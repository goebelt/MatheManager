/**
 * Dashboard Page - Terminverwaltung mit Wochenübersicht und Auto-Vorschlägen
 */

'use client';

import { useState, useEffect } from 'react';
import type { Student, Appointment, DataContainer } from '@/types';
import { DashboardHeader } from '@/components/DashboardHeader';
import { WeekView } from '@/components/WeekView';

export default function DashboardPage() {
  const [data, setData] = useState<DataContainer | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    loadData();

    const interval = setInterval(() => {
      loadData();
    }, 30000);

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
          <p className="text-gray-600 dark:text-gray-400 mb-6">Bitte erstelle einige Schüler oder lade bestehende Daten aus dem LocalStorage.</p>
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
        <WeekView
          appointments={data.appointments || []}
          students={data.students}
          priceEntries={data.priceEntries || []}
          onStatusUpdate={handleStatusUpdate}
          currentDate={currentDate}
        />
      </main>
    </div>
  );
}