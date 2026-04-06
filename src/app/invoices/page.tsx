/**
 * Invoices Page - Select family, date range, preview invoice items, generate printable invoice
 */

'use client';

import { useState, useMemo } from 'react';
import { Calendar, DollarSign, Printer, FileText, Loader2 } from 'lucide-react';
import type { Appointment, DataContainer } from '@/types';
import { calculateAppointmentFee } from '@/lib/billing';
import { InvoiceTemplate } from '@/components/InvoiceTemplate';

interface InvoicesPageProps {
  onBack?: () => void;
}

export default function InvoicesPage({ onBack }: InvoicesPageProps) => {
  const [data, setData] = useState<DataContainer | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Settings state
  const [companyInfo, setCompanyInfo] = useState({
    name: '',
    address: '',
    taxId: ''
  });

  // Invoice generation state
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>('all');
  const [startDateStr, setStartDateStr] = useState('');
  const [endDateStr, setEndDateStr] = useState(new Date().toISOString().split('T')[0]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Load data and settings
  useEffect(() => {
    loadData();
    loadSettings();
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

  const loadSettings = () => {
    try {
      const stored = localStorage.getItem('mathe_manager_settings');
      if (stored) {
        setCompanyInfo(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  // Filter and calculate invoice items
  const invoiceItems = useMemo(() => {
    if (!data) return [];

    let filteredAppointments = data.appointments || [];

    // Apply date range filter
    if (startDateStr && endDateStr) {
      filteredAppointments = filteredAppointments.filter(
        app => app.date >= startDateStr + 'T00:00:00Z' && app.date <= endDateStr + 'T23:59:59Z'
      );
    }

    // Apply family filter
    if (selectedFamilyId !== 'all') {
      filteredAppointments = filteredAppointments.filter(
        app => app.studentIds.includes(selectedFamilyId)
      );
    }

    // Calculate items for invoice
    const items: Array<{
      date: string;
      studentName: string;
      description: string;
      amount: number;
      appointmentType: 'einzel' | 'gruppe';
    }> = [];

    filteredAppointments.forEach(appointment => {
      const studentIds = appointment.studentIds || [];
      const appointmentType = studentIds.length === 1 ? 'einzel' : 'gruppe';
      
      // Use first student for display (primary)
      const primaryStudentId = studentIds[0];
      
      items.push({
        date: appointment.date,
        studentName: getStudentName(primaryStudentId),
        description: `${appointmentType === 'einzel' ? 'Einzelstunde' : 'Gruppenkurs'} ${appointment.duration} Min`,
        amount: calculateAppointmentFee(appointment, primaryStudentId, data.priceEntries || []),
        appointmentType
      });
    });

    return items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [data, selectedFamilyId, startDateStr, endDateStr]);

  const totalPrice = useMemo(() => {
    return invoiceItems.reduce((sum, item) => sum + item.amount, 0);
  }, [invoiceItems]);

  const appointmentCount = invoiceItems.length;
  
  // Get selected family name for display
  const selectedFamilyName = useMemo(() => {
    if (selectedFamilyId === 'all') return null;
    if (!data?.students) return null;
    
    const student = data.students.find(s => s.id === selectedFamilyId);
    return student ? `${student.firstName} ${student.lastName || ''}` : null;
  }, [selectedFamilyId, data]);

  // Generate unique invoice number: YYYY-MM-ID
  const generateInvoiceNumber = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    
    // Simple random ID (in production, use a sequential counter)
    const id = Math.floor(Math.random() * 10000);
    return `${year}-${month}-${id.toString().padStart(4, '0')}`;
  };

  const handleGenerateInvoice = () => {
    if (!data || !companyInfo.name || !companyInfo.address) {
      alert('Bitte speichern Sie zuerst Ihre Firmeninformationen in den Einstellungen');
      return;
    }

    if (appointmentCount === 0) {
      alert('Keine Termine im ausgewählten Zeitraum gefunden.');
      return;
    }

    setIsGenerating(true);

    // Small delay to allow UI to update
    setTimeout(() => {
      const invoiceNumber = generateInvoiceNumber();
      const invoiceDate = new Date().toISOString();
      
      // Generate HTML content for the invoice template
      const htmlContent = `
        <html>
          <head>
            <title>Rechnung ${invoiceNumber} - MatheManager</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @media print {
                .print-container * {
                  visibility: visible !important;
                }
                .no-print {
                  display: none !important;
                }
                body {
                  margin: 0;
                  padding: 0;
                  height: auto !important;
                  overflow: visible !important;
                }
              }
            </style>
          </head>
          <body class="bg-gray-100">
            <div class="print-container min-h-screen flex items-center justify-center p-4">
              ${InvoiceTemplate({
                companyInfo,
                invoiceNumber,
                invoiceDate,
                familyName: selectedFamilyName || 'Familie',
                familyAddress: '', // Could fetch from data if needed
                items: invoiceItems.map(item => ({
                  date: item.date,
                  studentName: item.studentName,
                  description: `${item.description} (${item.appointmentType})`,
                  amount: item.amount.toFixed(2)
                })),
                totalPrice,
                onPrint: () => window.print()
              })}
          </body>
        </html>`;

      // Create a new window with the invoice content for printing
      const printWindow = window.open('', '_blank');
      
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        
        // Wait for content to load then print
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.focus();
            window.print();
            printWindow.close();
          }, 500);
        };
      } else {
        // Fallback if popup blocked
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = url;
        document.body.appendChild(iframe);
        
        iframe.onload = () => {
          setTimeout(() => {
            window.print();
            document.body.removeChild(iframe);
          }, 500);
        };
      }

      setIsGenerating(false);
    }, 100);
  };

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
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700 sticky top-0 z-10 print:hidden">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-600" />
                Rechnungen
              </h1>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                Wähle eine Familie und Zeitraum, um eine Rechnung zu erstellen
              </p>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden sm:flex items-center gap-2">
              <a href="/dashboard" className="px-3 py-1.5 text-sm font-medium bg-gray-100 dark:bg-slate-700/50 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
                Dashboard
              </a>
              <a href="/billing" className="px-3 py-1.5 text-sm font-medium bg-gray-100 dark:bg-slate-700/50 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
                Abrechnung
              </a>
              <button
                onClick={() => window.location.href = '/settings'}
                className="px-3 py-1.5 text-sm font-medium bg-gray-100 dark:bg-slate-700/50 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
              >
                Einstellungen
              </button>
            </nav>
          </div>

          {/* Mobile Navigation */}
          <nav className="sm:hidden mt-4 overflow-x-auto flex gap-2 pb-1 -mx-4">
            <a href="/dashboard" className="flex-1 px-3 py-1.5 text-sm font-medium bg-gray-100 dark:bg-slate-700/50 rounded-lg whitespace-nowrap hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
              Dashboard
            </a>
            <a href="/billing" className="flex-1 px-3 py-1.5 text-sm font-medium bg-gray-100 dark:bg-slate-700/50 rounded-lg whitespace-nowrap hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
              Abrechnung
            </a>
            <button
              onClick={() => window.location.href = '/invoices'}
              className="flex-1 px-3 py-1.5 text-sm font-medium bg-green-600 text-white rounded-lg whitespace-nowrap"
            >
              Rechnungen
            </button>
            <button
              onClick={onBack}
              className="flex-1 px-3 py-1.5 text-sm font-medium bg-gray-100 dark:bg-slate-700/50 rounded-lg whitespace-nowrap hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
            >
              Zurück
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6 print:hidden">
        {/* Filters Card */}
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm p-5 space-y-4">
          {/* Family & Date Range Row */}
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Family Selector */}
            <div>
              <label htmlFor="familySelect" className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-blue-600 text-white flex items-center justify-center text-[8px] font-bold">A</span>
                Familie
              </label>
              <select
                id="familySelect"
                value={selectedFamilyId}
                onChange={(e) => setSelectedFamilyId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              >
                <option value="all">Alle Familien</option>
                {data?.students.map(student => (
                  <option key={student.id} value={student.id}>
                    {student.firstName} {student.lastName || ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label htmlFor="startDate" className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-gray-400" />
                Von
              </label>
              <input
                type="date"
                id="startDate"
                value={startDateStr}
                onChange={(e) => setStartDateStr(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* End Date */}
            <div>
              <label htmlFor="endDate" className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-gray-400" />
                Bis
              </label>
              <input
                type="date"
                id="endDate"
                value={endDateStr}
                onChange={(e) => setEndDateStr(e.target.value)}
                min={startDateStr || undefined}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Summary & Generate Button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-gray-200 dark:border-slate-600">
            <div className="text-sm space-y-1">
              {appointmentCount > 0 ? (
                <>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {appointmentCount} Termin(e) gefunden
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    Gesamthonorar:
                  </p>
                </>
              ) : (
                <>
                  <p className="text-gray-500 dark:text-slate-400 italic">
                    Wählen Sie eine Familie und Zeitraum, um Termine anzuzeigen.
                  </p>
                </>
              )}
            </div>

            {/* Generate Button */}
            {appointmentCount > 0 && (
              <button
                onClick={handleGenerateInvoice}
                disabled={isGenerating}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed w-full sm:w-auto"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Drucken...
                  </>
                ) : (
                  <>
                    <Printer size={16} />
                    Rechnung drucken
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Preview Section */}
        {appointmentCount > 0 && invoiceItems.length > 0 && (
          <div className="mt-6 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 dark:bg-slate-700/30 border-b border-gray-200 dark:border-slate-600 flex items-center justify-between print:hidden">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1.5">
                <FileText size={14} />
                Rechnungsvorschau
              </h3>
              <span className="text-xs text-gray-500 dark:text-slate-400 font-mono bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded">
                {invoiceItems.length} Positionen
              </span>
            </div>

            <div className="max-h-[300px] overflow-y-auto divide-y divide-gray-100 dark:divide-slate-700">
              {invoiceItems.map((item, index) => (
                <div key={index} className="flex justify-between items-center px-5 py-3 text-sm hover:bg-gray-50 dark:hover:bg-slate-700/30 print:border-b print:border-black print:last:border-none">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {item.studentName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                      {new Date(item.date).toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })} • {item.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4 min-w-[80px] justify-end">
                    <span className="text-xs text-gray-500 dark:text-slate-400 whitespace-nowrap hidden sm:block">
                      {item.amount.toFixed(2)} €
                    </span>
                  </div>
                </div>
              ))}

              {/* Footer Row */}
              <div className="flex justify-between items-center px-5 py-3 bg-gray-50 dark:bg-slate-700/30 border-t border-gray-200 dark:border-slate-600">
                <span className="text-sm font-medium text-gray-900 dark:text-white">Gesamtsumme:</span>
                <span className="text-sm font-bold text-green-600 dark:text-green-500 whitespace-nowrap">
                  {totalPrice.toFixed(2)} €
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {appointmentCount === 0 && invoiceItems.length === 0 && (
          <div className="text-center py-16">
            <FileText size={48} className="mx-auto text-gray-300 dark:text-slate-600 mb-4" />
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Wählen Sie eine Familie und Zeitraum, um Termine anzuzeigen.
            </p>
          </div>
        )}
      </main>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .print-container * {
            visibility: visible !important;
          }
          .no-print {
            display: none !important;
          }
          body {
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            overflow: visible !important;
          }
        }
      `}</style>
    </div>
  );
}

function getStudentName(studentId?: string): string {
  if (!studentId) return 'Familie';
  
  const [firstName, lastName] = studentId.split('-').slice(-2);
  return `${firstName} ${lastName || ''}`;
}