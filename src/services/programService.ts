import { db, functions } from '../config/firebase';
import { ref, get, set, update, remove, push, onValue } from 'firebase/database';
import { httpsCallable } from 'firebase/functions';
import { Program } from '../types';

export type ProgramAccess = 'private' | 'public' | 'judge';

const toProgramList = (data: Record<string, any> | null): Program[] => {
  if (!data) return [];
  const programsList = Object.keys(data).filter(key => data[key]).map(key => ({ ...data[key], id: key })) as Program[];
  // Keep published results in their persisted publication order. Consumers that
  // intentionally reverse this list (Results/Green Room) therefore get oldest -> newest.
  programsList.sort((a, b) => {
    const aOrder = a.resultPublishedOrder || 0;
    const bOrder = b.resultPublishedOrder || 0;
    if (aOrder && bOrder) return bOrder - aOrder;
    if (aOrder) return -1;
    if (bOrder) return 1;
    return 0;
  });
  return programsList;
};

const cleanData = (value: any): any => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (Array.isArray(value)) return value.map(item => { const cleaned = cleanData(item); return cleaned === undefined ? null : cleaned; });
  if (typeof value === 'object') return Object.entries(value).reduce((acc: Record<string, any>, [key, child]) => { const cleaned = cleanData(child); if (cleaned !== undefined) acc[key] = cleaned; return acc; }, {});
  return value;
};

export const programService = {
  subscribeToPrograms: (
    festId: string,
    callback: (programs: Program[]) => void,
    { access = 'private', judgePanel }: { access?: ProgramAccess; judgePanel?: string } = {}
  ) => {
    const onError = (error: Error) => { console.error('Firebase Subscription Error:', error); callback([]); };

    if (access === 'private') {
      return onValue(ref(db, `fests/${festId}/programs`), (snapshot) => callback(toProgramList(snapshot.val())), onError);
    }

    const publicRef = ref(db, `publicFests/${festId}/programs`);
    if (access === 'public') {
      return onValue(publicRef, (snapshot) => callback(toProgramList(snapshot.val())), onError);
    }

    // Judges: the rules only allow reading full data of programs on their own panel, so
    // take the program list from the public copy and subscribe to each allowed program.
    let publicData: Record<string, any> = {};
    const privateData: Record<string, any> = {};
    const privateSubs = new Map<string, () => void>();
    const emit = () => {
      const merged: Record<string, any> = {};
      Object.keys(publicData).forEach(id => { merged[id] = privateData[id] || publicData[id]; });
      callback(toProgramList(merged));
    };
    const unsubscribePublic = onValue(publicRef, (snapshot) => {
      publicData = snapshot.val() || {};
      const allowed = new Set(Object.keys(publicData).filter(id => !judgePanel || publicData[id]?.judgePanel === judgePanel));
      privateSubs.forEach((unsub, id) => {
        if (!allowed.has(id)) { unsub(); privateSubs.delete(id); delete privateData[id]; }
      });
      allowed.forEach(id => {
        if (privateSubs.has(id)) return;
        privateSubs.set(id, onValue(ref(db, `fests/${festId}/programs/${id}`), (snap) => {
          if (snap.exists()) privateData[id] = snap.val(); else delete privateData[id];
          emit();
        }, () => { delete privateData[id]; emit(); }));
      });
      emit();
    }, onError);

    return () => {
      unsubscribePublic();
      privateSubs.forEach(unsub => unsub());
      privateSubs.clear();
    };
  },

  /** Team leaders: register / request removal for their own team via the server. */
  updateOwnTeam: async (festId: string, programId: string, teamName: string, updates: Partial<Program>): Promise<boolean> => {
    const sameName = (a?: string) => String(a || '').trim().toLowerCase() === teamName.trim().toLowerCase();
    const team = (updates.teams || []).find(t => sameName(t?.teamName));
    if (!team) throw new Error('Team leaders can only change their own team.');
    const callable = httpsCallable(functions, 'teamLeaderUpdateTeam');
    await callable({ festId, programId, team: { teamName: team.teamName, participants: team.participants || [] } });
    return true;
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

    if (updates.isResultPublished === true) {
      const currentSnapshot = await get(programRef);
      const currentProgram = currentSnapshot.exists() ? currentSnapshot.val() : null;
      if (!currentProgram?.resultPublishedOrder) {
        const programsSnapshot = await get(ref(db, `fests/${festId}/programs`));
        const programsData = programsSnapshot.exists() ? programsSnapshot.val() : {};
        const maxOrder = Object.values(programsData as Record<string, any>).reduce((max: number, program: any) => Math.max(max, Number(program?.resultPublishedOrder) || 0), 0);
        finalUpdates.resultPublishedOrder = maxOrder + 1;
      }
    }

    try {
      await update(programRef, cleanData(finalUpdates));
      return true;
    } catch (error: any) {
      console.error('Firebase updateProgram failed:', { code: error?.code, message: error?.message, path: `fests/${festId}/programs/${id}` });
      throw error;
    }
  },

  /**
   * Apply field updates to several programs atomically with ONE multi-path update on
   * fests/{festId}/programs (paths like '<id>/startTime'). Throws on failure.
   * Not for publish-state changes (use updateProgram, which assigns resultPublishedOrder).
   */
  batchUpdatePrograms: async (festId: string, changes: { id: string; updates: Partial<Program> }[]): Promise<boolean> => {
    const payload: Record<string, any> = {};
    changes.forEach(({ id, updates }) => {
      Object.entries(cleanData(updates) || {}).forEach(([key, value]) => { payload[`${id}/${key}`] = value; });
    });
    if (Object.keys(payload).length === 0) return true;
    try {
      await update(ref(db, `fests/${festId}/programs`), payload);
      return true;
    } catch (error: any) {
      console.error('Firebase batchUpdatePrograms failed:', { code: error?.code, message: error?.message, path: `fests/${festId}/programs` });
      throw error;
    }
  },

  deleteProgram: async (festId: string, id: string): Promise<boolean> => {
    await remove(ref(db, `fests/${festId}/programs/${id}`));
    return true;
  }
};
