/**
 * Invoices Page - Generate invoices and appointment previews for families
 */
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import {
 Printer, User, Calendar, DollarSign, Building2, FileText,
 Check, X, Clock, Eye, Download, Files, Loader2,
} from 'lucide-react';
import type { DataContainer, InvoiceItem, Family, Student, PriceEntry, Appointment } from '@/types';
import { calculateAppointmentFee } from '@/lib/billing';
import { formatInvoiceNumber, calculateDueDate, calculateInvoiceTotals, buildInvoiceDataForFamily } from '@/lib/invoiceUtils';
import { filterAppointmentsByDate } from '@/lib/dateFilters';
import { InvoiceTemplate, type InvoiceData } from '@/components/InvoiceTemplate';
import { generatePdfFromElement, generateBatchPdf } from '@/lib/generatePdf';

export interface AppointmentPreviewItem {
  appointmentId: string;
  date: string;
  time: string;
  studentName: string;
  lessonType: 'individual' | 'group' | 'block';
  duration: number;
  status: Appointment['status'];
  unitPrice: number;
  totalPrice: number;
  blockName?: string; // Block name for block lesson type
}

export interface AppointmentPreviewData {
  issuedBy: {
    name?: string;
    street?: string;
    zipCode?: string;
    city?: string;
    email?: string;
    phone?: string;
  };
  billedTo: {
    name?: string;
    street?: string;
    zipCode?: string;
    city?: string;
  };
  items: AppointmentPreviewItem[];
  total: number;
  dateRange: { from: string; to: string };
}

// ── Preview Template Component (used for both screen and print) ──

