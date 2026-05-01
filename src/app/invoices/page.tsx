/**
 * Invoices Page - Generate invoices and appointment previews for families
 */
'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Printer, User, Calendar, DollarSign, Building2, FileText,
  Check, X, Clock, Eye, Download,
} from 'lucide-react';
import type { DataContainer, InvoiceItem, Family, Student, PriceEntry, Appointment } from '@/types';
import { calculateAppointmentFee } from '@/lib/billing';
import { formatInvoiceNumber, calculateDueDate, calculateInvoiceTotals } from '@/lib/invoiceUtils';
import { filterAppointmentsByDate } from '@/lib/dateFilters';
import { InvoiceTemplate, type InvoiceData } from '@/components/InvoiceTemplate';

// ── Appointment Preview Data ──

export interface AppointmentPreviewItem {
  appointmentId: string;
  date: string;
  time: string;
  studentName: string;
  lessonType: 'individual' | 'group';
  duration: number;
  status: Appointment['status'];
  unitPrice: number;
  totalPrice: number;
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

  return (
    <div className="min-h-screen bg-white p-0 print:p-0 print:min-h-0">
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
                    ) : item.duration === 0 ? (
                      <span className="inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span> Block-Unterricht
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Einzel
                      </span>
                    )}
                  </td>
                  <td className="py-1.5 px-1.5 text-xs">{item.duration === 0 ? '-' : `${item.duration} Min`}</td>
                  <td className="py-1.5 px-1.5 text-xs text-right">{item.unitPrice === 0 ? '-' : `€${item.unitPrice.toFixed(2)}`}</td>
                  <td className="py-1.5 px-1.5 text-xs text-right font-semibold">&euro;{item.totalPrice.toFixed(2)}</td>
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
            <button onClick={() => window.print()}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-700 text-white font-medium rounded-lg hover:bg-blue-800 transition-colors text-xs">
              <Printer size={12} /> Drucken
            </button>
            <button onClick={() => window.print()}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-xs">
              <Download size={12} /> PDF
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
              date: appointment.date,
              studentName: student ? `${student.firstName} ${student.lastName || ''}`.trim() : 'Unknown',
              lessonType: 'individual' as const,
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
        
        // If student has block pricing, add block item (only once per student per block)
        if (blockEntry) {
          const blockKey = `${studentId}-${blockEntry.id}`;
          if (!blockItemsSeen.has(blockKey)) {
            blockItemsSeen.add(blockKey);
            items.push({
              appointmentId: appointment.id,
              date: appointment.date,
              time: appointment.time || '--:--',
              studentName: student ? `${student.firstName} ${student.lastName || ''}`.trim() : 'Unknown',
              lessonType: 'individual' as const,
              duration: 0,
              status: appointment.status,
              unitPrice: blockEntry.blockPrice || 0,
              totalPrice: blockEntry.blockPrice || 0,
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
    const total = previewItems.reduce((sum, item) => sum + item.totalPrice, 0);
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
          <div className="grid gap-4 sm:grid-cols-3">
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
