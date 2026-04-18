/**
 * Settings Page - Manage invoice letterhead and bank details
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Save, Building2, Mail, Phone, MapPin, FileText, CreditCard, AlertTriangle
} from 'lucide-react';
import type { InvoiceSettings } from '@/types';

interface DataContainer {
  families?: any[];
  students?: any[];
  priceEntries?: any[];
  appointments?: any[];
  lastUpdated?: string;
  invoiceSettings?: InvoiceSettings;
}

export default function SettingsPage() {
  const [data, setData] = useState<DataContainer | null>(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<Omit<InvoiceSettings, 'id'>>({
    businessName: '',
    street: '',
    zipCode: '',
    city: '',
    email: '',
    phone: '',
    vatId: '',
    taxId: '',
    bankName: '',
    iban: '',
    bankBic: '',
    paymentTerms: 14,
    hourlyRate: 0,
    lessonType: 'individual',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    try {
      const stored = localStorage.getItem('mathe_manager_data');
      if (stored) {
        const parsed: DataContainer = JSON.parse(stored);
        setData(parsed);
        if (parsed.invoiceSettings) {
          setSettings(prev => ({ ...prev, ...parsed.invoiceSettings }));
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (!data) return;
    const updatedData = {
      ...data,
      invoiceSettings: settings,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem('mathe_manager_data', JSON.stringify(updatedData));
    setData(updatedData);
    alert('Einstellungen gespeichert!');
  };

  const isValid = settings.businessName && settings.street && settings.zipCode && settings.city;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <p className="text-gray-500 dark:text-slate-400 animate-pulse">Lade Einstellungen...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="w-6 h-6 text-green-600" />
                Einstellungen
              </h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                Briefkopf und Zahlungsdaten für Rechnungen
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={!isValid}
              className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Save size={16} />
              Speichern
            </button>
          </div>

          {!isValid && (
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-xs text-yellow-800 dark:text-yellow-300 flex items-center gap-1.5">
                <AlertTriangle size={14} />
                Bitte Name und Adresse ausfullen, damit Rechnungen funktionieren.
              </p>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm">
          {/* Business Info */}
          <div className="p-6 border-b border-gray-100 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-slate-700">
              <Building2 size={18} />
              Briefkopf
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                  Name / Firma <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={settings.businessName}
                  onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                  placeholder="z.B. Thomas Muller Nachhilfe"
                  disabled={!data}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                  <MapPin size={14} className="inline mr-1" />
                 Straße / Hausnummer <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={settings.street}
                  onChange={(e) => setSettings({ ...settings, street: e.target.value })}
                  placeholder="Musterstraße 123"
                  disabled={!data}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                    Postleitzahl <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={settings.zipCode}
                    onChange={(e) => setSettings({ ...settings, zipCode: e.target.value })}
                    placeholder="12345"
                    disabled={!data}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                    Stadt <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={settings.city}
                    onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                    placeholder="Berlin"
                    disabled={!data}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                  <Mail size={14} className="inline mr-1" />
                  E-Mail
                </label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  placeholder="kontakt@beispiel.de"
                  disabled={!data}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                  <Phone size={14} className="inline mr-1" />
                  Telefon
                </label>
                <input
                  type="tel"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  placeholder="+49 123 456789"
                  disabled={!data}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Optional: Tax */}
          <div className="p-6 border-b border-gray-100 dark:border-slate-700">
            <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <FileText size={14} />
              Steuer & Rechnungswesen
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                  USt-IdNr.
                </label>
                <input
                  type="text"
                  value={settings.vatId || ''}
                  onChange={(e) => setSettings({ ...settings, vatId: e.target.value })}
                  placeholder="DE123456789"
                  disabled={!data}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                  Steuernummer
                </label>
                <input
                  type="text"
                  value={settings.taxId || ''}
                  onChange={(e) => setSettings({ ...settings, taxId: e.target.value })}
                  placeholder="123/456/78900"
                  disabled={!data}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div className="p-6 border-b border-gray-100 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-slate-700">
              <CreditCard size={18} />
              Bankverbindung (fur Rechnungen)
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                  Bankname
                </label>
                <input
                  type="text"
                  value={settings.bankName || ''}
                  onChange={(e) => setSettings({ ...settings, bankName: e.target.value })}
                  placeholder="Sparkasse Berlin"
                  disabled={!data}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                  IBAN
                </label>
                <input
                  type="text"
                  value={settings.iban || ''}
                  onChange={(e) => setSettings({ ...settings, iban: e.target.value })}
                  placeholder="DE89 3704 0044 0532 1340 00"
                  disabled={!data}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                  BIC / SWIFT
                </label>
                <input
                  type="text"
                  value={settings.bankBic || ''}
                  onChange={(e) => setSettings({ ...settings, bankBic: e.target.value })}
                  placeholder="COBADEFFXXX"
                  disabled={!data}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Invoice Defaults */}
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-slate-700">
              <FileText size={18} />
              Rechnungs-Standardwerte
            </h2>
            <div className="space-y-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                  Zahlungsziel (Tage)
                </label>
                <input
                  type="number"
                  value={settings.paymentTerms}
                  onChange={(e) => setSettings({ ...settings, paymentTerms: parseInt(e.target.value) || 14 })}
                  min={1}
                  max={90}
                  disabled={!data}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Status Bar */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between">
            <p className={`text-sm ${isValid ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
              {isValid
                ? 'Alle Pflichtfelder ausgefüllt — Rechnungen konnen generiert werden'
                : 'Bitte Pflichtfelder ausfullen (Name,Straße,PLZ,Stadt)'}
            </p>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${data ? 'bg-green-500' : 'bg-gray-300 dark:bg-slate-600'}`} />
              <span className="text-xs text-gray-500 dark:text-slate-400">
                {data ? 'Daten geladen' : 'Keine Daten'}
              </span>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400 dark:text-slate-500">
          Diese Einstellungen werden fur den Briefkopf und die Zahlungsangaben auf Rechnungen verwendet.
        </p>
      </main>
    </div>
  );
}