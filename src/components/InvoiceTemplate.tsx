/**
 * Invoice Template Component - Professional, print-optimized design
 */

'use client';

import { Download, Printer, Check, X } from 'lucide-react';
// Flexible invoice type that accepts both full Invoice and the lighter object from invoices page
export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  issuedBy: {
    name?: string;
    street?: string;
    zipCode?: string;
    city?: string;
    email?: string;
    phone?: string;
    vatId?: string;
    iban?: string;
  };
  billedTo: {
    name?: string;
    street?: string;
    zipCode?: string;
    city?: string;
  };
  items: Array<{
    appointmentId?: string;
    date: string;
    studentName?: string;
    lessonType?: 'individual' | 'group' | 'block';
    status?: 'attended' | 'canceled_paid' | 'canceled_free' | 'planned';
    hourlyRate?: number;
    description: string;
    unitPrice: number;
    quantity: number;
    totalPrice: number;
    isPaid?: boolean;
  }>;
  subtotal: number;
  taxRate?: number;
  taxAmount?: number;
  total: number;
}

interface InvoiceTemplateProps {
  invoice: InvoiceData;
  onPrint?: () => void;
  showDownloadButton?: boolean;
}

export function InvoiceTemplate({
  invoice,
  onPrint,
}: InvoiceTemplateProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // Calculate subtotal
  const subtotal = invoice.items.reduce((sum, item) => sum + item.totalPrice, 0);

  return (
    <div className="min-h-screen bg-white p-0 print:p-0 print:min-h-0">
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
            padding: 0;
          }
          body {
            margin: 0;
            padding: 0;
            width: 210mm;
            height: 297mm;
          }
          .print-break-avoid {
            page-break-inside: avoid;
          }
          .print-break-after {
            page-break-after: always;
          }
        }
      `}</style>
      {/* Print Header - Always visible */}
      <header className="mb-4 border-b-4 border-black pb-3 print-break-avoid">
        <div className="flex justify-between items-start mb-3">
          {/* Issuer (Your Business) */}
          <div className="flex-1">
            <h1 className="text-xl font-bold uppercase tracking-wider mb-1">
              {invoice.issuedBy.name || 'MatheManager'}
            </h1>
            
            {(invoice.issuedBy.street || invoice.issuedBy.zipCode || invoice.issuedBy.city) && (
              <>
                <p className="text-xs font-semibold uppercase">{invoice.issuedBy.street}</p>
                <p className="text-xs font-semibold uppercase">
                  {invoice.issuedBy.zipCode} {invoice.issuedBy.city}
                </p>
              </>
            )}
            
            {(invoice.issuedBy.email || invoice.issuedBy.phone) && (
              <>
                {invoice.issuedBy.email && <p className="text-xs mt-1">{invoice.issuedBy.email}</p>}
                {invoice.issuedBy.phone && <p className="text-xs mt-1">{invoice.issuedBy.phone}</p>}
              </>
            )}
          </div>

          {/* Invoice Details */}
          <div className="text-right">
            <h2 className="text-xl font-bold uppercase tracking-wider mb-1">
              RECHNUNG
            </h2>
            <p className="text-sm font-semibold">{formatDate(invoice.invoiceDate)}</p>
            <p className="text-xs text-gray-600 mt-1">Rechnungsnummer: {invoice.invoiceNumber}</p>
          </div>
        </div>

        {/* Billed To */}
        <div className="mt-3 pt-2 border-t-2 border-dashed border-black">
          <p className="text-xs uppercase font-bold mb-1">Rechnung an:</p>
          {invoice.billedTo.name && (
            <>
              <p className="text-base font-bold">{invoice.billedTo.name}</p>
              {invoice.billedTo.street && (
                <p className="text-xs">{invoice.billedTo.street}</p>
              )}
              {invoice.billedTo.zipCode && invoice.billedTo.city && (
                <p className="text-xs">{`${invoice.billedTo.zipCode} ${invoice.billedTo.city}`}</p>
              )}
            </>
          )}
        </div>
      </header>

      {/* Invoice Items Table */}
      <div className="mb-4 print-break-avoid">
        <table className="w-full border-collapse border-black">
          <thead>
            <tr className="border-b-4 border-black bg-gray-50 print:bg-white">
              <th className="text-left py-1 px-1.5 text-xs uppercase font-semibold tracking-wider" style={{ width: '11%' }}>
                Datum
              </th>
              <th className="text-left py-1 px-1.5 text-xs uppercase font-semibold tracking-wider" style={{ width: '17%' }}>
                Schüler
              </th>
              <th className="text-left py-1 px-1.5 text-xs uppercase font-semibold tracking-wider" style={{ width: '17%' }}>
                Typ
              </th>
              <th className="text-left py-1 px-1.5 text-xs uppercase font-semibold tracking-wider" style={{ width: '17%' }}>
                Status
              </th>
              <th className="text-right py-1 px-1.5 text-xs uppercase font-semibold tracking-wider" style={{ width: '15%' }}>
                Gesamtpreis
              </th>
              <th className="text-center py-1 px-1.5 text-xs uppercase font-semibold tracking-wider" style={{ width: '6%' }}>
                Bezahlt
              </th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-3 px-2 text-center text-gray-400 italic">
                  Keine Positionen vorhanden
                </td>
              </tr>
            ) : (
              invoice.items.map((item, index) => (
                <tr key={index} className="border-b border-dotted border-black hover:bg-blue-50 transition-colors print-break-avoid">
                  <td className="py-1 px-1.5 text-xs text-gray-600">
                    {item.lessonType === 'block' ? '-' : formatDate(item.date)}
                  </td>
                  <td className="py-1 px-1.5 text-xs font-medium">{item.studentName || '-'}</td>
                  <td className="py-1 px-1.5 text-xs">
                    {item.lessonType === 'group' ? (
                      <span className="inline-flex items-center gap-1">
                        <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                        Gruppenunterricht
                      </span>
                    ) : item.lessonType === 'block' ? (
                      <span className="inline-flex items-center gap-1">
                        <span className="w-1 h-1 bg-orange-500 rounded-full"></span>
                        Block-Unterricht
                        {item.description && (
                          <span className="text-orange-600 font-medium">({item.description})</span>
                        )}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                        Einzelunterricht
                      </span>
                    )}
                  </td>
                  <td className="py-1 px-1.5 text-xs">
                    {item.lessonType === 'block' ? '-' : item.status === 'attended' ? (
                      <span className="inline-flex items-center gap-1 text-green-600">
                        <Check size={10} />
                        Besucht
                      </span>
                    ) : item.status === 'canceled_paid' ? (
                      <span className="inline-flex items-center gap-1 text-orange-600">
                        <X size={10} />
                        Bezahlt ausgefallen
                      </span>
                    ) : item.status === 'canceled_free' ? (
                      <span className="inline-flex items-center gap-1 text-red-600">
                        <X size={10} />
                        Kostenlos ausgefallen
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-gray-500">
                        <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                        Geplant
                      </span>
                    )}
                  </td>
                  <td className="py-1 px-1.5 text-right font-semibold text-xs">
                    &euro;{item.totalPrice.toFixed(2)}
                  </td>
                  <td className="py-1 px-1.5 text-center text-xs">
                    {item.lessonType === 'block' ? '-' : item.isPaid ? (
                      <span className="inline-flex items-center gap-1 text-green-600">
                        <Check size={10} />
                        Ja
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-gray-500">
                        <X size={10} />
                        Nein
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Totals Section */}
      <div className="flex justify-end mt-4 print-break-avoid">
        <div className="w-[40%]">
          <div className="flex justify-between py-1 border-b border-dotted border-black">
            <span className="text-xs font-medium text-gray-600">Zwischensumme (netto)</span>
            <span className="text-xs font-semibold">&euro;{subtotal.toFixed(2)}</span>
          </div>
          
          {invoice.taxRate !== undefined && (
            <div className="flex justify-between py-1 border-b border-dotted border-black">
              <span className="text-xs font-medium text-gray-600">MwSt. ({invoice.taxRate}%)</span>
              <span className="text-xs font-semibold">&euro;{(invoice.taxAmount || 0).toFixed(2)}</span>
            </div>
          )}
          
          <div className="flex justify-between py-2 border-t-4 border-black mt-1">
            <span className="text-base font-bold">Gesamtbetrag</span>
            <span className="text-base font-bold">&euro;{invoice.total.toFixed(2)}</span>
          </div>

          {/* Tax exemption notice */}
          <div className="mt-2 text-center">
            <p className="text-xs text-gray-600 italic">
              Gemäß &sect;4 Nr. 21 bin ich von der Umsatzsteuer befreit.
            </p>
          </div>

          {/* Payment terms */}
          <div className="mt-3 p-2 bg-gray-50 border border-gray-200 rounded-lg print-break-avoid">
            <p className="text-xs font-semibold text-gray-700 mb-1">Zahlungsbedingungen:</p>
            <p className="text-xs text-gray-600">Fällig bis: {formatDate(invoice.dueDate)}</p>
            {invoice.issuedBy.iban && (
              <p className="text-xs text-gray-600 mt-1">IBAN: {invoice.issuedBy.iban}</p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 mt-3 print:hidden">
            {onPrint && (
              <button
                onClick={onPrint}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors text-xs"
              >
                <Printer size={12} />
                Drucken
              </button>
            )}
            {typeof window !== 'undefined' && (
              <button
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-xs"
              >
                <Printer size={12} />
                PDF
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Footer note */}
      <div className="mt-4 pt-2 border-t border-gray-200 text-center">
        <p className="text-xs text-gray-500">
          Vielen Dank für die gute Zusammenarbeit!
        </p>
      </div>
    </div>
  );
}
