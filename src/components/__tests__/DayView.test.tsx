/**
 * @jest-environment jsdom
 */
import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DayView } from '../DayView';
import type { Student, Appointment } from '@/types';

const STUDENTS: Student[] = [
  {
    id: 's1',
    familyId: 'f1',
    firstName: 'Max',
    lastName: 'Müller',
    defaultDuration: 60,
    rhythm: 'weekly',
  },
  {
    id: 's2',
    familyId: 'f1',
    firstName: 'Anna',
    lastName: 'Müller',
    defaultDuration: 60,
    rhythm: 'biweekly',
  },
];

// Use dates that are safe from UTC offset issues (mid-month)
// DayView uses currentDate.toISOString().split('T')[0] to get dateStr
// In UTC+2, a local date of March 16 at 00:00 becomes March 15 22:00 UTC
// So we use midday dates to avoid the offset
const APPOINTMENTS: Appointment[] = [
  {
    id: 'a1',
    studentIds: ['s1'],
    date: '2026-03-16',
    time: '14:00',
    duration: 60,
    status: 'attended',
  },
  {
    id: 'a2',
    studentIds: ['s2'],
    date: '2026-03-16',
    time: '15:00',
    duration: 90,
    status: 'planned',
  },
  // Different day
  {
    id: 'a3',
    studentIds: ['s1'],
    date: '2026-03-17',
    time: '10:00',
    duration: 60,
    status: 'attended',
  },
];

describe('DayView', () => {
  it('renders day header with date', () => {
    // Use midday to avoid UTC date shift
    const date = new Date(2026, 2, 16, 12, 0, 0);
    render(
      <DayView
        students={STUDENTS}
        existingAppointments={APPOINTMENTS}
        currentDate={date}
      />
    );
    expect(screen.getByText(/16\.03\.2026/)).toBeInTheDocument();
  });

  it('shows "Heute" badge for current date', () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0); // midday to avoid UTC shift
    render(
      <DayView
        students={STUDENTS}
        existingAppointments={[]}
        currentDate={today}
      />
    );
    expect(screen.getByText('Heute')).toBeInTheDocument();
  });

  it('does not show "Heute" badge for other dates', () => {
    const date = new Date(2026, 2, 16, 12, 0, 0);
    render(
      <DayView
        students={STUDENTS}
        existingAppointments={[]}
        currentDate={date}
      />
    );
    expect(screen.queryByText('Heute')).not.toBeInTheDocument();
  });

  it('shows empty message when no appointments for the day', () => {
    const date = new Date(2026, 2, 20, 12, 0, 0); // No appointments on March 20
    render(
      <DayView
        students={STUDENTS}
        existingAppointments={APPOINTMENTS}
        currentDate={date}
      />
    );
    expect(screen.getByText('Keine Termine für diesen Tag')).toBeInTheDocument();
  });

  it('renders appointments for the current day', () => {
    // DayView filters by dateStr = currentDate.toISOString().split('T')[0]
    // With midday local time, toISOString() gives the correct UTC date
    const date = new Date(2026, 2, 16, 12, 0, 0);
    render(
      <DayView
        students={STUDENTS}
        existingAppointments={APPOINTMENTS}
        currentDate={date}
      />
    );
    // Both a1 and a2 are on March 16
    expect(screen.getByText('Max Müller')).toBeInTheDocument();
    expect(screen.getByText('Anna Müller')).toBeInTheDocument();
  });

  it('does not show appointments from other days', () => {
    const date = new Date(2026, 2, 17, 12, 0, 0);
    render(
      <DayView
        students={STUDENTS}
        existingAppointments={APPOINTMENTS}
        currentDate={date}
      />
    );
    // Only a3 on March 17 → Max, but not Anna
    expect(screen.getByText('Max Müller')).toBeInTheDocument();
    expect(screen.queryByText('Anna Müller')).not.toBeInTheDocument();
  });

  it('renders with empty appointments array', () => {
    const date = new Date(2026, 2, 16, 12, 0, 0);
    render(
      <DayView
        students={STUDENTS}
        existingAppointments={[]}
        currentDate={date}
      />
    );
    expect(screen.getByText('Keine Termine für diesen Tag')).toBeInTheDocument();
  });
});
