/**
 * Billing Page - Overview of earnings with date range filters and price calculations
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { DollarSign, Calendar, User, Filter, ArrowUpRight, Loader2 } from 'lucide-react';
import type { Appointment, Student, PriceEntry, DataContainer } from '@/types';
import { calculateAppointmentFee } from '@/lib/billing';

export default function BillingPage() {
  const [data, setData] = useState<DataContainer | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [selectedStudentId, setSelectedStudentId] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'month' | 'year' | 'custom'>('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Load data
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

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

  // Filter appointments based on selected filters
  const filteredAppointments = useMemo(() => {
    if (!data) return [];

    let result = data.appointments || [];

    // Apply date range filter
    if (timeRange === 'month') {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      result = result.filter(app => new Date(app.date) >= firstDay);
    } else if (timeRange === 'year') {
      const now = new Date();
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      result = result.filter(app => new Date(app.date) >= startOfYear);
    } else if (timeRange === 'custom' && startDate && endDate) {
      result = result.filter(
        app => app.date >= startDate + 'T00:00:00Z' && app.date <= endDate + 'T23:59:59Z'
      );
    }

    // Apply student filter
    if (selectedStudentId !== 'all') {
      result = result.filter(
        app => app.studentIds.includes(selectedStudentId)
      );
    }

    return result;
  }, [data, selectedStudentId, timeRange, startDate, endDate]);

  // Calculate fees for each appointment
  const appointmentsWithFees = useMemo(() => {
    if (!data) return [];

    return filteredAppointments.map(appointment => {
      // Determine appointment type: 'individual' or 'group'
      const studentIds = appointment.studentIds || [];
      const appointmentType: 'individual' | 'group' = studentIds.length === 1 ? 'individual' : 'group';

      // Find matching price entry
      let priceEntry: PriceEntry | undefined;
      for (const entry of data.priceEntries || []) {
        if (entry.type === appointmentType && 
            new Date(appointment.date) >= new Date(entry.validFrom)) {
          const validTo = entry.validTo ? new Date(entry.validTo) : null;
          if (!validTo || new Date(appointment.date) <= validTo) {
            priceEntry = entry;
            break;
          }
        }
      }

      // Calculate fee based on formula: Amount × (Duration / 60)
      const duration = appointment.duration || 60;
      const amount = priceEntry ? priceEntry.amount : 0;
      const fee = calculateAppointmentFee(appointment, studentIds[0], data.priceEntries || []);

      return {
        ...appointment,
        calculatedFee: fee,
        originalAmount: amount,
        priceEntryType: appointmentType,
        hasPrice: !!priceEntry
      };
    });
  }, [filteredAppointments, data]);

  // Calculate totals
  const totalEarnings = useMemo(() => {
    return appointmentsWithFees.reduce((sum, app) => sum + (app.calculatedFee || 0), 0);
  }, [appointmentsWithFees]);

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

  const appointmentCount = filteredAppointments.length;
  const freeFallCount = filteredAppointments.filter(a => a.status === 'canceled_free').length;

  // Get selected student name for display
  const selectedStudent = useMemo(() => {
    if (selectedStudentId !== 'all' && data?.students) {
      return data.students.find(s => s.id === selectedStudentId);
    }
    return null;
  }, [selectedStudentId, data]);

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
            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-200 dark:border-slate-600">
              <User className="w-4 h-4 text-gray-400" />
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="flex-1 bg-transparent text-sm focus:outline-none dark:text-white"
              >
                <option value="all">Alle Schüler</option>
                {data?.students.map(student => (
                  <option key={student.id} value={student.id}>
                    {student.firstName} {student.lastName || ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Time Range Filter */}
            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-200 dark:border-slate-600">
              <Calendar className="w-4 h-4 text-gray-400" />
              <select
                value={timeRange}
                onChange={(e) => {
                  const range = e.target.value;
                  if (range === 'month') {
                    setTimeRange('month');
                    setStartDate('');
                    setEndDate('');
                  } else if (range === 'year') {
                    setTimeRange('year');
                    setStartDate('');
                    setEndDate('');
                  } else {
                    setTimeRange('custom');
                  }
                }}
                className="flex-1 bg-transparent text-sm focus:outline-none dark:text-white"
              >
                <option value="month">Diesen Monat</option>
                <option value="year">Letztes Jahr</option>
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
                    disabled={!startDate}
                  />
                  <span className="text-gray-400">bis</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-20 text-sm bg-transparent focus:outline-none dark:text-white"
                    disabled={!endDate}
                    min={startDate || undefined}
                  />
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
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
                      Typ
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                      Dauer
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                      Honorar
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                  {appointmentsWithFees.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-slate-400">
                        Keine Termine im ausgewählten Zeitraum gefunden.
                      </td>
                    </tr>
                  ) : (
                    appointmentsWithFees.map((appointment) => (
                      <tr key={appointment.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {new Date(appointment.date).toLocaleDateString('de-DE', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-slate-400">
                          {appointment.studentIds.slice(0, 2).map(id => {
                            const student = data?.students.find(s => s.id === id);
                            return student ? `${student.firstName} ${student.lastName || ''}` : '';
                          }).join(', ')}
                        </td>
                        <td className="px-4 py-3">
                          {appointment.priceEntryType === 'individual' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                              Einzel
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                              Gruppe
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-slate-400">
                          {appointment.duration} min
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">
                          {appointment.calculatedFee ? (
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
                    Gesamtsumme für {timeRange}
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

