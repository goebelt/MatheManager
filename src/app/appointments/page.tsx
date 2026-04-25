/**
 * Appointments Management Page - Create, edit, delete appointments
 * Includes clickable placeholder slots and break blockers (e.g. lunch)
 */
'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Calendar, Plus, Edit2, Trash2, X, ChevronLeft, ChevronRight,
  Clock, User, Save, AlertCircle, Sparkles, Check, AlertTriangle, CheckCircle,
  CalendarPlus, Coffee,
} from 'lucide-react';
import type { Student, Appointment, DataContainer, ScheduleSettings } from '@/types';
import {
  addMinutes as addMinutesUtil,
  getWeekNumber as getWeekNumberUtil,
  getAppointmentStatus as getAppointmentStatusUtil,
  formatDateLocal,
  autoPlanStudents,
  generateTimeSlots,
  getBreakBlocks,
  getDefaultScheduleSettings,
  isWeekend,
  type TimeSlot,
  type BreakBlock,
} from '@/lib/scheduling';

export default function AppointmentsPage() {
  const [data, setData] = useState<DataContainer | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Modal state: null = closed, 'new' = create, real id = edit
  const [editingAppointmentId, setEditingAppointmentId] = useState<string | null>(null);

  // Form state
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('09:00');
  const [formDuration, setFormDuration] = useState(60);
  const [formStudentIds, setFormStudentIds] = useState<string[]>([]);
  const [formStatus, setFormStatus] = useState<'attended' | 'canceled_paid' | 'canceled_free' | 'planned'>('attended');

  const [showAutoSchedule, setShowAutoSchedule] = useState(false);
  const [autoScheduleWeeks, setAutoScheduleWeeks] = useState(4);
  const [autoScheduleStudentIds, setAutoScheduleStudentIds] = useState<string[]>([]);
  const [autoScheduleFilter, setAutoScheduleFilter] = useState('');

  // Student dropdown states
  const [studentDropdownOpen, setStudentDropdownOpen] = useState(false);
  const [studentFilter, setStudentFilter] = useState('');

  useEffect(() => { loadData(); }, []);

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
    } catch (e) { console.error('Error loading data:', e); }
    finally { setLoading(false); }
  };

  const saveData = (newData: DataContainer) => {
    localStorage.setItem('mathe_manager_data', JSON.stringify(newData));
    setData(newData);
  };

  const scheduleSettings: ScheduleSettings = data?.scheduleSettings || getDefaultScheduleSettings();

  const handleAutoSchedule = () => {
    if (autoScheduleStudentIds.length === 0) {
      alert('Bitte mindestens einen Schüler auswählen');
      return;
    }
    const selectedStudents = (data?.students || []).filter(s => autoScheduleStudentIds.includes(s.id));
    const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    startDate.setHours(0, 0, 0, 0);
    const newAppointments = autoPlanStudents(selectedStudents, data?.appointments || [], startDate, autoScheduleWeeks);
    if (newAppointments.length === 0) {
      alert('Keine neuen Termine erstellt (alle existieren bereits)');
      return;
    }
    const updatedData: DataContainer = data || { families: [], students: [], priceEntries: [], appointments: [], lastUpdated: new Date().toISOString() };
    updatedData.appointments = [...(updatedData.appointments || []), ...newAppointments];
    updatedData.lastUpdated = new Date().toISOString();
    saveData(updatedData);
    setShowAutoSchedule(false);
    setAutoScheduleStudentIds([]);
    setAutoScheduleFilter('');
    alert(`${newAppointments.length} Termine wurden erstellt!`);
  };

  const handleAddAppointment = () => {
    if (!formDate || formStudentIds.length === 0) {
      alert('Bitte Datum und mindestens einen Schüler auswählen');
      return;
    }
    const newAppointment: Appointment = {
      id: `appointment-${Date.now()}`,
      studentIds: formStudentIds,
      date: formDate,
      time: formTime,
      duration: formDuration,
      status: formStatus,
    };
    const updatedData: DataContainer = data || { families: [], students: [], priceEntries: [], appointments: [], lastUpdated: new Date().toISOString() };
    updatedData.appointments = [...(updatedData.appointments || []), newAppointment];
    updatedData.lastUpdated = new Date().toISOString();
    saveData(updatedData);
    closeModal();
    alert('Termin wurde erstellt!');
  };

  const handleUpdateAppointment = () => {
    if (!formDate || formStudentIds.length === 0 || !editingAppointmentId || editingAppointmentId === 'new') {
      alert('Bitte Datum und mindestens einen Schüler auswählen');
      return;
    }
    const updatedAppointments = (data?.appointments || []).map(appointment =>
      appointment.id === editingAppointmentId
        ? { ...appointment, date: formDate, time: formTime, duration: formDuration, studentIds: formStudentIds, status: formStatus }
        : appointment
    );
    const updatedData: DataContainer = data || { families: [], students: [], priceEntries: [], appointments: [], lastUpdated: new Date().toISOString() };
    updatedData.appointments = updatedAppointments;
    updatedData.lastUpdated = new Date().toISOString();
    saveData(updatedData);
    closeModal();
    alert('Termin wurde aktualisiert!');
  };

  const handleDeleteAppointment = (appointmentId: string) => {
    if (!confirm('Termin wirklich löschen?')) return;
    const updatedData: DataContainer = data || { families: [], students: [], priceEntries: [], appointments: [], lastUpdated: new Date().toISOString() };
    updatedData.appointments = (updatedData.appointments || []).filter(a => a.id !== appointmentId);
    updatedData.lastUpdated = new Date().toISOString();
    saveData(updatedData);
    closeModal();
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setFormDate(appointment.date);
    setFormTime(appointment.time || '09:00');
    setFormDuration(appointment.duration);
    setFormStudentIds(appointment.studentIds);
    setFormStatus(appointment.status);
    setEditingAppointmentId(appointment.id);
  };

  const handleSlotClick = (slot: TimeSlot) => {
    setFormDate(slot.date);
    setFormTime(slot.startTime);
    setFormDuration(slot.duration);
    setFormStudentIds([]);
    setFormStatus('planned');
    setEditingAppointmentId('new');
  };

  const handleNewAppointment = () => {
    resetForm();
    setEditingAppointmentId('new');
  };

  const closeModal = () => {
    setEditingAppointmentId(null);
    resetForm();
  };

  const resetForm = () => {
    setFormDate('');
    setFormTime('09:00');
    setFormDuration(60);
    setFormStudentIds([]);
    setFormStatus('attended');
    setStudentDropdownOpen(false);
    setStudentFilter('');
  };

  const getStudentsForAppointment = (studentIds: string[]): Student[] => {
    return (data?.students || []).filter(s => studentIds.includes(s.id));
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

  // Filter appointments by current week
  const weekStart = new Date(currentDate);
  const day = weekStart.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  weekStart.setDate(weekStart.getDate() + diff);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const filteredAppointments = (data?.appointments || []).filter(appointment => {
    const appointmentDate = new Date(appointment.date);
    return appointmentDate >= weekStart && appointmentDate <= weekEnd;
  });

  filteredAppointments.sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return (a.time || '').localeCompare(b.time || '');
  });

  // Generate placeholder slots for each day of the week
  const weekDaySlotMap = useMemo(() => {
    const map = new Map<string, TimeSlot[]>();
    for (let d = 0; d < 7; d++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + d);
      const dateStr = formatDateLocal(date);
      const isWe = isWeekend(dateStr);
      const start = isWe ? scheduleSettings.weekendStart : scheduleSettings.weekdayStart;
      const end = isWe ? scheduleSettings.weekendEnd : scheduleSettings.weekdayEnd;
      const breakStart = isWe ? scheduleSettings.weekendBreakStart : scheduleSettings.weekdayBreakStart;
      const breakEnd = isWe ? scheduleSettings.weekendBreakEnd : scheduleSettings.weekdayBreakEnd;
      const slots = generateTimeSlots(
        dateStr,
        filteredAppointments,
        start,
        end,
        scheduleSettings.slotDuration,
        scheduleSettings.breakMinutes,
        breakStart || undefined,
        breakEnd || undefined,
      );
      map.set(dateStr, slots);
    }
    return map;
  }, [weekStart, filteredAppointments, scheduleSettings]);

  const handlePreviousWeek = () => {
    setCurrentDate(prev => { const date = new Date(prev); date.setDate(date.getDate() - 7); return date; });
  };
  const handleNextWeek = () => {
    setCurrentDate(prev => { const date = new Date(prev); date.setDate(date.getDate() + 7); return date; });
  };
  const handleCurrentWeek = () => { setCurrentDate(new Date()); };

  const getWeekNumber = getWeekNumberUtil;
  const getAppointmentStatus = getAppointmentStatusUtil;
  const addMinutes = addMinutesUtil;

  const isNewMode = editingAppointmentId === 'new';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <p className="text-gray-500 dark:text-slate-400 animate-pulse">Lade Termine...</p>
      </div>
    );
  }

  type DayItem =
    | { kind: 'appointment'; appointment: Appointment }
    | { kind: 'slot'; slot: TimeSlot }
    | { kind: 'break'; block: BreakBlock };

  /** Reusable student multi-select dropdown */
  const StudentDropdown = () => (
    <div className="student-dropdown-container">
      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1"> Schüler * </label>
      <div className="relative">
        <div
          onClick={() => setStudentDropdownOpen(!studentDropdownOpen)}
          className="min-h-[42px] px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          {formStudentIds.length === 0 ? (
            <span className="text-gray-500 dark:text-slate-400 text-sm"> Schüler auswählen... </span>
          ) : (
            <div className="flex flex-wrap gap-1">
              {formStudentIds.map(id => {
                const student = (data?.students || []).find(s => s.id === id);
                if (!student) return null;
                return (
                  <span key={id} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-sm">
                    {student.firstName} {student.lastName || ''}
                    <button onClick={(e) => { e.stopPropagation(); setFormStudentIds(formStudentIds.filter(sid => sid !== id)); }}
                      className="hover:text-blue-900 dark:hover:text-blue-100"><X size={14} /></button>
                  </span>
                );
              })}
            </div>
          )}
        </div>
        {studentDropdownOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg shadow-lg max-h-60 overflow-hidden">
            <div className="p-2 border-b border-gray-200 dark:border-slate-700">
              <input type="text" placeholder="Nach Schüler oder Familie filtern..." value={studentFilter}
                onChange={e => setStudentFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500" autoFocus />
            </div>
            <div className="max-h-48 overflow-y-auto">
              {getFilteredStudents().length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-slate-400 text-sm"> Keine Schüler gefunden </div>
              ) : (
                getFilteredStudents().map(student => {
                  const familyName = getFamilyForStudent(student.id);
                  const isSelected = formStudentIds.includes(student.id);
                  return (
                    <button key={student.id}
                      onClick={() => {
                        if (isSelected) setFormStudentIds(formStudentIds.filter(id => id !== student.id));
                        else setFormStudentIds([...formStudentIds, student.id]);
                      }}
                      className={`w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'bg-green-600 border-green-600 text-white' : 'border-gray-300 dark:border-slate-600'}`}>
                            {isSelected && <Check size={12} />}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900 dark:text-white"> {student.firstName} {student.lastName || ''} </span>
                            {familyName && <span className="text-xs text-gray-500 dark:text-slate-400"> {familyName} </span>}
                          </div>
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
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-6 h-6 text-green-600" /> Terminplan
              </h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                Verwalte deine Termine
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowAutoSchedule(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
                <Sparkles size={18} /> Auto-Plan
              </button>
              <button onClick={handleNewAppointment}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors">
                <Plus size={18} /> Neuer Termin
              </button>
            </div>
          </div>

          {/* Week Navigation */}
          <div className="flex items-center justify-between mt-4">
            <button onClick={handlePreviousWeek}
              className="p-2 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700"
              title="Vorherige Woche">
              <ChevronLeft size={20} />
            </button>
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900 dark:text-white"> KW {getWeekNumber(currentDate)} </p>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                {weekStart.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })} - {weekEnd.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </p>
              <button onClick={handleCurrentWeek}
                className="mt-2 px-3 py-1.5 text-sm font-medium text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                title="Zur aktuellen Woche springen">
                Aktuelle Woche
              </button>
            </div>
            <button onClick={handleNextWeek}
              className="p-2 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700"
              title="Nächste Woche">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Auto-Schedule Modal */}
      {showAutoSchedule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Sparkles size={20} className="text-blue-600" /> Termine automatisch planen
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1"> Anzahl Wochen </label>
                <input type="number" value={autoScheduleWeeks}
                  onChange={e => setAutoScheduleWeeks(parseInt(e.target.value) || 4)} min={1} max={52}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1"> Schüler auswählen * </label>
                <div className="mb-2">
                  <input type="text" placeholder="Schüler oder Familie suchen..." value={autoScheduleFilter}
                    onChange={e => setAutoScheduleFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  <label className="flex items-center gap-2 p-2 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer bg-gray-50 dark:bg-slate-700/30">
                    <input type="checkbox"
                      checked={autoScheduleStudentIds.length === (data?.students || []).length && (data?.students || []).length > 0}
                      onChange={e => {
                        if (e.target.checked) setAutoScheduleStudentIds((data?.students || []).map(s => s.id));
                        else setAutoScheduleStudentIds([]);
                      }}
                      className="w-4 h-4 text-green-600 rounded focus:ring-green-500" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white"> Alle auswählen </span>
                  </label>
                  {(data?.students || []).filter(student => {
                    const filter = autoScheduleFilter.toLowerCase();
                    const fullName = `${student.firstName} ${student.lastName || ''}`.toLowerCase();
                    const familyName = getFamilyForStudent(student.id).toLowerCase();
                    return fullName.includes(filter) || familyName.includes(filter);
                  }).map(student => (
                    <label key={student.id} className="flex items-center gap-2 p-2 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer">
                      <input type="checkbox"
                        checked={autoScheduleStudentIds.includes(student.id)}
                        onChange={e => {
                          if (e.target.checked) setAutoScheduleStudentIds([...autoScheduleStudentIds, student.id]);
                          else setAutoScheduleStudentIds(autoScheduleStudentIds.filter(id => id !== student.id));
                        }}
                        className="w-4 h-4 text-green-600 rounded focus:ring-green-500" />
                      <div className="flex-1">
                        <span className="text-sm text-gray-900 dark:text-white"> {student.firstName} {student.lastName || ''} </span>
                        {getFamilyForStudent(student.id) && (
                          <span className="text-xs text-gray-500 dark:text-slate-400 ml-2"> ({getFamilyForStudent(student.id)}) </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 dark:text-slate-400 ml-auto">
                        {student.rhythm === 'weekly' ? 'Wöchentlich' : 'Zweiwöchentlich'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => { setShowAutoSchedule(false); setAutoScheduleStudentIds([]); setAutoScheduleFilter(''); }}
                className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                Abbrechen
              </button>
              <button onClick={handleAutoSchedule} disabled={autoScheduleStudentIds.length === 0}
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <Sparkles size={16} className="inline mr-1" /> Planen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Universal Appointment Modal (create + edit) */}
      {editingAppointmentId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              {isNewMode
                ? <><Plus size={20} className="text-green-600" /> Neuen Termin anlegen</>
                : <><Edit2 size={20} className="text-blue-600" /> Termin bearbeiten</>
              }
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1"> Datum * </label>
                <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1"> Uhrzeit * </label>
                <input type="time" value={formTime} onChange={e => setFormTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1"> Dauer (Minuten) </label>
                <select value={formDuration} onChange={e => setFormDuration(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value={60}>60 Minuten</option>
                  <option value={90}>90 Minuten</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1"> Status </label>
                <select value={formStatus} onChange={e => setFormStatus(e.target.value as 'attended' | 'canceled_paid' | 'canceled_free' | 'planned')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="planned">Geplant</option>
                  <option value="attended">Besucht</option>
                  <option value="canceled_paid">Abgesagt (bezahlt)</option>
                  <option value="canceled_free">Abgesagt (kostenlos)</option>
                </select>
              </div>
              <StudentDropdown />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              {!isNewMode && (
                <button onClick={() => { if (confirm('Möchtest du diesen Termin wirklich löschen?')) { handleDeleteAppointment(editingAppointmentId!); } }}
                  className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors">
                  <Trash2 size={16} className="inline mr-1" /> Löschen
                </button>
              )}
              <button onClick={closeModal}
                className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                Abbrechen
              </button>
              <button
                onClick={isNewMode ? handleAddAppointment : handleUpdateAppointment}
                disabled={!formDate || formStudentIds.length === 0}
                className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <Save size={16} className="inline mr-1" /> {isNewMode ? 'Erstellen' : 'Speichern'}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Week Calendar View with Placeholders & Breaks */}
        <div className="grid grid-cols-7 gap-4">
          {(() => {
            const weekDays = [
              { name: 'Montag', day: 1 },
              { name: 'Dienstag', day: 2 },
              { name: 'Mittwoch', day: 3 },
              { name: 'Donnerstag', day: 4 },
              { name: 'Freitag', day: 5 },
              { name: 'Samstag', day: 6 },
              { name: 'Sonntag', day: 7 },
            ];
            return weekDays.map((weekDay) => {
              const dayDate = new Date(weekStart);
              const currentDay = dayDate.getDay() || 7;
              dayDate.setDate(weekStart.getDate() + (weekDay.day - currentDay));
              const dateStr = formatDateLocal(dayDate);

              const dayAppointments = filteredAppointments.filter(a => a.date === dateStr);
              const daySlots = weekDaySlotMap.get(dateStr) || [];
              const dayBreaks = getBreakBlocks(dateStr, scheduleSettings);

              const items: DayItem[] = [
                ...dayAppointments.map(a => ({ kind: 'appointment' as const, appointment: a })),
                ...daySlots.map(s => ({ kind: 'slot' as const, slot: s })),
                ...dayBreaks.map(b => ({ kind: 'break' as const, block: b })),
              ];

              items.sort((a, b) => {
                const timeA = a.kind === 'appointment' ? (a.appointment.time || '99:99') : a.kind === 'break' ? a.block.startTime : a.slot.startTime;
                const timeB = b.kind === 'appointment' ? (b.appointment.time || '99:99') : b.kind === 'break' ? b.block.startTime : b.slot.startTime;
                return timeA.localeCompare(timeB);
              });

              return (
                <div key={weekDay.day} className="space-y-3">
                  <div className="text-center font-semibold text-gray-700 dark:text-slate-300 pb-2 border-b border-gray-200 dark:border-slate-700">
                    {weekDay.name}
                  </div>
                  {items.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 dark:text-slate-500 text-sm">
                      Keine Termine
                    </div>
                  ) : (
                    items.map(item => {
                      if (item.kind === 'break') {
                        /* ── Break Blocker (e.g. Mittagspause) ── */
                        const block = item.block;
                        return (
                          <div key={block.id}
                            className="bg-gray-200 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-xl overflow-hidden">
                            <div className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-300 dark:bg-slate-600 text-gray-600 dark:text-slate-300">
                                  <Coffee size={18} />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-base text-gray-600 dark:text-slate-300">
                                    {block.startTime} – {block.endTime}
                                  </h3>
                                  <p className="text-xs text-gray-500 dark:text-slate-400">
                                    {block.label} • {block.duration} Min
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      if (item.kind === 'slot') {
                        /* ── Placeholder Slot ── */
                        return (
                          <div key={item.slot.id}
                            onClick={() => handleSlotClick(item.slot)}
                            className="bg-white dark:bg-slate-800 border-2 border-dashed border-green-300 dark:border-green-700 rounded-xl shadow-sm cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-400 dark:hover:border-green-500 transition-all overflow-hidden group">
                            <div className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-50 dark:bg-green-900/30 text-green-500 group-hover:bg-green-100 dark:group-hover:bg-green-900/50 transition-colors">
                                  <CalendarPlus size={18} />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-base text-green-700 dark:text-green-400">
                                    {item.slot.startTime} – {item.slot.endTime}
                                  </h3>
                                  <p className="text-xs text-green-600 dark:text-green-500">
                                    Frei • {item.slot.duration} Min
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      /* ── Real Appointment ── */
                      const appointment = item.appointment;
                      const students = getStudentsForAppointment(appointment.studentIds);
                      const status = getAppointmentStatus(appointment, filteredAppointments);
                      return (
                        <div key={appointment.id}
                          className={`bg-white dark:bg-slate-800 border rounded-xl shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow ${
                            appointment.status.startsWith('canceled') ? 'border-gray-300 dark:border-slate-600 opacity-60'
                            : status === 'conflict' ? 'border-red-500 dark:border-red-500'
                            : status === 'tight' ? 'border-yellow-500 dark:border-yellow-500'
                            : 'border-gray-200 dark:border-slate-700'
                          }`}
                          onClick={() => handleEditAppointment(appointment)}>
                          <div className={`px-4 py-3 border-b ${
                            appointment.status.startsWith('canceled') ? 'bg-gray-50 dark:bg-slate-700/50 border-gray-200 dark:border-slate-700'
                            : 'bg-gray-50 dark:bg-slate-700/50 border-gray-200 dark:border-slate-700'
                          }`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                  appointment.status === 'planned' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600'
                                  : appointment.status.startsWith('canceled') ? 'bg-gray-200 dark:bg-slate-600 text-gray-500'
                                  : 'bg-green-100 dark:bg-green-900/30 text-green-600'
                                }`}>
                                  <Clock size={18} />
                                </div>
                                <h3 className={`font-semibold text-base ${
                                  appointment.status.startsWith('canceled') ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'
                                }`}>
                                  {appointment.time || '--:--'}
                                </h3>
                              </div>
                              <div className="flex items-center gap-2">
                                {appointment.status === 'planned' && (
                                  <button onClick={(e) => { e.stopPropagation(); handleDeleteAppointment(appointment.id); }}
                                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors" title="Löschen">
                                    <Trash2 size={18} />
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className={`flex items-center gap-1 text-sm mt-2 ${
                              appointment.status.startsWith('canceled') ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-slate-400'
                            }`}>
                              {!appointment.status.startsWith('canceled') && (
                                <>
                                  {status === 'conflict' && <span title="Konflikt"><AlertTriangle size={16} className="text-red-500" /></span>}
                                  {status === 'tight' && <span title="Keine Pause"><AlertTriangle size={16} className="text-yellow-500" /></span>}
                                  {status === 'ok' && <span title="Termin passt"><CheckCircle size={16} className="text-green-500" /></span>}
                                </>
                              )}
                              <span>{appointment.duration} Min</span>
                            </div>
                            <div className={`text-sm mt-1 ${
                              appointment.status === 'attended' ? 'text-green-600'
                              : appointment.status === 'canceled_paid' ? 'text-orange-600'
                              : appointment.status === 'canceled_free' ? 'text-red-600'
                              : 'text-blue-600'
                            }`}>
                              {appointment.status === 'attended' ? 'Besucht'
                                : appointment.status === 'canceled_paid' ? 'Abgesagt (bezahlt)'
                                : appointment.status === 'canceled_free' ? 'Abgesagt (kostenlos)'
                                : 'Geplant'}
                            </div>
                          </div>
                          <div className={`p-4 ${appointment.status.startsWith('canceled') ? 'opacity-60' : ''}`}>
                            <div className="flex items-center gap-2 mb-2">
                              <User size={16} className={`text-gray-500 ${appointment.status.startsWith('canceled') ? 'text-gray-400' : ''}`} />
                              <span className={`text-sm font-medium ${
                                appointment.status.startsWith('canceled') ? 'text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-slate-300'
                              }`}>
                                {students.length} Schüler:
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {students.map(student => (
                                <span key={student.id} className={`px-2 py-1 rounded text-sm ${
                                  appointment.status.startsWith('canceled') ? 'bg-gray-100 dark:bg-slate-600 text-gray-400 dark:text-gray-500' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                }`}>
                                  {student.firstName} {student.lastName || ''}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              );
            });
          })()}
        </div>
      </main>
    </div>
  );
}
