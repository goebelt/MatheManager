/**
 * Invoice Template - Professional, minimalist invoice design optimized for printing
 */

'use client';

import { Printer } from 'lucide-react';

interface InvoiceLineItem {
  date: string;
  studentName: string;
  description: string;
  amount: number;
}

interface InvoiceTemplateProps {
  companyInfo: {
    name: string;
    address: string;
    taxId?: string;
  };
  invoiceNumber: string;
  invoiceDate: string;
  familyName: string;
  familyAddress: string;
  items: InvoiceLineItem[];
  totalPrice: number;
  onPrint: () => void;
}

export function InvoiceTemplate({
  companyInfo,
  invoiceNumber,
  invoiceDate,
  familyName,
  familyAddress,
  items,
  totalPrice,
  onPrint
}: InvoiceTemplateProps) {
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="print-container">
      {/* Invoice Content */}
      <div className="max-w-[80mm] mx-auto p-6 print:p-4 print:min-h-full">
        {/* Letterhead / Company Info */}
        <header className="border-b border-gray-300 pb-4 mb-4 space-y-1">
          <p className="font-bold text-sm leading-tight">{companyInfo.name}</p>
          {companyInfo.address && (
            <p className="text-xs text-gray-600">{companyInfo.address}</p>
          )}
          {companyInfo.taxId && (
            <p className="text-xs text-gray-500">Steuernummer: {companyInfo.taxId}</p>
          )}
        </header>

        {/* Invoice Number & Date */}
        <div className="flex justify-between items-center mb-4 print:hidden">
          <span className="text-sm font-semibold text-gray-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-lg inline-block">
            Rechnung Nr. {invoiceNumber}
          </span>

          {/* Print Button */}
          <button
            onClick={onPrint}
            className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
          >
            <Printer size={14} />
            Drucken
          </button>
        </div>

        {/* Invoice Metadata */}
        <div className="flex justify-between mb-6">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Rechnungsdatum</p>
            <p className="text-sm font-medium">{formatDate(invoiceDate)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Für</p>
            <p className="text-sm font-bold">{familyName}</p>
            {familyAddress && (
              <p className="text-xs text-gray-600 mt-0.5">{familyAddress}</p>
            )}
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full mb-4">
          <thead>
            <tr className="border-b border-gray-300 print:border-black">
              <th className="text-left py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider pr-2">Datum</th>
              <th className="text-left py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider pr-2">Schüler</th>
              <th className="text-left py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider pr-4">Leistung</th>
              <th className="text-right py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider pr-2">Preis (€)</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-4 px-2 text-center text-sm text-gray-500 italic">
                  Keine Positionen im ausgewählten Zeitraum.
                </td>
              </tr>
            ) : (
              items.map((item, index) => (
                <tr key={index} className="print:border-b print:border-black">
                  <td className="py-1 px-2 text-xs text-gray-600">{formatDate(item.date)}</td>
                  <td className="py-1 px-2 text-sm font-medium text-gray-900">{item.studentName}</td>
                  <td className="py-1 px-2 text-xs text-gray-700 truncate max-w-[150px]">
                    {item.description}
                  </td>
                  <td className="py-1 px-2 text-right font-medium text-sm">
                    {item.amount.toFixed(2)} €
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Summary */}
        <div className="flex justify-end">
          <div className="w-48">
            <div className="border-t border-gray-300 pt-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Gesamtsumme:</span>
                <span className="font-bold">
                  {totalPrice.toFixed(2)} €
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 pt-4 border-t border-gray-300 text-xs text-gray-500 flex justify-between">
          <p>Danksagung für Ihre Zahlung.</p>
          <p>Mit freundlichen Grüßen</p>
        </footer>

        {/* Hidden whitespace for print formatting */}
        <div className="h-[4mm]"></div>
      </div>
    </div>
  );
}