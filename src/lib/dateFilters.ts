/**
 * Date filter utilities – extracted from billing/invoices pages for testability
 */

import type { Appointment } from '@/types';

export type TimeRange = 'month' | 'year' | 'all' | 'custom';

export interface DateFilterOptions {
  timeRange: TimeRange;
  startDate?: string;
  endDate?: string;
  /** Reference date – defaults to now */
  referenceDate?: Date;
}

/**
 * Filter appointments by date range and exclude planned appointments.
 * This is the core logic shared between billing and invoice pages.
 */
export function filterAppointmentsByDate(
  appointments: Appointment[],
  options: DateFilterOptions
): Appointment[] {
  const now = options.referenceDate || new Date();
  let result = appointments.filter(app => app.status !== 'planned');

  switch (options.timeRange) {
    case 'month': {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      lastDay.setHours(23, 59, 59, 999);
      result = result.filter(app => {
        const appDate = new Date(app.date);
        return appDate >= firstDay && appDate <= lastDay;
      });
      break;
    }
    case 'year': {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const endOfYear = new Date(now.getFullYear(), 11, 31);
      endOfYear.setHours(23, 59, 59, 999);
      result = result.filter(app => {
        const appDate = new Date(app.date);
        return appDate >= startOfYear && appDate <= endOfYear;
      });
      break;
    }
    case 'custom': {
      // Default empty startDate to today (reference date)
      const effectiveStartDate = options.startDate || now.toISOString().split('T')[0];
      if (effectiveStartDate && options.endDate) {
        const start = new Date(effectiveStartDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(options.endDate);
        end.setHours(23, 59, 59, 999);
        result = result.filter(app => {
          const appDate = new Date(app.date);
          return appDate >= start && appDate <= end;
        });
      }
      break;
    }
    case 'all':
    default:
      // Show all non-planned appointments
      break;
  }

  // Sort by date ascending
  result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return result;
}
