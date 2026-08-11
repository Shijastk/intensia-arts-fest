import { Program, ProgramStatus } from '../types';

export interface CandidateStat {
  chestNumber: string;
  name: string;
  teamName: string;
  totalPoints: number;
  individualPoints: number;
  offStagePoints: number;
  firsts: number;
  seconds: number;
  thirds: number;
}

export const calculateConsolidatedResults = (programs: Program[]) => {
  const teamScores: Record<string, number> = {};
  const candidatesMap = new Map<string, CandidateStat>();

  const isOffStage = (category: string) => {
    const lower = (category || '').toLowerCase();
    return lower.includes('no stage') || lower.includes('non stage') || lower.includes('off stage') || lower.includes('off-stage');
  };

  const completedPrograms = programs.filter(p => p.status === ProgramStatus.COMPLETED);

  completedPrograms.forEach(prog => {
    const isGrp = prog.isGroup;
    const isOff = isOffStage(prog.category);

    prog.teams.forEach(team => {
      const tName = (team.teamName || 'UNKNOWN').toUpperCase().trim();
      if (!teamScores[tName]) teamScores[tName] = 0;

      // Add Group points to Team Overall Score
      if (isGrp) {
        const teamEventPts = team.points ?? (team.participants[0]?.points || 0);
        teamScores[tName] += teamEventPts;
      }

      team.participants.forEach(p => {
        const chest = p.chestNumber;
        if (!chest) return;

        if (!candidatesMap.has(chest)) {
          candidatesMap.set(chest, {
            chestNumber: chest,
            name: p.name,
            teamName: tName,
            totalPoints: 0,
            individualPoints: 0,
            offStagePoints: 0,
            firsts: 0,
            seconds: 0,
            thirds: 0
          });
        }

        const cand = candidatesMap.get(chest)!;
        const pts = p.points || 0;
        const rank = p.rank || team.rank || 0;

        // Add Individual points to Team Overall Score & Prathibha calculations
        if (!isGrp) {
          cand.totalPoints += pts;
          teamScores[tName] += pts;
          cand.individualPoints += pts;
          if (isOff) cand.offStagePoints += pts;

          // Count achievements
          if (rank === 1) cand.firsts += 1;
          else if (rank === 2) cand.seconds += 1;
          else if (rank === 3) cand.thirds += 1;
        }
      });
    });
  });

  const allCandidates = Array.from(candidatesMap.values());

  const kalaPrathibha = [...allCandidates].sort((a, b) => b.individualPoints - a.individualPoints)[0];
  const sargaPrathibha = [...allCandidates].filter(c => c.offStagePoints > 0).sort((a, b) => b.offStagePoints - a.offStagePoints)[0];
  const sortedCandidates = [...allCandidates].sort((a, b) => b.totalPoints - a.totalPoints);
  const top15 = sortedCandidates.slice(0, 15);
  const sortedTeams = Object.entries(teamScores).map(([name, score]) => ({ name, score })).sort((a, b) => b.score - a.score);

  return { sortedTeams, kalaPrathibha, sargaPrathibha, top15, allCandidates: sortedCandidates };
};