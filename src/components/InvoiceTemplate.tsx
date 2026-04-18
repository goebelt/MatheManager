/**
 * Invoice Template Component - Professional, print-optimized design
 */

import { Download, Printer } from 'lucide-react';
// Flexible invoice type that accepts both full Invoice and the lighter object from invoices page
interface InvoiceData {
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
    description: string;
    unitPrice: number;
    quantity: number;
    totalPrice: number;
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
    <div className="min-h-screen bg-white p-8 print:p-0 print:min-h-0">
      {/* Print Header - Always visible */}
      <header className="mb-12 border-b-4 border-black pb-6">
        <div className="flex justify-between items-start mb-6">
          {/* Issuer (Your Business) */}
          <div>
            <h1 className="text-4xl font-bold uppercase tracking-wider text-center mb-3">
              {invoice.issuedBy.name || 'MatheManager'}
            </h1>
            
            {(invoice.issuedBy.street || invoice.issuedBy.zipCode || invoice.issuedBy.city) && (
              <>
                <p className="text-sm font-semibold uppercase">{invoice.issuedBy.street}</p>
                <p className="text-sm font-semibold uppercase">
                  {invoice.issuedBy.zipCode} {invoice.issuedBy.city}
                </p>
              </>
            )}
            
            {(invoice.issuedBy.email || invoice.issuedBy.phone) && (
              <>
                {invoice.issuedBy.email && <p className="text-sm mt-1">{invoice.issuedBy.email}</p>}
                {invoice.issuedBy.phone && <p className="text-sm mt-1">{invoice.issuedBy.phone}</p>}
              </>
            )}
          </div>

          {/* Invoice Details */}
          <div className="text-right">
            <h2 className="text-4xl font-bold uppercase tracking-wider text-center mb-3">
              RECHNUNG
            </h2>
            <p className="text-lg font-semibold">{formatDate(invoice.invoiceDate)}</p>
            <p className="text-sm text-gray-600 mt-1">Rechnungsnummer: {invoice.invoiceNumber}</p>
          </div>
        </div>

        {/* Billed To */}
        <div className="mt-8 pt-6 border-t-2 border-dashed border-black">
          <p className="text-sm uppercase font-bold mb-1 text-center">Rechnung an:</p>
          {invoice.billedTo.name && (
            <>
              <p className="text-xl font-bold">{invoice.billedTo.name}</p>
              {invoice.billedTo.street && invoice.billedTo.zipCode && (
                <>
                  <p className="text-sm">{invoice.billedTo.street}</p>
                  <p className="text-sm">{`${invoice.billedTo.zipCode} ${invoice.billedTo.city}`}</p>
                </>
              )}
            </>
          )}
        </div>
      </header>

      {/* Invoice Items Table */}
      <div className="mb-12">
        <table className="w-full border-collapse border-black">
          <thead>
            <tr className="border-b-4 border-black bg-gray-50 print:bg-white">
              <th className="text-left py-3 px-4 text-xs uppercase font-semibold tracking-wider" style={{ width: '12%' }}>
                Datum
              </th>
              <th className="text-left py-3 px-4 text-xs uppercase font-semibold tracking-wider" style={{ width: '50%' }}>
                Position
              </th>
              <th className="text-center py-3 px-4 text-xs uppercase font-semibold tracking-wider" style={{ width: '12%' }}>
                Menge
              </th>
              <th className="text-right py-3 px-4 text-xs uppercase font-semibold tracking-wider" style={{ width: '18%' }}>
                Einzelpreis
              </th>
              <th className="text-right py-3 px-4 text-xs uppercase font-semibold tracking-wider" style={{ width: '8%' }}>
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
                <tr key={index} className="border-b border-dotted border-black hover:bg-blue-50 transition-colors">
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {formatDate(item.date)}
                  </td>
                  <td className="py-3 px-4 text-sm font-medium">{item.description}</td>
                  <td className="py-3 px-4 text-center text-sm">
                    {item.quantity}
                  </td>
                  <td className="py-3 px-4 text-right text-sm">
                    &euro;{Number(item.unitPrice).toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold">
                    &euro;{item.totalPrice.toFixed(2)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Totals Section */}
      <div className="flex justify-end mt-16">
        <div className="w-[35%]">
          <div className="flex justify-between py-2 border-b border-dotted border-black">
            <span className="text-sm font-medium text-gray-600">Zwischensumme (netto)</span>
            <span className="text-sm font-semibold">&euro;{subtotal.toFixed(2)}</span>
          </div>
          
          {invoice.taxRate !== undefined && invoice.taxRate > 0 && (
            <div className="flex justify-between py-2 border-b border-dotted border-black">
              <span className="text-sm font-medium text-gray-600">MwSt. ({invoice.taxRate}%)</span>
              <span className="text-sm font-semibold">&euro;{(invoice.taxAmount || 0).toFixed(2)}</span>
            </div>
          )}
          
          <div className="flex justify-between py-3 border-t-4 border-black mt-2">
            <span className="text-xl font-bold">Gesamtbetrag</span>
            <span className="text-xl font-bold">&euro;{invoice.total.toFixed(2)}</span>
          </div>

          {/* Payment terms */}
          <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-xs font-semibold text-gray-700 mb-2">Zahlungsbedingungen:</p>
            <p className="text-xs text-gray-600">Fällig bis: {formatDate(invoice.dueDate)}</p>
            {invoice.issuedBy.iban && (
              <p className="text-xs text-gray-600 mt-1">IBAN: {invoice.issuedBy.iban}</p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 mt-6 print:hidden">
            {onPrint && (
              <button
                onClick={onPrint}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
              >
                <Printer size={16} />
                Drucken
              </button>
            )}
            {typeof window !== 'undefined' && (
              <button
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Printer size={16} />
                PDF
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Footer note */}
      <div className="mt-12 pt-6 border-t border-gray-200 text-center">
        <p className="text-xs text-gray-500">
          Vielen Dank für die gute Zusammenarbeit!
        </p>
      </div>
    </div>
  );
}