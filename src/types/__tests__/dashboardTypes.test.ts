import { describe, it, expect } from '@jest/globals';
import { getRhythmWeekParity } from '../dashboardTypes';

describe('getRhythmWeekParity', () => {
  it('always returns true for weekly rhythm', () => {
    expect(getRhythmWeekParity(1, 'weekly')).toBe(true);
    expect(getRhythmWeekParity(2, 'weekly')).toBe(true);
    expect(getRhythmWeekParity(52, 'weekly')).toBe(true);
  });

  it('returns true for even calendar weeks with biweekly rhythm', () => {
    expect(getRhythmWeekParity(2, 'biweekly')).toBe(true);
    expect(getRhythmWeekParity(4, 'biweekly')).toBe(true);
    expect(getRhythmWeekParity(52, 'biweekly')).toBe(true);
  });

  it('returns false for odd calendar weeks with biweekly rhythm', () => {
    expect(getRhythmWeekParity(1, 'biweekly')).toBe(false);
    expect(getRhythmWeekParity(3, 'biweekly')).toBe(false);
    expect(getRhythmWeekParity(51, 'biweekly')).toBe(false);
  });
});
