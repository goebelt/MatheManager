/**
 * Invoice Template Component - Professional, print-optimized design
 */

import { Download, Printer } from 'lucide-react';
import type { Invoice, InvoiceItem } from '@/types';

interface InvoiceTemplateProps {
  invoice: Invoice;
  onPrint?: () => void;
  showDownloadButton?: boolean;
  downloadUrl?: string; // Optional URL to download the PDF
}

export function InvoiceTemplate({ 
  invoice, 
  onPrint, 
  showDownloadButton = false,
  downloadUrl 
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
    <div className="min-h-screen bg-white p-4 md:p-8 print:p-0 print:min-h-0">
      {/* Print Header - Always visible */}
      <header className="mb-8 border-b-2 border-black pb-6">
        <div className="flex justify-between items-start mb-4">
          {/* Issuer (Your Business) */}
          <div className="text-left w-[45%] print:w-full">
            <h1 className="text-3xl font-bold uppercase tracking-wider text-center mb-2">
              {invoice.issuedBy.name || 'MatheManager'}
            </h1>
            <p className="text-sm">{invoice.issuedBy.street}</p>
            <p className="text-sm">{`${invoice.issuedBy.zipCode} ${invoice.issuedBy.city}`}</p>
            {invoice.issuedBy.email && (
              <p className="text-sm mt-1">{invoice.issuedBy.email}</p>
            )}
            {invoice.issuedBy.phone && (
              <p className="text-sm mt-1">{invoice.issuedBy.phone}</p>
            )}
            {invoice.issuedBy.vatId && (
              <p className="text-sm mt-1 font-mono text-xs">Steuernummer: {invoice.issuedBy.vatId}</p>
            )}
          </div>

          {/* Invoice Details */}
          <div className="text-right w-[45%] print:w-full">
            <h2 className="text-3xl font-bold uppercase tracking-wider text-center mb-4">
              RECHNUNG
            </h2>
            <p className="text-sm font-semibold">{formatDate(invoice.invoiceDate)}</p>
            <p className="text-xs text-gray-600 mt-1">Rechnungsnummer: {invoice.invoiceNumber}</p>
          </div>
        </div>

        {/* Billed To */}
        <div className="mt-4 pt-4 border-t border-dashed border-black">
          <p className="text-xs uppercase font-semibold mb-1 text-center">Rechnung an:</p>
          <p className="text-lg font-bold">{invoice.billedTo.name}</p>
          {invoice.billedTo.address && (
            <>
              <p className="text-sm">{invoice.billedTo.street || ''} {invoice.billedTo.city || ''}</p>
              <p className="text-sm">{`${invoice.billedTo.zipCode} ${invoice.billedTo.city}`}</p>
            </>
          )}
        </div>
      </header>

      {/* Invoice Items Table */}
      <div className="mb-6">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-black print:border-black">
              <th className="text-left py-3 px-4 text-xs uppercase font-semibold tracking-wider bg-gray-50 print:bg-white text-gray-600 print:text-black" style={{ width: '10%' }}>
                Datum
              </th>
              <th className="text-left py-3 px-4 text-xs uppercase font-semibold tracking-wider bg-gray-50 print:bg-white text-gray-600 print:text-black" style={{ width: '25%' }}>
                Position
              </th>
              <th className="text-center py-3 px-4 text-xs uppercase font-semibold tracking-wider bg-gray-50 print:bg-white text-gray-600 print:text-black" style={{ width: '10%' }}>
                Menge
              </th>
              <th className="text-right py-3 px-4 text-xs uppercase font-semibold tracking-wider bg-gray-50 print:bg-white text-gray-600 print:text-black" style={{ width: '20%' }}>
                Einzelpreis
              </th>
              <th className="text-right py-3 px-4 text-xs uppercase font-semibold tracking-wider bg-gray-50 print:bg-white text-gray-600 print:text-black" style={{ width: '15%' }}>
                Gesamtpreis
              </th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 px-4 text-center text-gray-400 italic">
                  Keine Positionen vorhanden
                </td>
              </tr>
            ) : (
              invoice.items.map((item, index) => (
                <tr key={index} className="border-b border-dotted border-black print:border-black hover:bg-blue-50 print:hover:bg-transparent transition-colors">
                  <td className="py-3 px-4 text-sm text-gray-600 print:text-black">
                    {formatDate(item.date)}
                  </td>
                  <td className="py-3 px-4 text-sm font-medium text-gray-900 print:text-black">
                    {item.description}
                  </td>
                  <td className="py-3 px-4 text-center text-sm text-gray-600 print:text-black">
                    {item.quantity}
                  </td>
                  <td className="py-3 px-4 text-right text-sm text-gray-600 print:text-black">
                    €{Number(item.unitPrice).toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-gray-900 print:text-black">
                    €{item.totalPrice.toFixed(2)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Totals Section */}
      <div className="flex justify-end mt-8 print:mt-0">
        <div className="w-[35%]">
          {subtotal > 0 && (
            <div className="flex justify-between py-2 border-b border-dotted border-black print:border-black">
              <span className="text-sm text-gray-600 print:text-black">Zwischensumme</span>
              <span className="text-sm font-medium text-gray-900 print:text-black">€{subtotal.toFixed(2)}</span>
            </div>
          )}

          {invoice.subtotal > 0 && invoice.taxRate !== undefined && invoice.taxRate > 0 && (
            <>
              <div className="flex justify-between py-2 border-b border-dotted border-black print:border-black">
                <span className="text-sm text-gray-600 print:text-black">MwSt ({invoice.taxRate}%)</span>
                <span className="text-sm font-medium text-gray-900 print:text-black">€{(subtotal * invoice.taxRate / 100).toFixed(2)}</span>
              </div>
            </>
          )}

          <div className={`flex justify-between py-3 ${invoice.subtotal > 0 ? 'border-t-2 border-black mt-4' : ''} print:border-t-2 print:border-black`}>
            <span className="text-sm font-bold text-gray-900 print:text-black">Gesamt</span>
            <span className={`text-lg ${invoice.subtotal > 0 ? 'font-bold' : ''} text-gray-900 print:text-black`}>
              €{invoice.total.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Payment Terms - Optional */}
      {invoice.dueDate && (
        <div className="mt-8 pt-6 border-t border-dashed border-black print:border-black">
          <p className="text-xs text-center text-gray-500 print:text-gray-400 italic mb-2">
            Bitte zahlen bis zum: {formatDate(invoice.dueDate)}
          </p>
        </div>
      )}

      {/* Footer Actions - Hidden when printing */}
      <footer className={`mt-12 pt-6 border-t border-gray-200 flex justify-center items-center gap-4 print:hidden ${showDownloadButton ? 'flex' : 'hidden'}`}>
        {onPrint && (
          <button
            onClick={onPrint}
            disabled={!window.print}
            className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Printer size={18} />
            Druck ausgeben
          </button>
        )}
        {downloadUrl && (
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Download size={18} />
            Als PDF herunterladen
          </a>
        )}
      </footer>

      {/* Print-only styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:visible {
            visibility: visible;
          }
          .print\\:block {
            display: block !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          /* Force white background */
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}