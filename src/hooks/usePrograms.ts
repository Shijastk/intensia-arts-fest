import { useState, useEffect, useCallback } from 'react';
import { Program } from '../types';
import { programService } from '../services/programService';

export const usePrograms = (festId: string | null) => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!festId) {
      setPrograms([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    const unsubscribe = programService.subscribeToPrograms(festId, (data) => {
      setPrograms(data);
      setLoading(false);
      setError(null);
    });

    return () => unsubscribe();
  }, [festId]);

  const addProgram = async (programData: Omit<Program, 'id' | 'festId'>): Promise<boolean> => {
    if (!festId) return false;
    try {
      await programService.addProgram(festId, programData);
      return true;
    } catch (err: any) {
      console.error("Error adding program:", err);
      return false;
    }
  };

  const updateProgram = async (id: string, updates: Partial<Program>): Promise<boolean> => {
    if (!festId) return false;
    try {
      await programService.updateProgram(festId, id, updates);
      return true;
    } catch (err: any) {
      console.error("Error updating program:", err);
      return false;
    }
  };

  const deleteProgram = async (id: string): Promise<boolean> => {
    if (!festId) return false;
    try {
      await programService.deleteProgram(festId, id);
      return true;
    } catch (err: any) {
      console.error("Error deleting program:", err);
      return false;
    }
  };

  const refresh = useCallback(() => {}, []);

  return {
    programs,
    setPrograms,
    loading,
    error,
    addProgram,
    updateProgram,
    deleteProgram,
    refresh,
  };
};