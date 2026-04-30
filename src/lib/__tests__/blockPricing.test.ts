/**
 * Tests for Block Pricing functionality
 */

import { describe, it, expect } from '@jest/globals';
import {
  getBlockPriceForStudent,
  calculateBlockPrice,
  calculateAppointmentFee,
} from '../billing';
import type { PriceEntry, Appointment } from '@/types';

describe('Block Pricing', () => {
  describe('getBlockPriceForStudent', () => {
    it('returns block price entry when student has block pricing for date', () => {
      const priceEntries: PriceEntry[] = [
        {
          id: 'block1',
          type: 'block',
          studentIds: ['s1'],
          blockName: 'Abiturprogramm',
          blockPrice: 450,
          blockStartDate: '2026-01-01',
          blockEndDate: '2026-06-30',
          validFrom: '2026-01-01',
          validTo: '2026-06-30',
        },
      ];

      const result = getBlockPriceForStudent('s1', '2026-03-15', priceEntries);
      expect(result).toBeDefined();
      expect(result?.id).toBe('block1');
      expect(result?.blockName).toBe('Abiturprogramm');
      expect(result?.blockPrice).toBe(450);
    });

    it('returns undefined when student has no block pricing', () => {
      const priceEntries: PriceEntry[] = [
        {
          id: 'block1',
          type: 'block',
          studentIds: ['s2'],
          blockName: 'Abiturprogramm',
          blockPrice: 450,
          blockStartDate: '2026-01-01',
          blockEndDate: '2026-06-30',
          validFrom: '2026-01-01',
          validTo: '2026-06-30',
        },
      ];

      const result = getBlockPriceForStudent('s1', '2026-03-15', priceEntries);
      expect(result).toBeUndefined();
    });

    it('returns undefined when date is outside block period', () => {
      const priceEntries: PriceEntry[] = [
        {
          id: 'block1',
          type: 'block',
          studentIds: ['s1'],
          blockName: 'Abiturprogramm',
          blockPrice: 450,
          blockStartDate: '2026-01-01',
          blockEndDate: '2026-06-30',
          validFrom: '2026-01-01',
          validTo: '2026-06-30',
        },
      ];

      const result = getBlockPriceForStudent('s1', '2026-07-15', priceEntries);
      expect(result).toBeUndefined();
    });

    it('returns undefined when date is before block period', () => {
      const priceEntries: PriceEntry[] = [
        {
          id: 'block1',
          type: 'block',
          studentIds: ['s1'],
          blockName: 'Abiturprogramm',
          blockPrice: 450,
          blockStartDate: '2026-01-01',
          blockEndDate: '2026-06-30',
          validFrom: '2026-01-01',
          validTo: '2026-06-30',
        },
      ];

      const result = getBlockPriceForStudent('s1', '2025-12-15', priceEntries);
      expect(result).toBeUndefined();
    });

    it('returns undefined for standard price entries', () => {
      const priceEntries: PriceEntry[] = [
        {
          id: 'standard1',
          type: 'standard',
          studentIds: ['s1'],
          individual60: 35,
          individual90: 50,
          group60: 25,
          group90: 35,
          validFrom: '2026-01-01',
        },
      ];

      const result = getBlockPriceForStudent('s1', '2026-03-15', priceEntries);
      expect(result).toBeUndefined();
    });
  });

  describe('calculateBlockPrice', () => {
    it('returns block price when student has block pricing', () => {
      const priceEntries: PriceEntry[] = [
        {
          id: 'block1',
          type: 'block',
          studentIds: ['s1'],
          blockName: 'Abiturprogramm',
          blockPrice: 450,
          blockStartDate: '2026-01-01',
          blockEndDate: '2026-06-30',
          validFrom: '2026-01-01',
          validTo: '2026-06-30',
        },
      ];

      const result = calculateBlockPrice('s1', priceEntries);
      expect(result).toBeDefined();
      expect(result?.entry.id).toBe('block1');
      expect(result?.price).toBe(450);
    });

    it('returns undefined when student has no block pricing', () => {
      const priceEntries: PriceEntry[] = [
        {
          id: 'standard1',
          type: 'standard',
          studentIds: ['s1'],
          individual60: 35,
          individual90: 50,
          group60: 25,
          group90: 35,
          validFrom: '2026-01-01',
        },
      ];

      const result = calculateBlockPrice('s1', priceEntries);
      expect(result).toBeUndefined();
    });
  });

  describe('calculateAppointmentFee with block pricing', () => {
    it('returns 0 when student has block pricing for appointment date', () => {
      const priceEntries: PriceEntry[] = [
        {
          id: 'block1',
          type: 'block',
          studentIds: ['s1'],
          blockName: 'Abiturprogramm',
          blockPrice: 450,
          blockStartDate: '2026-01-01',
          blockEndDate: '2026-06-30',
          validFrom: '2026-01-01',
          validTo: '2026-06-30',
        },
      ];

      const appointment: Appointment = {
        id: 'a1',
        studentIds: ['s1'],
        date: '2026-03-15',
        time: '14:00',
        duration: 60,
        status: 'attended',
      };

      const result = calculateAppointmentFee(appointment, 's1', priceEntries);
      expect(result).toBe(0);
    });

    it('returns standard price when student has no block pricing', () => {
      const priceEntries: PriceEntry[] = [
        {
          id: 'standard1',
          type: 'standard',
          studentIds: ['s1'],
          individual60: 35,
          individual90: 50,
          group60: 25,
          group90: 35,
          validFrom: '2026-01-01',
        },
      ];

      const appointment: Appointment = {
        id: 'a1',
        studentIds: ['s1'],
        date: '2026-03-15',
        time: '14:00',
        duration: 60,
        status: 'attended',
      };

      const result = calculateAppointmentFee(appointment, 's1', priceEntries);
      expect(result).toBe(35);
    });

    it('returns standard price when appointment date is outside block period', () => {
      const priceEntries: PriceEntry[] = [
        {
          id: 'block1',
          type: 'block',
          studentIds: ['s1'],
          blockName: 'Abiturprogramm',
          blockPrice: 450,
          blockStartDate: '2026-01-01',
          blockEndDate: '2026-06-30',
          validFrom: '2026-01-01',
          validTo: '2026-06-30',
        },
        {
          id: 'standard1',
          type: 'standard',
          studentIds: ['s1'],
          individual60: 35,
          individual90: 50,
          group60: 25,
          group90: 35,
          validFrom: '2026-01-01',
        },
      ];

      const appointment: Appointment = {
        id: 'a1',
        studentIds: ['s1'],
        date: '2026-07-15',
        time: '14:00',
        duration: 60,
        status: 'attended',
      };

      const result = calculateAppointmentFee(appointment, 's1', priceEntries);
      expect(result).toBe(35);
    });

    it('returns 0 for canceled_free appointments even with block pricing', () => {
      const priceEntries: PriceEntry[] = [
        {
          id: 'block1',
          type: 'block',
          studentIds: ['s1'],
          blockName: 'Abiturprogramm',
          blockPrice: 450,
          blockStartDate: '2026-01-01',
          blockEndDate: '2026-06-30',
          validFrom: '2026-01-01',
          validTo: '2026-06-30',
        },
      ];

      const appointment: Appointment = {
        id: 'a1',
        studentIds: ['s1'],
        date: '2026-03-15',
        time: '14:00',
        duration: 60,
        status: 'canceled_free',
      };

      const result = calculateAppointmentFee(appointment, 's1', priceEntries);
      expect(result).toBe(0);
    });

    it('returns 0 for planned appointments even with block pricing', () => {
      const priceEntries: PriceEntry[] = [
        {
          id: 'block1',
          type: 'block',
          studentIds: ['s1'],
          blockName: 'Abiturprogramm',
          blockPrice: 450,
          blockStartDate: '2026-01-01',
          blockEndDate: '2026-06-30',
          validFrom: '2026-01-01',
          validTo: '2026-06-30',
        },
      ];

      const appointment: Appointment = {
        id: 'a1',
        studentIds: ['s1'],
        date: '2026-03-15',
        time: '14:00',
        duration: 60,
        status: 'planned',
      };

      const result = calculateAppointmentFee(appointment, 's1', priceEntries);
      expect(result).toBe(0);
    });

    it('handles multiple students with different pricing', () => {
      const priceEntries: PriceEntry[] = [
        {
          id: 'block1',
          type: 'block',
          studentIds: ['s1'],
          blockName: 'Abiturprogramm',
          blockPrice: 450,
          blockStartDate: '2026-01-01',
          blockEndDate: '2026-06-30',
          validFrom: '2026-01-01',
          validTo: '2026-06-30',
        },
        {
          id: 'standard1',
          type: 'standard',
          studentIds: ['s2'],
          individual60: 35,
          individual90: 50,
          group60: 25,
          group90: 35,
          validFrom: '2026-01-01',
        },
      ];

      const appointment: Appointment = {
        id: 'a1',
        studentIds: ['s1', 's2'],
        date: '2026-03-15',
        time: '14:00',
        duration: 60,
        status: 'attended',
      };

      const result1 = calculateAppointmentFee(appointment, 's1', priceEntries);
      const result2 = calculateAppointmentFee(appointment, 's2', priceEntries);

      expect(result1).toBe(0); // s1 has block pricing
      expect(result2).toBe(25); // s2 has standard pricing (group60)
    });
  });
});
