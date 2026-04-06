/**
 * Invoices Page - Generate and print professional invoices for families
 */

'use client';

import { useState, useMemo } from 'react';
import { Printer, User, Calendar, DollarSign, ArrowRight, Building2 } from 'lucide-react';
import type { DataContainer, InvoiceItem, Family } from '@/types';
import { calculateAppointmentFee } from '@/lib/billing';
import { InvoiceTemplate } from '@/components/InvoiceTemplate';

export default function InvoicesPage() {
  const [data, setData] = useState<DataContainer | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Invoice generation state
  const [invoiceData, setInvoiceData] = useState<{
    invoice: any;
    items: InvoiceItem[];
    total: number;
  } | null>(null);

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

    return filteredAppointments.map((appointment: any) => {
      const studentIds = appointment.studentIds || [];
      const primaryStudentId = studentIds[0];
      
      // Find student name (use family name for families, individual name for students)
      let studentName = '';
      if (primaryStudentId) {
        const student = data.students?.find(s => s.id === primaryStudentId);
        if (student) {
          studentName = `${student.firstName} ${student.lastName || ''}`.trim();
        } else {
          // Fallback to family name for families
          const family = data.families?.find(f => f.id === primaryStudentId);
          if (family) {
            studentName = family.name;
          }
        }
      }

      // Determine description based on appointment type
      const appointmentType = studentIds.length === 1 ? 'Einzel' : 'Gruppe';
      const duration = appointment.duration || 60;
      
      let unitPrice = 0;
      if (data.priceEntries) {
        for (const entry of data.priceEntries) {
          if (entry.type === appointmentType && 
              new Date(appointment.date) >= new Date(entry.validFrom)) {
            const validTo = entry.validTo ? new Date(entry.validTo) : null;
            if (!validTo || new Date(appointment.date) <= validTo) {
              unitPrice = entry.amount;
              break;
            }
          }
        }
      }

      // Calculate fee using the billing engine
      const calculatedFee = calculateAppointmentFee(appointment, primaryStudentId, data.priceEntries);

      return {
        appointmentId: appointment.id,
        date: appointment.date,
        studentName,
        description: `${appointmentType} • ${duration} Min`,
        unitPrice: Number(unitPrice.toFixed(2)),
        quantity: 1,
        totalPrice: Number(calculatedFee.toFixed(2))
      };
    });
  }, [filteredAppointments, data]);

  // Calculate totals
  const subtotal = useMemo(() => {
    return invoiceItems.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [invoiceItems]);

  // Generate invoice number with format: YYYY-MM-001
  const generateInvoiceNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}-00${Math.floor(Math.random() * 90) + 1}`;
  };

  // Handle invoice generation with print
  const handleGenerateInvoice = () => {
    if (!selectedFamilyId || !data) return;

    const invoiceNumber = generateInvoiceNumber();
    const now = new Date().toISOString();

    // Get user's invoice settings (letterhead data)
    const invoiceSettings = data.invoiceSettings || {
      businessName: '',
      street: '',
      zipCode: '',
      city: '',
      email: '',
      phone: ''
    };

    const issuedBy = {
      name: invoiceSettings.businessName || 'MatheManager',
      street: invoiceSettings.street,
      zipCode: invoiceSettings.zipCode,
      city: invoiceSettings.city,
      email: invoiceSettings.email,
      phone: invoiceSettings.phone,
      vatId: '' // Steuernummer could be added later
    };

    const billedTo = data.families?.find(f => f.id === selectedFamilyId) || {
      name: 'Familie',
      street: '',
      city: '',
      zipCode: ''
    };

    setInvoiceData({
      invoiceNumber,
      items: invoiceItems,
      total: subtotal,
      issuedBy,
      billedTo,
      invoiceDate: now,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days later
      subtotal,
      taxRate: undefined,
      taxAmount: undefined
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <p className="text-gray-500 dark:text-slate-400 animate-pulse">Lade Daten...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700 sticky top-0 z-10 print:hidden">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-6 h-6 text-green-600" />
                Rechnungen
              </h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                Generiere professionelle Rechnungen für Familien
              </p>
            </div>

            {/* Generate Invoice Button */}
            {data && data.families.length > 0 && (
              <button
                onClick={handleGenerateInvoice}
                disabled={!selectedFamilyId || invoiceItems.length === 0}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <DollarSign size={18} />
                Rechnung generieren
              </button>
            )}
          </div>

          {/* Filter Controls */}
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {/* Family Selection */}
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-200 dark:border-slate-600">
              <label htmlFor="family-select" className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                <User size={16} />
                Familie auswählen
              </label>
              <select
                id="family-select"
                value={selectedFamilyId}
                onChange={(e) => setSelectedFamilyId(e.target.value)}
                disabled={!data || data.families.length === 0}
                className="flex-1 bg-transparent text-sm focus:outline-none dark:text-white cursor-pointer"
              >
                <option value="all">Alle Familien</option>
                {data.families.map((family) => (
                  <option key={family.id} value={family.id}>
                    {family.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-200 dark:border-slate-600">
              <label htmlFor="date-range" className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                <Calendar size={16} />
                Zeitraum
              </label>
              <div className="flex gap-1">
                <input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={!selectedFamilyId || !data}
                  className="w-20 text-sm bg-transparent focus:outline-none dark:text-white cursor-pointer"
                />
                <span className="text-gray-400">bis</span>
                <input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={!selectedFamilyId || !data}
                  min={startDate || undefined}
                  className="w-20 text-sm bg-transparent focus:outline-none dark:text-white cursor-pointer"
                />
              </div>
            </div>

            {/* Results Summary */}
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-200 dark:border-slate-600">
              <span className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                <DollarSign size={16} />
                Summe
              </span>
              <div className="text-right">
                {invoiceItems.length > 0 ? (
                  <>
                    <p className={`text-lg font-bold text-gray-900 dark:text-white ${subtotal > 0 ? 'text-green-600' : ''}`}>
                      €{subtotal.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      {invoiceItems.length} Position(en)
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-medium text-gray-300 dark:text-slate-600">€ 0,00</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      {selectedFamilyId === 'all' 
                        ? `${filteredAppointments.length} Termine im Zeitraum` 
                        : ''}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Info Message */}
          {!data.families || data.families.length === 0 ? (
            <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-300 flex items-start gap-2">
                <span className="text-xl">⚠️</span>
                <span>Keine Familien oder Schüler im System. Bitte erstelle zunächst einige Einträge in den Familien-/Schüler-Bereichen.</span>
              </p>
            </div>
          ) : (
            !selectedFamilyId && invoiceItems.length === 0 && (
              <div className="mt-6 p-4 bg-gray-50 dark:bg-slate-700/30 border border-gray-200 dark:border-slate-600 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-slate-400 flex items-start gap-2">
                  <span className="text-xl">📅</span>
                  Wähle eine Familie und einen Zeitraum, um die Rechnungen zu generieren. Alle nicht stornierten Termine werden berücksichtigt.
                </p>
              </div>
            )
          )}
        </div>
      </header>

      {/* Invoice Preview Section */}
      {invoiceData ? (
        <main className="max-w-5xl mx-auto px-4 py-6">
          {/* Invoice Actions Bar */}
          <div className={`mb-6 p-4 bg-gray-50 dark:bg-slate-700/30 border border-gray-200 dark:border-slate-600 rounded-lg print:hidden ${invoiceData.total > 0 ? 'flex justify-between items-center' : ''}`}>
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Rechnungsvorschau:</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400">Nr. {invoiceData.invoiceNumber} • {new Date(invoiceData.invoiceDate).toLocaleDateString('de-DE')} bis {formatDueDate(invoiceData.dueDate)}</p>
            </div>

            {/* Print Button */}
            <button
              onClick={() => window.print()}
              disabled={invoiceData.total <= 0 || !window.print}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Printer size={18} />
              Drucken (PDF)
            </button>
          </div>

          {/* Invoice Template */}
          <InvoiceTemplate
            invoice={invoiceData}
            onPrint={() => window.print()}
            showDownloadButton={false}
          />
        </main>
      ) : (
        // Show placeholder if no invoice generated yet
        !invoiceData && data.families.length > 0 && (
          <main className="max-w-5xl mx-auto px-4 py-12 text-center">
            <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
              <Building2 className="w-24 h-24 text-gray-300 dark:text-slate-600 mb-6" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Keine Rechnung generiert
              </h2>
              <p className="text-gray-500 dark:text-slate-400 max-w-md mx-auto">
                Wähle eine Familie und einen Zeitraum oben, um eine professionelle Rechnung zu generieren.
              </p>
            </div>
          </main>
        )
      )}

      {/* Print-only styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:visible {
            visibility: visible !important;
          }
          .print\\:block {
            display: block !important;
          }
          /* Print only the invoice content */
          main {
            visibility: visible !important;
          }
          InvoiceTemplate {
            print-display: inline;
          }
        }
      `}</style>
    </div>
  );
}

function formatDueDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}