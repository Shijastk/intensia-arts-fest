import { useState, useEffect } from 'react';
import { GlobalStudent } from '../types';
import { studentService } from '../services/studentService';
import { reportError } from '../utils/errorReporting';

export const useStudents = (festId: string | null) => {
  const [students, setStudents] = useState<GlobalStudent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!festId) {
      setStudents([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    const unsubscribe = studentService.subscribeToStudents(festId, (data) => {
      setStudents(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [festId]);

  const addStudent = async (studentData: Omit<GlobalStudent, 'id' | 'festId'>): Promise<boolean> => {
    if (!festId) return false;
    try {
      await studentService.addStudent(festId, studentData);
      return true;
    } catch (err: any) {
      return reportError('Student not added', err);
    }
  };

  const addBulkStudents = async (studentsData: Omit<GlobalStudent, 'id' | 'festId'>[]): Promise<boolean> => {
    if (!festId) return false;
    try {
      await studentService.addBulkStudents(festId, studentsData);
      return true;
    } catch (err: any) {
      return reportError('Students not added', err);
    }
  };

  const deleteStudent = async (id: string): Promise<boolean> => {
    if (!festId) return false;
    try {
      await studentService.deleteStudent(festId, id);
      return true;
    } catch (err: any) {
      return reportError('Student not deleted', err, { studentId: id });
    }
  };

  return {
    students,
    loading,
    addStudent,
    addBulkStudents,
    deleteStudent,
  };
};
