import { useState, useEffect, useCallback } from 'react';
import { Program } from '../types';
import { programService, ProgramAccess } from '../services/programService';
import { reportError } from '../utils/errorReporting';

interface UseProgramsOptions {
  // 'private' / 'public': all programs of the fest. 'judge': only the judge's own panel.
  access?: ProgramAccess;
  judgePanel?: string;
  // Team leaders change registrations of their own team only.
  teamName?: string;
}

export const usePrograms = (festId: string | null, options: UseProgramsOptions = {}) => {
  const { access = 'private', judgePanel, teamName } = options;
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
    }, { access, judgePanel });

    return () => unsubscribe();
  }, [festId, access, judgePanel]);

  const addProgram = async (programData: Omit<Program, 'id' | 'festId'>): Promise<boolean> => {
    if (!festId) return false;
    try {
      await programService.addProgram(festId, programData);
      return true;
    } catch (err: any) {
      return reportError('Program not added', err, { name: programData.name });
    }
  };

  const updateProgram = async (id: string, updates: Partial<Program>): Promise<boolean> => {
    if (!festId) return false;
    try {
      if (access === 'public' && teamName) {
        await programService.updateOwnTeam(festId, id, teamName, updates);
      } else {
        await programService.updateProgram(festId, id, updates);
      }
      return true;
    } catch (err: any) {
      return reportError('Program not updated', err, { programId: id });
    }
  };

  const deleteProgram = async (id: string): Promise<boolean> => {
    if (!festId) return false;
    try {
      await programService.deleteProgram(festId, id);
      return true;
    } catch (err: any) {
      return reportError('Program not deleted', err, { programId: id });
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
