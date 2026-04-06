/**
 * SSR-safe storage service for localStorage
 */

// Keys for localStorage to avoid collisions
const STORAGE_KEY = 'mathe_manager_data';
const VERSION_KEY = 'mathe_manager_version';
const DEFAULT_VERSION = 1;

/**
 * Check if we're in a browser environment (safe for SSR)
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * Get or initialize the data from localStorage
 */
export function loadData(): DataContainer | null {
  if (!isBrowser()) return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    
    // Check version compatibility
    const currentVersion = Number(localStorage.getItem(VERSION_KEY) || DEFAULT_VERSION);
    
    // If we have a different version, warn but continue (simple migration would go here)
    if (currentVersion !== DEFAULT_VERSION && parsed.lastUpdated) {
      console.warn(`[MatheManager] Version mismatch: expected ${DEFAULT_VERSION}, found ${parsed.lastUpdated}`);
    }

    return parsed as DataContainer;
  } catch (error) {
    console.error('[Storage] Error loading data:', error);
    return null;
  }
}

/**
 * Save data to localStorage with validation and error handling
 */
export function saveData(data: DataContainer): boolean {
  if (!isBrowser()) return false;

  try {
    const serialized = JSON.stringify(data, null, 2);
    
    // Check size (localStorage has ~5MB limit)
    if (serialized.length > 4000000) {
      console.warn('[Storage] Data too large for localStorage');
      return false;
    }

    localStorage.setItem(STORAGE_KEY, serialized);
    localStorage.setItem(VERSION_KEY, String(DEFAULT_VERSION));
    
    if (data.lastUpdated) {
      localStorage.setItem('mathe_manager_last_updated', data.lastUpdated);
    }
    
    return true;
  } catch (error) {
    console.error('[Storage] Error saving data:', error);
    return false;
  }
}

/**
 * Export data as JSON file for backup/import
 */
export function exportAsJSON(): Blob | null {
  if (!isBrowser()) return null;

  try {
    const data = loadData();
    if (!data) return null;

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    return blob;
  } catch (error) {
    console.error('[Storage] Error exporting data:', error);
    return null;
  }
}

/**
 * Import and merge data from a JSON file
 */
export function importFromJSON(jsonString: string): { success: boolean; error?: string } {
  if (!isBrowser()) return { success: false, error: 'Import not available in SSR' };

  try {
    const parsed = JSON.parse(jsonString);
    
    // Basic validation
    if (!parsed.families || !Array.isArray(parsed.families)) {
      throw new Error('Invalid data format: missing or invalid families array');
    }

    // Merge with existing data, preserving appointments and priceEntries structure
    const current = loadData() || { families: [], students: [], priceEntries: [], appointments: [] };
    
    // Use import mode - new families/students added, existing ones updated
    const importedData: DataContainer = {
      ...current,
      lastUpdated: new Date().toISOString(),
    };

    // Update or add students (keeping old appointments)
    const studentMap = new Map(current.students.map(s => [s.id, s]));
    for (const student of parsed.students) {
      if (!student.id) continue;
      
      if (studentMap.has(student.id)) {
        // Update existing student
        studentMap.set(student.id, { ...studentMap.get(student.id!), ...student });
      } else {
        // Add new student
        studentMap.set(student.id, student);
      }
    }
    importedData.students = Array.from(studentMap.values());

    // Update or add families
    const familyMap = new Map(current.families.map(f => [f.id, f]));
    for (const family of parsed.families) {
      if (!family.id) continue;
      
      if (familyMap.has(family.id)) {
        familyMap.set(family.id, { ...familyMap.get(family.id!), ...family });
      } else {
        familyMap.set(family.id, family);
      }
    }
    importedData.families = Array.from(familyMap.values());

    // Keep existing priceEntries and appointments (don't overwrite)

    saveData(importedData);
    return { success: true };
  } catch (error) {
    console.error('[Storage] Error importing data:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown import error'
    };
  }
}

/**
 * Clear all stored data
 */
export function clearData(): boolean {
  if (!isBrowser()) return false;

  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(VERSION_KEY);
    localStorage.removeItem('mathe_manager_last_updated');
    return true;
  } catch (error) {
    console.error('[Storage] Error clearing data:', error);
    return false;
  }
}