function AppointmentPreviewTemplate({ preview }: { preview: AppointmentPreviewData }) {
 const formatDate = (dateString: string) => {
 return new Date(dateString).toLocaleDateString('de-DE', { year: 'numeric', month: '2-digit', day: '2-digit' });
 };

 const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
 const previewRef = useRef<HTMLDivElement>(null);

 const handleDownloadPdf = async () => {
 if (!previewRef.current || isGeneratingPdf) return;
 setIsGeneratingPdf(true);
 try {
 const filename = `Terminvorschau_${preview.billedTo.name || 'Unbekannt'}.pdf`;
 await generatePdfFromElement(previewRef.current, {
 filename,
 margin: [10, 10, 10, 10],
 orientation: 'portrait',
 format: 'a4',
 imageQuality: 0.98,
 html2canvasScale: 2,
 });
 } catch (err) {
 console.error('PDF generation failed:', err);
 } finally {
 setIsGeneratingPdf(false);
 }
 };

 return (
 <div ref={previewRef} className="min-h-screen bg-white p-0 print:p-0 print:min-h-0">
      <style>{`
        @media print {
          @page { size: A4; margin: 10mm; padding: 0; }
          body { margin: 0; padding: 0; width: 210mm; height: 297mm; }
          .print-break-avoid { page-break-inside: avoid; }
          .print-break-after { page-break-after: always; }
        }
      `}</style>

      {/* Preview Header */}
      <header className="mb-4 border-b-4 border-blue-700 pb-3 print-break-avoid">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h1 className="text-xl font-bold uppercase tracking-wider mb-1">
              {preview.issuedBy.name || 'MatheManager'}
            </h1>
            {preview.issuedBy.street && <p className="text-xs font-semibold uppercase">{preview.issuedBy.street}</p>}
            {(preview.issuedBy.zipCode || preview.issuedBy.city) && (
              <p className="text-xs font-semibold uppercase">{preview.issuedBy.zipCode} {preview.issuedBy.city}</p>
            )}
            {preview.issuedBy.email && <p className="text-xs mt-1">{preview.issuedBy.email}</p>}
            {preview.issuedBy.phone && <p className="text-xs mt-1">{preview.issuedBy.phone}</p>}
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold uppercase tracking-wider mb-1 text-blue-700">
              TERMINVORSCHAU
            </h2>
            <p className="text-sm font-semibold">{formatDate(new Date().toISOString())}</p>
            {preview.dateRange.from && preview.dateRange.to && (
              <p className="text-xs text-gray-600 mt-1">
                Zeitraum: {formatDate(preview.dateRange.from)} – {formatDate(preview.dateRange.to)}
              </p>
            )}
          </div>
        </div>
        <div className="mt-3 pt-2 border-t-2 border-dashed border-blue-700">
          <p className="text-xs uppercase font-bold mb-1">Terminliste & Zahlungsvorschau für:</p>
          {preview.billedTo.name && <p className="text-base font-bold">{preview.billedTo.name}</p>}
        </div>
      </header>

      {/* Preview Items Table */}
      <div className="mb-4 print-break-avoid">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-4 border-blue-700 bg-blue-50 print:bg-white">
              <th className="text-left py-1 px-1.5 text-xs uppercase font-semibold tracking-wider" style={{ width: '16%' }}>
                Datum / Zeit
              </th>
              <th className="text-left py-1 px-1.5 text-xs uppercase font-semibold tracking-wider" style={{ width: '16%' }}>
                Schüler
              </th>
              <th className="text-left py-1 px-1.5 text-xs uppercase font-semibold tracking-wider" style={{ width: '14%' }}>
                Typ
              </th>
              <th className="text-left py-1 px-1.5 text-xs uppercase font-semibold tracking-wider" style={{ width: '14%' }}>
                Dauer
              </th>
              <th className="text-right py-1 px-1.5 text-xs uppercase font-semibold tracking-wider" style={{ width: '20%' }}>
                Preis
              </th>
              <th className="text-right py-1 px-1.5 text-xs uppercase font-semibold tracking-wider" style={{ width: '20%' }}>
                Gesamtpreis
              </th>
            </tr>
          </thead>
          <tbody>
            {preview.items.length > 0 ? (
              preview.items.map((item, index) => (
                <tr key={index} className="border-b border-dotted border-gray-300 hover:bg-blue-50 transition-colors print-break-avoid">
                  <td className="py-1.5 px-1.5 text-xs">
                    <div className="font-medium">{formatDate(item.date)}</div>
                    <div className="text-gray-500 flex items-center gap-1">
                      <Clock size={10} /> {item.time}
                    </div>
                  </td>
                  <td className="py-1.5 px-1.5 text-xs font-medium">{item.studentName}</td>
                  <td className="py-1.5 px-1.5 text-xs">
                    {item.lessonType === 'group' ? (
                      <span className="inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span> Gruppe
                      </span>
                    ) : item.lessonType === 'block' ? (
                      <span className="inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span> Block-Unterricht
                      {item.blockName && (
                        <span className="text-orange-600 font-medium">({item.blockName})</span>
                      )}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Einzel
                      </span>
                    )}
                  </td>
                  <td className="py-1.5 px-1.5 text-xs">{item.lessonType === 'block' ? '-' : (item.duration === 0 ? '-' : `${item.duration} Min`)}</td>
                  <td className="py-1.5 px-1.5 text-xs text-right">{item.lessonType === 'block' ? '-' : (item.unitPrice === 0 ? '-' : `€${item.unitPrice.toFixed(2)}`)}</td>
                  <td className="py-1.5 px-1.5 text-xs text-right font-semibold">{item.lessonType === 'block' ? '-' : `€${item.totalPrice.toFixed(2)}`}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-3 px-2 text-center text-gray-400 italic">
                  Keine geplanten Termine vorhanden
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Totals Section */}
      <div className="flex justify-end mt-4 print-break-avoid">
        <div className="w-[45%]">
          <div className="flex justify-between py-1 border-b border-dotted border-gray-300">
            <span className="text-xs font-medium text-gray-600">Voraussichtlicher Gesamtbetrag</span>
            <span className="text-xs font-semibold">&euro;{preview.total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-2 border-t-4 border-blue-700 mt-1">
            <span className="text-base font-bold text-blue-700">Voraussichtliche Summe</span>
            <span className="text-base font-bold text-blue-700">&euro;{preview.total.toFixed(2)}</span>
          </div>
          <div className="mt-2 text-center">
            <p className="text-xs text-gray-600 italic">
              Gemäß &sect;4 Nr. 21 bin ich von der Umsatzsteuer befreit.
            </p>
          </div>
          <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg print-break-avoid">
            <p className="text-xs font-semibold text-blue-700 mb-1">Hinweis:</p>
            <p className="text-xs text-blue-600">
              Dies ist eine Vorschau der geplanten Termine und voraussichtlichen Kosten.
              Die tatsächliche Abrechnung erfolgt nach Durchführung der Termine.
            </p>
          </div>
 {/* Action buttons – hidden in print */}
 <div className="flex gap-2 mt-3 print:hidden">
 <button onClick={handleDownloadPdf} disabled={isGeneratingPdf}
 className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-700 text-white font-medium rounded-lg hover:bg-blue-800 transition-colors text-xs disabled:opacity-50 disabled:cursor-not-allowed">
 {isGeneratingPdf ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
 {isGeneratingPdf ? 'PDF wird erstellt…' : 'PDF herunterladen'}
 </button>
 <button onClick={() => window.print()}
 className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-xs">
 <Printer size={12} /> Drucken
 </button>
 </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-2 border-t border-gray-200 text-center">
        <p className="text-xs text-gray-500">
          Diese Terminvorschau ist kein Rechnungsdokument. Die endgültige Abrechnung erfolgt separat.
        </p>
      </div>
    </div>
  );
}

// ── Page Component ──

export default function InvoicesPage() {
  const [data, setData] = useState<DataContainer | null>(null);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [previewData, setPreviewData] = useState<AppointmentPreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'invoice' | 'preview'>('invoice');

  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  // Default to current month range (local timezone)
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  // Format dates as YYYY-MM-DD in local timezone
  const formatDateLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const [startDate, setStartDate] = useState(formatDateLocal(firstDayOfMonth));
  const [endDate, setEndDate] = useState(formatDateLocal(lastDayOfMonth));

  const [studentDropdownOpen, setStudentDropdownOpen] = useState(false);
  const [studentFilter, setStudentFilter] = useState('');

  // Family multi-select for Serienrechnung
  const [selectedFamilyIds, setSelectedFamilyIds] = useState<string[]>([]);
  const [familyDropdownOpen, setFamilyDropdownOpen] = useState(false);
  const [familyFilter, setFamilyFilter] = useState('');

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.student-dropdown-container')) {
        setStudentDropdownOpen(false);
        setStudentFilter('');
      }
      if (!target.closest('.family-dropdown-container')) {
        setFamilyDropdownOpen(false);
        setFamilyFilter('');
      }
    };
    if (studentDropdownOpen || familyDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [studentDropdownOpen, familyDropdownOpen]);

  const loadData = () => {
    setLoading(true);
    try {
      const stored = localStorage.getItem('mathe_manager_data');
      if (stored) { setData(JSON.parse(stored)); }
    } catch (error) { console.error('Error loading data:', error); }
    finally { setLoading(false); }
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

  const getFilteredFamilies = (): Family[] => {
    const filter = familyFilter.toLowerCase();
    return (data?.families || []).filter(family =>
      family.name.toLowerCase().includes(filter)
    );
  };

  // ── Build invoice items for a specific family (used by batch + single invoice) ──
  const buildFamilyAppointmentItems = (
    familyId: string,
    appointments: Appointment[]
  ): Array<{
    id: string; date: string; studentId: string; studentName: string;
    lessonType: 'individual' | 'group' | 'block';
    status: 'attended' | 'canceled_paid' | 'canceled_free' | 'planned';
    description: string; totalPrice: number; isPaid: boolean;
  }> => {
    const studentsInFamily = (data?.students || []).filter(s => s.familyId === familyId);
    const studentIdsInFamily = new Set(studentsInFamily.map(s => s.id));

    // Filter appointments for this family's students
    const familyAppointments = appointments.filter(app =>
      app.studentIds.some(id => studentIdsInFamily.has(id))
    );

    const items: Array<{
      id: string; date: string; studentId: string; studentName: string;
      lessonType: 'individual' | 'group' | 'block';
      status: 'attended' | 'canceled_paid' | 'canceled_free' | 'planned';
      description: string; totalPrice: number; isPaid: boolean;
    }> = [];
    const seen = new Set<string>();

    // Track block pricing per student to avoid duplicates
    const blockItemsSeen = new Set<string>();

    familyAppointments.forEach(appointment => {
      appointment.studentIds.forEach(studentId => {
        if (!studentIdsInFamily.has(studentId)) return;
        const key = `${appointment.id}-${studentId}`;
        if (seen.has(key)) return;
        seen.add(key);

        const student = (data?.students || []).find(s => s.id === studentId);
        const lessonType = appointment.studentIds.length > 1 ? 'group' : 'individual';

        // Check block pricing
        let blockEntry: PriceEntry | undefined;
        for (const entry of data?.priceEntries || []) {
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

        if (blockEntry) {
          const blockKey = `${studentId}-${blockEntry.id}`;
          if (!blockItemsSeen.has(blockKey)) {
            blockItemsSeen.add(blockKey);
            const paymentStatus = (data?.paymentStatuses || []).find(
              s => s.appointmentId === appointment.id && s.studentId === studentId
            );
            items.push({
              id: appointment.id,
              date: blockEntry.blockName || 'Block-Unterricht',
              studentId,
              studentName: student ? `${student.firstName} ${student.lastName || ''}`.trim() : 'Unknown',
              lessonType: 'block',
              status: 'attended',
              description: blockEntry.blockName || 'Block-Unterricht',
              totalPrice: blockEntry.blockPrice || 0,
              isPaid: paymentStatus?.isPaid || false,
            });
          }
          return;
        }

        // Standard pricing
        let fee = calculateAppointmentFee(appointment, studentId, data?.priceEntries || []);
        if (appointment.status === 'canceled_free') fee = 0;
        const paymentStatus = (data?.paymentStatuses || []).find(
          s => s.appointmentId === appointment.id && s.studentId === studentId
        );
        let description = lessonType === 'group' ? 'Gruppenunterricht' : 'Einzelunterricht';
        if (appointment.status === 'attended') description += ' (besucht)';
        else if (appointment.status === 'canceled_paid') description += ' (ausgefallen, 50%)';
        else if (appointment.status === 'canceled_free') description += ' (ausgefallen, kostenlos)';
        else if (appointment.status === 'planned') description += ' (geplant)';

        items.push({
          id: appointment.id, date: appointment.date, studentId,
          studentName: student ? `${student.firstName} ${student.lastName || ''}`.trim() : 'Unknown',
          lessonType, status: appointment.status as 'attended' | 'canceled_paid' | 'canceled_free' | 'planned',
          description, totalPrice: fee, isPaid: paymentStatus?.isPaid || false,
        });
      });
    });

    // Sort by date
    items.sort((a, b) => a.date.localeCompare(b.date));
    return items;
  };

 // ── Serienrechnung: generate ONE PDF with all families (one page each) ──
 const handleBatchInvoice = async () => {
 if (!data || selectedFamilyIds.length === 0) return;

 const familiesToProcess = selectedFamilyIds
 .map(id => (data.families || []).find(f => f.id === id))
 .filter(Boolean) as Family[];

 const invoiceDate = new Date();
 const paymentTerms = data.invoiceSettings?.paymentTerms || 14;
 const issuedBy: InvoiceData['issuedBy'] = {
 name: data.invoiceSettings?.businessName || 'MatheManager',
 street: data.invoiceSettings?.street,
 zipCode: data.invoiceSettings?.zipCode,
 city: data.invoiceSettings?.city,
 email: data.invoiceSettings?.email,
 phone: data.invoiceSettings?.phone,
 vatId: data.invoiceSettings?.vatId,
 iban: data.invoiceSettings?.iban,
 };
 const currentYear = new Date().getFullYear();
 let sequenceNumber = data.invoiceSettings?.invoiceNumberStart || 1;

 // Collect all elements to render into the batch PDF
 const batchElements: { element: HTMLElement; cleanup: () => void }[] = [];

 for (const family of familiesToProcess) {
 const appointmentItems = buildFamilyAppointmentItems(family.id, filteredAppointments);
 if (appointmentItems.length === 0) {
 // Skip families with no appointments in range, but still increment counter
 sequenceNumber++;
 continue;
 }

 const invoiceNumber = formatInvoiceNumber(currentYear, sequenceNumber);
 sequenceNumber++;

 const invoiceDataForFamily = buildInvoiceDataForFamily(
 family.id,
 family.name,
 family.address,
 (data?.students || []).filter(s => s.familyId === family.id).map(s => s.id),
 appointmentItems,
 issuedBy,
 invoiceNumber,
 invoiceDate,
 paymentTerms
 );

 // Update invoice number counter in localStorage
 const updatedData = {
 ...data,
 invoiceSettings: {
 ...data.invoiceSettings,
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
 invoiceNumberStart: sequenceNumber,
 },
 lastUpdated: new Date().toISOString(),
 };
 localStorage.setItem('mathe_manager_data', JSON.stringify(updatedData));
 setData(updatedData);

 // Create a temporary DOM element for this invoice
 const container = document.createElement('div');
 container.style.fontFamily = 'Arial, sans-serif';
 container.style.maxWidth = '210mm';
 container.style.padding = '10mm';
 container.style.boxSizing = 'border-box';
 container.style.background = '#fff';
 container.style.color = '#000';
 container.style.position = 'absolute';
 container.style.left = '-9999px';

 const inv = invoiceDataForFamily;
 const fmtDate = (ds: string) => new Date(ds).toLocaleDateString('de-DE', { year: 'numeric', month: '2-digit', day: '2-digit' });
 const sub = inv.items.reduce((s: number, i: { totalPrice: number }) => s + i.totalPrice, 0);

 const rowsHtml = inv.items.map((item: { date: string; studentName?: string; lessonType?: string; status?: string; totalPrice: number; isPaid?: boolean; description?: string }) => {
 const dateStr = item.lessonType === 'block' ? '-' : fmtDate(item.date);
 const typeStr = item.lessonType === 'group' ? 'Gruppenunterricht' : item.lessonType === 'block' ? 'Block-Unterricht' : 'Einzelunterricht';
 const statusStr = item.status === 'attended' ? 'Besucht' : item.status === 'canceled_paid' ? 'Bezahlt ausgefallen' : item.status === 'canceled_free' ? 'Kostenlos ausgefallen' : 'Geplant';
 const paidStr = item.lessonType === 'block' ? '-' : item.isPaid ? '✓ Ja' : '✗ Nein';
 return `<tr style="border-bottom:1px dotted #999"><td style="padding:4px 6px;font-size:12px">${dateStr}</td><td style="padding:4px 6px;font-size:12px">${item.studentName || '-'}</td><td style="padding:4px 6px;font-size:12px">${typeStr}</td><td style="padding:4px 6px;font-size:12px">${statusStr}</td><td style="padding:4px 6px;font-size:12px;text-align:right;font-weight:600">€${item.totalPrice.toFixed(2)}</td><td style="padding:4px 6px;font-size:12px;text-align:center">${paidStr}</td></tr>`;
 }).join('');

 container.innerHTML = `
 <div style="margin-bottom:16px;padding-bottom:12px;border-bottom:4px solid #000">
 <div style="display:flex;justify-content:space-between;align-items:flex-start">
 <div>
 <h1 style="font-size:20px;font-weight:900;letter-spacing:0.1em;margin:0 0 4px">${inv.issuedBy.name || 'MatheManager'}</h1>
 ${inv.issuedBy.street ? `<p style="font-size:11px;font-weight:600;text-transform:uppercase;margin:0">${inv.issuedBy.street}</p>` : ''}
 ${(inv.issuedBy.zipCode || inv.issuedBy.city) ? `<p style="font-size:11px;font-weight:600;text-transform:uppercase;margin:0">${inv.issuedBy.zipCode || ''} ${inv.issuedBy.city || ''}</p>` : ''}
 ${inv.issuedBy.email ? `<p style="font-size:11px;margin:4px 0 0">${inv.issuedBy.email}</p>` : ''}
 ${inv.issuedBy.phone ? `<p style="font-size:11px;margin:2px 0 0">${inv.issuedBy.phone}</p>` : ''}
 </div>
 <div style="text-align:right">
 <h2 style="font-size:20px;font-weight:900;letter-spacing:0.1em;margin:0 0 4px">RECHNUNG</h2>
 <p style="font-size:13px;font-weight:600">${fmtDate(inv.invoiceDate)}</p>
 <p style="font-size:11px;color:#666;margin-top:4px">Rechnungsnummer: ${inv.invoiceNumber}</p>
 </div>
 </div>
 <div style="margin-top:12px;padding-top:8px;border-top:2px dashed #000">
 <p style="font-size:10px;font-weight:700;text-transform:uppercase;margin:0 0 4px">Rechnung an:</p>
 <p style="font-size:14px;font-weight:700;margin:0">${inv.billedTo.name}</p>
 ${inv.billedTo.street ? `<p style="font-size:11px;margin:2px 0 0">${inv.billedTo.street}</p>` : ''}
 </div>
 </div>
 <table style="width:100%;border-collapse:collapse;border:2px solid #000;margin-bottom:16px">
 <thead>
 <tr style="background:#f0f0f0;border-bottom:3px solid #000">
 <th style="text-align:left;padding:4px 6px;font-size:10px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase">Datum</th>
 <th style="text-align:left;padding:4px 6px;font-size:10px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase">Schüler</th>
 <th style="text-align:left;padding:4px 6px;font-size:10px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase">Typ</th>
 <th style="text-align:left;padding:4px 6px;font-size:10px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase">Status</th>
 <th style="text-align:right;padding:4px 6px;font-size:10px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase">Gesamtpreis</th>
 <th style="text-align:center;padding:4px 6px;font-size:10px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase">Bezahlt</th>
 </tr>
 </thead>
 <tbody>${rowsHtml}</tbody>
 </table>
 <div style="display:flex;justify-content:flex-end">
 <div style="width:45%">
 <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px dotted #999">
 <span style="font-size:11px;color:#666">Zwischensumme (netto)</span>
 <span style="font-size:11px;font-weight:600">€${sub.toFixed(2)}</span>
 </div>
 <div style="display:flex;justify-content:space-between;padding:8px 0;border-top:3px solid #000;margin-top:4px">
 <span style="font-size:14px;font-weight:700">Gesamtbetrag</span>
 <span style="font-size:14px;font-weight:700">€${inv.total.toFixed(2)}</span>
 </div>
 <p style="text-align:center;font-size:10px;color:#666;font-style:italic;margin-top:8px">Gemäß §4 Nr. 21 bin ich von der Umsatzsteuer befreit.</p>
 <div style="margin-top:8px;padding:8px;background:#f5f5f5;border:1px solid #ccc;border-radius:4px">
 <p style="font-size:11px;font-weight:600;color:#333;margin:0 0 4px">Zahlungsbedingungen:</p>
 <p style="font-size:11px;color:#666;margin:0">Fällig bis: ${fmtDate(inv.dueDate)}</p>
 ${inv.issuedBy.iban ? `<p style="font-size:11px;color:#666;margin:4px 0 0">IBAN: ${inv.issuedBy.iban}</p>` : ''}
 </div>
 </div>
 </div>
 <div style="margin-top:16px;padding-top:8px;border-top:1px solid #ccc;text-align:center">
 <p style="font-size:10px;color:#999">Vielen Dank für die gute Zusammenarbeit!</p>
 </div>`;

 document.body.appendChild(container);
 batchElements.push({ element: container, cleanup: () => document.body.removeChild(container) });
 }

 // Generate ONE combined PDF with all invoices
 if (batchElements.length > 0) {
 try {
 await generateBatchPdf(batchElements, {
 filename: `Serienrechnung_${new Date().toISOString().slice(0, 10)}.pdf`,
 margin: [10, 10, 10, 10],
 orientation: 'portrait',
 format: 'a4',
 imageQuality: 0.98,
 html2canvasScale: 2,
 });
 } catch (err) {
 console.error('Batch PDF generation failed:', err);
 // Clean up any remaining containers
 batchElements.forEach(({ cleanup }) => { try { cleanup(); } catch {} });
 }
 }

 // Reset family selection after processing
 setSelectedFamilyIds([]);
 };

  // ── Filtered appointments for INVOICE (exclude planned) ──
  const filteredAppointments = useMemo(() => {
    // If endDate is set, use custom range – startDate defaults to today if empty
    const effectiveStartDate = startDate || new Date().toISOString().split('T')[0];
    return filterAppointmentsByDate(data?.appointments || [], {
      timeRange: endDate ? 'custom' : 'all',
      startDate: effectiveStartDate,
      endDate,
    }).filter(app => {
      if (selectedStudentIds.length === 0) return true;
      return app.studentIds.some(id => selectedStudentIds.includes(id));
    });
  }, [data, selectedStudentIds, startDate, endDate]);

  // ── Filtered appointments for PREVIEW (ONLY planned) ──
  const plannedAppointments = useMemo(() => {
    let result = (data?.appointments || []).filter(app => app.status === 'planned');
    if (startDate && endDate) {
      const start = new Date(startDate); start.setHours(0, 0, 0, 0);
      const end = new Date(endDate); end.setHours(23, 59, 59, 999);
      result = result.filter(app => {
        const appDate = new Date(app.date);
        return appDate >= start && appDate <= end;
      });
    }
    if (selectedStudentIds.length > 0) {
      result = result.filter(app => app.studentIds.some(id => selectedStudentIds.includes(id)));
    }
    result.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return (a.time || '').localeCompare(b.time || '');
    });
    return result;
  }, [data, selectedStudentIds, startDate, endDate]);

  // ── Invoice items ──
  const invoiceItems = useMemo(() => {
    if (!data) return [];
    const items: InvoiceItem[] = [];
    const seen = new Set<string>();
    
    // Track block pricing per student to avoid duplicates
    const blockItemsSeen = new Set<string>();
    
    filteredAppointments.forEach(appointment => {
      appointment.studentIds.forEach(studentId => {
        if (selectedStudentIds.length > 0 && !selectedStudentIds.includes(studentId)) return;
        const key = `${appointment.id}-${studentId}`;
        if (seen.has(key)) return;
        seen.add(key);
        const student = data.students.find(s => s.id === studentId);
        const lessonType = appointment.studentIds.length > 1 ? 'group' : 'individual';
        
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
        
        // If student has block pricing, add block item (only once per student per block)
        if (blockEntry) {
          const blockKey = `${studentId}-${blockEntry.id}`;
          if (!blockItemsSeen.has(blockKey)) {
            blockItemsSeen.add(blockKey);
            const paymentStatus = (data?.paymentStatuses || []).find(s => s.appointmentId === appointment.id && s.studentId === studentId);
            items.push({
              appointmentId: appointment.id,
              date: blockEntry.blockName || 'Block-Unterricht', // Use block name instead of date
              studentName: student ? `${student.firstName} ${student.lastName || ''}`.trim() : 'Unknown',
              lessonType: 'block',
              status: 'attended' as const,
              hourlyRate: 0,
              description: blockEntry.blockName || 'Block-Unterricht',
              unitPrice: blockEntry.blockPrice || 0,
              quantity: 1,
              totalPrice: blockEntry.blockPrice || 0,
              isPaid: paymentStatus?.isPaid || false,
            });
          }
          return; // Skip individual appointment items for block pricing
        }
        
        // Standard pricing logic
        let priceEntry: PriceEntry | undefined;
        for (const entry of data.priceEntries || []) {
          if (entry.type === 'block') continue; // Skip block entries for standard pricing
          if (new Date(appointment.date) >= new Date(entry.validFrom) && entry.studentIds && entry.studentIds.includes(studentId)) {
            const validTo = entry.validTo ? new Date(entry.validTo) : null;
            if (!validTo || new Date(appointment.date) <= validTo) { priceEntry = entry; break; }
          }
        }
        if (!priceEntry) {
          for (const entry of data.priceEntries || []) {
            if (entry.type === 'block') continue; // Skip block entries for standard pricing
            if (new Date(appointment.date) >= new Date(entry.validFrom) && (!entry.studentIds || entry.studentIds.length === 0)) {
              const validTo = entry.validTo ? new Date(entry.validTo) : null;
              if (!validTo || new Date(appointment.date) <= validTo) { priceEntry = entry; break; }
            }
          }
        }
        let fee = calculateAppointmentFee(appointment, studentId, data.priceEntries || []);
        if (appointment.status === 'canceled_free') fee = 0;
        const paymentStatus = (data?.paymentStatuses || []).find(s => s.appointmentId === appointment.id && s.studentId === studentId);
        let description = lessonType === 'group' ? 'Gruppenunterricht' : 'Einzelunterricht';
        if (appointment.status === 'attended') description += ' (besucht)';
        else if (appointment.status === 'canceled_paid') description += ' (ausgefallen, 50%)';
        else if (appointment.status === 'canceled_free') description += ' (ausgefallen, kostenlos)';
        else if (appointment.status === 'planned') description += ' (geplant)';
        let hourlyRate = 0;
        if (priceEntry) {
          if (lessonType === 'individual') {
            hourlyRate = appointment.duration === 90 ? (priceEntry.individual90 || 0) / 1.5 : (priceEntry.individual60 || 0);
          } else {
            hourlyRate = appointment.duration === 90 ? (priceEntry.group90 || 0) / 1.5 : (priceEntry.group60 || 0);
          }
        }
        items.push({
          appointmentId: appointment.id, date: appointment.date,
          studentName: student ? `${student.firstName} ${student.lastName || ''}`.trim() : 'Unknown',
          lessonType, status: appointment.status as 'attended' | 'canceled_paid' | 'canceled_free' | 'planned',
          hourlyRate, description, unitPrice: fee, quantity: 1, totalPrice: fee,
          isPaid: paymentStatus?.isPaid || false,
        });
      });
    });
    return items;
  }, [filteredAppointments, data, selectedStudentIds]);

  // ── Preview items ──
  const previewItems = useMemo(() => {
    if (!data) return [];
    const items: AppointmentPreviewItem[] = [];
    const seen = new Set<string>();
    
    // Track block pricing per student to avoid duplicates
    const blockItemsSeen = new Set<string>();
    
    plannedAppointments.forEach(appointment => {
      appointment.studentIds.forEach(studentId => {
        if (selectedStudentIds.length > 0 && !selectedStudentIds.includes(studentId)) return;
        const key = `${appointment.id}-${studentId}`;
        if (seen.has(key)) return;
        seen.add(key);
        const student = data.students.find(s => s.id === studentId);
        const lessonType = appointment.studentIds.length > 1 ? 'group' : 'individual';
        
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
        
        // If student has block pricing, list each appointment individually with block label
        if (blockEntry) {
          items.push({
            appointmentId: appointment.id,
            date: appointment.date,
            time: appointment.time || '--:--',
            studentName: student ? `${student.firstName} ${student.lastName || ''}`.trim() : 'Unknown',
            lessonType: 'block',
            duration: appointment.duration,
            status: appointment.status,
            unitPrice: 0, // Show as "-" in preview
            totalPrice: 0, // Show as "-" in preview; excluded from total
            blockName: blockEntry.blockName || 'Block-Unterricht',
          });
          return; // Skip standard pricing for block appointments
        }
        
        // Standard pricing logic
        let priceEntry: PriceEntry | undefined;
        for (const entry of data.priceEntries || []) {
          if (entry.type === 'block') continue; // Skip block entries for standard pricing
          if (new Date(appointment.date) >= new Date(entry.validFrom) && entry.studentIds && entry.studentIds.includes(studentId)) {
            const validTo = entry.validTo ? new Date(entry.validTo) : null;
            if (!validTo || new Date(appointment.date) <= validTo) { priceEntry = entry; break; }
          }
        }
        if (!priceEntry) {
          for (const entry of data.priceEntries || []) {
            if (entry.type === 'block') continue; // Skip block entries for standard pricing
            if (new Date(appointment.date) >= new Date(entry.validFrom) && (!entry.studentIds || entry.studentIds.length === 0)) {
              const validTo = entry.validTo ? new Date(entry.validTo) : null;
              if (!validTo || new Date(appointment.date) <= validTo) { priceEntry = entry; break; }
            }
          }
        }
        let unitPrice = 0;
        if (priceEntry) {
          if (lessonType === 'individual') {
            unitPrice = appointment.duration === 90 ? (priceEntry.individual90 || 0) : (priceEntry.individual60 || 0);
          } else {
            unitPrice = appointment.duration === 90 ? (priceEntry.group90 || 0) : (priceEntry.group60 || 0);
          }
        }
        items.push({
          appointmentId: appointment.id, date: appointment.date, time: appointment.time || '--:--',
          studentName: student ? `${student.firstName} ${student.lastName || ''}`.trim() : 'Unknown',
          lessonType, duration: appointment.duration, status: appointment.status,
          unitPrice, totalPrice: unitPrice,
        });
      });
    });
    return items;
  }, [plannedAppointments, data, selectedStudentIds]);

  const calculateInvoice = () => {
    if (!data || invoiceItems.length === 0) return;
    const firstStudentId = invoiceItems[0].appointmentId
      ? filteredAppointments.find(app => app.id === invoiceItems[0].appointmentId)?.studentIds[0]
      : null;
    const student = firstStudentId ? data.students.find(s => s.id === firstStudentId) : null;
    const family = student ? data.families.find(f => f.id === student.familyId) : null;
    const { subtotal, taxAmount, total } = calculateInvoiceTotals(invoiceItems);
    const currentYear = new Date().getFullYear();
    const currentInvoiceNumber = data.invoiceSettings?.invoiceNumberStart || 1;
    const invoiceNumber = formatInvoiceNumber(currentYear, currentInvoiceNumber);
    const invoiceDate = new Date();
    const dueDate = calculateDueDate(invoiceDate, data.invoiceSettings?.paymentTerms || 14);
    const updatedData = {
      ...data,
      invoiceSettings: {
        businessName: data.invoiceSettings?.businessName || '',
        street: data.invoiceSettings?.street || '',
        zipCode: data.invoiceSettings?.zipCode || '',
        city: data.invoiceSettings?.city || '',
        email: data.invoiceSettings?.email, phone: data.invoiceSettings?.phone,
        vatId: data.invoiceSettings?.vatId, taxId: data.invoiceSettings?.taxId,
        bankName: data.invoiceSettings?.bankName, iban: data.invoiceSettings?.iban,
        bankBic: data.invoiceSettings?.bankBic,
        paymentTerms: data.invoiceSettings?.paymentTerms || 14,
        hourlyRate: data.invoiceSettings?.hourlyRate || 0,
        lessonType: data.invoiceSettings?.lessonType || 'individual',
        invoiceNumberStart: currentInvoiceNumber + 1,
      },
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem('mathe_manager_data', JSON.stringify(updatedData));
    setData(updatedData);
    setInvoiceData({
      invoiceNumber,
      invoiceDate: invoiceDate.toISOString(),
      dueDate: dueDate.toISOString(),
      issuedBy: {
        name: data.invoiceSettings?.businessName || 'MatheManager',
        street: data.invoiceSettings?.street, zipCode: data.invoiceSettings?.zipCode,
        city: data.invoiceSettings?.city, email: data.invoiceSettings?.email,
        phone: data.invoiceSettings?.phone, vatId: data.invoiceSettings?.vatId,
        iban: data.invoiceSettings?.iban,
      },
      billedTo: { name: family?.name || 'Familie', street: family?.address },
      items: invoiceItems, subtotal, taxRate: 0, taxAmount, total,
    });
    setActiveView('invoice');
  };

  const calculatePreview = () => {
    if (!data || previewItems.length === 0) return;
    const firstStudentId = plannedAppointments[0]?.studentIds[0];
    const student = firstStudentId ? data.students.find(s => s.id === firstStudentId) : null;
    const family = student ? data.families.find(f => f.id === student.familyId) : null;
    // Total excludes block pricing items (they are listed individually but not summed)
  const total = previewItems.reduce((sum, item) => item.lessonType === 'block' ? sum : sum + item.totalPrice, 0);
    setPreviewData({
      issuedBy: {
        name: data.invoiceSettings?.businessName || 'MatheManager',
        street: data.invoiceSettings?.street, zipCode: data.invoiceSettings?.zipCode,
        city: data.invoiceSettings?.city, email: data.invoiceSettings?.email,
        phone: data.invoiceSettings?.phone,
      },
      billedTo: { name: family?.name || 'Familie', street: family?.address },
      items: previewItems,
      total: Math.round(total * 100) / 100,
      dateRange: {
        from: startDate || previewItems[0]?.date || '',
        to: endDate || previewItems[previewItems.length - 1]?.date || '',
      },
    });
    setActiveView('preview');
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
                <FileText className="w-6 h-6 text-green-600" /> Rechnungen
              </h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                Rechnungen und Terminvorschau für Familien
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={calculatePreview} disabled={previewItems.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <Eye size={16} /> Terminvorschau
              </button>
              <button onClick={calculateInvoice} disabled={invoiceItems.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <Printer size={16} /> Rechnung erstellen
              </button>
              <button onClick={handleBatchInvoice} disabled={selectedFamilyIds.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <Files size={16} /> Serienrechnung
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Filters */}
      <main className="max-w-4xl mx-auto px-4 py-6 print:hidden">
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-slate-700">
            <FileText size={18} /> Filter
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="student-dropdown-container">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Schüler</label>
              <div className="relative">
                <button type="button" onClick={() => setStudentDropdownOpen(!studentDropdownOpen)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-left focus:outline-none focus:ring-2 focus:ring-green-500">
                  {selectedStudentIds.length === 0
                    ? <span className="text-gray-500">Alle Schüler</span>
                    : <span>{selectedStudentIds.length} Schüler ausgewählt</span>
                  }
                </button>
                {studentDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <input type="text" placeholder="Schüler suchen..." value={studentFilter}
                      onChange={e => setStudentFilter(e.target.value)}
                      className="w-full px-3 py-2 border-b border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none" />
                    {getFilteredStudents().map(student => {
                      const familyName = getFamilyForStudent(student.id);
                      const isSelected = selectedStudentIds.includes(student.id);
                      return (
                        <button key={student.id} type="button"
                          onClick={() => {
                            if (isSelected) setSelectedStudentIds(prev => prev.filter(id => id !== student.id));
                            else setSelectedStudentIds(prev => [...prev, student.id]);
                          }}
                          className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-gray-100 dark:hover:bg-slate-600 ${isSelected ? 'bg-green-50 dark:bg-green-900/20' : ''}`}>
                          <span>{student.firstName} {student.lastName || ''} {familyName && <span className="text-gray-500 dark:text-slate-400 ml-2">({familyName})</span>}</span>
                          {isSelected && <Check size={16} className="text-green-600" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Family multi-select for Serienrechnung */}
            <div className="family-dropdown-container">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                Familien <span className="text-green-700 dark:text-green-400 text-xs">(für Serienrechnung)</span>
              </label>
              <div className="relative">
                <button type="button" onClick={() => setFamilyDropdownOpen(!familyDropdownOpen)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-left focus:outline-none focus:ring-2 focus:ring-green-500">
                  {selectedFamilyIds.length === 0
                    ? <span className="text-gray-500">Alle Familien</span>
                    : <span>{selectedFamilyIds.length} Familie(n) ausgewählt</span>
                  }
                </button>
              {familyDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg shadow-lg max-h-60 overflow-hidden flex flex-col">
                  <input type="text" placeholder="Familie suchen..." value={familyFilter}
                    onChange={e => setFamilyFilter(e.target.value)}
                    className="w-full px-3 py-2 border-b border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none" />
                  <div className="flex gap-1 px-2 py-1.5 border-b border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-600/50">
                    <button type="button"
                      onClick={() => {
                        const allFilteredIds = getFilteredFamilies().map(f => f.id);
                        setSelectedFamilyIds(prev => [...new Set([...prev, ...allFilteredIds])]);
                      }}
                      className="flex-1 px-2 py-1 text-xs font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 rounded hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors">
                      Alle auswählen
                    </button>
                    <button type="button"
                      onClick={() => setSelectedFamilyIds([])}
                      className="flex-1 px-2 py-1 text-xs font-medium text-gray-600 dark:text-slate-400 bg-gray-100 dark:bg-slate-600 rounded hover:bg-gray-200 dark:hover:bg-slate-500 transition-colors">
                      Auswahl aufheben
                    </button>
                  </div>
                  <div className="overflow-y-auto max-h-44">
                  {getFilteredFamilies().map(family => {
                    const isSelected = selectedFamilyIds.includes(family.id);
                    return (
                      <button key={family.id} type="button"
                        onClick={() => {
                          if (isSelected) setSelectedFamilyIds(prev => prev.filter(id => id !== family.id));
                          else setSelectedFamilyIds(prev => [...prev, family.id]);
                        }}
                        className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-gray-100 dark:hover:bg-slate-600 ${isSelected ? 'bg-green-50 dark:bg-green-900/20' : ''}`}>
                        <span>{family.name}</span>
                        {isSelected && <Check size={16} className="text-green-600" />}
                      </button>
                    );
                  })}
                  </div>
                </div>
              )}
              </div>
            </div>

            <div></div>
            <div></div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Von</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Bis</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500 dark:text-slate-400">
            {filteredAppointments.length} abgerechnete Termin(e) • {plannedAppointments.length} geplante Termin(e)
            {selectedFamilyIds.length > 0 && <span className="ml-2 text-green-600 dark:text-green-400">• {selectedFamilyIds.length} Familie(n) für Serienrechnung ausgewählt</span>}
          </div>
        </div>
      </main>

      {/* ── Print-only views (hidden on screen, visible when printing) ── */}
      {activeView === 'invoice' && invoiceData && (
        <div className="print:block hidden">
          <InvoiceTemplate invoice={invoiceData} onPrint={() => window.print()} />
        </div>
      )}
      {activeView === 'preview' && previewData && (
        <div className="print:block hidden">
          <AppointmentPreviewTemplate preview={previewData} />
        </div>
      )}

      {/* ── Screen-only views (hidden when printing) ── */}
      <main className="max-w-4xl mx-auto px-4 py-6 print:hidden">
        {activeView === 'invoice' && (
          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-slate-700">
              <FileText size={18} /> Rechnungsvorschau
            </h2>
            {invoiceData ? (
              <InvoiceTemplate invoice={invoiceData} onPrint={() => window.print()} />
            ) : (
              <div className="text-center py-16 text-gray-500 dark:text-gray-400">
                <FileText size={32} className="mx-auto mb-3 opacity-30" />
                <p>Noch keine Rechnungsdaten</p>
                <p className="text-sm mt-1">Wählen Sie einen Zeitraum und klicken Sie auf Rechnung erstellen</p>
              </div>
            )}
          </div>
        )}

        {activeView === 'preview' && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            {previewData ? (
              <AppointmentPreviewTemplate preview={previewData} />
            ) : (
              <div className="text-center py-16 text-gray-500">
                <Eye size={32} className="mx-auto mb-3 opacity-30" />
                <p>Noch keine Vorschaudaten</p>
                <p className="text-sm mt-1">Wählen Sie einen Zeitraum und klicken Sie auf Terminvorschau</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
