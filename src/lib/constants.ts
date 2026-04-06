/**
 * Application constants for MatheManager
 */

/**
 * Default appointment durations in minutes
 */
export const DURATION_OPTIONS = {
  SHORT: 60,
  LONG: 90
} as const;

/**
 * Appointment rhythm options
 */
export const RHYTHM_OPTIONS = {
  WEEKLY: 'weekly',
  BIWEEKLY: 'biweekly'
} as const;

/**
 * Price calculation types
 */
export const PRICE_TYPES = {
  INDIVIDUAL: 'individual',
  GROUP: 'group' // Max 2 students per group session
} as const;

/**
 * Status options for appointments
 */
export const APPOINTMENT_STATUSES = {
  ATTENDED: 'attended',
  CANCELED_PAID: 'canceled_paid',
  CANCELED_FREE: 'canceled_free'
} as const;

/**
 * Maximum students per group session
 */
export const MAX_GROUP_SIZE = 2;