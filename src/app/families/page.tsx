/**
 * Families Management Page - List, create, edit families and their students
 */
'use client';

import { useState, useEffect } from 'react';
import { Users, Plus, Search, Edit2, Trash2, X, ChevronRight, ChevronLeft, Phone, Mail, MapPin, Clock, User, ArrowLeft, UserCheck, UserX, Wallet } from 'lucide-react';
import Link from 'next/link';
import type { Family, Student, DataContainer, FamilyCredit } from '@/types';
import { DURATION_OPTIONS, RHYTHM_OPTIONS } from '@/lib/constants';

type PaginationState = { familyPage: number; studentPage: number; };

export default function FamiliesPage() {
  const [data, setData] = useState<DataContainer | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingFamilyId, setEditingFamilyId] = useState<string | null>(null);
  const [addingStudentToFamilyId, setAddingStudentToFamilyId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({ familyPage: 1, studentPage: 1 });

  // Add family form state
  const [formName, setFormName] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');

  // Add student form state
  const [studentFirstName, setStudentFirstName] = useState('');
  const [studentLastName, setStudentLastName] = useState('');
  const [studentDuration, setStudentDuration] = useState(60);
  const [studentRhythm, setStudentRhythm] = useState<'weekly' | 'biweekly'>('weekly');

    const [depositFamilyId, setDepositFamilyId] = useState<string | null>(null);
    const [depositAmount, setDepositAmount] = useState<string>('');
    const [historyFamilyId, setHistoryFamilyId] = useState<string | null>(null);
    const [depositDate, setDepositDate] = useState<string>('');
    const [depositNote, setDepositNote] = useState<string>('');


  useEffect(() => { loadData(); }, []);

  const loadData = () => {
    setLoading(true);
    try {
      const stored = localStorage.getItem('mathe_manager_data');
      if (stored) { setData(JSON.parse(stored)); }
    } catch (e) { console.error('Error loading data:', e); }
    finally { setLoading(false); }
  };

  const saveData = (newData: DataContainer) => {
    localStorage.setItem('mathe_manager_data', JSON.stringify(newData));
    setData(newData);
  };

  // --- Toggle student active/inactive ---
  const handleToggleStudentActive = (studentId: string) => {
    if (!data) return;
    const updatedStudents = data.students.map(s =>
      s.id === studentId ? { ...s, inactive: !s.inactive } : s
    );
    const updatedData = { ...data, students: updatedStudents, lastUpdated: new Date().toISOString() };
    saveData(updatedData);
  };

  // --- Family CRUD ---
  const handleAddFamily = () => {
    if (!formName.trim()) return;
    const existing = (data?.families || []).find(f => f.name.toLowerCase() === formName.trim().toLowerCase());
    if (existing) { alert('Eine Familie mit diesem Namen existiert bereits.'); return; }

    const newFamily: Family = {
      id: `family-${Date.now()}`, name: formName.trim(),
      address: formAddress.trim(), email: formEmail.trim(), phone: formPhone.trim(),
    };
    const updatedData: DataContainer = data || { families: [], students: [], priceEntries: [], appointments: [], lastUpdated: new Date().toISOString() };
    updatedData.families = [...(updatedData.families || []), newFamily];

    if (studentFirstName.trim()) {
      const newStudent: Student = {
        id: `student-${Date.now()}`, familyId: newFamily.id,
        firstName: studentFirstName.trim(), lastName: studentLastName.trim() || undefined,
        notes: '', defaultDuration: studentDuration, rhythm: studentRhythm,
      };
      updatedData.students = [...(updatedData.students || []), newStudent];
    }
    updatedData.lastUpdated = new Date().toISOString();
    saveData(updatedData);
    resetForm(); setShowAddForm(false);
    alert(`Familie "${newFamily.name}" wurde erstellt!`);
  };

  const handleUpdateFamily = (familyId: string) => {
    if (!formName.trim()) return;
    const updatedFamilies = (data?.families || []).map(f =>
      f.id === familyId ? { ...f, name: formName.trim(), address: formAddress.trim(), email: formEmail.trim(), phone: formPhone.trim() } : f
    );
    const updatedData: DataContainer = data || { families: [], students: [], priceEntries: [], appointments: [], lastUpdated: new Date().toISOString() };
    updatedData.families = updatedFamilies;
    updatedData.lastUpdated = new Date().toISOString();
    saveData(updatedData); setEditingFamilyId(null); resetForm();
  };

  const handleDeleteFamily = (familyId: string, name: string) => {
    if (!confirm(`Möchten Sie die Familie "${name}" und alle zugehörigen Schüler wirklich löschen?`)) return;
    const updatedData: DataContainer = data || { families: [], students: [], priceEntries: [], appointments: [], lastUpdated: new Date().toISOString() };
    updatedData.families = (updatedData.families || []).filter(f => f.id !== familyId);
    updatedData.students = (updatedData.students || []).filter(s => s.familyId !== familyId);
    updatedData.lastUpdated = new Date().toISOString();
    saveData(updatedData);
    if (editingFamilyId === familyId) { setEditingFamilyId(null); }
  };

  const handleEditFamily = (family: Family) => {
    setFormName(family.name); setFormAddress(family.address || '');
    setFormEmail(family.email || ''); setFormPhone(family.phone || '');
    setEditingFamilyId(family.id); setShowAddForm(false);
  };

  // --- Student CRUD ---
  const handleAddStudent = (familyId: string) => {
    if (!studentFirstName.trim()) return;
    const newStudent: Student = {
      id: `student-${Date.now()}`, familyId,
      firstName: studentFirstName.trim(), lastName: studentLastName.trim() || undefined,
      notes: '', defaultDuration: studentDuration, rhythm: studentRhythm,
    };
    const updatedData: DataContainer = data || { families: [], students: [], priceEntries: [], appointments: [], lastUpdated: new Date().toISOString() };
    updatedData.students = [...(updatedData.students || []), newStudent];
    updatedData.lastUpdated = new Date().toISOString();
    saveData(updatedData);
    setStudentFirstName(''); setStudentLastName(''); setStudentDuration(60); setStudentRhythm('weekly');
  };

  const handleUpdateStudent = (studentId: string) => {
    if (!studentFirstName.trim()) return;
    const updatedStudents = (data?.students || []).map(s =>
      s.id === studentId ? { ...s, firstName: studentFirstName.trim(), lastName: studentLastName.trim() || undefined, defaultDuration: studentDuration, rhythm: studentRhythm } : s
    );
    const updatedData: DataContainer = data || { families: [], students: [], priceEntries: [], appointments: [], lastUpdated: new Date().toISOString() };
    updatedData.students = updatedStudents;
    updatedData.lastUpdated = new Date().toISOString();
    saveData(updatedData); setEditingFamilyId(null); resetForm();
  };

  const handleDeleteStudent = (studentId: string, name: string) => {
    if (!confirm(`Schüler "${name}" wirklich löschen? Zugehörige Termine bleiben erhalten.`)) return;
    const updatedData: DataContainer = data || { families: [], students: [], priceEntries: [], appointments: [], lastUpdated: new Date().toISOString() };
    updatedData.students = (updatedData.students || []).filter(s => s.id !== studentId);
    updatedData.lastUpdated = new Date().toISOString();
    saveData(updatedData);
  };

  const handleEditStudent = (student: Student) => {
    setStudentFirstName(student.firstName); setStudentLastName(student.lastName || '');
    setStudentDuration(student.defaultDuration); setStudentRhythm(student.rhythm);
    setEditingFamilyId(student.familyId);
  };

  const resetForm = () => {
    setFormName(''); setFormAddress(''); setFormEmail(''); setFormPhone('');
    setStudentFirstName(''); setStudentLastName(''); setStudentDuration(60); setStudentRhythm('weekly');
  };

    const handleOpenDeposit = (familyId: string) => {
      if (!data) return;
      setDepositFamilyId(familyId);
      setDepositAmount('');
      setDepositDate(new Date().toISOString().split('T')[0]);
      setDepositNote('');
    };

    const handleOpenHistory = (familyId: string) => {
      setHistoryFamilyId(familyId);
    };

    const handleDeleteCredit = (familyId: string, creditId: string) => {
      if (!data || !confirm('Diesen Guthabeneintrag wirklich löschen?')) return;
      const updatedFamilies = (data?.families || []).map(family =>
        family.id === familyId
          ? { ...family, credits: (family.credits || []).filter(c => c.id !== creditId) }
          : family
      );
      const updatedData = { ...data, families: updatedFamilies, lastUpdated: new Date().toISOString() };
      saveData(updatedData);
    };

    const handleSubmitDeposit = () => {
      if (!data || !depositFamilyId) return;
      const amount = parseFloat(depositAmount);
      if (isNaN(amount) || amount <= 0) {
        alert('Bitte gib einen gültigen Betrag ein.');
        return;
      }
      const date = depositDate || new Date().toISOString().split('T')[0];
      const note = depositNote;
      const newCredit: FamilyCredit = {
        id: `credit-${Date.now()}`,
        familyId: depositFamilyId,
        amount,
        date,
        ...(note ? { note } : {}),
      };
      const updatedFamilies = (data?.families || []).map(family =>
        family.id === depositFamilyId
          ? {
              ...family,
              credits: [...(family.credits || []), newCredit],
            }
          : family
      );
      const updatedData = { ...data, families: updatedFamilies, lastUpdated: new Date().toISOString() };
      saveData(updatedData);
      setDepositFamilyId(null);
      setDepositAmount('');
      setDepositDate('');
      setDepositNote('');
      alert('Guthaben erfolgreich eingezahlt.');
    };


  const getStudentsForFamily = (familyId: string): Student[] =>
    (data?.students || []).filter(s => s.familyId === familyId);

  const calculateFamilyCreditBalance = (family: Family): number => {
    if (!family.credits || family.credits.length === 0) return 0;
    return family.credits.reduce((sum, credit) => sum + credit.amount, 0);
  };

  const filteredFamilies = (data?.families || []).filter(f =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (f.email && f.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const pageSize = 10;
  const totalPagesFamilies = Math.max(1, Math.ceil(filteredFamilies.length / pageSize));
  const paginatedFamilies = filteredFamilies.slice((pagination.familyPage - 1) * pageSize, pagination.familyPage * pageSize);

  // Count active/inactive students
  const allStudents = data?.students || [];
  const activeCount = allStudents.filter(s => !s.inactive).length;
  const inactiveCount = allStudents.filter(s => s.inactive).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400 animate-pulse">Lade Daten...</p>
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
                <Users className="w-6 h-6 text-green-600" /> Familien & Schüler
              </h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                Verwalte Familien, Schüler und deren Einstellungen
              </p>
            </div>
            <button onClick={() => { resetForm(); setShowAddForm(true); setEditingFamilyId(null); }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus size={18} /> Neue Familie
            </button>
          </div>

          {/* Search */}
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Nach Familie suchen..." value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setPagination(p => ({ ...p, familyPage: 1 })); }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-4 mt-4">
            <div className="px-3 py-1.5 bg-gray-100 dark:bg-slate-700 rounded-lg text-sm">
              <span className="font-semibold">{data?.families?.length || 0}</span>{' '}
              <span className="text-gray-500 dark:text-slate-400">Familien</span>
            </div>
            <div className="px-3 py-1.5 bg-gray-100 dark:bg-slate-700 rounded-lg text-sm">
              <span className="font-semibold">{activeCount}</span>{' '}
              <span className="text-gray-500 dark:text-slate-400">Aktive Schüler</span>
            </div>
            {inactiveCount > 0 && (
              <div className="px-3 py-1.5 bg-gray-100 dark:bg-slate-700 rounded-lg text-sm">
                <span className="font-semibold text-gray-400">{inactiveCount}</span>{' '}
                <span className="text-gray-400">Inaktiv</span>
              </div>
            )}
            <div className="px-3 py-1.5 bg-gray-100 dark:bg-slate-700 rounded-lg text-sm">
              <span className="font-semibold">{allStudents.filter(s => s.defaultDuration === 90).length}</span>{' '}
              <span className="text-gray-500 dark:text-slate-400">90-Min</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Add/Edit Family Form */}
        {showAddForm && (
          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Neue Familie anlegen</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Familienname *</label>
                <input type="text" value={formName} onChange={e => setFormName(e.target.value)} placeholder="z.B. Müller"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1"><MapPin size={14} className="inline mr-1" /> Adresse</label>
                <input type="text" value={formAddress} onChange={e => setFormAddress(e.target.value)} placeholder="Musterstraße 1, 12345 Stadt"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1"><Mail size={14} className="inline mr-1" /> E-Mail</label>
                <input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="familie@beispiel.de"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1"><Phone size={14} className="inline mr-1" /> Telefon</label>
                <input type="tel" value={formPhone} onChange={e => setFormPhone(e.target.value)} placeholder="+49 123 456789"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            </div>

            {/* Add first student */}
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-200 mb-3">Ersten Schüler hinzufügen (optional)</h3>
              <div className="grid gap-4 sm:grid-cols-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Vorname *</label>
                  <input type="text" value={studentFirstName} onChange={e => setStudentFirstName(e.target.value)} placeholder="Max"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Nachname</label>
                  <input type="text" value={studentLastName} onChange={e => setStudentLastName(e.target.value)} placeholder="Müller"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Dauer</label>
                  <select value={studentDuration} onChange={e => setStudentDuration(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500">
                    <option value={60}>60 Minuten</option>
                    <option value={90}>90 Minuten</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Rhythmus</label>
                  <select value={studentRhythm} onChange={e => setStudentRhythm(e.target.value as 'weekly' | 'biweekly')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500">
                    <option value="weekly">Wöchentlich</option>
                    <option value="biweekly">Zweiwöchentlich</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => { setShowAddForm(false); resetForm(); }}
                className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                Abbrechen
              </button>
              <button onClick={handleAddFamily} disabled={!formName.trim()}
                className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                Familie speichern
              </button>
            </div>
          </div>
        )}

        {/* Family List */}
        {paginatedFamilies.length === 0 && !showAddForm ? (
          <div className="text-center py-16">
            <Users className="w-16 h-16 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Noch keine Familien angelegt</h2>
            <p className="text-gray-500 dark:text-slate-400 mb-6">Erstelle deine erste Familie um Schüler hinzuzufügen.</p>
            <button onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors">
              <Plus size={18} /> Erste Familie anlegen
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedFamilies.map(family => {
              const students = getStudentsForFamily(family.id);
              const isEditingThis = editingFamilyId === family.id;
              return (
                <div key={family.id} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
                  {/* Family Header */}
                  <div className="px-4 py-3 bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center text-green-600 font-bold text-lg">
                        {family.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{family.name}</h3>
                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-slate-400">
                          {family.address && <span className="flex items-center gap-1"><MapPin size={12} />{family.address}</span>}
                          {family.email && <span className="flex items-center gap-1"><Mail size={12} />{family.email}</span>}
                          {family.phone && <span className="flex items-center gap-1"><Phone size={12} />{family.phone}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Credit Balance Display */}
                      {(function() {
                        const balance = calculateFamilyCreditBalance(family);
                        const balanceColor = balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
                        const bgColor = balance >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30';
                        return (
                          <span className={`text-xs px-2 py-1 rounded-full font-semibold ${bgColor} ${balanceColor}`}>
                            {balance >= 0 ? '+' : ''}{balance.toFixed(2)} €
                          </span>
                        );
                      })()}
                      <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                        {students.length} Schüler
                      </span>
                      <button onClick={() => handleEditFamily(family)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" title="Bearbeiten">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleOpenDeposit(family.id)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" title="Guthaben einzahlen">
                        <Wallet size={18} />
                      </button>
                      <button onClick={() => handleOpenHistory(family.id)} className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-colors" title="Guthaben-Historie">
                        <Clock size={18} />
                      </button>
                      <button onClick={() => handleDeleteFamily(family.id, family.name)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors" title="Löschen">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Edit Family Form */}
                  {isEditingThis && !showAddForm && (
                    <div className="p-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
                      <h4 className="text-sm font-semibold text-gray-800 dark:text-slate-200 mb-3">Familie bearbeiten</h4>
                      <div className="grid gap-3 sm:grid-cols-4 mb-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Name *</label>
                          <input type="text" value={formName} onChange={e => setFormName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Adresse</label>
                          <input type="text" value={formAddress} onChange={e => setFormAddress(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">E-Mail</label>
                          <input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Telefon</label>
                          <input type="tel" value={formPhone} onChange={e => setFormPhone(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleUpdateFamily(family.id)} className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700">Familie speichern</button>
                        <button onClick={() => { setEditingFamilyId(null); resetForm(); }} className="px-3 py-1.5 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700">Abbrechen</button>
                      </div>
                    </div>
                  )}

                  {/* Students List */}
                  {students.length > 0 && (
                    <div className="divide-y divide-gray-100 dark:divide-slate-700">
                      {students.map(student => {
                        const isEditingStudent = editingFamilyId === student.id && !isEditingThis;
                        const isInactive = !!student.inactive;
                        return (
                          <div key={student.id} className={`p-4 ${isInactive ? 'opacity-50 bg-gray-50 dark:bg-slate-800/30' : ''}`}>
                            {isEditingStudent ? (
                              /* Student Edit Form */
                              <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-gray-800 dark:text-slate-200">Schüler bearbeiten</h4>
                                <div className="grid gap-3 sm:grid-cols-4">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Vorname *</label>
                                    <input type="text" value={studentFirstName} onChange={e => setStudentFirstName(e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Nachname</label>
                                    <input type="text" value={studentLastName} onChange={e => setStudentLastName(e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Dauer</label>
                                    <select value={studentDuration} onChange={e => setStudentDuration(parseInt(e.target.value))}
                                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                                      <option value={60}>60 Min</option>
                                      <option value={90}>90 Min</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Rhythmus</label>
                                    <select value={studentRhythm} onChange={e => setStudentRhythm(e.target.value as 'weekly' | 'biweekly')}
                                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                                      <option value="weekly">Wöchentlich</option>
                                      <option value="biweekly">Zweiwöchentlich</option>
                                    </select>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <button onClick={() => handleUpdateStudent(student.id)} className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700">Speichern</button>
                                  <button onClick={() => { setEditingFamilyId(null); resetForm(); }} className="px-3 py-1.5 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700">Abbrechen</button>
                                </div>
                              </div>
                            ) : (
                              /* Student Display */
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium ${
                                    isInactive
                                      ? 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                                      : student.defaultDuration === 90
                                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                  }`}>
                                    {isInactive ? <UserX size={16} /> : <User size={16} />}
                                  </div>
                                  <div>
                                    <p className={`font-medium ${isInactive ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-900 dark:text-white'}`}>
                                      {student.firstName} {student.lastName || ''}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
                                      <Clock size={12} /> {student.defaultDuration} Min
                                      <span>·</span>
                                      {student.rhythm === 'weekly' ? 'Wöchentlich' : 'Zweiwöchentlich'}
                                      {isInactive && (
                                        <>
                                          <span>·</span>
                                          <span className="text-gray-400 dark:text-gray-500 font-medium">Inaktiv</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  {/* Active/Inactive Toggle */}
                                  <button
                                    onClick={() => handleToggleStudentActive(student.id)}
                                    className={`p-1.5 rounded-lg transition-colors ${
                                      isInactive
                                        ? 'text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30'
                                        : 'text-green-600 hover:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                                    }`}
                                    title={isInactive ? 'Schüler aktivieren' : 'Schüler deaktivieren'}
                                  >
                                    {isInactive ? <UserCheck size={16} /> : <UserX size={16} />}
                                  </button>
                                  <button onClick={() => handleDeleteStudent(student.id, `${student.firstName} ${student.lastName || ''}`)}
                                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors" title="Löschen">
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Add Student Button */}
                  {!isEditingThis && (
                    <div className="px-4 py-3 border-t border-gray-100 dark:border-slate-700">
                      <button onClick={() => { resetForm(); setAddingStudentToFamilyId(family.id); }}
                        className="inline-flex items-center gap-1 text-sm text-green-600 dark:text-green-400 hover:text-green-700 font-medium">
                        <Plus size={16} /> Schüler hinzufügen
                      </button>
                    </div>
                  )}

                  {/* Add Student Form */}
                  {addingStudentToFamilyId === family.id && (
                    <div className="p-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
                      <h4 className="text-sm font-semibold text-gray-800 dark:text-slate-200 mb-3">Neuen Schüler hinzufügen</h4>
                      <div className="grid gap-3 sm:grid-cols-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Vorname *</label>
                          <input type="text" value={studentFirstName} onChange={e => setStudentFirstName(e.target.value)} placeholder="Vorname"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Nachname</label>
                          <input type="text" value={studentLastName} onChange={e => setStudentLastName(e.target.value)} placeholder="Nachname"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Dauer</label>
                          <select value={studentDuration} onChange={e => setStudentDuration(parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                            <option value={60}>60 Min</option>
                            <option value={90}>90 Min</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Rhythmus</label>
                          <select value={studentRhythm} onChange={e => setStudentRhythm(e.target.value as 'weekly' | 'biweekly')}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                            <option value="weekly">Wöchentlich</option>
                            <option value="biweekly">Zweiwöchentlich</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => handleAddStudent(family.id)} disabled={!studentFirstName.trim()}
                          className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed">
                          Schüler hinzufügen
                        </button>
                        <button onClick={() => { setAddingStudentToFamilyId(null); resetForm(); }}
                          className="px-3 py-1.5 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700">
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

        {/* Pagination */}
        {!showAddForm && totalPagesFamilies > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <button onClick={() => setPagination(p => ({ ...p, familyPage: Math.max(1, p.familyPage - 1) }))} disabled={pagination.familyPage === 1}
              className="p-2 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed">
              <ChevronLeft size={20} />
            </button>
            {Array.from({ length: totalPagesFamilies }, (_, i) => (
              <button key={i + 1} onClick={() => setPagination(p => ({ ...p, familyPage: i + 1 }))}
                className={`w-8 h-8 rounded-lg font-medium transition-colors ${
                  pagination.familyPage === i + 1 ? 'bg-green-600 text-white' : 'border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700'
                }`}>
                {i + 1}
              </button>
            ))}
            <button onClick={() => setPagination(p => ({ ...p, familyPage: Math.min(totalPagesFamilies, p.familyPage + 1) }))} disabled={pagination.familyPage === totalPagesFamilies}
              className="p-2 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed">
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </main>
    {/* History Dialog */}
    {historyFamilyId !== null && (function() {
      const family = data?.families?.find(f => f.id === historyFamilyId);
      const credits = family?.credits || [];
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg w-96 max-w-xs p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Guthaben-Historie: {family?.name}</h2>
              <button onClick={() => setHistoryFamilyId(null)} className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">
                <X size={20} />
              </button>
            </div>
            {credits.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-slate-400 py-8">Keine Guthabeneinträge vorhanden.</p>
            ) : (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {credits
                  .slice()
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map(credit => {
                    // Try to extract student name from note (for consumption entries)
                    let studentName = '';
                    if (credit.note && credit.note.includes('Termin ')) {
                      const match = credit.note.match(/Termin ([^ ]+)/);
                      if (match) {
                        const apptId = match[1];
                        const appointment = data?.appointments?.find(a => a.id === apptId);
                        if (appointment?.studentIds[0]) {
                          const student = data?.students?.find(s => s.id === appointment.studentIds[0]);
                          if (student) {
                            studentName = student.firstName + (student.lastName ? ' ' + student.lastName : '');
                          }
                        }
                      }
                    }
                    return (
                      <div key={credit.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`font-semibold ${credit.amount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {credit.amount >= 0 ? '+' : ''}{credit.amount.toFixed(2)} €
                            </span>
                            <span className="text-xs text-gray-500 dark:text-slate-400">
                              {new Date(credit.date).toLocaleDateString('de-DE')}
                            </span>
                            {studentName && (
                              <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                                {studentName}
                              </span>
                            )}
                          </div>
                          {credit.note && (
                            <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">{credit.note}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteCredit(historyFamilyId!, credit.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title="Löschen"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      );
    })()}

    {depositFamilyId !== null && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg w-96 max-w-xs p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Guthaben einzahlen</h2>
          <form onSubmit={(e) => { e.preventDefault(); handleSubmitDeposit(); }}>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Betrag (EUR)</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={depositAmount}
                onChange={e => setDepositAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="z.B. 50.00"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Datum</label>
              <input
                type="date"
                value={depositDate}
                onChange={e => setDepositDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                defaultValue={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Notiz (optional)</label>
              <textarea
                value={depositNote}
                onChange={e => setDepositNote(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={3}
                placeholder="Optional"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setDepositFamilyId(null);
                  setDepositAmount('');
                  setDepositDate('');
                  setDepositNote('');
                }}
                className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={!depositAmount || parseFloat(depositAmount) <= 0}
                className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700"
              >
                Einzahlen
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
    </div>
  );
}
