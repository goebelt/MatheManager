/**
 * @jest-environment jsdom
 */
import { describe, it, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AppointmentCard } from '../AppointmentCard';
import type { Appointment, Student } from '@/types';

const BASE_STUDENT: Student = {
  id: 's1', familyId: 'f1', firstName: 'Max', lastName: 'Müller',
  defaultDuration: 60, rhythm: 'weekly',
};

const BASE_APPOINTMENT: Appointment = {
  id: 'a1', studentIds: ['s1'], date: '2026-03-16', time: '14:00',
  duration: 60, status: 'planned',
};

describe('AppointmentCard', () => {
  // ── Basic rendering ──

  it('renders student name', () => {
    render(<AppointmentCard appointment={BASE_APPOINTMENT} student={BASE_STUDENT} />);
    expect(screen.getByText('Max Müller')).toBeInTheDocument();
  });

  it('renders duration for individual lesson', () => {
    render(<AppointmentCard appointment={BASE_APPOINTMENT} student={BASE_STUDENT} />);
    expect(screen.getByText(/Einzel/)).toBeInTheDocument();
    expect(screen.getAllByText(/60 Min/).length).toBeGreaterThanOrEqual(1);
  });

  it('renders group lesson type when multiple students', () => {
    const groupAppt: Appointment = { ...BASE_APPOINTMENT, studentIds: ['s1', 's2'] };
    const student2: Student = { ...BASE_STUDENT, id: 's2', firstName: 'Anna' };
    render(<AppointmentCard appointment={groupAppt} student={BASE_STUDENT} allStudents={[BASE_STUDENT, student2]} />);
    expect(screen.getByText(/Gruppenkurs/)).toBeInTheDocument();
  });

  // ── Time display (fixed from UTC 02:00 bug) ──

  it('shows appointment.time directly as start time', () => {
    render(<AppointmentCard appointment={BASE_APPOINTMENT} student={BASE_STUDENT} />);
    // Time display: "14:00 – 15:00"
    expect(screen.getByText(/14:00/)).toBeInTheDocument();
  });

  it('shows calculated end time based on time + duration', () => {
    render(<AppointmentCard appointment={BASE_APPOINTMENT} student={BASE_STUDENT} />);
    // 14:00 + 60 min = 15:00
    expect(screen.getByText(/15:00/)).toBeInTheDocument();
  });

  it('shows time range format "HH:MM – HH:MM"', () => {
    render(<AppointmentCard appointment={BASE_APPOINTMENT} student={BASE_STUDENT} />);
    // Should show "14:00 – 15:00"
    const timeEl = screen.getByText(/14:00.*15:00/);
    expect(timeEl).toBeInTheDocument();
  });

  it('calculates end time correctly for 90-min appointment', () => {
    const appt90: Appointment = { ...BASE_APPOINTMENT, time: '10:00', duration: 90 };
    render(<AppointmentCard appointment={appt90} student={BASE_STUDENT} />);
    // 10:00 + 90 min = 11:30
    expect(screen.getByText(/10:00.*11:30/)).toBeInTheDocument();
  });

  it('calculates end time crossing hour boundary', () => {
    const appt: Appointment = { ...BASE_APPOINTMENT, time: '09:45', duration: 45 };
    render(<AppointmentCard appointment={appt} student={BASE_STUDENT} />);
    // 09:45 + 45 min = 10:30
    expect(screen.getByText(/09:45.*10:30/)).toBeInTheDocument();
  });

  it('shows dash when appointment has no time', () => {
    const noTime: Appointment = { ...BASE_APPOINTMENT, time: undefined };
    render(<AppointmentCard appointment={noTime} student={BASE_STUDENT} />);
    expect(screen.getByText('–')).toBeInTheDocument();
  });

  it('does NOT show 02:00 from UTC date parsing bug', () => {
    // This was the original bug: new Date("2026-03-16").toLocaleTimeString()
    // interpreted as UTC midnight → 02:00 in GMT+2
    render(<AppointmentCard appointment={BASE_APPOINTMENT} student={BASE_STUDENT} />);
    expect(screen.queryByText(/02:00/)).not.toBeInTheDocument();
  });

  // ── Status labels ──

  it('renders "Geplant" status for planned appointment', () => {
    render(<AppointmentCard appointment={BASE_APPOINTMENT} student={BASE_STUDENT} />);
    expect(screen.getByText('Geplant')).toBeInTheDocument();
  });

  it('renders "Stattgefunden" for attended appointment', () => {
    const attended = { ...BASE_APPOINTMENT, status: 'attended' as const };
    render(<AppointmentCard appointment={attended} student={BASE_STUDENT} />);
    expect(screen.getByText('Stattgefunden')).toBeInTheDocument();
  });

  it('renders "Ausfall bezahlt" for canceled_paid appointment', () => {
    const canceled = { ...BASE_APPOINTMENT, status: 'canceled_paid' as const };
    render(<AppointmentCard appointment={canceled} student={BASE_STUDENT} />);
    expect(screen.getByText('Ausfall bezahlt')).toBeInTheDocument();
  });

  it('renders "Ausfall frei" for canceled_free appointment', () => {
    const canceled = { ...BASE_APPOINTMENT, status: 'canceled_free' as const };
    render(<AppointmentCard appointment={canceled} student={BASE_STUDENT} />);
    expect(screen.getByText('Ausfall frei')).toBeInTheDocument();
  });

  // ── Conflict indicators ──

  it('shows conflict indicator when conflictStatus=conflict', () => {
    render(<AppointmentCard appointment={BASE_APPOINTMENT} student={BASE_STUDENT} conflictStatus="conflict" />);
    expect(screen.getByText('Konflikt')).toBeInTheDocument();
  });

  it('shows tight indicator when conflictStatus=tight', () => {
    render(<AppointmentCard appointment={BASE_APPOINTMENT} student={BASE_STUDENT} conflictStatus="tight" />);
    expect(screen.getByText('Knapp')).toBeInTheDocument();
  });

  it('does not show conflict indicator for canceled appointments', () => {
    const canceled = { ...BASE_APPOINTMENT, status: 'canceled_paid' as const };
    render(<AppointmentCard appointment={canceled} student={BASE_STUDENT} conflictStatus="conflict" />);
    expect(screen.queryByText('Konflikt')).not.toBeInTheDocument();
  });

  // ── Status controls ──

  it('shows status controls when onStatusChange is provided', () => {
    const onStatusChange = jest.fn();
    render(<AppointmentCard appointment={BASE_APPOINTMENT} student={BASE_STUDENT} onStatusChange={onStatusChange} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('does not show status controls by default', () => {
    render(<AppointmentCard appointment={BASE_APPOINTMENT} student={BASE_STUDENT} />);
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  // ── Group appointments ──

  it('displays multiple student names for group appointments', () => {
    const groupAppt: Appointment = { ...BASE_APPOINTMENT, studentIds: ['s1', 's2'] };
    const student2: Student = { ...BASE_STUDENT, id: 's2', firstName: 'Anna', lastName: 'Schmidt' };
    render(<AppointmentCard appointment={groupAppt} student={BASE_STUDENT} allStudents={[BASE_STUDENT, student2]} />);
    expect(screen.getByText('Max Müller, Anna Schmidt')).toBeInTheDocument();
  });

  it('shows pupil count for group appointments', () => {
    const groupAppt: Appointment = { ...BASE_APPOINTMENT, studentIds: ['s1', 's2'] };
    const student2: Student = { ...BASE_STUDENT, id: 's2', firstName: 'Anna' };
    render(<AppointmentCard appointment={groupAppt} student={BASE_STUDENT} allStudents={[BASE_STUDENT, student2]} />);
    expect(screen.getByText(/2 Schüler/)).toBeInTheDocument();
  });

  // ── Duration fallback ──

  it('falls back to student defaultDuration when appointment has no duration', () => {
    const noDuration: Appointment = { ...BASE_APPOINTMENT, duration: 0 };
    const student90: Student = { ...BASE_STUDENT, defaultDuration: 90 };
    render(<AppointmentCard appointment={noDuration} student={student90} />);
    // End time: 14:00 + 90 min = 15:30
    expect(screen.getByText(/14:00.*15:30/)).toBeInTheDocument();
  });
});
