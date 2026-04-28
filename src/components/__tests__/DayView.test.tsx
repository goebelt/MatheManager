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
  {
    id: 's3',
    familyId: 'f2',
    firstName: 'Lisa',
    lastName: 'Schmidt',
    defaultDuration: 60,
    rhythm: 'weekly',
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
      <DayView students={STUDENTS} existingAppointments={APPOINTMENTS} currentDate={date} />
    );
    expect(screen.getByText(/16\.03\.2026/)).toBeInTheDocument();
  });

  it('shows "Heute" badge for current date', () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0); // midday to avoid UTC shift
    render(
      <DayView students={STUDENTS} existingAppointments={[]} currentDate={today} />
    );
    expect(screen.getByText('Heute')).toBeInTheDocument();
  });

  it('does not show "Heute" badge for other dates', () => {
    const date = new Date(2026, 2, 16, 12, 0, 0);
    render(
      <DayView students={STUDENTS} existingAppointments={[]} currentDate={date} />
    );
    expect(screen.queryByText('Heute')).not.toBeInTheDocument();
  });

  it('shows empty message when no appointments for the day', () => {
    const date = new Date(2026, 2, 20, 12, 0, 0); // No appointments on March 20
    render(
      <DayView students={STUDENTS} existingAppointments={APPOINTMENTS} currentDate={date} />
    );
    expect(screen.getByText('Keine Termine für diesen Tag')).toBeInTheDocument();
  });

  it('renders appointments for the current day', () => {
    // DayView filters by dateStr = currentDate.toISOString().split('T')[0]
    // With midday local time, toISOString() gives the correct UTC date
    const date = new Date(2026, 2, 16, 12, 0, 0);
    render(
      <DayView students={STUDENTS} existingAppointments={APPOINTMENTS} currentDate={date} />
    );
    // Both a1 and a2 are on March 16
    expect(screen.getByText('Max Müller')).toBeInTheDocument();
    expect(screen.getByText('Anna Müller')).toBeInTheDocument();
  });

  it('does not show appointments from other days', () => {
    const date = new Date(2026, 2, 17, 12, 0, 0);
    render(
      <DayView students={STUDENTS} existingAppointments={APPOINTMENTS} currentDate={date} />
    );
    // Only a3 on March 17 → Max, but not Anna
    expect(screen.getByText('Max Müller')).toBeInTheDocument();
    expect(screen.queryByText('Anna Müller')).not.toBeInTheDocument();
  });

  it('renders with empty appointments array', () => {
    const date = new Date(2026, 2, 16, 12, 0, 0);
    render(
      <DayView students={STUDENTS} existingAppointments={[]} currentDate={date} />
    );
    expect(screen.getByText('Keine Termine für diesen Tag')).toBeInTheDocument();
  });
});

