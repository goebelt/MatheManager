/**
 * @jest-environment jsdom
 */
import { describe, it, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AppointmentCard } from '../AppointmentCard';
import type { Appointment, Student } from '@/types';

const BASE_STUDENT: Student = {
  id: 's1',
  familyId: 'f1',
  firstName: 'Max',
  lastName: 'Müller',
  defaultDuration: 60,
  rhythm: 'weekly',
};

const BASE_APPOINTMENT: Appointment = {
  id: 'a1',
  studentIds: ['s1'],
  date: '2026-03-16',
  time: '14:00',
  duration: 60,
  status: 'planned',
};

describe('AppointmentCard', () => {
  it('renders student name', () => {
    render(
      <AppointmentCard
        appointment={BASE_APPOINTMENT}
        student={BASE_STUDENT}
      />
    );
    expect(screen.getByText('Max Müller')).toBeInTheDocument();
  });

  it('renders duration for individual lesson', () => {
    render(
      <AppointmentCard
        appointment={BASE_APPOINTMENT}
        student={BASE_STUDENT}
      />
    );
    expect(screen.getByText(/Einzel/)).toBeInTheDocument();
    expect(screen.getAllByText(/60 Min/).length).toBeGreaterThanOrEqual(1);
  });

  it('renders group lesson type when multiple students', () => {
    const groupAppt: Appointment = {
      ...BASE_APPOINTMENT,
      studentIds: ['s1', 's2'],
    };
    const student2: Student = { ...BASE_STUDENT, id: 's2', firstName: 'Anna' };
    render(
      <AppointmentCard
        appointment={groupAppt}
        student={BASE_STUDENT}
        allStudents={[BASE_STUDENT, student2]}
      />
    );
    expect(screen.getByText(/Gruppenkurs/)).toBeInTheDocument();
    expect(screen.getAllByText(/60 Min/).length).toBeGreaterThanOrEqual(1);
  });

  it('renders "Geplant" status for planned appointment', () => {
    render(
      <AppointmentCard
        appointment={BASE_APPOINTMENT}
        student={BASE_STUDENT}
      />
    );
    expect(screen.getByText('Geplant')).toBeInTheDocument();
  });

  it('renders "Stattgefunden" for attended appointment', () => {
    const attended = { ...BASE_APPOINTMENT, status: 'attended' as const };
    render(
      <AppointmentCard
        appointment={attended}
        student={BASE_STUDENT}
      />
    );
    expect(screen.getByText('Stattgefunden')).toBeInTheDocument();
  });

  it('renders "Ausfall bezahlt" for canceled_paid appointment', () => {
    const canceled = { ...BASE_APPOINTMENT, status: 'canceled_paid' as const };
    render(
      <AppointmentCard
        appointment={canceled}
        student={BASE_STUDENT}
      />
    );
    expect(screen.getByText('Ausfall bezahlt')).toBeInTheDocument();
  });

  it('renders "Ausfall frei" for canceled_free appointment', () => {
    const canceled = { ...BASE_APPOINTMENT, status: 'canceled_free' as const };
    render(
      <AppointmentCard
        appointment={canceled}
        student={BASE_STUDENT}
      />
    );
    expect(screen.getByText('Ausfall frei')).toBeInTheDocument();
  });

  it('shows conflict indicator when conflictStatus=conflict', () => {
    render(
      <AppointmentCard
        appointment={BASE_APPOINTMENT}
        student={BASE_STUDENT}
        conflictStatus="conflict"
      />
    );
    expect(screen.getByText('Konflikt')).toBeInTheDocument();
  });

  it('shows tight indicator when conflictStatus=tight', () => {
    render(
      <AppointmentCard
        appointment={BASE_APPOINTMENT}
        student={BASE_STUDENT}
        conflictStatus="tight"
      />
    );
    expect(screen.getByText('Knapp')).toBeInTheDocument();
  });

  it('does not show conflict indicator for canceled appointments', () => {
    const canceled = { ...BASE_APPOINTMENT, status: 'canceled_paid' as const };
    render(
      <AppointmentCard
        appointment={canceled}
        student={BASE_STUDENT}
        conflictStatus="conflict"
      />
    );
    // Canceled appointments should not show conflict indicator
    expect(screen.queryByText('Konflikt')).not.toBeInTheDocument();
  });

  it('shows status controls when onStatusChange is provided', () => {
    const onStatusChange = jest.fn();
    render(
      <AppointmentCard
        appointment={BASE_APPOINTMENT}
        student={BASE_STUDENT}
        onStatusChange={onStatusChange}
      />
    );
    // Should render the select dropdown with status options
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText('Stattgefunden')).toBeInTheDocument();
    expect(screen.getByText('Ausfall bezahlt')).toBeInTheDocument();
    expect(screen.getByText('Ausfall frei')).toBeInTheDocument();
  });

  it('does not show status controls by default', () => {
    render(
      <AppointmentCard
        appointment={BASE_APPOINTMENT}
        student={BASE_STUDENT}
      />
    );
    // No select dropdown
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('displays multiple student names for group appointments', () => {
    const groupAppt: Appointment = {
      ...BASE_APPOINTMENT,
      studentIds: ['s1', 's2'],
    };
    const student2: Student = { ...BASE_STUDENT, id: 's2', firstName: 'Anna', lastName: 'Schmidt' };
    render(
      <AppointmentCard
        appointment={groupAppt}
        student={BASE_STUDENT}
        allStudents={[BASE_STUDENT, student2]}
      />
    );
    expect(screen.getByText('Max Müller, Anna Schmidt')).toBeInTheDocument();
  });
});
