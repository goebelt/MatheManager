/**
 * Price Management Page - Manage price entries for individual and group lessons
 */

'use client';

import { useState, useEffect } from 'react';
import { Euro, Calendar, Plus, Edit2, Trash2, Search, Check, X, Loader2 } from 'lucide-react';
import type { PriceEntry, DataContainer } from '@/types';
import { DURATION_OPTIONS, PRICE_TYPES } from '@/lib/constants';

export default function PricesPage() {
  const [data, setData] = useState<DataContainer | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state
  const [formStudentId, setFormStudentId] = useState('');
  const [formType, setFormType] = useState<'individual' | 'group'>('individual');
  const [formAmount, setFormAmount] = useState('');
  const [formValidFrom, setFormValidFrom] = useState('');
  const [formValidTo, setFormValidTo] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    try {
      const stored = localStorage.getItem('mathe_manager_data');
      if (stored) {
        setData(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveData = (newData: DataContainer) => {
    localStorage.setItem('mathe_manager_data', JSON.stringify(newData));
    setData(newData);
  };

  const handleAdd = () => {
    if (!formStudentId || !formAmount || !formValidFrom) return;
    if (!data) return;

    const newEntry: PriceEntry = {
      id: `price-${Date.now()}`,
      studentId: formStudentId,
      type: formType,
      amount: parseFloat(formAmount),
      validFrom: formValidFrom,
      validTo: formValidTo || null,
    };

    const updatedData = {
      ...data,
      priceEntries: [...(data.priceEntries || []), newEntry],
      lastUpdated: new Date().toISOString(),
    };

    saveData(updatedData);
    resetForm();
    setShowAddForm(false);
  };

  const handleUpdate = (id: string) => {
    if (!formAmount || !formValidFrom) return;
    if (!data) return;

    const updatedEntries = (data.priceEntries || []).map(entry =>
      entry.id === id
        ? {
            ...entry,
            type: formType,
            amount: parseFloat(formAmount),
            validFrom: formValidFrom,
            validTo: formValidTo || null,
          }
        : entry
    );

    const updatedData = {
      ...data,
      priceEntries: updatedEntries,
      lastUpdated: new Date().toISOString(),
    };

    saveData(updatedData);
    resetForm();
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Preiseintrag wirklich löschen?')) return;
    if (!data) return;

    const updatedData = {
      ...data,
      priceEntries: (data.priceEntries || []).filter(e => e.id !== id),
      lastUpdated: new Date().toISOString(),
    };

    saveData(updatedData);
  };

  const handleEdit = (entry: PriceEntry) => {
    setFormStudentId(entry.studentId);
    setFormType(entry.type);
    setFormAmount(entry.amount.toString());
    setFormValidFrom(entry.validFrom);
    setFormValidTo(entry.validTo || '');
    setEditingId(entry.id);
    setShowAddForm(false);
  };

  const resetForm = () => {
    setFormStudentId('');
    setFormType('individual');
    setFormAmount('');
    setFormValidFrom('');
    setFormValidTo('');
  };

  // Get student name by ID
  const getStudentName = (studentId: string): string => {
    if (!data) return studentId;
    const student = data.students?.find(s => s.id === studentId);
    if (student) return `${student.firstName} ${student.lastName || ''}`.trim();
    const family = data.families?.find(f => f.id === studentId);
    return family?.name || studentId;
  };

  // Filter entries by search term (searches student name)
  const filteredEntries = (data?.priceEntries || []).filter(entry => {
    if (!searchTerm) return true;
    const studentName = getStudentName(entry.studentId).toLowerCase();
    return studentName.includes(searchTerm.toLowerCase());
  });

  // Group entries by student for display
  const entriesByStudent = filteredEntries.reduce((groups, entry) => {
    const key = entry.studentId;
    if (!groups[key]) groups[key] = [];
    groups[key].push(entry);
    return groups;
  }, {} as Record<string, PriceEntry[]>);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Euro className="w-6 h-6 text-green-600" />
                Preisverwaltung
              </h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                Verwalte Preise für Einzel- und Gruppenstunden
              </p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowAddForm(true);
                setEditingId(null);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus size={18} />
              Neuer Preis
            </button>
          </div>

          {/* Search */}
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Nach Schüler/Familie suchen..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Add/Edit Form */}
        {(showAddForm || editingId) && (
          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {editingId ? 'Preis bearbeiten' : 'Neuen Preis hinzufügen'}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Student Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Schüler/Familie *
                </label>
                <select
                  value={formStudentId}
                  onChange={e => setFormStudentId(e.target.value)}
                  disabled={!!editingId}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                >
                  <option value="">-- Auswählen --</option>
                  {(data?.students || []).map(student => (
                    <option key={student.id} value={student.id}>
                      {student.firstName} {student.lastName || ''}
                    </option>
                  ))}
                  {(data?.families || []).map(family => (
                    <option key={family.id} value={family.id}>
                      {family.name} (Familie)
                    </option>
                  ))}
                </select>
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Typ *
                </label>
                <select
                  value={formType}
                  onChange={e => setFormType(e.target.value as 'individual' | 'group')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="individual">Einzelstunde</option>
                  <option value="group">Gruppenstunde</option>
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Betrag (€) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formAmount}
                  onChange={e => setFormAmount(e.target.value)}
                  placeholder="z.B. 45.00"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Valid From */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Gültig ab *
                </label>
                <input
                  type="date"
                  value={formValidFrom}
                  onChange={e => setFormValidFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Valid To */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Gültig bis (optional)
                </label>
                <input
                  type="date"
                  value={formValidTo}
                  onChange={e => setFormValidTo(e.target.value)}
                  min={formValidFrom || undefined}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  resetForm();
                  setShowAddForm(false);
                  setEditingId(null);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                <X size={18} className="inline mr-1" />
                Abbrechen
              </button>
              <button
                onClick={() => editingId ? handleUpdate(editingId) : handleAdd()}
                disabled={!formStudentId || !formAmount || !formValidFrom}
                className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check size={18} className="inline mr-1" />
                {editingId ? 'Aktualisieren' : 'Speichern'}
              </button>
            </div>
          </div>
        )}

        {/* Price List */}
        {filteredEntries.length === 0 && !showAddForm && !editingId ? (
          <div className="text-center py-16">
            <Euro className="w-16 h-16 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Noch keine Preise angelegt
            </h2>
            <p className="text-gray-500 dark:text-slate-400 mb-6">
              Erstelle Preiseinträge um die Abrechnung korrekt zu berechnen.
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus size={18} />
              Ersten Preis anlegen
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(entriesByStudent).map(([studentId, entries]) => (
              <div key={studentId} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {getStudentName(studentId)}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    {entries.length} Preiseintrag{entries.length !== 1 ? 'räge' : ''}
                  </p>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-slate-700">
                  {entries.map(entry => (
                    <div key={entry.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          entry.type === 'individual'
                            ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
                        }`}>
                          {entry.type === 'individual' ? '1' : '2'}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            &euro;{entry.amount.toFixed(2)} pro {DURATION_OPTIONS.SHORT} Min
                          </p>
                          <p className="text-sm text-gray-500 dark:text-slate-400 flex items-center gap-1">
                            <Calendar size={14} />
                            {new Date(entry.validFrom).toLocaleDateString('de-DE')}
                            {entry.validTo && ` — ${new Date(entry.validTo).toLocaleDateString('de-DE')}`}
                            {!entry.validTo && ' — unbefristet'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(entry)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          title="Bearbeiten"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title="Löschen"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}