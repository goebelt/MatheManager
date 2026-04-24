/**
 * Settings Page - Manage invoice letterhead, bank details, and schedule time windows
 */
'use client';

import { useState, useEffect } from 'react';
import { Save, Building2, Mail, Phone, MapPin, FileText, CreditCard, AlertTriangle, Download, Upload, Clock } from 'lucide-react';
import type { InvoiceSettings, ScheduleSettings } from '@/types';
import { getDefaultScheduleSettings } from '@/lib/scheduling';

interface DataContainer {
  families?: any[];
  students?: any[];
  priceEntries?: any[];
  appointments?: any[];
  lastUpdated?: string;
  invoiceSettings?: InvoiceSettings;
  scheduleSettings?: ScheduleSettings;
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
    invoiceNumberStart: 1,
  });

  const [scheduleSettings, setScheduleSettings] = useState<ScheduleSettings>(getDefaultScheduleSettings());

  useEffect(() => { loadData(); }, []);

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
        if (parsed.scheduleSettings) {
          setScheduleSettings(prev => ({ ...prev, ...parsed.scheduleSettings }));
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    try {
      const stored = localStorage.getItem('mathe_manager_data');
      if (!stored) { alert('Keine Daten zum Exportieren vorhanden.'); return; }
      const data = JSON.parse(stored);
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const timestamp = new Date().toISOString().split('T')[0];
      link.download = `mathe-manager-backup-${timestamp}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      alert('Daten erfolgreich exportiert!');
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Fehler beim Exportieren der Daten.');
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedData = JSON.parse(content);
        if (!importedData || typeof importedData !== 'object') {
          throw new Error('Ungültiges Datenformat');
        }
        if (confirm('Möchtest du die Daten wirklich importieren? Alle vorhandenen Daten werden überschrieben!')) {
          localStorage.setItem('mathe_manager_data', JSON.stringify(importedData));
          setData(importedData);
          if (importedData.invoiceSettings) {
            setSettings(prev => ({ ...prev, ...importedData.invoiceSettings }));
          }
          if (importedData.scheduleSettings) {
            setScheduleSettings(prev => ({ ...prev, ...importedData.scheduleSettings }));
          }
          alert('Daten erfolgreich importiert!');
        }
      } catch (error) {
        console.error('Error importing data:', error);
        alert('Fehler beim Importieren der Daten. Bitte überprüfe die Datei.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleSave = () => {
    if (!data) return;
    const updatedData = {
      ...data,
      invoiceSettings: settings,
      scheduleSettings,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem('mathe_manager_data', JSON.stringify(updatedData));
    setData(updatedData);
    alert('Einstellungen gespeichert!');
  };

  const isValid = settings.businessName && settings.street && settings.zipCode && settings.city;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="flex items-center justify-center">
          <p className="text-gray-500 dark:text-slate-400 animate-pulse">Lade Einstellungen...</p>
        </div>
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
                <FileText className="w-6 h-6 text-green-600" /> Einstellungen
              </h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                Briefkopf, Zahlungsdaten und Terminplanung
              </p>
            </div>
            <button onClick={handleSave} disabled={!isValid}
              className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              <Save size={16} /> Speichern
            </button>
          </div>
          {!isValid && (
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-xs text-yellow-800 dark:text-yellow-300 flex items-center gap-1.5">
                <AlertTriangle size={14} /> Bitte Name und Adresse ausfüllen, damit Rechnungen funktionieren.
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
              <Building2 size={18} /> Briefkopf
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5"> Name / Firma <span className="text-red-500">*</span> </label>
                <input type="text" value={settings.businessName} onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                  placeholder="z.B. Thomas Müller Nachhilfe"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5"> <MapPin size={14} className="inline mr-1" /> Straße / Hausnummer <span className="text-red-500">*</span> </label>
                <input type="text" value={settings.street} onChange={(e) => setSettings({ ...settings, street: e.target.value })}
                  placeholder="Musterstraße 123"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5"> Postleitzahl <span className="text-red-500">*</span> </label>
                  <input type="text" value={settings.zipCode} onChange={(e) => setSettings({ ...settings, zipCode: e.target.value })}
                    placeholder="12345"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5"> Stadt <span className="text-red-500">*</span> </label>
                  <input type="text" value={settings.city} onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                    placeholder="Berlin"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5"> <Mail size={14} className="inline mr-1" /> E-Mail </label>
                <input type="email" value={settings.email} onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  placeholder="kontakt@beispiel.de"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5"> <Phone size={14} className="inline mr-1" /> Telefon </label>
                <input type="tel" value={settings.phone} onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  placeholder="+49 123 456789"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            </div>
          </div>

          {/* Optional: Tax */}
          <div className="p-6 border-b border-gray-100 dark:border-slate-700">
            <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <FileText size={14} /> Steuer & Rechnungswesen
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5"> USt-IdNr. </label>
                <input type="text" value={settings.vatId || ''} onChange={(e) => setSettings({ ...settings, vatId: e.target.value })}
                  placeholder="DE123456789"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5"> Steuernummer </label>
                <input type="text" value={settings.taxId || ''} onChange={(e) => setSettings({ ...settings, taxId: e.target.value })}
                  placeholder="123/456/78900"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div className="p-6 border-b border-gray-100 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-slate-700">
              <CreditCard size={18} /> Bankverbindung (für Rechnungen)
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5"> Bankname </label>
                <input type="text" value={settings.bankName || ''} onChange={(e) => setSettings({ ...settings, bankName: e.target.value })}
                  placeholder="Deutsche Bank"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5"> IBAN </label>
                <input type="text" value={settings.iban || ''} onChange={(e) => setSettings({ ...settings, iban: e.target.value })}
                  placeholder="DE89 3704 0044 0532 1340 00"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5"> BIC / SWIFT </label>
                <input type="text" value={settings.bankBic || ''} onChange={(e) => setSettings({ ...settings, bankBic: e.target.value })}
                  placeholder="COBADEFFXXX"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            </div>
          </div>

          {/* Invoice Defaults */}
          <div className="p-6 border-b border-gray-100 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-slate-700">
              <FileText size={18} /> Rechnungs-Standardwerte
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5"> Zahlungsziel (Tage) </label>
                <input type="number" value={settings.paymentTerms}
                  onChange={(e) => setSettings({ ...settings, paymentTerms: parseInt(e.target.value) || 14 })} min={1} max={90}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5"> Startwert Rechnungsnummer </label>
                <input type="number" value={settings.invoiceNumberStart || 1}
                  onChange={(e) => setSettings({ ...settings, invoiceNumberStart: parseInt(e.target.value) || 1 })} min={1} max={99999}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1"> Format: JAHR/00001 (z.B. 2026/00001) </p>
              </div>
            </div>
          </div>

          {/* ── Schedule Time Windows ── */}
          <div className="p-6 border-b border-gray-100 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-slate-700">
              <Clock size={18} /> Terminplanung – Zeitfenster
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
              Konfiguriere die Zeitfenster für die Platzhalter in der Terminansicht. Die Auto-Plan-Funktion ignoriert Platzhalter.
            </p>

            {/* Weekday (Mon–Fri) */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3"> Montag – Freitag </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5"> Beginn </label>
                  <input type="time" value={scheduleSettings.weekdayStart}
                    onChange={(e) => setScheduleSettings({ ...scheduleSettings, weekdayStart: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5"> Ende </label>
                  <input type="time" value={scheduleSettings.weekdayEnd}
                    onChange={(e) => setScheduleSettings({ ...scheduleSettings, weekdayEnd: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>
            </div>

            {/* Weekend (Sat–Sun) */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3"> Samstag – Sonntag </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5"> Beginn </label>
                  <input type="time" value={scheduleSettings.weekendStart}
                    onChange={(e) => setScheduleSettings({ ...scheduleSettings, weekendStart: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5"> Ende </label>
                  <input type="time" value={scheduleSettings.weekendEnd}
                    onChange={(e) => setScheduleSettings({ ...scheduleSettings, weekendEnd: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>
            </div>

            {/* Slot & Break settings */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5"> Slot-Dauer (Minuten) </label>
                <select value={scheduleSettings.slotDuration}
                  onChange={(e) => setScheduleSettings({ ...scheduleSettings, slotDuration: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value={60}>60 Minuten</option>
                  <option value={90}>90 Minuten</option>
                </select>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1"> Bevorzugte Dauer für freie Slots </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5"> Pause zwischen Terminen (Minuten) </label>
                <input type="number" value={scheduleSettings.breakMinutes}
                  onChange={(e) => setScheduleSettings({ ...scheduleSettings, breakMinutes: parseInt(e.target.value) || 10 })} min={0} max={60}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1"> Pause zwischen Slots und bestehenden Terminen </p>
              </div>
            </div>
          </div>

          {/* Data Management */}
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-slate-700">
              <FileText size={18} /> Datenverwaltung
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-4"> Exportiere oder importiere alle Anwendungsdaten im JSON-Format. </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <button onClick={handleExport}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
                  <Download size={16} /> Daten exportieren
                </button>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-2"> Lädt alle Daten als JSON-Datei herunter. </p>
              </div>
              <div>
                <input type="file" id="import-file" accept=".json" onChange={handleImport} className="hidden" />
                <label htmlFor="import-file"
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors cursor-pointer">
                  <Upload size={16} /> Daten importieren
                </label>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-2"> Lädt eine JSON-Datei hoch und überschreibt alle Daten. </p>
              </div>
            </div>
          </div>

          {/* Status Bar */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between">
            <p className={`text-sm ${isValid ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
              {isValid ? 'Alle Pflichtfelder ausgefüllt — Rechnungen können generiert werden' : 'Bitte Pflichtfelder ausfüllen (Name,Straße,PLZ,Stadt)'}
            </p>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${data ? 'bg-green-500' : 'bg-gray-300 dark:bg-slate-600'}`} />
              <span className="text-xs text-gray-500 dark:text-slate-400"> {data ? 'Daten geladen' : 'Keine Daten'} </span>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400 dark:text-slate-500">
          Diese Einstellungen werden für den Briefkopf, die Zahlungsangaben auf Rechnungen und die Terminplanung verwendet.
        </p>
        <p className="mt-2 text-center text-xs text-gray-400 dark:text-slate-500">
          Mit der Datenverwaltung kannst du deine Daten sichern und wiederherstellen.
        </p>
      </main>
    </div>
  );
}
