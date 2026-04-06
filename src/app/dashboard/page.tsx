/**
 * Dashboard Page - Terminverwaltung mit Wochenübersicht und Auto-Vorschlägen
 */

"use client";

import { useState, useEffect } from 'react';
import type { Student, Appointment, DataContainer } from '@/types';
import { DashboardHeader } from '@/components/DashboardHeader';
import { WeekView } from '@/components/WeekView';

export default function DashboardPage() {
  const [data, setData] = useState(DataContainer | null)(null);
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
      appointment.id === appointmentI