/**
 * Appointments Management Page - Create, edit, delete appointments
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Calendar, Plus, Edit2, Trash2, X, ChevronLeft, ChevronRight,
  Clock, User, Save, AlertCircle, Sparkles, Check, AlertTriangle, CheckCircle
} from 'lucide-react';
import type { Student, Appointment, DataContainer } from '@/types';

export default function AppointmentsPage() {
  const [data, setData] = useState<DataContainer | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddForm, setShowAddForm] = useState(false);
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

  // Student dropdown states
  const [studentDropdownOpen, setStudentDropdownOpen] = useState(false);
  const [studentFilter, setStudentFilter] = useState('');

  useEffect(() => {
    loadData();
  }, []);

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

  const handleAutoSchedule = () => {
    if (autoScheduleStudentIds.length === 0) {
      alert('Bitte mindestens einen Schüler auswählen');
      return;
    }

    const selectedStudents = (data?.students || []).filter(s => autoScheduleStudentIds.includes(s.id));
    const newAppointments: Appointment[] = [];
    const startDate = new Date(currentDate);
    startDate.setHours(0, 0, 0, 0);

    selectedStudents.forEach(student => {
      // Use preferred schedule if available, otherwise find usual weekday from existing appointments
      let preferredSchedules = student.preferredSchedule || [];
      
      if (preferredSchedules.length > 0) {
        // Use all preferred schedules
        preferredSchedules.forEach(schedule => {
          for (let week = 0; week < autoScheduleWeeks; week++) {
            const appointmentDate = new Date(startDate);
            appointmentDate.setDate(startDate.getDate() + (week * 7));
            
            // Adjust to the preferred weekday
            const currentDay = appointmentDate.getDay() || 7; // Sunday = 7
            const dayDiff = schedule.dayOfWeek - currentDay;
            appointmentDate.setDate(appointmentDate.getDate() + dayDiff);

            // Check if this is the right week for biweekly students
            if (student.rhythm === 'biweekly') {
              const weekNumber = getWeekNumberForDate(appointmentDate);
              if (weekNumber % 2 !== 0) continue; // Skip odd weeks for biweekly
            }

            // Check if appointment already exists
            // Create date in local timezone to avoid UTC offset issues
            const localDate = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate());
            const dateStr = localDate.toISOString().split('T')[0];
            const existing = (data?.appointments || []).find(
              a => a.date === dateStr && a.studentIds.includes(student.id)
            );
            if (existing) continue;

            newAppointments.push({
              id: `appointment-${Date.now()}-${week}-${student.id}-${schedule.dayOfWeek}`,
              studentIds: [student.id],
              date: dateStr,
              time: schedule.time,
              duration: student.defaultDuration,
              status: 'planned',
            });
          }
        });
      } else {
        // Find the student's usual weekday from existing appointments
        let usualWeekday = 1; // Default to Monday
        let usualTime = '09:00';
        
        const studentAppts = (data?.appointments || []).filter(a => a.studentIds.includes(student.id));
        if (studentAppts.length > 0) {
          const weekdayCount: Record<number, number> = {};
          studentAppts.forEach(appt => {
            const d = new Date(appt.date);
            const wd = d.getDay() || 7; // Sunday = 7
            weekdayCount[wd] = (weekdayCount[wd] || 0) + 1;
          });
          let best = 1, bestCount = 0;
          Object.entries(weekdayCount).forEach(([wd, count]) => {
            if (count > bestCount) { bestCount = count; best = parseInt(wd); }
          });
          usualWeekday = best;
        }

        // Generate appointments for the specified number of weeks
        for (let week = 0; week < autoScheduleWeeks; week++) {
          const appointmentDate = new Date(startDate);
          appointmentDate.setDate(startDate.getDate() + (week * 7));
          
          // Adjust to the student's usual weekday
          const currentDay = appointmentDate.getDay() || 7;
          const dayDiff = usualWeekday - currentDay;
          appointmentDate.setDate(appointmentDate.getDate() + dayDiff);

          // Check if this is the right week for biweekly students
          if (student.rhythm === 'biweekly') {
            const weekNumber = getWeekNumberForDate(appointmentDate);
            if (weekNumber % 2 !== 0) continue; // Skip odd weeks for biweekly
          }

          // Check if appointment already exists
          // Create date in local timezone to avoid UTC offset issues
          const localDate = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate());
          const dateStr = localDate.toISOString().split('T')[0];
          const existing = (data?.appointments || []).find(
            a => a.date === dateStr && a.studentIds.includes(student.id)
          );
          if (existing) continue;

          newAppointments.push({
            id: `appointment-${Date.now()}-${week}-${student.id}`,
            studentIds: [student.id],
            date: dateStr,
            time: usualTime,
            duration: student.defaultDuration,
            status: 'planned',
          });
        }
      }
    });

    if (newAppointments.length === 0) {
      alert('Keine neuen Termine erstellt (alle existieren bereits)');
      return;
    }

    const updatedData: DataContainer = data || {
      families: [],
      students: [],
      priceEntries: [],
      appointments: [],
      lastUpdated: new Date().toISOString(),
    };
    updatedData.appointments = [...(updatedData.appointments || []), ...newAppointments];
    updatedData.lastUpdated = new Date().toISOString();

    saveData(updatedData);
    setShowAutoSchedule(false);
    setAutoScheduleStudentIds([]);
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

    const updatedData: DataContainer = data || {
      families: [],
      students: [],
      priceEntries: [],
      appointments: [],
      lastUpdated: new Date().toISOString(),
    };
    updatedData.appointments = [...(updatedData.appointments || []), newAppointment];
    updatedData.lastUpdated = new Date().toISOString();

    saveData(updatedData);
    resetForm();
    setShowAddForm(false);
    alert('Termin wurde erstellt!');
  };

  const handleUpdateAppointment = () => {
    if (!formDate || formStudentIds.length === 0 || !editingAppointmentId) {
      alert('Bitte Datum und mindestens einen Schüler auswählen');
      return;
    }

    const updatedAppointments = (data?.appointments || []).map(appointment =>
      appointment.id === editingAppointmentId
        ? { ...appointment, date: formDate, time: formTime, duration: formDuration, studentIds: formStudentIds, status: formStatus }
        : appointment
    );

    const updatedData: DataContainer = data || {
      families: [],
      students: [],
      priceEntries: [],
      appointments: [],
      lastUpdated: new Date().toISOString(),
    };
    updatedData.appointments = updatedAppointments;
    updatedData.lastUpdated = new Date().toISOString();

    saveData(updatedData);
    setEditingAppointmentId(null);
    resetForm();
    alert('Termin wurde aktualisiert!');
  };

  const handleDeleteAppointment = (appointmentId: string) => {
    if (!confirm('Termin wirklich löschen?')) return;

    const updatedData: DataContainer = data || {
      families: [],
      students: [],
      priceEntries: [],
      appointments: [],
      lastUpdated: new Date().toISOString(),
    };
    updatedData.appointments = (updatedData.appointments || []).filter(a => a.id !== appointmentId);
    updatedData.lastUpdated = new Date().toISOString();

    saveData(updatedData);
    if (editingAppointmentId === appointmentId) {
      setEditingAppointmentId(null);
    }
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setFormDate(appointment.date);
    setFormTime(appointment.time || '09:00');
    setFormDuration(appointment.duration);
    setFormStudentIds(appointment.studentIds);
    setFormStatus(appointment.status);
    setEditingAppointmentId(appointment.id);
    setShowAddForm(false);
  };

  const resetForm = () => {
    setFormDate('');
    setFormTime('09:00');
    setFormDuration(60);
    setFormStudentIds([]);
    setFormStatus('attended');
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

  // Sort by date and time
  filteredAppointments.sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return (a.time || '').localeCompare(b.time || '');
  });

  const handlePreviousWeek = () => {
    setCurrentDate(prev => {
      const date = new Date(prev);
      date.setDate(date.getDate() - 7);
      return date;
    });
  };

  const handleNextWeek = () => {
    setCurrentDate(prev => {
      const date = new Date(prev);
      date.setDate(date.getDate() + 7);
      return date;
    });
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getWeekNumber = (date: Date): number => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  const getWeekNumberForDate = (date: Date): number => {
    return getWeekNumber(date);
  };

  // Calculate conflict status for an appointment
  const getAppointmentStatus = (appointment: Appointment, allAppointments: Appointment[]): 'ok' | 'conflict' | 'tight' => {
    // Skip conflict detection for canceled appointments
    if (appointment.status.startsWith('canceled')) {
      return 'ok';
    }

    if (!appointment.time) return 'ok';

    // Get all non-canceled appointments on the same day
    const sameDayAppointments = allAppointments.filter(app => 
      app.date === appointment.date && 
      app.time &&
      !app.status.startsWith('canceled')
    );
    
    // Sort by time
    sameDayAppointments.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    
    // Find the index of the current appointment
    const currentIndex = sameDayAppointments.findIndex(app => app.id === appointment.id);
    
    // If it's the first appointment, no conflict
    if (currentIndex <= 0) return 'ok';
    
    // Get the previous appointment
    const previousAppointment = sameDayAppointments[currentIndex - 1];
    if (!previousAppointment.time) return 'ok';
    
    // Calculate end time of previous appointment
    const prevEndTime = addMinutes(previousAppointment.time, previousAppointment.duration);
    
    // Check for conflict
    if (appointment.time < prevEndTime) {
      return 'conflict';
    }
    
    // Check for tight schedule (no pause or less than 5 minutes)
    const prevEndTimePlus5 = addMinutes(prevEndTime, 5);
    if (appointment.time <= prevEndTimePlus5) {
      return 'tight';
    }
    
    return 'ok';
  };

  // Helper function to add minutes to a time string
  const addMinutes = (time: string, minutes: number): string => {
    const [hours, mins] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMins = totalMinutes % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <p className="text-gray-500 dark:text-slate-400 animate-pulse">Lade Termine...</p>
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
                <Calendar className="w-6 h-6 text-green-600" />
                Terminplan
              </h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                Verwalte deine Termine
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAutoSchedule(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Sparkles size={18} />
                Auto-Plan
              </button>
              <button
                onClick={() => {
                  resetForm();
                  setShowAddForm(true);
                  setEditingAppointmentId(null);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus size={18} />
                Neuer Termin
              </button>
            </div>
          </div>

          {/* Week Navigation */}
          <div className="flex items-center justify-between mt-4">
            <button
              onClick={handlePreviousWeek}
              className="p-2 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                KW {getWeekNumber(currentDate)}
              </p>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                {weekStart.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })} - {weekEnd.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </p>
            </div>
            <button
              onClick={handleNextWeek}
              className="p-2 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700"
            >
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
              <Sparkles size={20} className="text-blue-600" />
              Termine automatisch planen
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Anzahl Wochen
                </label>
                <input
                  type="number"
                  value={autoScheduleWeeks}
                  onChange={e => setAutoScheduleWeeks(parseInt(e.target.value) || 4)}
                  min={1}
                  max={52}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Schüler auswählen *
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {/* Select All Checkbox */}
                  <label className="flex items-center gap-2 p-2 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer bg-gray-50 dark:bg-slate-700/30">
                    <input
                      type="checkbox"
                      checked={autoScheduleStudentIds.length === (data?.students || []).length && (data?.students || []).length > 0}
                      onChange={e => {
                        if (e.target.checked) {
                          setAutoScheduleStudentIds((data?.students || []).map(s => s.id));
                        } else {
                          setAutoScheduleStudentIds([]);
                        }
                      }}
                      className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Alle auswählen
                    </span>
                  </label>
                  {(data?.students || []).map(student => (
                    <label key={student.id} className="flex items-center gap-2 p-2 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoScheduleStudentIds.includes(student.id)}
                        onChange={e => {
                          if (e.target.checked) {
                            setAutoScheduleStudentIds([...autoScheduleStudentIds, student.id]);
                          } else {
                            setAutoScheduleStudentIds(autoScheduleStudentIds.filter(id => id !== student.id));
                          }
                        }}
                        className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                      />
                      <span className="text-sm text-gray-900 dark:text-white">
                        {student.firstName} {student.lastName || ''}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-slate-400 ml-auto">
                        {student.rhythm === 'weekly' ? 'Wöchentlich' : 'Zweiwöchentlich'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowAutoSchedule(false);
                  setAutoScheduleStudentIds([]);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleAutoSchedule}
                disabled={autoScheduleStudentIds.length === 0}
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles size={16} className="inline mr-1" />
                Planen
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Add/Edit Appointment Form */}
        {(showAddForm || editingAppointmentId) && (
          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {editingAppointmentId ? 'Termin bearbeiten' : 'Neuen Termin anlegen'}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Datum *
                </label>
                <input
                  type="date"
                  value={formDate}
                  onChange={e => setFormDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Uhrzeit *
                </label>
                <input
                  type="time"
                  value={formTime}
                  onChange={e => setFormTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
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
                  Status
                </label>
                <select
                  value={formStatus}
                  onChange={e => setFormStatus(e.target.value as 'attended' | 'canceled_paid' | 'canceled_free' | 'planned')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="planned">Geplant</option>
                  <option value="planned">Geplant</option>
                  <option value="attended">Besucht</option>
                  <option value="canceled_paid">Abgesagt (bezahlt)</option>
                  <option value="canceled_free">Abgesagt (kostenlos)</option>
                </select>
              </div>
              <div className="sm:col-span-2 student-dropdown-container">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Schüler *
                </label>
                <div className="relative">
                  {/* Selected students display */}
                  <div
                    onClick={() => setStudentDropdownOpen(!studentDropdownOpen)}
                    className="min-h-[42px] px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {formStudentIds.length === 0 ? (
                      <span className="text-gray-500 dark:text-slate-400 text-sm">
                        Schüler auswählen...
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {formStudentIds.map(id => {
                          const student = (data?.students || []).find(s => s.id === id);
                          if (!student) return null;
                          return (
                            <span
                              key={id}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-sm"
                            >
                              {student.firstName} {student.lastName || ''}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFormStudentIds(formStudentIds.filter(sid => sid !== id));
                                }}
                                className="hover:text-blue-900 dark:hover:text-blue-100"
                              >
                                <X size={14} />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Dropdown with filter */}
                  {studentDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg shadow-lg max-h-60 overflow-hidden">
                      {/* Filter input */}
                      <div className="p-2 border-b border-gray-200 dark:border-slate-700">
                        <input
                          type="text"
                          placeholder="Nach Schüler oder Familie filtern..."
                          value={studentFilter}
                          onChange={e => setStudentFilter(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          autoFocus
                        />
                      </div>

                      {/* Student list */}
                      <div className="max-h-48 overflow-y-auto">
                        {getFilteredStudents().length === 0 ? (
                          <div className="p-4 text-center text-gray-500 dark:text-slate-400 text-sm">
                            Keine Schüler gefunden
                          </div>
                        ) : (
                          getFilteredStudents().map(student => {
                            const familyName = getFamilyForStudent(student.id);
                            const isSelected = formStudentIds.includes(student.id);
                            return (
                              <button
                                key={student.id}
                                onClick={() => {
                                  if (isSelected) {
                                    setFormStudentIds(formStudentIds.filter(id => id !== student.id));
                                  } else {
                                    setFormStudentIds([...formStudentIds, student.id]);
                                  }
                                }}
                                className={`w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors ${
                                  isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                                      isSelected ? 'bg-green-600 border-green-600 text-white' : 'border-gray-300 dark:border-slate-600'
                                    }`}>
                                      {isSelected && <Check size={12} />}
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        {student.firstName} {student.lastName || ''}
                                      </span>
                                      {familyName && (
                                        <span className="text-xs text-gray-500 dark:text-slate-400">
                                          {familyName}
                                        </span>
                                      )}
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
            </div>
            <div className="flex justify-end gap-2 mt-6">
              {editingAppointmentId && (
                <button
                  onClick={() => {
                    if (confirm('Möchtest du diesen Termin wirklich löschen?')) {
                      handleDeleteAppointment(editingAppointmentId);
                      setShowAddForm(false);
                      setEditingAppointmentId(null);
                      resetForm();
                    }
                  }}
                  className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 size={16} className="inline mr-1" />
                  Löschen
                </button>
              )}
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingAppointmentId(null);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={editingAppointmentId ? handleUpdateAppointment : handleAddAppointment}
                disabled={!formDate || formStudentIds.length === 0}
                className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={16} className="inline mr-1" />
                {editingAppointmentId ? 'Aktualisieren' : 'Speichern'}
              </button>
            </div>
          </div>
        )}

        {/* Appointments List - Calendar View */}
        {filteredAppointments.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="w-16 h-16 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Keine Termine für diese Woche
            </h2>
            <p className="text-gray-500 dark:text-slate-400 mb-6">
              Erstelle deinen ersten Termin um loszulegen.
            </p>
            <button
              onClick={() => {
                resetForm();
                setShowAddForm(true);
                setEditingAppointmentId(null);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus size={18} />
              Ersten Termin anlegen
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-4">
            {(() => {
              const weekDays = [
                { name: 'Montag', day: 1 },
                { name: 'Dienstag', day: 2 },
                { name: 'Mittwoch', day: 3 },
                { name: 'Donnerstag', day: 4 },
                { name: 'Freitag', day: 5 },
                { name: 'Samstag', day: 6 },
                { name: 'Sonntag', day: 0 },
              ];

              return weekDays.map((weekDay) => {
                const dayAppointments = filteredAppointments.filter(appointment => {
                  const appointmentDate = new Date(appointment.date);
                  const dayOfWeek = appointmentDate.getDay();
                  return dayOfWeek === weekDay.day;
                });

                return (
                  <div key={weekDay.day} className="space-y-3">
                    <div className="text-center font-semibold text-gray-700 dark:text-slate-300 pb-2 border-b border-gray-200 dark:border-slate-700">
                      {weekDay.name}
                    </div>
                    {dayAppointments.length === 0 ? (
                      <div className="text-center py-8 text-gray-400 dark:text-slate-500 text-sm">
                        Keine Termine
                      </div>
                    ) : (
                      dayAppointments.map(appointment => {
                        const students = getStudentsForAppointment(appointment.studentIds);
                        const isEditing = editingAppointmentId === appointment.id;
                        const status = getAppointmentStatus(appointment, filteredAppointments);

                        return (
                          <div
                            key={appointment.id}
                            className={`bg-white dark:bg-slate-800 border rounded-xl shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow ${
                              appointment.status.startsWith('canceled') ? 'border-gray-300 dark:border-slate-600 opacity-60' :
                              status === 'conflict' ? 'border-red-500 dark:border-red-500' :
                              status === 'tight' ? 'border-yellow-500 dark:border-yellow-500' :
                              'border-gray-200 dark:border-slate-700'
                            }`}
                            onClick={() => handleEditAppointment(appointment)}
                          >
                            <div className={`px-3 py-2 border-b flex items-center justify-between ${
                              appointment.status.startsWith('canceled') ? 'bg-gray-50 dark:bg-slate-700/50 border-gray-200 dark:border-slate-700' :
                              'bg-gray-50 dark:bg-slate-700/50 border-gray-200 dark:border-slate-700'
                            }`}>
                              <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                  appointment.status.startsWith('canceled') ? 'bg-gray-200 dark:bg-slate-600 text-gray-500' :
                                  'bg-green-100 dark:bg-green-900/30 text-green-600'
                                }`}>
                                  <Clock size={16} />
                                </div>
                                <div className="flex items-center gap-2">
                                  <h3 className={`font-semibold text-sm ${
                                    appointment.status.startsWith('canceled') ? 'text-gray-500 dark:text-gray-400' :
                                    'text-gray-900 dark:text-white'
                                  }`}>
                                    {appointment.time || '--:--'}
                                  </h3>
                                  {!appointment.status.startsWith('canceled') && (
                                    <>
                                      {status === 'conflict' && (
                                        <span title="Konflikt mit Vorgängertermin">
                                          <AlertTriangle size={14} className="text-red-500" />
                                        </span>
                                      )}
                                      {status === 'tight' && (
                                        <span title="Keine Pause zum Vorgängertermin">
                                          <AlertTriangle size={14} className="text-yellow-500" />
                                        </span>
                                      )}
                                      {status === 'ok' && (
                                        <span title="Termin passt">
                                          <CheckCircle size={14} className="text-green-500" />
                                        </span>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className={`flex items-center gap-1 text-xs ${
                                appointment.status.startsWith('canceled') ? 'text-gray-400 dark:text-gray-500' :
                                'text-gray-500 dark:text-slate-400'
                              }`}>
                                <span>{appointment.duration} Min</span>
                                <span>·</span>
                                <span className={
                                  appointment.status === 'attended' ? 'text-green-600' :
                                  appointment.status === 'canceled_paid' ? 'text-orange-600' :
                                  appointment.status === 'canceled_free' ? 'text-red-600' :
                                  'text-blue-600'
                                }>
                                  {appointment.status === 'attended' ? 'Besucht' :
                                   appointment.status === 'canceled_paid' ? 'Abgesagt (bezahlt)' :
                                   appointment.status === 'canceled_free' ? 'Abgesagt (kostenlos)' :
                                   'Geplant'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                {appointment.status === 'planned' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteAppointment(appointment.id);
                                    }}
                                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                    title="Löschen"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className={`p-3 ${appointment.status.startsWith('canceled') ? 'opacity-60' : ''}`}>
                              <div className="flex items-center gap-2 mb-2">
                                <User size={14} className={`text-gray-500 ${appointment.status.startsWith('canceled') ? 'text-gray-400' : ''}`} />
                                <span className={`text-xs font-medium ${
                                  appointment.status.startsWith('canceled') ? 'text-gray-400 dark:text-gray-500' :
                                  'text-gray-700 dark:text-slate-300'
                                }`}>
                                  {students.length} Schüler:
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {students.map(student => (
                                  <span
                                    key={student.id}
                                    className={`px-2 py-0.5 rounded text-xs ${
                                      appointment.status.startsWith('canceled') 
                                        ? 'bg-gray-100 dark:bg-slate-600 text-gray-400 dark:text-gray-500' 
                                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                    }`}
                                  >
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
        )}
      </main>
    </div>
  );
}