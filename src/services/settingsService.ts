import { db } from '../config/firebase';
import { ref, set, update, onValue, get } from 'firebase/database';
import { Settings } from '../types';
import { CATEGORIES } from '../constants/categories'; // Fallback categories

const DEFAULT_SETTINGS: Settings = {
  categories: CATEGORIES,
  maxStudentsPerTeam: 50,
  maxNonGeneralPerStudent: 3,
};

export const settingsService = {
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
      console.error("Firebase Subscription Error (Settings):", error);
      callback(DEFAULT_SETTINGS);
    });
  },

  updateSettings: async (festId: string, updates: Partial<Settings>): Promise<boolean> => {
    try {
      const settingsRef = ref(db, `fests/${festId}/settings`);
      const snapshot = await get(settingsRef);
      if (snapshot.exists()) {
        await update(settingsRef, updates);
      } else {
        // If settings do not exist yet, create with merged data
        await set(settingsRef, { ...DEFAULT_SETTINGS, ...updates });
      }
      return true;
    } catch (error) {
      console.error("Error updating settings:", error);
      return false;
    }
  }
};
