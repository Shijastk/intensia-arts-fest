import { db } from '../config/firebase';
import { ref, get, set, update, remove, push, onValue } from 'firebase/database';
import { Program } from '../types';

// Firebase Realtime Database rejects undefined values anywhere in a write payload.
const cleanData = (value: any): any => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (Array.isArray(value)) return value.map(item => { const cleaned = cleanData(item); return cleaned === undefined ? null : cleaned; });
  if (typeof value === 'object') return Object.entries(value).reduce((acc: Record<string, any>, [key, child]) => { const cleaned = cleanData(child); if (cleaned !== undefined) acc[key] = cleaned; return acc; }, {});
  return value;
};

export const programService = {
  subscribeToPrograms: (festId: string, callback: (programs: Program[]) => void) => {
    const programsRef = ref(db, `fests/${festId}/programs`);
    return onValue(programsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const programsList = Object.keys(data).map(key => ({ ...data[key], id: key })) as Program[];
        callback(programsList);
      } else callback([]);
    }, (error) => { console.error('Firebase Subscription Error:', error); callback([]); });
  },

  addProgram: async (festId: string, programData: Omit<Program, 'id' | 'festId'>): Promise<string> => {
    const programsRef = ref(db, `fests/${festId}/programs`);
    const newProgramRef = push(programsRef);
    await set(newProgramRef, cleanData({ ...programData, festId, id: newProgramRef.key }));
    return newProgramRef.key as string;
  },

  updateProgram: async (festId: string, id: string, updates: Partial<Program>): Promise<boolean> => {
    const programRef = ref(db, `fests/${festId}/programs/${id}`);
    const finalUpdates: Partial<Program> = { ...updates };

    // Result publication order is persisted at the moment a result is first published.
    // This is done here so every existing result-publish path gets the same behavior.
    if (updates.isResultPublished === true) {
      const currentSnapshot = await get(programRef);
      const currentProgram = currentSnapshot.exists() ? currentSnapshot.val() : null;
      if (!currentProgram?.resultPublishedOrder) {
        const programsSnapshot = await get(ref(db, `fests/${festId}/programs`));
        const programsData = programsSnapshot.exists() ? programsSnapshot.val() : {};
        const maxOrder = Object.values(programsData as Record<string, any>).reduce((max: number, program: any) => {
          return Math.max(max, Number(program?.resultPublishedOrder) || 0);
        }, 0);
        finalUpdates.resultPublishedOrder = maxOrder + 1;
      }
    }

    const cleanedUpdates = cleanData(finalUpdates);
    try {
      await update(programRef, cleanedUpdates);
      return true;
    } catch (error: any) {
      console.error('Firebase updateProgram failed:', { code: error?.code, message: error?.message, path: `fests/${festId}/programs/${id}` });
      throw error;
    }
  },

  deleteProgram: async (festId: string, id: string): Promise<boolean> => {
    await remove(ref(db, `fests/${festId}/programs/${id}`));
    return true;
  }
};
