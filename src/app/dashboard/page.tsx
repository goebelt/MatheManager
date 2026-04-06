/**
 * Dashboard Page - Terminverwaltung mit Wochenübersicht und Auto-Vorschlägen
 */

import { useState, useEffect } from 'react';
import type { Student, Appointment, DataContainer } from '@/types';
import { DashboardHeader } from '@/components/DashboardHeader';
import { WeekView } from '@/components/WeekView';

export default function DashboardPage() {
  const [data, setData] = useState<DataContainer | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Load data on mount and when date changes (for new week)
  useEffect(() => {
    loadData();

    const interval = setInterval(() => {
      loadData();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [currentDate]);

  const loadData = () => {
    setLoading(true);
    try {
      const loadedData = JSON.parse(localStorage.getItem('mathe_manager_data') || '{}');
      if (loadedData && loadedData.students) {
        setData(loadedData as DataContainer);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = (appointmentId: string, newStatus: 'attended' | 'canceled_paid' | 'canceled_free') => {
    // Update in localStorage and UI
    if (!data) return;

    const updatedAppointments = data.appointments.map(appointment =>
      appointment.id === appointmentId
        ? { ...appointment, status: newStatus }
        : appointment
    );

    const updatedData = {
      ...data,
      appointments: updatedAppointments,
      lastUpdated: new Date().toISOString()
    };

    localStorage.setItem('mathe_manager_data', JSON.stringify(updatedData));
    setData(updatedData);
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Lade Termine...</p>
      </div>
    );
  }

  if (!data || !data.students) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Willkommen bei MatheManager</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Bitte erstelle einige Schüler oder lade bestehende Daten aus dem LocalStorage.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <DashboardHeader
        currentDate={currentDate}
        onPreviousWeek={handlePreviousWeek}
        onNextWeek={handleNextWeek}
      />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Terminverwaltung
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Wähle eine Woche oben, um Termine zu sehen. Automatische Vorschläge basierend auf Schüler-Rhythmus.
          </p>
        </div>

        {/* Week View */}
        <WeekView
          students={data.students as Student[]}
          existingAppointments={(data.appointments || []) as Appointment[]}
        />

        {/* Legend for mobile (simplified) */}
        <div className="sm:hidden mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-2">Legende</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-600"></span>
              <span className="text-gray-700 dark:text-gray-300">Mo-Sa</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-600"></span>
              <span className="text-gray-700 dark:text-gray-300">Sonntag</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}