/**
 * Invoices Page - Generate and print professional invoices for families
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { Printer, User, Calendar, DollarSign, ArrowRight, Building2, FileText } from 'lucide-react';
import type { DataContainer, InvoiceItem, Family } from '@/types';
import { calculateAppointmentFee } from '@/lib/billing';
import { InvoiceTemplate, type InvoiceData } from '@/components/InvoiceTemplate';

export default function InvoicesPage() {
  const [data, setData] = useState<DataContainer | null>(null);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Load data and price entries
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

    // Apply family filter (only non-canceled and non-planned appointments)
    if (selectedFamilyId !== 'all') {
      result = result.filter(
        app => 
          app.studentIds.includes(selectedFamilyId) &&
          !app.status.startsWith('canceled') &&
          app.status !== 'planned'
      );
    } else {
      // Show all families, but exclude canceled and planned
      result = result.filter(app => !app.status.startsWith('canceled') && app.status !== 'planned');
    }

    return result;
  }, [data, selectedFamilyId, startDate, endDate]);

  // Calculate invoice items from filtered appointments
  const invoiceItems = useMemo(() => {
    if (!data) return [];

    const items: InvoiceItem[] = [];
    const seen = new Set<string>();

    filteredAppointments.forEach(appointment => {
      appointment.studentIds.forEach(studentId => {
        const key = `${appointment.id}-${studentId}`;
        if (!seen.has(key)) {
          seen.add(key);
          const student = data.students.find(s => s.id === studentId);
          
          // Calculate fee using billing helper
          let fee = calculateAppointmentFee(appointment, undefined, data.priceEntries || []);
          
          // For canceled_paid, only charge 50%
          if (appointment.status === 'canceled_paid') {
            fee = fee * 0.5;
          }
          
          items.push({
            appointmentId: appointment.id,
            date: appointment.date,
            studentName: student ? `${student.firstName} ${student.lastName || ''}`.trim() : 'Unknown',
            description: appointment.status === 'canceled_paid' ? 'Einzelunterricht (50%)' : 'Einzelunterricht',
            unitPrice: fee,
            quantity: 1,
            totalPrice: fee,
          });
        }
      });
    });

    return items;
  }, [filteredAppointments, data]);

  const calculateInvoice = () => {
    if (!data || invoiceItems.length === 0) return;

    // Find the family for the first student
    const firstStudentId = filteredAppointments[0].studentIds[0];
    const student = data.students.find(s => s.id === firstStudentId);
    const family = student ? data.families.find(f => f.id === student.familyId) : null;

    // Calculate total fee for all appointments
    let subtotal = 0;
    filteredAppointments.forEach(appointment => {
      let fee = calculateAppointmentFee(appointment, undefined, data.priceEntries || []);
      
      // For canceled_paid, only charge 50%
      if (appointment.status === 'canceled_paid') {
        fee = fee * 0.5;
      }
      
      subtotal += fee;
    });

    const taxRate = 0.19;
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;

    setInvoiceData({
      invoiceNumber: Math.floor(1000 + Math.random() * 9000).toString(),
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
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700 sticky top-0 z-10">
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
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-slate-700">
            <FileText size={18} />
            Filter
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Familie</label>
              <select
                value={selectedFamilyId}
                onChange={e => setSelectedFamilyId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">Alle Familien</option>
                {data?.families?.map(family => (
                  <option key={family.id} value={family.id}>{family.name}</option>
                ))}
              </select>
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

        {/* Invoice Preview */}
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm p-6">
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
      </main>
    </div>
  );
}