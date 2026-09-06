import { db } from '../config/firebase';
import { ref, set, update, remove, push, onValue } from 'firebase/database';
import { Program } from '../types';

// Firebase Realtime Database rejects undefined values anywhere in a write payload.
// Program updates can contain deeply nested team/participant objects, so a shallow
// Object.entries() cleanup is not sufficient for judge score submissions.
const cleanData = (value: any): any => {
  if (value === undefined) return undefined;
  if (value === null) return null;

  if (Array.isArray(value)) {
    // Firebase arrays cannot contain undefined. Use null for an undefined slot so
    // the array remains structurally valid.
    return value.map(item => {
      const cleaned = cleanData(item);
      return cleaned === undefined ? null : cleaned;
    });
  }

  if (typeof value === 'object') {
    return Object.entries(value).reduce((acc: Record<string, any>, [key, child]) => {
      const cleaned = cleanData(child);
      if (cleaned !== undefined) {
        acc[key] = cleaned;
      }
      return acc;
    }, {});
  }

  return value;
};

export const programService = {
  subscribeToPrograms: (festId: string, callback: (programs: Program[]) => void) => {
    const programsRef = ref(db, `fests/${festId}/programs`);
    
    return onValue(programsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const programsList = Object.keys(data).map(key => ({
          ...data[key],
          id: key
        })) as Program[];
        callback(programsList);
      } else {
        callback([]);
      }
    }, (error) => {
      console.error("Firebase Subscription Error:", error);
      callback([]);
    });
  },

  addProgram: async (festId: string, programData: Omit<Program, 'id' | 'festId'>): Promise<string> => {
    const programsRef = ref(db, `fests/${festId}/programs`);
    const newProgramRef = push(programsRef);
    
    const finalData = cleanData({
      ...programData,
      festId,
      id: newProgramRef.key
    });
    
    await set(newProgramRef, finalData);
    return newProgramRef.key as string;
  },

  updateProgram: async (festId: string, id: string, updates: Partial<Program>): Promise<boolean> => {
    const programRef = ref(db, `fests/${festId}/programs/${id}`);
    const cleanedUpdates = cleanData(updates);

    try {
      await update(programRef, cleanedUpdates);
      return true;
    } catch (error: any) {
      // Keep the original Firebase error visible in DevTools so future write
      // failures are diagnosable instead of being reduced to a generic UI message.
      console.error('Firebase updateProgram failed:', {
        code: error?.code,
        message: error?.message,
        path: `fests/${festId}/programs/${id}`
      });
      throw error;
    }
  },

  deleteProgram: async (festId: string, id: string): Promise<boolean> => {
    const programRef = ref(db, `fests/${festId}/programs/${id}`);
    await remove(programRef);
    return true;
  }
};
