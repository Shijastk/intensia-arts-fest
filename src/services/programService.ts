import { db } from '../config/firebase';
import { ref, set, update, remove, push, onValue } from 'firebase/database';
import { Program } from '../types';

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
    await set(newProgramRef, {
      ...programData,
      festId,
      id: newProgramRef.key
    });
    return newProgramRef.key as string;
  },

  updateProgram: async (festId: string, id: string, updates: Partial<Program>): Promise<boolean> => {
    const programRef = ref(db, `fests/${festId}/programs/${id}`);
    await update(programRef, updates);
    return true;
  },

  deleteProgram: async (festId: string, id: string): Promise<boolean> => {
    const programRef = ref(db, `fests/${festId}/programs/${id}`);
    await remove(programRef);
    return true;
  }
};