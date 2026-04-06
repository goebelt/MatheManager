/**
 * Invoice Template Component - Professional, print-optimized design
 */

import { Download, Printer } from 'lucide-react';
import type { Invoice, InvoiceItem } from '@/types';

interface InvoiceTemplateProps {
  invoice: Invoice;
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
                    €{Number(item.unitPrice).toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold">
                    €{item.totalPrice.toFixed(2)}
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
          