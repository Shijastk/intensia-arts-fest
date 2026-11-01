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

/** Adds a competition-style position (1, 1, 3) to an already-sorted list. */
export const withPositions = <T,>(sorted: T[], value: (item: T) => number): (T & { position: number })[] =>
  sorted.map((item, i) => ({ ...item, position: 0 })).map((item, i, arr) => {
    item.position = i > 0 && value(sorted[i]) === value(sorted[i - 1]) ? arr[i - 1].position : i + 1;
    return item;
  });

export const calculateConsolidatedResults = (programs: Program[], includeUnpublished: boolean = false) => {
  const teamScores: Record<string, number> = {};
  const candidatesMap = new Map<string, CandidateStat>();

  const isOffStage = (category: string) => {
    const lower = (category || '').toLowerCase();
    return lower.includes('no stage') || lower.includes('non stage') || lower.includes('off stage') || lower.includes('off-stage');
  };

  // General programs are separate from the student's Individual/Non-General score.
  // Keep the same category convention already used by TeamLeaderPage for registration.
  const isGeneralProgram = (category: string) =>
    (category || '').toLowerCase().includes('general');

  const completedPrograms = programs.filter(
    p => p.status === ProgramStatus.COMPLETED && (includeUnpublished || p.isResultPublished)
  );

  completedPrograms.forEach(prog => {
    const isGrp = prog.isGroup;
    const isGeneral = isGeneralProgram(prog.category);
    const isOff = isOffStage(prog.category);

    // RTDB drops empty arrays, so teams/participants may be missing.
    (prog.teams || []).filter(Boolean).forEach(team => {
      const tName = (team.teamName || 'UNKNOWN').toUpperCase().trim();
      if (!teamScores[tName]) teamScores[tName] = 0;

      // Group programs contribute their group result to Team Overall Score.
      // A Group program remains Group based on prog.isGroup, regardless of participant count.
      if (isGrp) {
        const teamEventPts = team.points ?? ((team.participants || [])[0]?.points || 0);
        teamScores[tName] += teamEventPts;
      }

      (team.participants || []).filter(Boolean).forEach(p => {
        const pts = p.points || 0;

        // Every individual program (General included) counts towards the team's overall score.
        if (!isGrp) teamScores[tName] += pts;

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
        const rank = p.rank || team.rank || 0;

        // Individual score MUST contain only Non-General Individual programs.
        // General programs are deliberately excluded even when isGroup === false.
        if (!isGrp && !isGeneral) {
          cand.totalPoints += pts;
          cand.individualPoints += pts;
          if (isOff) cand.offStagePoints += pts;

          // Count achievements only for Non-General Individual programs.
          if (rank === 1) cand.firsts += 1;
          else if (rank === 2) cand.seconds += 1;
          else if (rank === 3) cand.thirds += 1;
        }
      });
    });
  });

  const allCandidates = Array.from(candidatesMap.values());

  // Ties are broken by number of 1st, then 2nd, then 3rd places, then name (deterministic).
  const tieBreak = (a: CandidateStat, b: CandidateStat) =>
    b.firsts - a.firsts || b.seconds - a.seconds || b.thirds - a.thirds || a.name.localeCompare(b.name);
  const kalaPrathibha = [...allCandidates].filter(c => c.individualPoints > 0).sort((a, b) => b.individualPoints - a.individualPoints || tieBreak(a, b))[0];
  const sargaPrathibha = [...allCandidates].filter(c => c.offStagePoints > 0).sort((a, b) => b.offStagePoints - a.offStagePoints || tieBreak(a, b))[0];
  const sortedCandidates = [...allCandidates].sort((a, b) => b.totalPoints - a.totalPoints || tieBreak(a, b));
  const top15 = sortedCandidates.slice(0, 15);
  const sortedTeams = withPositions(
    Object.entries(teamScores).map(([name, score]) => ({ name, score })).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name)),
    t => t.score
  );

  return { sortedTeams, kalaPrathibha, sargaPrathibha, top15: withPositions(top15, c => c.totalPoints), allCandidates: sortedCandidates };
};
