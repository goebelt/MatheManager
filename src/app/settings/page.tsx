/**
 * Settings Page - Configure company info for invoices
 */

'use client';

import { useState, useEffect } from 'react';
import { Save, X } from 'lucide-react';

interface CompanySettings {
  name: string;
  address: string;
  taxId?: string;
}

export default function SettingsPage() {
  const [data, setData] = useState<CompanySettings>({
    name: '',
    address: '',
    taxId: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    try {
      const stored = localStorage.getItem('mathe_manager_settings');
      if (stored) {
        setData(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      localStorage.setItem('mathe_manager_settings', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Fehler beim Speichern der Einstellungen');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <p className="text-sm text-gray-500">Lade Einstellungen...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700 sticky top-0 z-10 print:hidden">
        <div className="max-w-xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="w-5 h-5 bg-green-600 rounded flex items-center justify-center">
                  <Save size={14} className="text-white" />
                </span>
                Einstellungen
              </h1>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                Ihre Firmeninformationen für Rechnungen
              </p>
            </div>

            {/* Close Button - Only show on mobile */}
            <button
              onClick={() => window.history.back()}
              className="sm:hidden p-2 text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Tabs */}
          <nav className="mt-4 sm:hidden overflow-x-auto flex gap-2 pb-1 -mx-4">
            <a href="/dashboard" className="px-3 py-1.5 text-sm font-medium bg-gray-100 dark:bg-slate-700/50 rounded-lg whitespace-nowrap">
              Dashboard
            </a>
            <a href="/billing" className="px-3 py-1.5 text-sm font-medium bg-gray-100 dark:bg-slate-700/50 rounded-lg whitespace-nowrap">
              Abrechnung
            </a>
            <a href="/invoices" className="px-3 py-1.5 text-sm font-medium bg-green-600 text-white rounded-lg whitespace-nowrap">
              Rechnungen
            </a>
            <button
              onClick={() => window.history.back()}
              className="px-3 py-1.5 text-sm font-medium bg-gray-100 dark:bg-slate-700/50 rounded-lg whitespace-nowrap"
            >
              Einstellungen
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-xl mx-auto px-4">
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm p-6">
          <h2 className="text-md font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-5 h-5 bg-green-600 rounded flex items-center justify-center">
              <Save size={13} className="text-white" />
            </span>
            Rechnungs-Kopfzeile
          </h2>

          <div className="space-y-4">
            {/* Company Name */}
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                Firmenname / Ihr Name (Pflicht)
              </label>
              <input
                type="text"
                id="companyName"
                value={data.name}
                onChange={(e) => setData({ ...data, name: e.target.value })}
                placeholder="z. B. Thomas Müller oder MatheNachhilfe Müller"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            {/* Address */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                Adresse (Pflicht)
              </label>
              <input
                type="text"
                id="address"
                value={data.address}
                onChange={(e) => setData({ ...data, address: e.target.value })}
                placeholder="Straße Nr., PLZ Ort"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            {/* Tax ID */}
            <div>
              <label htmlFor="taxId" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                Steuernummer / USt-ID (Optional)
              </label>
              <input
                type="text"
                id="taxId"
                value={data.taxId}
                onChange={(e) => setData({ ...data, taxId: e.target.value })}
                placeholder="DE123456789"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
              <button
                onClick={handleSave}
                disabled={saving || !data.name.trim() || !data.address.trim()}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-sm transition-colors ${
                  saving || !data.name.trim() || !data.address.trim()
                    ? 'bg-gray-100 dark:bg-slate-700/50 text-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white shadow-sm'
                }`}
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Speichere...
                  </>
                ) : (
                  'Einstellungen speichern'
                )}
              </button>
            </div>

            {/* Info Text */}
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-4">
              Diese Informationen werden auf Ihrer Rechnung angezeigt. Alle Felder sind optional außer Name und Adresse.
            </p>
          </div>
        </div>

        {/* Navigation Footer */}
        <nav className="mt-6 print:hidden">
          <a href="/dashboard" className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white hover:underline">
            <span>← Zurück zum Dashboard</span>
          </a>
        </nav>
      </main>
    </div>
  );
}