import { db } from '../config/firebase';
import { ref, set, remove, push, onValue } from 'firebase/database';
import { GlobalStudent } from '../types';

export const studentService = {
  subscribeToStudents: (festId: string, callback: (students: GlobalStudent[]) => void) => {
    const studentsRef = ref(db, `fests/${festId}/students`);
    
    return onValue(studentsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const studentsList = Object.keys(data).map(key => ({
          ...data[key],
          id: key
        })) as GlobalStudent[];
        callback(studentsList);
      } else {
        callback([]);
      }
    }, (error) => {
      console.error("Firebase Subscription Error:", error);
      callback([]);
    });
  },

  addStudent: async (festId: string, studentData: Omit<GlobalStudent, 'id' | 'festId'>): Promise<string> => {
    const studentsRef = ref(db, `fests/${festId}/students`);
    const newStudentRef = push(studentsRef);
    
    const finalData = {
      ...studentData,
      festId,
      id: newStudentRef.key
    };
    
    await set(newStudentRef, finalData);
    return newStudentRef.key as string;
  },

  addBulkStudents: async (festId: string, studentsData: Omit<GlobalStudent, 'id' | 'festId'>[]): Promise<boolean> => {
    try {
      const promises = studentsData.map(async (student) => {
        const studentsRef = ref(db, `fests/${festId}/students`);
        const newStudentRef = push(studentsRef);
        await set(newStudentRef, {
          ...student,
          festId,
          id: newStudentRef.key
        });
      });
      await Promise.all(promises);
      return true;
    } catch (e) {
      console.error("Error bulk adding students:", e);
      return false;
    }
  },

  deleteStudent: async (festId: string, id: string): Promise<boolean> => {
    const studentRef = ref(db, `fests/${festId}/students/${id}`);
    await remove(studentRef);
    return true;
  }
};
