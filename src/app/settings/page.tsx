/**
 * Settings Page - Manage invoice letterhead and bank details
 */

'use client';

import { useState, useEffect } from 'react';
import { Save, Building2, Mail, Phone, MapPin, FileText } from 'lucide-react';
import type { InvoiceSettings } from '@/types';

export default function SettingsPage() {
  const [data, setData] = useState<DataContainer | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Form state for invoice settings
  const [settings, setSettings] = useState<Omit<InvoiceSettings, 'id'>>({
    businessName: '',
    street: '',
    zipCode: '',
    city: '',
    email: '',
    phone: ''
  });

  // Load data and existing settings
  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    try {
      const stored = localStorage.getItem('mathe_manager_data');
      if (stored) {
        setData(JSON.parse(stored));
        
        // Load existing invoice settings or use defaults
        const savedSettings = data.invoiceSettings || {
          businessName: '',
          street: '',
          zipCode: '',
          city: '',
          email: '',
          phone: ''
        };
        setSettings(savedSettings);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Save settings
  const handleSave = () => {
    if (!data) return;

    const updatedData = {
      ...data,
      invoiceSettings: settings,
      lastUpdated: new Date().toISOString()
    };

    localStorage.setItem('mathe_manager_data', JSON.stringify(updatedData));
    setData(updatedData);

    // Also save just the settings for quick access
    localStorage.setItem('mathe_manager_invoice_settings', JSON.stringify(settings));

    alert('Rechnungs-Einstellungen gespeichert!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <p className="text-gray-500 dark:text-slate-400 animate-pulse">Lade Einstellungen...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700 sticky top-0 z-10 print:hidden">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="w-6 h-6 text-green-600" />
                Rechnungs-Einstellungen
              </h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                Verwalte deine Briefkopf-Daten für Rechnungen
              </p>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={!settings.businessName || !settings.street || !settings.zipCode || !settings.city}
              className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={16} />
              Speichern
            </button>
          </div>

          {/* Requirements Info */}
          {!settings.businessName && !settings.street && (
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-xs text-yellow-800 dark:text-yellow-300 flex items-start gap-1.5">
                <span>⚠️</span>
                Bitte füle mindestens deine Firma/Name und Adresse aus, damit Rechnungen generiert werden können.
              </p>
            </div>
          )}
        </div>
      </header>

      {/* Settings Form */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm p-6 space-y-6 print:hidden">
          
          {/* Business Information Section */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-slate-700">
              <Building2 size={18} />
              Firmeninformationen (Briefkopf)
            </h2>

            <div className="space-y-4">
              {/* Business Name */}
              <div>
                <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                  Firmenname / Dein Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="businessName"
                  type="text"
                  value={settings.businessName}
                  onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                  placeholder="z.B. MatheManager oder Thomas Müller Nachhilfe"
                  disabled={!data}
                  className={`w-full px-3 py-2 bg-white dark:bg-slate-700 border rounded-lg focus:outline-none focus:ring-2 ${
                    data 
                      ? 'border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white focus:ring-green-500' 
                      : 'border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 text-gray-400 cursor-not-allowed'
                  }`}
                />
              </div>

              {/* Street Address */}
              <div>
                <label htmlFor="street" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                  Straße / Hausnummer <span className="text-red-500">*</span>
                </label>
                <input
                  id="street"
                  type="text"
                  value={settings.street}
                  onChange={(e) => setSettings({ ...settings, street: e.target.value })}
                  placeholder="z.B. Musterstraße 123"
                  disabled={!data}
                  className={`w-full px-3 py-2 bg-white dark:bg-slate-700 border rounded-lg focus:outline-none focus:ring-2 ${
                    data 
                      ? 'border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white focus:ring-green-500' 
                      : 'border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 text-gray-400 cursor-not-allowed'
                  }`}
                />
              </div>

              {/* Postal Code & City */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                    Postleitzahl <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="zipCode"
                    type="text"
                    value={settings.zipCode}
                    onChange={(e) => setSettings({ ...settings, zipCode: e.target.value })}
                    placeholder="12345"
                    disabled={!data}
                    className={`w-full px-3 py-2 bg-white dark:bg-slate-700 border rounded-lg focus:outline-none focus:ring-2 ${
                      data 
                        ? 'border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white focus:ring-green-500' 
                        : 'border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 text-gray-400 cursor-not-allowed'
                    }`}
                  />
                </div>

                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                  Stadt / Ort <span className="text-red-500">*</span>
                </label>
                <input
                  id="city"
                  type="text"
                  value={settings.city}
                  onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                  placeholder="Berlin"
                  disabled={!data}
                  className={`w-full px-3 py-2 bg-white dark:bg-slate-700 border rounded-lg focus:outline-none focus:ring-2 ${
                    data 
                      ? 'border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white focus:ring-green-500' 
                      : 'border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 text-gray-400 cursor-not-allowed'
                  }`}
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                  E-Mail <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  placeholder="kontakt@mathe-manager.de"
                  disabled={!data}
                  className={`w-full px-3 py-2 bg-white dark:bg-slate-700 border rounded-lg focus:outline-none focus:ring-2 ${
                    data 
                      ? 'border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white focus:ring-green-500' 
                      : 'border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 text-gray-400 cursor-not-allowed'
                  }`}
                />
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                  Telefonnummer
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  placeholder="+49 123 456789"
                  disabled={!data}
                  className={`w-full px-3 py-2 bg-white dark:bg-slate-700 border rounded-lg focus:outline-none focus:ring-2 ${
                    data 
                      ? 'border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white focus:ring-green-500' 
                      : 'border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 text-gray-400 cursor-not-allowed'
                  }`}
                />
              </div>
            </div>

            {/* Optional Fields */}
            <div className="mt-6 pt-4 border-t border-dashed border-gray-200 dark:border-slate-700">
              <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <FileText size={14} />
                Optional (für Rechnungen)
              </p>

              {/* Tax ID / VAT ID */}
              <div>
                <label htmlFor="vatId" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                  Steuernummer / USt-IdNr.
                </label>
                <input
                  id="vatId"
                  type="text"
                  value={settings.vatId || ''}
                  onChange={(e) => setSettings({ ...settings, vatId: e.target.value })}
                  placeholder="DE123456789 oder UST-ID"
                  disabled={!data}
                  className={`w-full px-3 py-2 bg-white dark:bg-slate-700 border rounded-lg focus:outline-none focus:ring-2 ${
                    data 
                      ? 'border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white focus:ring-green-500' 
                      : 'border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 text-gray-400 cursor-not-allowed'
                  }`}
                />
              </div>
            </div>
          </section>

          {/* Status */}
          <div className="flex items-center justify-between pt-2">
            <p className={`text-sm ${settings.businessName && settings.street ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
              {settings.businessName && settings.street 
                ? 'Formular ist ausfüllbar • Speichern nicht deaktiviert' 
                : 'Bitte mindestens Name und Adresse eingeben'}
            </p>

            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${data ? 'bg-green-500' : 'bg-gray-300 dark:bg-slate-600'}`}></span>
              <span className="text-xs text-gray-500 dark:text-slate-400 hidden sm:inline">
                {data ? 'Verfügbar' : 'Deaktiviert (noch keine Daten)'}
              </span>
            </div>
          </div>
        </div>

        {/* Help Text */}
        <p className="mt-6 text-center text-xs text-gray-400 dark:text-slate-500 print:hidden">
          Diese Einstellungen werden verwendet, um deinen Namen und deine Kontaktinformationen auf den generierten Rechnungen anzuzeigen.
        </p>
      </main>
    </div>
  );
}

interface DataContainer {
  families?: any[];
  students?: any[];
  priceEntries?: any[];
  appointments?: any[];
  lastUpdated?: string;
  invoiceSettings?: InvoiceSettings;
}