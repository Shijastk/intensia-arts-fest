import { GlobalStudent, Program } from '../types';

/**
 * Multi-path update (relative to fests/{festId}) that removes one chest number everywhere:
 * from every program's teams (dropping teams left empty) and from the student register
 * (fests/{festId}/students, filled by "Bulk Add Students"). Written as ONE update, so the
 * student is either removed everywhere or nowhere.
 */
export const buildParticipantRemoval = (
  programs: Program[],
  students: Pick<GlobalStudent, 'id' | 'chestNumber'>[],
  chestNo: string
) => {
  const payload: Record<string, unknown> = {};
  let programCount = 0;

  programs.forEach(p => {
    const teams = (p.teams || []).filter(Boolean);
    const inProgram = teams.some(t => (t.participants || []).some(pt => pt?.chestNumber === chestNo));
    if (!inProgram) return;
    programCount++;
    const updatedTeams = teams
      .map(t => ({ ...t, participants: (t.participants || []).filter(pt => pt?.chestNumber !== chestNo) }))
      .filter(t => t.participants.length > 0);
    // RTDB has no empty arrays; null removes the node when no team is left.
    payload[`programs/${p.id}/teams`] = updatedTeams.length > 0 ? updatedTeams : null;
  });

  const studentIds = students.filter(s => s.chestNumber === chestNo).map(s => s.id);
  studentIds.forEach(id => { payload[`students/${id}`] = null; });

  return { payload, programCount, studentCount: studentIds.length };
};
