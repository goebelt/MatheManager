/**
 * Billing Page - Overview of earnings with date range filters and price calculations
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { DollarSign, Calendar, User, Filter, ArrowUpRight, Loader2, X, Check } from 'lucide-react';
import type { Appointment, Student, PriceEntry, DataContainer, PaymentStatus } from '@/types';
import { calculateAppointmentFee } from '@/lib/billing';
import { filterAppointmentsByDate } from '@/lib/dateFilters';


export default function BillingPage() {
  const [data, setData] = useState<DataContainer | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [timeRange, setTimeRange] = useState<'month' | 'year' | 'custom' | 'all'>('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Student dropdown states
  const [studentDropdownOpen, setStudentDropdownOpen] = useState(false);
  const [studentFilter, setStudentFilter] = useState('');

  // Load data
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.student-dropdown-container')) {
        setStudentDropdownOpen(false);
        setStudentFilter('');
      }
    };

    if (studentDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [studentDropdownOpen]);

  const loadData = () => {
    setLoading(true);
    try {
      const stored = localStorage.getItem('mathe_manager_data');
      if (stored) {
        setData(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFamilyForStudent = (studentId: string): string => {
    const student = (data?.students || []).find(s => s.id === studentId);
    if (!student || !student.familyId) return '';
    const family = (data?.families || []).find(f => f.id === student.familyId);
    return family?.name || '';
  };

  const getFilteredStudents = (): Student[] => {
    const filter = studentFilter.toLowerCase();
    return (data?.students || []).filter(student => {
      const fullName = `${student.firstName} ${student.lastName || ''}`.toLowerCase();
      const familyName = getFamilyForStudent(student.id).toLowerCase();
      return fullName.includes(filter) || familyName.includes(filter);
    });
  };

  // Get payment status for a specific student in an appointment
  const getPaymentStatus = (appointmentId: string, studentId: string): boolean => {
    const status = (data?.paymentStatuses || []).find(
      s => s.appointmentId === appointmentId && s.studentId === studentId
    );
    return status?.isPaid || false;
  };

  // Toggle payment status for a specific student in an appointment
  const togglePaymentStatus = (appointmentId: string, studentId: string) => {
    if (!data) return;

    const currentStatus = getPaymentStatus(appointmentId, studentId);
    const newStatus = !currentStatus;

    // Update payment statuses
    const updatedPaymentStatuses = [...(data.paymentStatuses || [])];
    const existingIndex = updatedPaymentStatuses.findIndex(
      s => s.appointmentId === appointmentId && s.studentId === studentId
    );

    if (existingIndex >= 0) {
      // Update existing status
      updatedPaymentStatuses[existingIndex] = {
        ...updatedPaymentStatuses[existingIndex],
        isPaid: newStatus,
        paidDate: newStatus ? new Date().toISOString() : undefined,
      };
    } else {
      // Add new status
      updatedPaymentStatuses.push({
        appointmentId,
        studentId,
        isPaid: newStatus,
        paidDate: newStatus ? new Date().toISOString() : undefined,
      });
    }

    // Update data
    const updatedData = {
      ...data,
      paymentStatuses: updatedPaymentStatuses,
      lastUpdated: new Date().toISOString(),
    };

    setData(updatedData);
    localStorage.setItem('mathe_manager_data', JSON.stringify(updatedData));
  };

  // Filter appointments based on selected filters
  const filteredAppointments = useMemo(() => {
    return filterAppointmentsByDate(data?.appointments || [], {
      timeRange,
      startDate,
      endDate,
      referenceDate: new Date(),
    }).filter(app => {
      if (selectedStudentIds.length === 0) return true;
      return app.studentIds.some(id => selectedStudentIds.includes(id));
    });
  }, [data, selectedStudentIds, timeRange, startDate, endDate]);

  // Calculate fees for each appointment - expand group appointments to one row per student
  const appointmentsWithFees = useMemo(() => {
    if (!data) return [];

    const rows: any[] = [];

    filteredAppointments.forEach(appointment => {
      // Determine appointment type: 'individual' or 'group'
      const studentIds = appointment.studentIds || [];
      const appointmentType: 'individual' | 'group' = studentIds.length === 1 ? 'individual' : 'group';

      // Create one row per student (only for selected students if filter is active)
      studentIds.forEach(studentId => {
        // Skip if student filter is active and this student is not selected
        if (selectedStudentIds.length > 0 && !selectedStudentIds.includes(studentId)) {
          return;
        }

        // Check if student has block pricing for this date
        let blockEntry: PriceEntry | undefined;
        for (const entry of data.priceEntries || []) {
          if (entry.type === 'block' && 
              entry.studentIds && entry.studentIds.includes(studentId) &&
              entry.blockStartDate && entry.blockEndDate) {
            const appointmentDate = new Date(appointment.date);
            const blockStart = new Date(entry.blockStartDate);
            const blockEnd = new Date(entry.blockEndDate);
            if (appointmentDate >= blockStart && appointmentDate <= blockEnd) {
              blockEntry = entry;
              break;
            }
          }
        }

        // Find matching price entry for this specific student:
        // - Appointment date must be between validFrom and validTo (if present)
        // - Priority: Student-specific price first, then default price
        let priceEntry: PriceEntry | undefined;
        
        // First, try to find a student-specific price entry (skip block entries)
        for (const entry of data.priceEntries || []) {
          if (entry.type === 'block') continue; // Skip block entries for standard pricing
          if (new Date(appointment.date) >= new Date(entry.validFrom) &&
              entry.studentIds && entry.studentIds.includes(studentId)) {
            const validTo = entry.validTo ? new Date(entry.validTo) : null;
            if (!validTo || new Date(appointment.date) <= validTo) {
              priceEntry = entry;
              break;
            }
          }
        }
        
        // If no student-specific price found, try to find a default price (skip block entries)
        if (!priceEntry) {
          for (const entry of data.priceEntries || []) {
            if (entry.type === 'block') continue; // Skip block entries for standard pricing
            if (new Date(appointment.date) >= new Date(entry.validFrom) &&
                (!entry.studentIds || entry.studentIds.length === 0)) {
              const validTo = entry.validTo ? new Date(entry.validTo) : null;
              if (!validTo || new Date(appointment.date) <= validTo) {
                priceEntry = entry;
                break;
              }
            }
          }
        }

        // Calculate fee using billing helper
        const fee = calculateAppointmentFee(appointment, studentId, data.priceEntries || []);
        const student = (data?.students || []).find(s => s.id === studentId);
        const family = student ? (data?.families || []).find(f => f.id === student.familyId) : null;
        const isPaid = getPaymentStatus(appointment.id, studentId);

        // Determine display type
        let displayType: 'individual' | 'group' | 'block' = appointmentType;
        let displayFee = fee;
        let blockName = undefined;
        let blockPrice = undefined;

        if (blockEntry) {
          displayType = 'block';
          displayFee = 0; // Show 0 in honorar column for block appointments
          blockName = blockEntry.blockName;
          blockPrice = blockEntry.blockPrice;
        }

        rows.push({
          ...appointment,
          studentId,
          student,
          family,
          calculatedFee: displayFee,
          priceEntryType: displayType,
          hasPrice: !!priceEntry || !!blockEntry,
          isPaid,
          blockName,
          blockPrice,
        });
      });
    });

    return rows;
  }, [filteredAppointments, data, selectedStudentIds]);

  // Calculate totals
  const individualEarnings = useMemo(() => {
    return appointmentsWithFees.filter(a => a.priceEntryType === 'individual').reduce(
      (sum, app) => sum + (app.calculatedFee || 0), 0
    );
  }, [appointmentsWithFees]);

  const groupEarnings = useMemo(() => {
    return appointmentsWithFees.filter(a => a.priceEntryType === 'group').reduce(
      (sum, app) => sum + (app.calculatedFee || 0), 0
    );
  }, [appointmentsWithFees]);

  // Calculate block earnings - only once per student per block
  const blockEarnings = useMemo(() => {
    const seen = new Set<string>(); // Track student-block combinations
    return appointmentsWithFees.reduce((sum, app) => {
      if (app.priceEntryType === 'block' && app.blockPrice) {
        const key = `${app.studentId}-${app.blockName}`;
        if (!seen.has(key)) {
          seen.add(key);
          return sum + app.blockPrice;
        }
      }
      return sum;
    }, 0);
  }, [appointmentsWithFees]);

  const totalEarnings = useMemo(() => {
    return individualEarnings + groupEarnings + blockEarnings;
  }, [individualEarnings, groupEarnings, blockEarnings]);

  const appointmentCount = filteredAppointments.length;
  const freeFallCount = filteredAppointments.filter(a => a.status === 'canceled_free').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-green-600" />
                Abrechnung
              </h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                Übersicht der Einnahmen und Honorare
              </p>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {/* Student Filter */}
            <div className="student-dropdown-container flex items-center gap-2 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-200 dark:border-slate-600">
              <User className="w-4 h-4 text-gray-400" />
              <div className="relative flex-1">
                {/* Selected students display */}
                <div
                  onClick={() => setStudentDropdownOpen(!studentDropdownOpen)}
                  className="min-h-[28px] px-2 py-1 cursor-pointer text-sm focus:outline-none dark:text-white"
                >
                  {selectedStudentIds.length === 0 ? (
                    <span className="text-gray-500 dark:text-slate-400">
                      Alle Schüler
                    </span>
                  ) : (
                    <span className="text-gray-900 dark:text-white">
                      {selectedStudentIds.length} Schüler ausgewählt
                    </span>
                  )}
                </div>

                {/* Dropdown with filter */}
                {studentDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg shadow-lg max-h-60 overflow-hidden">
                    {/* Filter input */}
                    <div className="p-2 border-b border-gray-200 dark:border-slate-700">
                      <input
                        type="text"
                        placeholder="Nach Schüler oder Familie filtern..."
                        value={studentFilter}
                        onChange={e => setStudentFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        autoFocus
                      />
                    </div>

                    {/* Student list */}
                    <div className="max-h-48 overflow-y-auto">
                      {getFilteredStudents().length === 0 ? (
                        <div className="p-4 text-center text-gray-500 dark:text-slate-400 text-sm">
                          Keine Schüler gefunden
                        </div>
                      ) : (
                        getFilteredStudents().map(student => {
                          const familyName = getFamilyForStudent(student.id);
                          const isSelected = selectedStudentIds.includes(student.id);
                          return (
                            <button
                              key={student.id}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedStudentIds(selectedStudentIds.filter(id => id !== student.id));
                                } else {
                                  setSelectedStudentIds([...selectedStudentIds, student.id]);
                                }
                              }}
                              className={`w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors ${
                                isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                                  isSelected ? 'bg-green-600 border-green-600 text-white' : 'border-gray-300 dark:border-slate-600'
                                }`}>
                                  {isSelected && <Check size={12} />}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {student.firstName} {student.lastName || ''}
                                  </span>
                                  {familyName && (
                                    <span className="text-xs text-gray-500 dark:text-slate-400">
                                      {familyName}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Time Range Filter */}
            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-200 dark:border-slate-600">
              <Calendar className="w-4 h-4 text-gray-400" />
              <select
                value={timeRange}
                onChange={(e) => {
                  const range = e.target.value as 'month' | 'year' | 'custom' | 'all';
                  if (range === 'month') {
                    setTimeRange('month');
                    setStartDate('');
                    setEndDate(new Date().toISOString().split('T')[0]);
                  } else if (range === 'year') {
                    setTimeRange('year');
                    setStartDate('');
                    setEndDate(new Date().toISOString().split('T')[0]);
                  } else if (range === 'all') {
                    setTimeRange('all');
                    setStartDate('');
                    setEndDate(new Date().toISOString().split('T')[0]);
                  } else {
                    setTimeRange('custom');
                  }
                }}
                className="flex-1 bg-transparent text-sm focus:outline-none dark:text-white"
              >
                <option value="month">Diesen Monat</option>
                <option value="year">Dieses Jahr</option>
                <option value="all">Alle (bis heute)</option>
                <option value="custom">Freier Zeitraum</option>
              </select>

              {/* Date Range Input (only show for custom) */}
              {timeRange === 'custom' && (
                <>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-20 text-sm bg-transparent focus:outline-none dark:text-white"
                  />
                  <span className="text-gray-400">bis</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-20 text-sm bg-transparent focus:outline-none dark:text-white"
                    min={startDate || undefined}
                  />
                  {(startDate || endDate) && (
                    <button
                      onClick={() => {
                        setStartDate('');
                        setEndDate(new Date().toISOString().split('T')[0]);
                      }}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-slate-600 rounded"
                      title="Filter zurücksetzen"
                    >
                      <X size={14} className="text-gray-500" />
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Results Summary */}
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <DollarSign className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-xs text-green-600 dark:text-green-400 uppercase font-medium">Gesamtsumme</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {totalEarnings.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Summary Cards */}
        {!loading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-6">
            <SummaryCard
              label="Termine"
              value={appointmentCount.toString()}
              icon={<Calendar className="w-5 h-5 text-blue-600" />}
            />
            <SummaryCard
              label="Einzeltermine"
              value={appointmentsWithFees.filter(a => a.priceEntryType === 'individual').length.toString()}
              icon={<User className="w-5 h-5 text-purple-600" />}
            />
            <SummaryCard
              label="Gruppentermine"
              value={appointmentsWithFees.filter(a => a.priceEntryType === 'group').length.toString()}
              icon={<DollarSign className="w-5 h-5 text-green-600" />}
            />
            <SummaryCard
              label="Block-Unterricht"
              value={appointmentsWithFees.filter(a => a.priceEntryType === 'block').length.toString()}
              icon={<DollarSign className="w-5 h-5 text-orange-600" />}
            />
            <SummaryCard
              label="Ausfälle (frei)"
              value={freeFallCount.toString()}
              icon={<Filter className="w-5 h-5 text-gray-400" />}
            />
          </div>
        )}

        {/* Earnings Breakdown */}
        {!loading && data && (
          <div className="grid gap-4 mb-6">
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700/30 rounded-lg border border-gray-200 dark:border-slate-600">
              <div>
                <p className="text-sm text-gray-500 dark:text-slate-400">Einzelstunden Honorar</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {individualEarnings.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                </p>
              </div>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700/30 rounded-lg border border-gray-200 dark:border-slate-600">
              <div>
                <p className="text-sm text-gray-500 dark:text-slate-400">Gruppenstunden Honorar</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {groupEarnings.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                </p>
              </div>
            </div>
            {blockEarnings > 0 && (
              <div className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <div>
                  <p className="text-sm text-orange-600 dark:text-orange-400">Block-Unterricht Honorar</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-orange-700 dark:text-orange-300">
                    {blockEarnings.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Appointments Table */}
        {!loading && (
          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                <thead className="bg-gray-50 dark:bg-slate-700/30">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                      Datum
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                      Schüler
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                      Familie
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                      Typ
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                      Dauer
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                      Honorar
                    </th>
                    <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                      Bezahlstatus
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                  {appointmentsWithFees.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-slate-400">
                        Keine Termine im ausgewählten Zeitraum gefunden.
                      </td>
                    </tr>
                  ) : (
                    appointmentsWithFees.map((appointment) => (
                      <tr key={`${appointment.id}-${appointment.studentId}`} className="hover:bg-gray-50 dark:hover:bg-slate-700/30">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {new Date(appointment.date).toLocaleDateString('de-DE', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-slate-400">
                          {appointment.student ? `${appointment.student.firstName} ${appointment.student.lastName || ''}` : 'Unbekannt'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-slate-400">
                          {appointment.family ? appointment.family.name : '-'}
                        </td>
                        <td className="px-4 py-3">
                          {appointment.priceEntryType === 'individual' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                              Einzel
                            </span>
                          ) : appointment.priceEntryType === 'group' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                              Gruppe
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                              Block-Unterricht
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-slate-400">
                          {appointment.duration} min
                        </td>
                        <td className="px-4 py-3">
                          {appointment.status === 'attended' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                              Besucht
                            </span>
                          ) : appointment.status === 'canceled_paid' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                              Bezahlt ausgefallen
                            </span>
                          ) : appointment.status === 'canceled_free' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                              Kostenlos ausgefallen
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-slate-300">
                              Geplant
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">
                          {appointment.priceEntryType === 'block' ? (
                            <span className="text-gray-400">-</span>
                          ) : appointment.calculatedFee ? (
                            <>
                              €{appointment.calculatedFee.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              {!appointment.hasPrice && (
                                <span className="ml-1 text-xs text-gray-400">
                                  *keine Preisregelung
                                </span>
                              )}
                            </>
                          ) : (
                            <>
                              €{appointment.calculatedFee?.toFixed(2) ?? '0.00'}
                              {!appointment.hasPrice && (
                                <span className="ml-1 text-xs text-gray-400">
                                  *keine Preisregelung
                                </span>
                              )}
                            </>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => togglePaymentStatus(appointment.id, appointment.studentId)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                              appointment.isPaid
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50'
                                : 'bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                            }`}
                          >
                            {appointment.isPaid ? (
                              <>
                                <Check size={12} />
                                Bezahlt
                              </>
                            ) : (
                              <>
                                <X size={12} />
                                Offen
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer Total */}
            {!loading && appointmentsWithFees.length > 0 && (
              <div className="bg-gray-50 dark:bg-slate-700/30 px-4 py-4 sm:px-6">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                  <p className="text-sm text-gray-500 dark:text-slate-400">
                    {timeRange === 'month' ? 'Gesamtsumme für diesen Monat' :
                     timeRange === 'year' ? 'Gesamtsumme für dieses Jahr' :
                     timeRange === 'all' ? 'Gesamtsumme (alle Termine bis heute)' :
                     'Gesamtsumme für den gewählten Zeitraum'}
                  </p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-500 flex items-center gap-2">
                    <ArrowUpRight className="w-5 h-5" />
                    {totalEarnings.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function SummaryCard({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {

        return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        </div>
        <div className="p-2 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
          {icon}
        </div>
      </div>
    </div>
  );
}

