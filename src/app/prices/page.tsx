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
    if (!formStudentId || !formAmount || !formValidFrom) {
      alert('Bitte alle Pflichtfelder ausfüllen');
      return;
    }

    const newEntry: PriceEntry = {
      id: `price-${Date.now()}`,
      studentId: formStudentId,
      type: formType,
      amount: parseFloat(formAmount),
      validFrom: formValidFrom,
      validTo: formValidTo || undefined,
    };

    const updatedData: DataContainer = data || {
      families: [],
      students: [],
      priceEntries: [],
      appointments: [],
      lastUpdated: new Date().toISOString(),
    };
    updatedData.priceEntries = [...(updatedData.priceEntries || []), newEntry];
    updatedData.lastUpdated = new Date().toISOString();

    saveData(updatedData);
    resetForm();
    setShowAddForm(false);
    alert('Preisregelung wurde erstellt!');
  };

  const handleUpdate = () => {
    if (!formStudentId || !formAmount || !formValidFrom || !editingId) {
      alert('Bitte alle Pflichtfelder ausfüllen');
      return;
    }

    const updatedEntries = (data?.priceEntries || []).map(entry =>
      entry.id === editingId
        ? { ...entry, studentId: formStudentId, type: formType, amount: parseFloat(formAmount), validFrom: formValidFrom, validTo: formValidTo || undefined }
        : entry
    );

    const updatedData: DataContainer = data || {
      families: [],
      students: [],
      priceEntries: [],
      appointments: [],
      lastUpdated: new Date().toISOString(),
    };
    updatedData.priceEntries = updatedEntries;
    updatedData.lastUpdated = new Date().toISOString();

    saveData(updatedData);
    setEditingId(null);
    resetForm();
    alert('Preisregelung wurde aktualisiert!');
  };

  const handleDelete = (id: string) => {
    if (!confirm('Preisregelung wirklich löschen?')) return;

    const updatedData: DataContainer = data || {
      families: [],
      students: [],
      priceEntries: [],
      appointments: [],
      lastUpdated: new Date().toISOString(),
    };
    updatedData.priceEntries = (updatedData.priceEntries || []).filter(e => e.id !== id);
    updatedData.lastUpdated = new Date().toISOString();

    saveData(updatedData);
    if (editingId === id) {
      setEditingId(null);
    }
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

  const filteredEntries = (data?.priceEntries || []).filter(entry => {
    const student = (data?.students || []).find(s => s.id === entry.studentId);
    const studentName = student ? `${student.firstName} ${student.lastName || ''}`.toLowerCase() : '';
    return studentName.includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        </div>
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
              Neue Preisregelung
            </button>
          </div>

          {/* Search */}
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Nach Schüler suchen..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Add/Edit Form */}
        {(showAddForm || editingId) && (
          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {editingId ? 'Preisregelung bearbeiten' : 'Neue Preisregelung anlegen'}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Schüler *
                </label>
                <select
                  value={formStudentId}
                  onChange={e => setFormStudentId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Schüler auswählen...</option>
                  {(data?.students || []).map(student => (
                    <option key={student.id} value={student.id}>
                      {student.firstName} {student.lastName || ''}
                    </option>
                  ))}
                </select>
              </div>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Preis pro Stunde (€) *
                </label>
                <input
                  type="number"
                  value={formAmount}
                  onChange={e => setFormAmount(e.target.value)}
                  placeholder="z.B. 35"
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
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
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Gültig bis (optional)
                </label>
                <input
                  type="date"
                  value={formValidTo}
                  onChange={e => setFormValidTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingId(null);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={editingId ? handleUpdate : handleAdd}
                disabled={!formStudentId || !formAmount || !formValidFrom}
                className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingId ? 'Aktualisieren' : 'Speichern'}
              </button>
            </div>
          </div>
        )}

        {/* Price Entries List */}
        {filteredEntries.length === 0 ? (
          <div className="text-center py-16">
            <Euro className="w-16 h-16 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Noch keine Preisregelungen
            </h2>
            <p className="text-gray-500 dark:text-slate-400 mb-6">
              Erstelle deine erste Preisregelung um loszulegen.
            </p>
            <button
              onClick={() => {
                resetForm();
                setShowAddForm(true);
                setEditingId(null);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus size={18} />
              Erste Preisregelung anlegen
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEntries.map(entry => {
              const student = (data?.students || []).find(s => s.id === entry.studentId);
              const isEditing = editingId === entry.id;

              return (
                <div
                  key={entry.id}
                  className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden"
                >
                  <div className="px-4 py-3 bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center text-green-600">
                        <Euro size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {student ? `${student.firstName} ${student.lastName || ''}` : 'Unbekannt'}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
                          <span className={
                            entry.type === 'individual' ? 'text-blue-600' : 'text-purple-600'
                          }>
                            {entry.type === 'individual' ? 'Einzel' : 'Gruppe'}
                          </span>
                          <span>·</span>
                          <span>€{entry.amount.toFixed(2)}/h</span>
                        </div>
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

                  <div className="p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400">
                      <Calendar size={16} />
                      <span>
                        Gültig ab: {new Date(entry.validFrom).toLocaleDateString('de-DE')}
                        {entry.validTo && ` bis ${new Date(entry.validTo).toLocaleDateString('de-DE')}`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}