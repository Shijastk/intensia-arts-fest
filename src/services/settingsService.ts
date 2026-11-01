import { auth, db } from '../config/firebase';
import { reportLoadError } from '../utils/errorReporting';
import { ref, set, update, onValue, get } from 'firebase/database';
import { Settings } from '../types';
import { CATEGORIES, ZONES } from '../constants/categories'; // Fallback values

const DEFAULT_SETTINGS: Settings = {
  categories: CATEGORIES,
  zones: ZONES,
  maxStudentsPerTeam: 50,
  maxNonGeneralPerStudent: 3,
  customScores: {},
};


export const settingsService = {
  /** Fest name / venue / dates for certificates. Never throws (exports fall back to the fest id). */
  getFestDetails: async (festId: string): Promise<{ festName?: string; festVenue?: string; festDates?: string }> => {
    try {
      const snap = await get(ref(db, `fests/${festId}/settings`));
      const s = (snap.val() || {}) as Settings;
      return { festName: s.festName, festVenue: s.festVenue, festDates: s.festDates };
    } catch (error) {
      console.error('Could not load fest details for export:', error);
      return {};
    }
  },

  subscribeToSettings: (festId: string, callback: (settings: Settings) => void) => {
    const settingsRef = ref(db, `fests/${festId}/settings`);

    return onValue(settingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Merge with defaults in case of new fields missing in DB
        callback({ ...DEFAULT_SETTINGS, ...data });
      } else {
        // If settings don't exist, use defaults
        callback(DEFAULT_SETTINGS);
      }
    }, (error) => {
      reportLoadError('fest settings', error, !!auth.currentUser);
      callback(DEFAULT_SETTINGS);
    });
  },

  /** Throws on failure (the useSettings hook shows the error to the user). */
  updateSettings: async (festId: string, updates: Partial<Settings>): Promise<boolean> => {
    const settingsRef = ref(db, `fests/${festId}/settings`);
    const snapshot = await get(settingsRef);
    if (snapshot.exists()) {
      await update(settingsRef, updates);
    } else {
      // If settings do not exist yet, create with merged data
      await set(settingsRef, { ...DEFAULT_SETTINGS, ...updates });
    }
    return true;
  }
};
