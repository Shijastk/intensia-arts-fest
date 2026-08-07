import { db } from '../config/firebase';
import { ref, set, update, remove, push, onValue } from 'firebase/database';
import { Program } from '../types';

const cleanData = (obj: any) => {
  return Object.entries(obj).reduce((acc: any, [key, value]) => {
    if (value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {});
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
    await update(programRef, cleanData(updates));
    return true;
  },

  deleteProgram: async (festId: string, id: string): Promise<boolean> => {
    const programRef = ref(db, `fests/${festId}/programs/${id}`);
    await remove(programRef);
    return true;
  }
};