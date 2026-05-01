/**
 * Price Management Page - Manage price entries for individual, group, and block lessons
 * Edit form expands inline under the corresponding entry card
 */
'use client';

import { useState, useEffect } from 'react';
import { Euro, Calendar, Plus, Edit2, Trash2, Search, Check, User, X, Loader2, Package } from 'lucide-react';
import type { PriceEntry, DataContainer, Student } from '@/types';

export default function PricesPage() {
  const [data, setData] = useState<DataContainer | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<'standard' | 'block'>('standard');
  const [formStudentIds, setFormStudentIds] = useState<string[]>([]);
  const [formIndividual60, setFormIndividual60] = useState('');
  const [formIndividual90, setFormIndividual90] = useState('');
  const [formGroup60, setFormGroup60] = useState('');
  const [formGroup90, setFormGroup90] = useState('');
  const [formBlockName, setFormBlockName] = useState('');
  const [formBlockPrice, setFormBlockPrice] = useState('');
  const [formBlockStartDate, setFormBlockStartDate] = useState('');
  const [formBlockEndDate, setFormBlockEndDate] = useState('');
  const [formValidFrom, setFormValidFrom] = useState('');
  const [formValidTo, setFormValidTo] = useState('');
  const [formIsDefault, setFormIsDefault] = useState(false);

  // Student dropdown states
  const [studentDropdownOpen, setStudentDropdownOpen] = useState(false);
  const [studentFilter, setStudentFilter] = useState('');

  useEffect(() => { loadData(); }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.student-dropdown-container')) {
        setStudentDropdownOpen(false);
        setStudentFilter('');
      }
    };
    if (studentDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [studentDropdownOpen]);

  const loadData = () => {
    setLoading(true);
    try {
      const stored = localStorage.getItem('mathe_manager_data');
      if (stored) { setData(JSON.parse(stored)); }
    } catch (error) { console.error('Error loading data:', error); }
    finally { setLoading(false); }
  };

  const saveData = (newData: DataContainer) => {
    localStorage.setItem('mathe_manager_data', JSON.stringify(newData));
    setData(newData);
  };

  const getFamilyForStudent = (studentId: string): string => {
    const student = (data?.students || []).find(s => s.id === studentId);
    if (!student || !student.familyId) return '';
    const family = (data?.families || []).find(f => f.id === student.familyId);
    return family?.name || '';
  };

  const getFilteredStudents = (): Student[] => {
    const filter = studentFilter.toLowerCase();
    return (data?.students || []).filter(student => {
      const fullName = `${student.firstName} ${student.lastName || ''}`.toLowerCase();
      const familyName = getFamilyForStudent(student.id).toLowerCase();
      return fullName.includes(filter) || familyName.includes(filter);
    });
  };

  const handleAdd = () => {
    if (formType === 'standard') {
      if (formIsDefault) {
        if (!formIndividual60 || !formIndividual90 || !formGroup60 || !formGroup90 || !formValidFrom) {
          alert('Bitte alle Preise und Gültigkeitszeitraum angeben'); return;
        }
      } else {
        if (formStudentIds.length === 0 || !formIndividual60 || !formIndividual90 || !formGroup60 || !formGroup90 || !formValidFrom) {
          alert('Bitte mindestens einen Schüler, alle Preise und Gültigkeitszeitraum angeben'); return;
        }
      }
      const newEntry: PriceEntry = {
        id: `price-${Date.now()}`,
        name: formName || undefined,
        type: 'standard',
        studentIds: formIsDefault ? [] : formStudentIds,
        individual60: parseFloat(formIndividual60),
        individual90: parseFloat(formIndividual90),
        group60: parseFloat(formGroup60),
        group90: parseFloat(formGroup90),
        validFrom: formValidFrom,
        validTo: formValidTo || undefined,
        isDefault: formIsDefault,
      };
      const updatedData: DataContainer = data || {
        families: [], students: [], priceEntries: [], appointments: [], lastUpdated: new Date().toISOString(),
      };
      updatedData.priceEntries = [...(updatedData.priceEntries || []), newEntry];
      updatedData.lastUpdated = new Date().toISOString();
      saveData(updatedData);
      resetForm(); setShowAddForm(false);
      alert('Preisregelung wurde erstellt!');
    } else {
      // Block pricing
      if (formStudentIds.length === 0 || !formBlockName || !formBlockPrice || !formBlockStartDate || !formBlockEndDate) {
        alert('Bitte mindestens einen Schüler, Block-Name, Block-Preis und Block-Zeitraum angeben'); return;
      }
      const newEntry: PriceEntry = {
        id: `price-${Date.now()}`,
        name: formName || undefined,
        type: 'block',
        studentIds: formStudentIds,
        blockName: formBlockName,
        blockPrice: parseFloat(formBlockPrice),
        blockStartDate: formBlockStartDate,
        blockEndDate: formBlockEndDate,
        validFrom: formBlockStartDate,
        validTo: formBlockEndDate,
      };
      const updatedData: DataContainer = data || {
        families: [], students: [], priceEntries: [], appointments: [], lastUpdated: new Date().toISOString(),
      };
      updatedData.priceEntries = [...(updatedData.priceEntries || []), newEntry];
      updatedData.lastUpdated = new Date().toISOString();
      saveData(updatedData);
      resetForm(); setShowAddForm(false);
      alert('Block-Unterricht wurde erstellt!');
    }
  };

  const handleUpdate = () => {
    if (formType === 'standard') {
      if (formIsDefault) {
        if (!formIndividual60 || !formIndividual90 || !formGroup60 || !formGroup90 || !formValidFrom || !editingId) {
          alert('Bitte alle Preise und Gültigkeitszeitraum angeben'); return;
        }
      } else {
        if (formStudentIds.length === 0 || !formIndividual60 || !formIndividual90 || !formGroup60 || !formGroup90 || !formValidFrom || !editingId) {
          alert('Bitte mindestens einen Schüler, alle Preise und Gültigkeitszeitraum angeben'); return;
        }
      }
      const updatedEntries = (data?.priceEntries || []).map(entry =>
        entry.id === editingId
          ? {
              ...entry,
              name: formName || undefined,
              type: 'standard' as const,
              studentIds: formIsDefault ? [] : formStudentIds,
              individual60: parseFloat(formIndividual60),
              individual90: parseFloat(formIndividual90),
              group60: parseFloat(formGroup60),
              group90: parseFloat(formGroup90),
              validFrom: formValidFrom,
              validTo: formValidTo || undefined,
              isDefault: formIsDefault,
            }
          : entry
      );
      const updatedData: DataContainer = data || {
        families: [], students: [], priceEntries: [], appointments: [], lastUpdated: new Date().toISOString(),
      };
      updatedData.priceEntries = updatedEntries;
      updatedData.lastUpdated = new Date().toISOString();
      saveData(updatedData);
      setEditingId(null); resetForm();
      alert('Preisregelung wurde aktualisiert!');
    } else {
      // Block pricing
      if (formStudentIds.length === 0 || !formBlockName || !formBlockPrice || !formBlockStartDate || !formBlockEndDate || !editingId) {
        alert('Bitte mindestens einen Schüler, Block-Name, Block-Preis und Block-Zeitraum angeben'); return;
      }
      const updatedEntries = (data?.priceEntries || []).map(entry =>
        entry.id === editingId
          ? {
              ...entry,
              name: formName || undefined,
              type: 'block' as const,
              studentIds: formStudentIds,
              blockName: formBlockName,
              blockPrice: parseFloat(formBlockPrice),
              blockStartDate: formBlockStartDate,
              blockEndDate: formBlockEndDate,
              validFrom: formBlockStartDate,
              validTo: formBlockEndDate,
            }
          : entry
      );
      const updatedData: DataContainer = data || {
        families: [], students: [], priceEntries: [], appointments: [], lastUpdated: new Date().toISOString(),
      };
      updatedData.priceEntries = updatedEntries;
      updatedData.lastUpdated = new Date().toISOString();
      saveData(updatedData);
      setEditingId(null); resetForm();
      alert('Block-Unterricht wurde aktualisiert!');
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm('Preisregelung wirklich löschen?')) return;
    const updatedData: DataContainer = data || {
      families: [], students: [], priceEntries: [], appointments: [], lastUpdated: new Date().toISOString(),
    };
    updatedData.priceEntries = (updatedData.priceEntries || []).filter(e => e.id !== id);
    updatedData.lastUpdated = new Date().toISOString();
    saveData(updatedData);
    if (editingId === id) { setEditingId(null); }
  };

  const handleEdit = (entry: PriceEntry) => {
    setFormName(entry.name || '');
    setFormType(entry.type || 'standard');
    setFormStudentIds(entry.studentIds || []);
    setFormIndividual60(entry.individual60?.toString() || '');
    setFormIndividual90(entry.individual90?.toString() || '');
    setFormGroup60(entry.group60?.toString() || '');
    setFormGroup90(entry.group90?.toString() || '');
    setFormBlockName(entry.blockName || '');
    setFormBlockPrice(entry.blockPrice?.toString() || '');
    setFormBlockStartDate(entry.blockStartDate || '');
    setFormBlockEndDate(entry.blockEndDate || '');
    setFormValidFrom(entry.validFrom);
    setFormValidTo(entry.validTo || '');
    setFormIsDefault(entry.isDefault || false);
    setEditingId(entry.id);
    setShowAddForm(false);
  };

  const resetForm = () => {
    setFormName(''); setFormType('standard'); setFormStudentIds([]);
    setFormIndividual60(''); setFormIndividual90('');
    setFormGroup60(''); setFormGroup90('');
    setFormBlockName(''); setFormBlockPrice('');
    setFormBlockStartDate(''); setFormBlockEndDate('');
    setFormValidFrom(''); setFormValidTo('');
    setFormIsDefault(false);
  };

  const filteredEntries = (data?.priceEntries || []).filter(entry => {
    if (entry.isDefault) return true;
    const students = (data?.students || []).filter(s => entry.studentIds?.includes(s.id));
    const studentNames = students.map(s => `${s.firstName} ${s.lastName || ''}`).join(' ').toLowerCase();
    return studentNames.includes(searchTerm.toLowerCase()) || (entry.name || '').toLowerCase().includes(searchTerm.toLowerCase());
  });

  // --- Student selector sub-component (reused in add + edit forms) ---
  const renderStudentSelector = () => (
    <div className="student-dropdown-container flex items-center gap-2 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-200 dark:border-slate-600">
      <User className="w-4 h-4 text-gray-400" />
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-slate-300">Schüler zuordnen</span>
          {formIsDefault && (
            <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
              Standardpreis
            </span>
          )}
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder={formIsDefault ? 'Standardpreis (keine Schüler)' : formStudentIds.length === 0 ? 'Schüler auswählen...' : `${formStudentIds.length} Schüler ausgewählt`}
            onClick={() => setStudentDropdownOpen(!studentDropdownOpen)}
            readOnly={formIsDefault}
            className={`w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 ${formIsDefault ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
          />
          {studentDropdownOpen && !formIsDefault && (
            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg shadow-lg max-h-60 overflow-hidden">
              <div className="p-2 border-b border-gray-200 dark:border-slate-700">
                <input type="text" placeholder="Nach Schüler oder Familie filtern..." value={studentFilter}
                  onChange={e => setStudentFilter(e.target.value)} autoFocus
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="max-h-48 overflow-y-auto">
                {getFilteredStudents().length === 0 ? (
                  <div className="p-4 text-center text-gray-500 dark:text-slate-400 text-sm">Keine Schüler gefunden</div>
                ) : (
                  getFilteredStudents().map(student => {
                    const familyName = getFamilyForStudent(student.id);
                    const isSelected = formStudentIds.includes(student.id);
                    return (
                      <button key={student.id}
                        onClick={() => {
                          if (isSelected) { setFormStudentIds(formStudentIds.filter(id => id !== student.id)); }
                          else { setFormStudentIds([...formStudentIds, student.id]); }
                        }}
                        className={`w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'bg-green-600 border-green-600 text-white' : 'border-gray-300 dark:border-slate-600'}`}>
                            {isSelected && <Check size={12} />}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {student.firstName} {student.lastName || ''}
                            </span>
                            {familyName && <span className="text-xs text-gray-500 dark:text-slate-400">{familyName}</span>}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // --- Price fields sub-component ---
  const renderPriceFields = () => (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">60 Min. Einzelunterricht</label>
        <div className="relative">
          <input type="number" value={formIndividual60} onChange={e => setFormIndividual60(e.target.value)} placeholder="z.B. 35" min="0" step="0.01"
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
        </div>
      </div>
      <div>
        <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">90 Min. Einzelunterricht</label>
        <div className="relative">
          <input type="number" value={formIndividual90} onChange={e => setFormIndividual90(e.target.value)} placeholder="z.B. 50" min="0" step="0.01"
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
        </div>
      </div>
      <div>
        <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">60 Min. Gruppenunterricht</label>
        <div className="relative">
          <input type="number" value={formGroup60} onChange={e => setFormGroup60(e.target.value)} placeholder="z.B. 25" min="0" step="0.01"
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
        </div>
      </div>
      <div>
        <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">90 Min. Gruppenunterricht</label>
        <div className="relative">
          <input type="number" value={formGroup90} onChange={e => setFormGroup90(e.target.value)} placeholder="z.B. 35" min="0" step="0.01"
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
        </div>
      </div>
    </div>
  );

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
                <Euro className="w-6 h-6 text-green-600" /> Preisverwaltung
              </h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                Verwalte feste Preise für Einzel-, Gruppenstunden und Block-Unterricht
              </p>
            </div>
            <button onClick={() => { resetForm(); setShowAddForm(true); setEditingId(null); }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus size={18} /> Neue Preisregelung
            </button>
          </div>

          {/* Search */}
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Nach Schüler suchen..." value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-4 mt-4">
            <div className="px-3 py-1.5 bg-gray-100 dark:bg-slate-700 rounded-lg text-sm">
              <span className="font-semibold">{data?.priceEntries?.length || 0}</span>{' '}
              <span className="text-gray-500 dark:text-slate-400">Preisregelungen</span>
            </div>
            <div className="px-3 py-1.5 bg-gray-100 dark:bg-slate-700 rounded-lg text-sm">
              <span className="font-semibold">{(data?.priceEntries || []).filter(e => e.isDefault).length}</span>{' '}
              <span className="text-gray-500 dark:text-slate-400">Standardpreise</span>
            </div>
            <div className="px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-sm">
              <span className="font-semibold">{(data?.priceEntries || []).filter(e => e.type === 'block').length}</span>{' '}
              <span className="text-purple-700 dark:text-purple-300">Block-Unterrichte</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Add New Price Entry Form (top-level, separate card) */}
        {showAddForm && (
          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Neue Preisregelung anlegen
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Name (optional)</label>
                <input type="text" value={formName} onChange={e => setFormName(e.target.value)} placeholder="z.B. Standardpreis 2024"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Art der Preisregelung *</label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setFormType('standard')}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      formType === 'standard'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    Standardpreise
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormType('block')}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      formType === 'block'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    Block-Unterricht
                  </button>
                </div>
              </div>
              {formType === 'standard' ? (
                <>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Schüler *</label>
                    {renderStudentSelector()}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Preise *</label>
                    {renderPriceFields()}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Gültig ab *</label>
                    <input type="date" value={formValidFrom} onChange={e => setFormValidFrom(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Gültig bis (optional)</label>
                    <input type="date" value={formValidTo} onChange={e => setFormValidTo(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                  <div className="sm:col-span-2 flex items-center gap-2">
                    <input type="checkbox" id="isDefault" checked={formIsDefault} onChange={e => setFormIsDefault(e.target.checked)}
                      className="w-4 h-4 text-green-600 rounded focus:ring-green-500" />
                    <label htmlFor="isDefault" className="text-sm text-gray-700 dark:text-slate-300 cursor-pointer">
                      Diesen Preis als Standardpreis für alle Schüler ohne eigenen Eintrag verwenden
                    </label>
                  </div>
                </>
              ) : (
                <>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Schüler *</label>
                    {renderStudentSelector()}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Block-Name *</label>
                    <input type="text" value={formBlockName} onChange={e => setFormBlockName(e.target.value)} placeholder="z.B. Abiturprogramm"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Block-Preis *</label>
                    <div className="relative">
                      <input type="number" value={formBlockPrice} onChange={e => setFormBlockPrice(e.target.value)} placeholder="z.B. 450" min="0" step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Block-Startdatum *</label>
                    <input type="date" value={formBlockStartDate} onChange={e => setFormBlockStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Block-Enddatum *</label>
                    <input type="date" value={formBlockEndDate} onChange={e => setFormBlockEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                </>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => { setShowAddForm(false); resetForm(); }}
                className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                Abbrechen
              </button>
              <button onClick={handleAdd} disabled={
                formType === 'standard'
                  ? (!formIndividual60 || !formIndividual90 || !formGroup60 || !formGroup90 || !formValidFrom)
                  : (!formBlockName || !formBlockPrice || !formBlockStartDate || !formBlockEndDate)
              }
                className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Speichern
              </button>
            </div>
          </div>
        )}

        {/* Price Entries List */}
        {filteredEntries.length === 0 && !showAddForm ? (
          <div className="text-center py-16">
            <Euro className="w-16 h-16 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Noch keine Preisregelungen</h2>
            <p className="text-gray-500 dark:text-slate-400 mb-6">Erstelle deine erste Preisregelung mit festen Preisen für die 4 Kombinationen oder einen Block-Unterricht.</p>
            <button onClick={() => { resetForm(); setShowAddForm(true); setEditingId(null); }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus size={18} /> Erste Preisregelung anlegen
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEntries.map(entry => {
              const students = (entry.studentIds || []).map(id => (data?.students || []).find(s => s.id === id)).filter(Boolean) as Student[];
              const isEditing = editingId === entry.id;
              return (
                <div key={entry.id} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
                  {/* Entry Header */}
                  <div className="px-4 py-3 bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        entry.type === 'block' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600' : 'bg-green-100 dark:bg-green-900/30 text-green-600'
                      }`}>
                        {entry.type === 'block' ? <Package size={20} /> : <Euro size={20} />}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {entry.type === 'block' ? (
                            <span className="flex items-center gap-2">
                              <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">Block-Unterricht</span>
                              {entry.blockName || 'Unbenannt'}
                            </span>
                          ) : entry.isDefault ? (
                            <span className="flex items-center gap-2">
                              <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">Standardpreis</span>
                              {entry.name || ''}
                            </span>
                          ) : students.length > 0 ? (
                            students.map(s => `${s.firstName} ${s.lastName || ''}`).join(', ')
                          ) : (
                            'Unbekannt'
                          )}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400 flex-wrap">
                          {entry.type === 'block' ? (
                            <>
                              <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-700">
                                {entry.blockName}
                              </span>
                              <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-700">
                                €{entry.blockPrice?.toFixed(2) || '0.00'}
                              </span>
                              <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-700">
                                {new Date(entry.blockStartDate || '').toLocaleDateString('de-DE')} - {new Date(entry.blockEndDate || '').toLocaleDateString('de-DE')}
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
                                60' Einzel: €{entry.individual60?.toFixed(2) || '0.00'}
                              </span>
                              <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
                                90' Einzel: €{entry.individual90?.toFixed(2) || '0.00'}
                              </span>
                              <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-700">
                                60' Gruppe: €{entry.group60?.toFixed(2) || '0.00'}
                              </span>
                              <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-700">
                                90' Gruppe: €{entry.group90?.toFixed(2) || '0.00'}
                              </span>
                              {entry.name && !entry.isDefault && (
                                <>
                                  <span>·</span>
                                  <span>{entry.name}</span>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEdit(entry)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" title="Bearbeiten"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleDelete(entry.id)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors" title="Löschen"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Validity */}
                  {!isEditing && (
                    <div className="p-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400">
                        <Calendar size={16} />
                        <span>
                          {entry.type === 'block' ? (
                            <>
                              Block-Zeitraum: {new Date(entry.blockStartDate || '').toLocaleDateString('de-DE')} bis {new Date(entry.blockEndDate || '').toLocaleDateString('de-DE')}
                            </>
                          ) : (
                            <>
                              Gültig ab: {new Date(entry.validFrom).toLocaleDateString('de-DE')}
                              {entry.validTo && ` bis ${new Date(entry.validTo).toLocaleDateString('de-DE')}`}
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Inline Edit Form — expands under the entry card */}
                  {isEditing && (
                    <div className="p-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
                      <h4 className="text-sm font-semibold text-gray-800 dark:text-slate-200 mb-3">Preisregelung bearbeiten</h4>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Name (optional)</label>
                          <input type="text" value={formName} onChange={e => setFormName(e.target.value)} placeholder="z.B. Standardpreis 2024"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Art der Preisregelung *</label>
                          <div className="flex gap-4">
                            <button
                              type="button"
                              onClick={() => setFormType('standard')}
                              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                                formType === 'standard'
                                  ? 'bg-green-600 text-white'
                                  : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                              }`}
                            >
                              Standardpreise
                            </button>
                            <button
                              type="button"
                              onClick={() => setFormType('block')}
                              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                                formType === 'block'
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                              }`}
                            >
                              Block-Unterricht
                            </button>
                          </div>
                        </div>
                        {formType === 'standard' ? (
                          <>
                            <div className="sm:col-span-2">
                              <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Schüler *</label>
                              {renderStudentSelector()}
                            </div>
                            <div className="sm:col-span-2">
                              <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Preise *</label>
                              {renderPriceFields()}
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Gültig ab *</label>
                              <input type="date" value={formValidFrom} onChange={e => setFormValidFrom(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Gültig bis (optional)</label>
                              <input type="date" value={formValidTo} onChange={e => setFormValidTo(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                            </div>
                            <div className="sm:col-span-2 flex items-center gap-2">
                              <input type="checkbox" id={`isDefault-${entry.id}`} checked={formIsDefault} onChange={e => setFormIsDefault(e.target.checked)}
                                className="w-4 h-4 text-green-600 rounded focus:ring-green-500" />
                              <label htmlFor={`isDefault-${entry.id}`} className="text-sm text-gray-700 dark:text-slate-300 cursor-pointer">
                                Standardpreis für alle Schüler ohne eigenen Eintrag
                              </label>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="sm:col-span-2">
                              <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Schüler *</label>
                              {renderStudentSelector()}
                            </div>
                            <div className="sm:col-span-2">
                              <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Block-Name *</label>
                              <input type="text" value={formBlockName} onChange={e => setFormBlockName(e.target.value)} placeholder="z.B. Abiturprogramm"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                            </div>
                            <div className="sm:col-span-2">
                              <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Block-Preis *</label>
                              <div className="relative">
                                <input type="number" value={formBlockPrice} onChange={e => setFormBlockPrice(e.target.value)} placeholder="z.B. 450" min="0" step="0.01"
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Block-Startdatum *</label>
                              <input type="date" value={formBlockStartDate} onChange={e => setFormBlockStartDate(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Block-Enddatum *</label>
                              <input type="date" value={formBlockEndDate} onChange={e => setFormBlockEndDate(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                            </div>
                          </>
                        )}
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button onClick={handleUpdate}
                          disabled={
                            formType === 'standard'
                              ? (!formIndividual60 || !formIndividual90 || !formGroup60 || !formGroup90 || !formValidFrom)
                              : (!formBlockName || !formBlockPrice || !formBlockStartDate || !formBlockEndDate)
                          }
                          className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Speichern
                        </button>
                        <button onClick={() => { setEditingId(null); resetForm(); }}
                          className="px-3 py-1.5 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700"
                        >
                          Abbrechen
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