describe('DayView – Sortierung nach Uhrzeit', () => {
  // Appointments deliberately provided in non-chronological order
  const unsortedAppointments: Appointment[] = [
    {
      id: 'a-late',
      studentIds: ['s2'],
      date: '2026-03-16',
      time: '17:00',
      duration: 60,
      status: 'planned',
    },
    {
      id: 'a-early',
      studentIds: ['s1'],
      date: '2026-03-16',
      time: '09:00',
      duration: 60,
      status: 'attended',
    },
    {
      id: 'a-mid',
      studentIds: ['s3'],
      date: '2026-03-16',
      time: '14:00',
      duration: 60,
      status: 'attended',
    },
  ];

  it('sorts appointments by time regardless of input order', () => {
    const date = new Date(2026, 2, 16, 12, 0, 0);
    render(
      <DayView students={STUDENTS} existingAppointments={unsortedAppointments} currentDate={date} />
    );
    // All three students should be rendered
    const maxText = screen.getByText('Max Müller');
    const lisaText = screen.getByText('Lisa Schmidt');
    const annaText = screen.getByText('Anna Müller');
    // Verify they are in DOM order by comparing their positions
    // Max (09:00) should come before Lisa (14:00) which should come before Anna (17:00)
    const positions = [maxText, lisaText, annaText].map(
      el => el.compareDocumentPosition
    );
    // Max should precede Lisa in DOM order
    expect(maxText.compareDocumentPosition(lisaText) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // Lisa should precede Anna in DOM order
    expect(lisaText.compareDocumentPosition(annaText) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

describe('DayView – Konfliktlogik (konsistent mit Termine-Seite)', () => {
  it('shows conflict indicator for overlapping appointments', () => {
    // a1 ends at 10:00 (09:00 + 60min), a2 starts at 09:30 → conflict
    const conflictAppointments: Appointment[] = [
      {
        id: 'a1',
        studentIds: ['s1'],
        date: '2026-03-16',
        time: '09:00',
        duration: 60,
        status: 'attended',
      },
      {
        id: 'a2',
        studentIds: ['s2'],
        date: '2026-03-16',
        time: '09:30',
        duration: 60,
        status: 'planned',
      },
    ];
    const date = new Date(2026, 2, 16, 12, 0, 0);
    render(
      <DayView students={STUDENTS} existingAppointments={conflictAppointments} currentDate={date} />
    );
    // The second appointment (a2 at 09:30) should show a conflict indicator
    expect(screen.getByText('Konflikt')).toBeInTheDocument();
  });

  it('shows tight indicator when gap is ≤5 minutes', () => {
    // a1 ends at 10:00, a2 starts at 10:03 → tight (within 5 min of prev end)
    const tightAppointments: Appointment[] = [
      {
        id: 'a1',
        studentIds: ['s1'],
        date: '2026-03-16',
        time: '09:00',
        duration: 60,
        status: 'attended',
      },
      {
        id: 'a2',
        studentIds: ['s2'],
        date: '2026-03-16',
        time: '10:03',
        duration: 60,
        status: 'planned',
      },
    ];
    const date = new Date(2026, 2, 16, 12, 0, 0);
    render(
      <DayView students={STUDENTS} existingAppointments={tightAppointments} currentDate={date} />
    );
    expect(screen.getByText('Knapp')).toBeInTheDocument();
  });

  it('shows no conflict indicator for appointments with sufficient gap', () => {
    // a1 ends at 10:00, a2 starts at 10:10 → ok (5+ min gap, addMinutes('10:00', 60)='11:00', start 10:10 < 11:00 → conflict)
    // Let's use a proper gap: a1 ends at 10:00, a2 starts at 10:06 → still tight
    // a1 ends at 10:00, a2 starts at 10:15 → ok (addMinutes('09:00', 60)='10:00', '10:15' > addMinutes('10:00', 5)='10:05')
    const okAppointments: Appointment[] = [
      {
        id: 'a1',
        studentIds: ['s1'],
        date: '2026-03-16',
        time: '09:00',
        duration: 60,
        status: 'attended',
      },
      {
        id: 'a2',
        studentIds: ['s2'],
        date: '2026-03-16',
        time: '10:15',
        duration: 60,
        status: 'planned',
      },
    ];
    const date = new Date(2026, 2, 16, 12, 0, 0);
    render(
      <DayView students={STUDENTS} existingAppointments={okAppointments} currentDate={date} />
    );
    // No conflict or tight indicator should be present
    expect(screen.queryByText('Konflikt')).not.toBeInTheDocument();
    expect(screen.queryByText('Knapp')).not.toBeInTheDocument();
  });

  it('does not show conflict for canceled appointments', () => {
    // a1 is canceled, a2 overlaps → no conflict (canceled appointments are ignored)
    const canceledAppointments: Appointment[] = [
      {
        id: 'a1',
        studentIds: ['s1'],
        date: '2026-03-16',
        time: '09:00',
        duration: 60,
        status: 'canceled_paid',
      },
      {
        id: 'a2',
        studentIds: ['s2'],
        date: '2026-03-16',
        time: '09:30',
        duration: 60,
        status: 'planned',
      },
    ];
    const date = new Date(2026, 2, 16, 12, 0, 0);
    render(
      <DayView students={STUDENTS} existingAppointments={canceledAppointments} currentDate={date} />
    );
    // No conflict indicator (canceled appointment is ignored by getAppointmentStatus)
    expect(screen.queryByText('Konflikt')).not.toBeInTheDocument();
    expect(screen.queryByText('Knapp')).not.toBeInTheDocument();
  });
});
