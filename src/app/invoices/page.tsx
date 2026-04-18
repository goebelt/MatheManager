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

    // Apply family filter (only non-canceled appointments)
    if (selectedFamilyId !== 'all') {
      result = result.filter(
        app => 
          app.studentIds.includes(selectedFamilyId) &&
          !app.status.startsWith('canceled')
      );
    } else {
      // Show all families, but exclude canceled
      result = result.filter(app => !app.status.startsWith('canceled'));
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
          items.push({
            appointmentId: appointment.id,
            date: appointment.date,
            studentName: student ? `${student.firstName} ${student.lastName || ''}`.trim() : 'Unknown',
            description: 'Einzelunterricht',
            unitPrice: appointment.duration === 90 ? data.prices?.find(p => p.type === 'individual')?.amount || 70 : data.prices?.find(p => p.type === 'individual')?.amount || 60,
            quantity: 1,
            totalPrice: appointment.duration === 90 ? data.prices?.find(p => p.type === 'individual')?.amount || 70 : data.prices?.find(p => p.type === 'individual')?.amount || 60,
          });
        }
      });
    });

    return items;
  }, [filteredAppointments, data]);

  // Determine appointment type
  const appointmentType: 'individual' | 'group' = invoiceItems.length > 0
    ? invoiceItems[0].quantity > 1 ? 'group' : 'individual'
    : 'individual';

  // Find matching price entry
  const findPriceEntry = (): any => {
    if (!data?.priceEntries) return null;
    for (const entry of data.priceEntries) {
      if (entry.type === appointmentType &&
          new Date(appointment.date) >= new Date(entry.validFrom)) {
        const validTo = entry.validTo ? new Date(entry.validTo) : null;
        if (!validTo || new Date(appointment.date) <= validTo) {
          return entry;
        }
      }
    }
    return null;
  };

  const calculateInvoice = () => {
    if (!data || invoiceItems.length === 0) return;

    const appointment = filteredAppointments[0];
    const priceEntry = findPriceEntry();

    // Calculate fee using billing helper
    const fee = calculateAppointmentFee(appointment, invoiceItems[0]?.studentId, data.priceEntries || []);

    setInvoiceData({
      invoiceNumber: Math.floor(1000 + Math.random() * 9000).toString(),
      invoiceDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      issuedBy: {
        name: 'MatheManager',
        email: 'info@mathe-manager.de',
      },
      billedTo: {
        name: appointment?.studentIds.length === 1 ? data?.students.find(s => s.id === appointment.studentIds[0])?.firstName : 'Familie',
        street: data?.students.find(s => s.id === appointment.studentIds[0])?.firstName,
      },
      items: invoiceItems,
      subtotal: fee.subtotal,
      taxRate: 0.19,
      taxAmount: fee.subtotal * 0.19,
      total: fee.total,
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
              disabled={!invoiceData}
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
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-slate-700">
            <FileText size={18} />
            Rechnungs-Einstellungen
          </h2>

          {invoiceData ? (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
                <p className="text-sm text-gray-500 dark:text-slate-400 mb-2">Rechnungsnummer</p>
                <p className="text-2xl font-mono font-bold text-green-600 dark:text-green-400">
                  {invoiceData.invoiceNumber}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">Datum</p>
                  <p className="text-gray-900 dark:text-white">{new Date(invoiceData.invoiceDate).toLocaleDateString('de-DE')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">Fällig</p>
                  <p className="text-gray-900 dark:text-white">{new Date(invoiceData.dueDate).toLocaleDateString('de-DE')}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-slate-400 mb-1.5">Ausgegeben an</p>
                <p className="text-gray-900 dark:text-white">{invoiceData.issuedBy.name}</p>
                {invoiceData.issuedBy.email && <p className="text-sm text-gray-500">{invoiceData.issuedBy.email}</p>}
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-slate-400 mb-1.5">Rechnungsadresse</p>
                <p className="text-gray-900 dark:text-white">{invoiceData.billedTo.name}</p>
              </div>

              <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Positionen</h3>
                <div className="space-y-2">
                  {invoiceData.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">{item.description}</span>
                      <span className="text-gray-900 dark:text-white font-medium">{item.unitPrice.toFixed(2)} €</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between font-semibold text-lg text-gray-900 dark:text-white pt-4">
                <span>Gesamt</span>
                <span>{invoiceData.total.toFixed(2)} €</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-gray-500 dark:text-gray-400">
              <FileText size={32} className="mx-auto mb-3 opacity-30" />
              <p>Noch keine Rechnungsdaten</p>
              <p className="text-sm mt-1">Fügen Sie zunächst Termine hinzu und klicken Sie auf Rechnungsvorlage erstellen</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}