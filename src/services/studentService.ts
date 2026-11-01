import { auth, db } from '../config/firebase';
import { reportLoadError } from '../utils/errorReporting';
import { ref, get, set, update, remove, push, onValue } from 'firebase/database';
import { GlobalStudent, Program } from '../types';
import { buildParticipantRemoval } from '../utils/participantRemoval';

// RTDB rejects `undefined`; drop it from written values (null still means "delete").
const cleanForWrite = (payload: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(payload).map(([k, v]) => [k, v === null ? null : JSON.parse(JSON.stringify(v))]));

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
      reportLoadError('students', error, !!auth.currentUser);
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

  /** All students in one atomic write: either every row is saved or none. Throws on failure. */
  addBulkStudents: async (festId: string, studentsData: Omit<GlobalStudent, 'id' | 'festId'>[]): Promise<boolean> => {
    const studentsRef = ref(db, `fests/${festId}/students`);
    const payload: Record<string, unknown> = {};
    studentsData.forEach(student => {
      const id = push(studentsRef).key as string;
      payload[id] = { ...student, festId, id };
    });
    if (Object.keys(payload).length > 0) await update(studentsRef, payload);
    return true;
  },

  /**
   * Removes a chest number from every program and from the student register in one atomic
   * write. Throws on failure. Returns how many programs / register entries were affected.
   */
  removeParticipantEverywhere: async (festId: string, programs: Program[], chestNo: string) => {
    const snap = await get(ref(db, `fests/${festId}/students`));
    const students = Object.entries((snap.val() || {}) as Record<string, GlobalStudent>)
      .map(([id, s]) => ({ id, chestNumber: s?.chestNumber }));
    const { payload, programCount, studentCount } = buildParticipantRemoval(programs, students, chestNo);
    if (Object.keys(payload).length > 0) await update(ref(db, `fests/${festId}`), cleanForWrite(payload));
    return { programCount, studentCount };
  },

  deleteStudent: async (festId: string, id: string): Promise<boolean> => {
    const studentRef = ref(db, `fests/${festId}/students/${id}`);
    await remove(studentRef);
    return true;
  }
};
