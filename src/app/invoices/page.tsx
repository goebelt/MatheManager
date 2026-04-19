/**
 * Invoices Page - Generate and print professional invoices for families
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { Printer, User, Calendar, DollarSign, ArrowRight, Building2, FileText, Check, X } from 'lucide-react';
import type { DataContainer, InvoiceItem, Family, Student } from '@/types';
import { calculateAppointmentFee } from '@/lib/billing';
import { InvoiceTemplate, type InvoiceData } from '@/components/InvoiceTemplate';

export default function InvoicesPage() {
  const [data, setData] = useState<DataContainer | null>(null);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Student dropdown states
  const [studentDropdownOpen, setStudentDropdownOpen] = useState(false);
  const [studentFilter, setStudentFilter] = useState('');

  // Load data and price entries
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

  // Find matching price entry
  const findPriceEntry = (appointment: any, priceEntries: any[]): any => {
    if (!priceEntries || priceEntries.length === 0) return null;
    for (const entry of priceEntries) {
      if (entry.type === 'individual' &&
          new Date(appointment.date) >= new Date(entry.validFrom)) {
        const validTo = entry.validTo ? new Date(entry.validTo) : null;
        if (!validTo || new Date(appointment.date) <= validTo) {
          return entry;
        }
      }
    }
    return null;
  };

  // Filter appointments based on selected filters and calculate invoice items
  const filteredAppointments = useMemo(() => {
    if (!data) return [];

    let result = data.appointments || [];

    // Apply date range filter
    if (startDate && endDate) {
      result = result.filter(
        app => app.date >= startDate + 'T00:00:00Z' && app.date <= endDate + 'T23:59:59Z'
      );
    }

    // Apply student filter (no filter if no students selected)
    if (selectedStudentIds.length > 0) {
      result = result.filter(
        app => app.studentIds.some(id => selectedStudentIds.includes(id))
      );
    }

    return result;
  }, [data, selectedStudentIds, startDate, endDate]);

  // Calculate invoice items from filtered appointments
  const invoiceItems = useMemo(() => {
    if (!data) return [];

    const items: InvoiceItem[] = [];
    const seen = new Set<string>();

    filteredAppointments.forEach(appointment => {
      appointment.studentIds.forEach(studentId => {
        // Only include students that are in the filter (if filter is active)
        if (selectedStudentIds.length > 0 && !selectedStudentIds.includes(studentId)) {
          return;
        }

        const key = `${appointment.id}-${studentId}`;
        if (!seen.has(key)) {
          seen.add(key);
          const student = data.students.find(s => s.id === studentId);
          
          // Determine lesson type
          const lessonType = appointment.studentIds.length > 1 ? 'group' : 'individual';
          
          // Calculate fee using billing helper
          let fee = calculateAppointmentFee(appointment, undefined, data.priceEntries || []);
          
          // For canceled_free, charge nothing
          if (appointment.status === 'canceled_free') {
            fee = 0;
          }
          
          // Build description
          let description = '';
          if (lessonType === 'group') {
            description = 'Gruppenunterricht';
          } else {
            description = 'Einzelunterricht';
          }
          
          // Add status info
          if (appointment.status === 'attended') {
            description += ' (besucht)';
          } else if (appointment.status === 'canceled_paid') {
            description += ' (ausgefallen, 50%)';
          } else if (appointment.status === 'canceled_free') {
            description += ' (ausgefallen, kostenlos)';
          } else if (appointment.status === 'planned') {
            description += ' (geplant)';
          }
          
          items.push({
            appointmentId: appointment.id,
            date: appointment.date,
            studentName: student ? `${student.firstName} ${student.lastName || ''}`.trim() : 'Unknown',
            lessonType: lessonType,
            status: appointment.status as 'attended' | 'canceled_paid' | 'canceled_free' | 'planned',
            hourlyRate: fee,
            description: description,
            unitPrice: fee,
            quantity: 1,
            totalPrice: fee,
          });
        }
      });
    });

    return items;
  }, [filteredAppointments, data, selectedStudentIds]);

  const calculateInvoice = () => {
    if (!data || invoiceItems.length === 0) return;

    // Find the family for the first student in the filtered list
    const firstStudentId = invoiceItems[0].appointmentId ? 
      filteredAppointments.find(app => app.id === invoiceItems[0].appointmentId)?.studentIds[0] : null;
    
    const student = firstStudentId ? data.students.find(s => s.id === firstStudentId) : null;
    const family = student ? data.families.find(f => f.id === student.familyId) : null;

    // Calculate total fee for all items
    const subtotal = invoiceItems.reduce((sum, item) => sum + item.totalPrice, 0);

    const taxRate = 0.19;
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;

    // Generate invoice number in format YYYY/00001
    const currentYear = new Date().getFullYear();
    const currentInvoiceNumber = data.invoiceSettings?.invoiceNumberStart || 1;
    
    // Format invoice number as YYYY/00001
    const invoiceNumber = `${currentYear}/${currentInvoiceNumber.toString().padStart(5, '0')}`;
    
    // Increment and save invoice number in settings
    const updatedData = {
      ...data,
      invoiceSettings: {
        businessName: data.invoiceSettings?.businessName || '',
        street: data.invoiceSettings?.street || '',
        zipCode: data.invoiceSettings?.zipCode || '',
        city: data.invoiceSettings?.city || '',
        email: data.invoiceSettings?.email,
        phone: data.invoiceSettings?.phone,
        vatId: data.invoiceSettings?.vatId,
        taxId: data.invoiceSettings?.taxId,
        bankName: data.invoiceSettings?.bankName,
        iban: data.invoiceSettings?.iban,
        bankBic: data.invoiceSettings?.bankBic,
        paymentTerms: data.invoiceSettings?.paymentTerms || 14,
        hourlyRate: data.invoiceSettings?.hourlyRate || 0,
        lessonType: data.invoiceSettings?.lessonType || 'individual',
        invoiceNumberStart: currentInvoiceNumber + 1
      },
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem('mathe_manager_data', JSON.stringify(updatedData));
    setData(updatedData);

    setInvoiceData({
      invoiceNumber: invoiceNumber,
      invoiceDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      issuedBy: {
        name: data.invoiceSettings?.businessName || 'MatheManager',
        street: data.invoiceSettings?.street,
        zipCode: data.invoiceSettings?.zipCode,
        city: data.invoiceSettings?.city,
        email: data.invoiceSettings?.email,
        phone: data.invoiceSettings?.phone,
        vatId: data.invoiceSettings?.vatId,
        iban: data.invoiceSettings?.iban,
      },
      billedTo: {
        name: family?.name || 'Familie',
        street: family?.address,
        zipCode: family?.address ? family.address.split(',').pop()?.trim() : undefined,
        city: family?.address ? family.address.split(',').pop()?.trim() : undefined,
      },
      items: invoiceItems,
      subtotal: subtotal,
      taxRate: taxRate,
      taxAmount: taxAmount,
      total: total,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Lade Daten...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700 sticky top-0 z-10 print:hidden">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="w-6 h-6 text-green-600" />
                Rechnungen
              </h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                Rechnungen für Familien erstellen
              </p>
            </div>
            <button
              onClick={calculateInvoice}
              disabled={invoiceItems.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Printer size={16} />
              Rechnungsvorlage erstellen
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6 print:hidden">
        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm p-6 mb-6 print:hidden">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-slate-700">
            <FileText size={18} />
            Filter
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="student-dropdown-container">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Schüler</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setStudentDropdownOpen(!studentDropdownOpen)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-left focus:outline-none focus:ring-2 focus:ring-green-500">
                  {selectedStudentIds.length === 0 ? (
                    <span className="text-gray-500">Alle Schüler</span>
                  ) : (
                    <span>{selectedStudentIds.length} Schüler ausgewählt</span>
                  )}
                </button>
                {studentDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <input
                      type="text"
                      placeholder="Schüler suchen..."
                      value={studentFilter}
                      onChange={e => setStudentFilter(e.target.value)}
                      className="w-full px-3 py-2 border-b border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none"
                    />
                    {getFilteredStudents().map(student => {
                      const familyName = getFamilyForStudent(student.id);
                      const isSelected = selectedStudentIds.includes(student.id);
                      return (
                        <button
                          key={student.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedStudentIds(prev => prev.filter(id => id !== student.id));
                            } else {
                              setSelectedStudentIds(prev => [...prev, student.id]);
                            }
                          }}
                          className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-gray-100 dark:hover:bg-slate-600 ${
                            isSelected ? 'bg-green-50 dark:bg-green-900/20' : ''
                          }`}
                        >
                          <span>
                            {student.firstName} {student.lastName || ''}
                            {familyName && (
                              <span className="text-gray-500 dark:text-slate-400 ml-2">({familyName})</span>
                            )}
                          </span>
                          {isSelected && (
                            <Check size={16} className="text-green-600" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Von</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Bis</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500 dark:text-slate-400">
            {filteredAppointments.length} Termin(e) gefunden
          </div>
        </div>
      </main>

      {/* Invoice Preview - Visible in print */}
      {invoiceData && (
        <div className="print:block hidden">
          <InvoiceTemplate
            invoice={invoiceData}
            onPrint={() => window.print()}
          />
        </div>
      )}

      {/* Invoice Preview - Visible on screen */}
      <main className="max-w-4xl mx-auto px-4 py-6 print:hidden">
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm p-6 print:hidden">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-slate-700">
            <FileText size={18} />
            Rechnungsvorschau
          </h2>

          {invoiceData ? (
            <InvoiceTemplate
              invoice={invoiceData}
              onPrint={() => window.print()}
            />
          ) : (
            <div className="text-center py-16 text-gray-500 dark:text-gray-400">
              <FileText size={32} className="mx-auto mb-3 opacity-30" />
              <p>Noch keine Rechnungsdaten</p>
              <p className="text-sm mt-1">Wählen Sie einen Zeitraum und klicken Sie auf Rechnungsvorlage erstellen</p>
            </div>
          )}
        </div>

        {/* Print-only invoice view */}
        {invoiceData && (
          <div className="print:block hidden">
            <InvoiceTemplate
              invoice={invoiceData}
              onPrint={() => window.print()}
            />
          </div>)}
      </main>
    </div>
  );
}