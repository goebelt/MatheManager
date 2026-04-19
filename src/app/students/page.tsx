/**
 * Students Management Page - List, create, edit students
 */

'use client';

import { useState, useEffect } from 'react';
import {
  User, Plus, Search, Edit2, Trash2, Clock, Users as UsersIcon, Calendar, X
} from 'lucide-react';
import type { Student, Family, DataContainer, PreferredSchedule } from '@/types';
import { DURATION_OPTIONS, RHYTHM_OPTIONS } from '@/lib/constants';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sonntag' },
  { value: 1, label: 'Montag' },
  { value: 2, label: 'Dienstag' },
  { value: 3, label: 'Mittwoch' },
  { value: 4, label: 'Donnerstag' },
  { value: 5, label: 'Freitag' },
  { value: 6, label: 'Samstag' },
];

export default function StudentsPage() {
  const [data, setData] = useState<DataContainer | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state
  const [formFirstName, setFormFirstName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [formFamilyId, setFormFamilyId] = useState('');
  const [formDuration, setFormDuration] = useState(60);
  const [formRhythm, setFormRhythm] = useState<'weekly' | 'biweekly'>('weekly');
  const [formNotes, setFormNotes] = useState('');
  const [formPreferredSchedule, setFormPreferredSchedule] = useState<PreferredSchedule[]>([]);

  // Add schedule form state
  const [newScheduleDay, setNewScheduleDay] = useState<number>(1);
  const [newScheduleTime, setNewScheduleTime] = useState('14:00');

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
    } catch (e) {
      console.error('Error loading data:', e);
    } finally {
      setLoading(false);
    }
  };

  const saveData = (newData: DataContainer) => {
    localStorage.setItem('mathe_manager_data', JSON.stringify(newData));
    setData(newData);
  };

  const handleAddSchedule = () => {
    const newSchedule: PreferredSchedule = {
      dayOfWeek: newScheduleDay,
      time: newScheduleTime,
    };
    setFormPreferredSchedule([...formPreferredSchedule, newSchedule]);
  };

  const handleRemoveSchedule = (index: number) => {
    setFormPreferredSchedule(formPreferredSchedule.filter((_, i) => i !== index));
  };

  const handleAddStudent = () => {
    if (!formFirstName.trim() || !formFamilyId) {
      alert('Bitte Vorname und Familie auswählen');
      return;
    }

    const newStudent: Student = {
      id: `student-${Date.now()}`,
      familyId: formFamilyId,
      firstName: formFirstName.trim(),
      lastName: formLastName.trim() || undefined,
      notes: formNotes.trim(),
      defaultDuration: formDuration,
      rhythm: formRhythm,
      preferredSchedule: formPreferredSchedule.length > 0 ? formPreferredSchedule : undefined,
    };

    const updatedData: DataContainer = data || {
      families: [],
      students: [],
      priceEntries: [],
      appointments: [],
      lastUpdated: new Date().toISOString(),
    };
    updatedData.students = [...(updatedData.students || []), newStudent];
    updatedData.lastUpdated = new Date().toISOString();

    saveData(updatedData);
    resetForm();
    setShowAddForm(false);
    alert('Schüler wurde erstellt!');
  };

  const handleUpdateStudent = () => {
    if (!formFirstName.trim() || !formFamilyId || !editingStudentId) {
      alert('Bitte Vorname und Familie auswählen');
      return;
    }

    const updatedStudents = (data?.students || []).map(student =>
      student.id === editingStudentId
        ? { ...student, firstName: formFirstName.trim(), lastName: formLastName.trim() || undefined, familyId: formFamilyId, notes: formNotes.trim(), defaultDuration: formDuration, rhythm: formRhythm, preferredSchedule: formPreferredSchedule.length > 0 ? formPreferredSchedule : undefined }
        : student
    );

    const updatedData: DataContainer = data || {
      families: [],
      students: [],
      priceEntries: [],
      appointments: [],
      lastUpdated: new Date().toISOString(),
    };
    updatedData.students = updatedStudents;
    updatedData.lastUpdated = new Date().toISOString();

    saveData(updatedData);
    setEditingStudentId(null);
    resetForm();
    alert('Schüler wurde aktualisiert!');
  };

  const handleDeleteStudent = (studentId: string, name: string) => {
    if (!confirm(`Schüler "${name}" wirklich löschen? Zugehörige Termine bleiben erhalten.`)) return;

    const updatedData: DataContainer = data || {
      families: [],
      students: [],
      priceEntries: [],
      appointments: [],
      lastUpdated: new Date().toISOString(),
    };
    updatedData.students = (updatedData.students || []).filter(s => s.id !== studentId);
    updatedData.lastUpdated = new Date().toISOString();

    saveData(updatedData);
    if (editingStudentId === studentId) {
      setEditingStudentId(null);
    }
  };

  const handleEditStudent = (student: Student) => {
    setFormFirstName(student.firstName);
    setFormLastName(student.lastName || '');
    setFormFamilyId(student.familyId);
    setFormDuration(student.defaultDuration);
    setFormRhythm(student.rhythm);
    setFormNotes(student.notes || '');
    setFormPreferredSchedule(student.preferredSchedule || []);
    setEditingStudentId(student.id);
    setShowAddForm(false);
  };

  const resetForm = () => {
    setFormFirstName('');
    setFormLastName('');
    setFormFamilyId('');
    setFormDuration(60);
    setFormRhythm('weekly');
    setFormNotes('');
    setFormPreferredSchedule([]);
    setNewScheduleDay(1);
    setNewScheduleTime('14:00');
  };

  const getFamilyForStudent = (studentId: string): Family | undefined => {
    return (data?.families || []).find(f => f.id === (data?.students || []).find(s => s.id === studentId)?.familyId);
      
  };

  // Filter students by search term
  const filteredStudents = (data?.students || []).filter(student =>
    student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.lastName && student.lastName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <p className="text-gray-500 dark:text-slate-400 animate-pulse">Lade Schüler...</p>
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
                <User className="w-6 h-6 text-green-600" />
                Schülerverwaltung
              </h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                Verwalte alle Schüler und deren Einstellungen
              </p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowAddForm(true);
                setEditingStudentId(null);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus size={18} />
              Neuer Schüler
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

          {/* Stats */}
          <div className="flex gap-4 mt-4">
            <div className="px-3 py-1.5 bg-gray-100 dark:bg-slate-700 rounded-lg text-sm">
              <span className="font-semibold">{data?.students?.length || 0}</span>{' '}
              <span className="text-gray-500 dark:text-slate-400">Schüler</span>
            </div>
            <div className="px-3 py-1.5 bg-gray-100 dark:bg-slate-700 rounded-lg text-sm">
              <span className="font-semibold">
                {(data?.students || []).filter(s => s.defaultDuration === 90).length}
              </span>{' '}
              <span className="text-gray-500 dark:text-slate-400">90-Min</span>
            </div>
            <div className="px-3 py-1.5 bg-gray-100 dark:bg-slate-700 rounded-lg text-sm">
              <span className="font-semibold">
                {(data?.students || []).filter(s => s.rhythm === 'weekly').length}
              </span>{' '}
              <span className="text-gray-500 dark:text-slate-400">Wöchentlich</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Add/Edit Student Form */}
        {(showAddForm || editingStudentId) && (
          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {editingStudentId ? 'Schüler bearbeiten' : 'Neuen Schüler anlegen'}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Vorname *
                </label>
                <input
                  type="text"
                  value={formFirstName}
                  onChange={e => setFormFirstName(e.target.value)}
                  placeholder="Max"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Nachname
                </label>
                <input
                  type="text"
                  value={formLastName}
                  onChange={e => setFormLastName(e.target.value)}
                  placeholder="Mueller"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Familie *
                </label>
                <select
                  value={formFamilyId}
                  onChange={e => setFormFamilyId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Familie auswählen...</option>
                  {(data?.families || []).map(family => (
                    <option key={family.id} value={family.id}>
                      {family.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Dauer (Minuten)
                </label>
                <select
                  value={formDuration}
                  onChange={e => setFormDuration(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value={60}>60 Minuten</option>
                  <option value={90}>90 Minuten</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Rhythmus
                </label>
                <select
                  value={formRhythm}
                  onChange={e => setFormRhythm(e.target.value as 'weekly' | 'biweekly')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="weekly">Wöchentlich</option>
                  <option value="biweekly">Zweiwöchentlich</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Notizen
                </label>
                <textarea
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="Zusätzliche Informationen..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Preferred Schedule */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                <Calendar size={16} />
                Bevorzugte Termine (für automatische Planung)
              </h3>
              
              {/* Add Schedule Form */}
              <div className="flex gap-2 mb-3">
                <select
                  value={newScheduleDay}
                  onChange={e => setNewScheduleDay(parseInt(e.target.value))}
                  className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {DAYS_OF_WEEK.map(day => (
                    <option key={day.value} value={day.value}>{day.label}</option>
                  ))}
                </select>
                <input
                  type="time"
                  value={newScheduleTime}
                  onChange={e => setNewScheduleTime(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  onClick={handleAddSchedule}
                  className="px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Schedule List */}
              {formPreferredSchedule.length > 0 ? (
                <div className="space-y-2">
                  {formPreferredSchedule.map((schedule, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-slate-700/50 rounded-lg text-sm"
                    >
                      <span className="text-gray-700 dark:text-slate-300">
                        {DAYS_OF_WEEK.find(d => d.value === schedule.dayOfWeek)?.label} um {schedule.time}
                      </span>
                      <button
                        onClick={() => handleRemoveSchedule(index)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  Keine bevorzugten Termine angegeben
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingStudentId(null);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={editingStudentId ? handleUpdateStudent : handleAddStudent}
                disabled={!formFirstName.trim() || !formFamilyId}
                className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingStudentId ? 'Aktualisieren' : 'Speichern'}
              </button>
            </div>
          </div>
        )}

        {/* Students List */}
        {filteredStudents.length === 0 ? (
          <div className="text-center py-16">
            <User className="w-16 h-16 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Noch keine Schüler angelegt
            </h2>
            <p className="text-gray-500 dark:text-slate-400 mb-6">
              Erstelle deinen ersten Schüler um loszulegen.
            </p>
            <button
              onClick={() => {
                resetForm();
                setShowAddForm(true);
                setEditingStudentId(null);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus size={18} />
              Ersten Schüler anlegen
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredStudents.map(student => {
              const family = (data?.families || []).find(f => f.id === student.familyId);
              const isEditing = editingStudentId === student.id;

              return (
                <div
                  key={student.id}
                  className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden"
                >
                  <div className="px-4 py-3 bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium ${
                        student.defaultDuration === 90
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                      }`}>
                        <User size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {student.firstName} {student.lastName || ''}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
                          {family && <span className="flex items-center gap-1"><UsersIcon size={12} />{family.name}</span>}
                          <span className="flex items-center gap-1"><Clock size={12} />{student.defaultDuration} Min</span>
                          <span>·</span>
                          <span>{student.rhythm === 'weekly' ? 'Wöchentlich' : 'Zweiwöchentlich'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditStudent(student)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        title="Bearbeiten"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteStudent(student.id, `${student.firstName} ${student.lastName || ''}`)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="Löschen"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Preferred Schedule Display */}
                  {student.preferredSchedule && student.preferredSchedule.length > 0 && (
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-slate-400 mb-2">
                        <Calendar size={14} />
                        <span className="font-medium">Bevorzugte Termine:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {student.preferredSchedule.map((schedule, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md text-xs"
                          >
                            {DAYS_OF_WEEK.find(d => d.value === schedule.dayOfWeek)?.label} {schedule.time}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {student.notes && (
                    <div className="p-4 text-sm text-gray-600 dark:text-slate-400">
                      <strong>Notizen:</strong> {student.notes}
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