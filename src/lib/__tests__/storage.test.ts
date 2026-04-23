import { describe, it, expect, beforeEach } from '@jest/globals';
import { loadData, saveData, exportAsJSON, importFromJSON, clearData } from '../storage';
import type { DataContainer } from '@/types';

// localStorage Mock
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (i: number) => Object.keys(store)[i] ?? null,
  };
})();

// Mock browser environment so isBrowser() returns true
(globalThis as Record<string, unknown>).window = {};
(globalThis as Record<string, unknown>).document = {};
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });

const VALID_DATA: DataContainer = {
  families: [{ id: 'f1', name: 'Müller', address: 'Teststr. 1', email: 'a@b.de' }],
  students: [{ id: 's1', familyId: 'f1', firstName: 'Max', defaultDuration: 60, rhythm: 'weekly' }],
  priceEntries: [{
    id: 'p1', studentIds: [], individual60: 30, individual90: 45,
    group60: 20, group90: 30, validFrom: '2026-01-01',
  }],
  appointments: [{
    id: 'a1', studentIds: ['s1'], date: '2026-03-15',
    duration: 60, status: 'attended',
  }],
  lastUpdated: '2026-04-23T20:00:00.000Z',
};

describe('storage', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  // ─── loadData ────────────────────────────────────────────────────────────

  describe('loadData', () => {
    it('returns null when no data stored', () => {
      expect(loadData()).toBeNull();
    });

    it('returns parsed data when stored', () => {
      saveData(VALID_DATA);
      const loaded = loadData();
      expect(loaded).not.toBeNull();
      expect(loaded!.families).toHaveLength(1);
      expect(loaded!.students[0].firstName).toBe('Max');
    });
  });

  // ─── saveData ────────────────────────────────────────────────────────────

  describe('saveData', () => {
    it('saves data and returns true', () => {
      expect(saveData(VALID_DATA)).toBe(true);
      const loaded = loadData();
      expect(loaded).not.toBeNull();
    });

    it('stores lastUpdated timestamp', () => {
      saveData(VALID_DATA);
      expect(localStorageMock.getItem('mathe_manager_last_updated')).toBe('2026-04-23T20:00:00.000Z');
    });

    it('rejects data exceeding 4MB size limit', () => {
      const hugeData = { ...VALID_DATA, families: Array(50000).fill(VALID_DATA.families[0]) };
      // This might still fit; create truly oversized data
      const massiveData: DataContainer = {
        ...VALID_DATA,
        students: Array(100000).fill(null).map((_, i) => ({
          id: `s${i}`, familyId: 'f1', firstName: `Student${i}`,
          defaultDuration: 60, rhythm: 'weekly' as const,
          notes: 'x'.repeat(100),
        })),
      };
      expect(saveData(massiveData)).toBe(false);
    });
  });

  // ─── exportAsJSON ────────────────────────────────────────────────────────

  describe('exportAsJSON', () => {
    it('returns null when no data stored', () => {
      expect(exportAsJSON()).toBeNull();
    });

    it('returns a Blob with JSON data', () => {
      saveData(VALID_DATA);
      const blob = exportAsJSON();
      expect(blob).not.toBeNull();
      expect(blob!.type).toBe('application/json');
    });
  });

  // ─── importFromJSON ──────────────────────────────────────────────────────

  describe('importFromJSON', () => {
    it('rejects invalid JSON', () => {
      const result = importFromJSON('not json');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('rejects data without families array', () => {
      const result = importFromJSON(JSON.stringify({ students: [] }));
      expect(result.success).toBe(false);
      expect(result.error).toContain('families');
    });

    it('merges imported data with existing data', () => {
      // Seed existing data
      saveData(VALID_DATA);

      // Import new family + student
      const imported = {
        families: [{ id: 'f2', name: 'Schmidt' }],
        students: [{ id: 's2', familyId: 'f2', firstName: 'Anna', defaultDuration: 90, rhythm: 'biweekly' }],
      };
      const result = importFromJSON(JSON.stringify(imported));
      expect(result.success).toBe(true);

      const loaded = loadData()!;
      expect(loaded.families).toHaveLength(2);
      expect(loaded.students).toHaveLength(2);
    });

    it('updates existing students on import', () => {
      saveData(VALID_DATA);

      const imported = {
        families: [{ id: 'f1', name: 'Müller-Updated' }],
        students: [{ id: 's1', familyId: 'f1', firstName: 'Maximilian', defaultDuration: 90, rhythm: 'biweekly' }],
      };
      const result = importFromJSON(JSON.stringify(imported));
      expect(result.success).toBe(true);

      const loaded = loadData()!;
      expect(loaded.families[0].name).toBe('Müller-Updated');
      expect(loaded.students[0].firstName).toBe('Maximilian');
    });

    it('preserves existing appointments on import', () => {
      saveData(VALID_DATA);

      const imported = {
        families: [{ id: 'f2', name: 'Neu' }],
        students: [{ id: 's2', familyId: 'f2', firstName: 'Neu', defaultDuration: 60, rhythm: 'weekly' }],
      };
      importFromJSON(JSON.stringify(imported));

      const loaded = loadData()!;
      // Original appointments should still be there
      expect(loaded.appointments).toHaveLength(1);
      expect(loaded.appointments[0].id).toBe('a1');
    });

    it('skips students without id', () => {
      saveData(VALID_DATA);

      const imported = {
        families: [],
        students: [
          { familyId: 'f1', firstName: 'NoId', defaultDuration: 60, rhythm: 'weekly' },
          { id: 's2', familyId: 'f1', firstName: 'WithId', defaultDuration: 60, rhythm: 'weekly' },
        ],
      };
      importFromJSON(JSON.stringify(imported));

      const loaded = loadData()!;
      // Original s1 + new s2, but not the one without id
      expect(loaded.students.find(s => s.firstName === 'NoId')).toBeUndefined();
      expect(loaded.students.find(s => s.id === 's2')).toBeDefined();
    });
  });

  // ─── clearData ───────────────────────────────────────────────────────────

  describe('clearData', () => {
    it('removes all stored data', () => {
      saveData(VALID_DATA);
      expect(loadData()).not.toBeNull();

      expect(clearData()).toBe(true);
      expect(loadData()).toBeNull();
    });
  });

  // ─── Roundtrip ───────────────────────────────────────────────────────────

  describe('roundtrip', () => {
    it('data survives save → load cycle', () => {
      saveData(VALID_DATA);
      const loaded = loadData()!;

      expect(loaded.families).toEqual(VALID_DATA.families);
      expect(loaded.students).toEqual(VALID_DATA.students);
      expect(loaded.priceEntries).toEqual(VALID_DATA.priceEntries);
      expect(loaded.appointments).toEqual(VALID_DATA.appointments);
    });
  });
});
