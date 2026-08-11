import { Program, ProgramStatus } from '../types';

export interface TeamScore {
  name: string;
  score: number;
}

export interface CategoryChampion {
  name: string;
  teamName: string;
  chestNumber: string;
  points: number;
}

export interface ZoneStats {
  name: string;
  teamScores: Record<string, number>;
  leadingTeam: TeamScore | null;
  kalaPrathibha: CategoryChampion | null;
  sargaPrathibha: CategoryChampion | null;
  categories: Record<string, {
    kalaPrathibha: CategoryChampion | null;
    sargaPrathibha: CategoryChampion | null;
  }>;
}

export interface LeaderboardStats {
  leadingTeam: TeamScore;
  trailingTeam: TeamScore | null;
  kalaPrathibha: CategoryChampion | null;
  sarkhaPrathibha: CategoryChampion | null;
  zones: Record<string, ZoneStats>;
}

export type DetailedTeamScores = Record<string, Record<string, number>> & {
  totals: Record<string, number>;
};

type IndividualScore = {
  name: string;
  chestNumber: string;
  teamName: string;
  totalPoints: number;
};

const normalizeTeamName = (teamName: string) => teamName.trim().toUpperCase();

const roundScore = (score: number) => Number(score.toFixed(1));

const getCategoryZone = (category: string): string => {
  const match = (category || '').match(/^([A-Z])\s+zone/i);
  return match?.[1]?.toUpperCase() ?? 'General';
};

const getProgramZone = (program: Program): string => getCategoryZone(program.category);

const getAllZones = (programs: Program[]): string[] => {
  const zones = new Set<string>();
  (programs || []).forEach(program => {
    const zone = getProgramZone(program);
    if (zone) zones.add(zone);
  });
  return Array.from(zones).sort();
};

const getAllTeams = (programs: Program[]): string[] => {
  const teams = new Set<string>();
  (programs || []).forEach(program => {
    (program.teams || []).forEach(team => {
      const name = normalizeTeamName(team.teamName || '');
      if (name) teams.add(name);
    });
  });
  return Array.from(teams).sort();
};

const sumUniqueCodeLetterPoints = (team: Program['teams'][number]): number => {
  const uniqueByCodeLetter = new Map<string, number>();

  (team?.participants || []).forEach(participant => {
    const codeLetter = participant.codeLetter || participant.chestNumber;
    if (codeLetter && !uniqueByCodeLetter.has(codeLetter)) {
      uniqueByCodeLetter.set(codeLetter, participant.points || 0);
    }
  });

  return Array.from(uniqueByCodeLetter.values()).reduce((sum, points) => sum + points, 0);
};

const calculateTeamEventPoints = (program: Program, team: Program['teams'][number]): number => {
  if (!program.isGroup || program.name?.toLowerCase().includes('quiz')) {
    return sumUniqueCodeLetterPoints(team);
  }

  if (typeof team?.points === 'number') {
    return team.points;
  }

  return (team?.participants || [])[0]?.points || 0;
};

const calculateZoneScores = (programs: Program[], targetZone: string, teamNames: string[]): Record<string, number> => {
  const scores = Object.fromEntries(teamNames.map(teamName => [teamName, 0]));

  (programs || [])
    .filter(program => program.status === ProgramStatus.COMPLETED && program.isResultPublished && getProgramZone(program) === targetZone)
    .forEach(program => {
      (program.teams || []).forEach(team => {
        const teamName = normalizeTeamName(team.teamName || '');
        if (!(teamName in scores)) scores[teamName] = 0;
        scores[teamName] += calculateTeamEventPoints(program, team);
      });
    });

  return Object.fromEntries(
    Object.entries(scores).map(([teamName, score]) => [teamName, roundScore(score)])
  );
};

const isOffStageCategory = (program: Program) => {
  if (program.isOffStage !== undefined) return program.isOffStage;
  // Fallback for older programs
  const lowerCategory = (program.category || '').toLowerCase();
  return lowerCategory.includes('no stage') || lowerCategory.includes('non stage') || lowerCategory.includes('off stage') || lowerCategory.includes('off-stage');
};

const aggregateIndividualScores = (
  programs: Program[],
  categoryFilter: (category: string) => boolean,
  nonStageOnly = false
): IndividualScore[] => {
  const scores = new Map<string, IndividualScore>();

  (programs || [])
    .filter(program =>
      program.status === ProgramStatus.COMPLETED &&
      program.isResultPublished &&
      !program.isGroup &&
      categoryFilter(program.category) &&
      (!nonStageOnly || isOffStageCategory(program))
    )
    .forEach(program => {
      (program.teams || []).forEach(team => {
        (team.participants || []).forEach(participant => {
          const points = participant.points || 0;
          if (points <= 0 || !participant.chestNumber) return;

          const currentScore = scores.get(participant.chestNumber) || {
            name: participant.name,
            chestNumber: participant.chestNumber,
            teamName: team.teamName || 'Unknown',
            totalPoints: 0,
          };

          currentScore.totalPoints += points;
          scores.set(participant.chestNumber, currentScore);
        });
      });
    });

  return Array.from(scores.values())
    .map(score => ({ ...score, totalPoints: roundScore(score.totalPoints) }))
    .sort((a, b) => b.totalPoints - a.totalPoints);
};

const toChampion = (score?: IndividualScore): CategoryChampion | null => {
  if (!score || score.totalPoints <= 0) return null;
  return {
    name: score.name,
    teamName: score.teamName,
    chestNumber: score.chestNumber,
    points: score.totalPoints,
  };
};

const extractCategoryType = (category: string, zoneKey: string): string => {
  const withoutZone = category.replace(new RegExp(`^${zoneKey}\\s*zone`, 'i'), '').trim();
  return withoutZone ? withoutZone.toLowerCase() : 'general';
};

const sortTeamScores = (scores: Record<string, number>): TeamScore[] => {
  return Object.entries(scores)
    .map(([name, score]) => ({ name, score: roundScore(score) }))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
};

export const calculateLeaderboardStats = (programs: Program[]): LeaderboardStats => {
  const safePrograms = programs || [];
  const teamNames = getAllTeams(safePrograms);
  const zoneKeys = getAllZones(safePrograms);
  const overallScores = Object.fromEntries(teamNames.map(teamName => [teamName, 0]));
  const zones: Record<string, ZoneStats> = {};

  zoneKeys.forEach(zoneKey => {
    const teamScores = calculateZoneScores(programs, zoneKey, teamNames);

    Object.entries(teamScores).forEach(([teamName, score]) => {
      overallScores[teamName] = (overallScores[teamName] || 0) + score;
    });

    const zoneScoreRows = sortTeamScores(teamScores);
    const zoneFilter = (category: string) => getCategoryZone(category) === zoneKey;
    const zonePrograms = safePrograms.filter(program => program.status === ProgramStatus.COMPLETED && getProgramZone(program) === zoneKey);
    const zoneCategories = new Set(zonePrograms.map(program => extractCategoryType(program.category, zoneKey)));

    const categories: ZoneStats['categories'] = {};
    zoneCategories.forEach(categoryType => {
      const categoryFilter = (category: string) =>
        getCategoryZone(category) === zoneKey &&
        extractCategoryType(category, zoneKey) === categoryType;

      categories[categoryType] = {
        kalaPrathibha: toChampion(aggregateIndividualScores(safePrograms, categoryFilter)[0]),
        sargaPrathibha: toChampion(aggregateIndividualScores(safePrograms, categoryFilter, true)[0]),
      };
    });

    zones[zoneKey] = {
      name: `${zoneKey} Zone`,
      teamScores,
      leadingTeam: zoneScoreRows[0]?.score > 0 ? zoneScoreRows[0] : null,
      kalaPrathibha: toChampion(aggregateIndividualScores(safePrograms, zoneFilter)[0]),
      sargaPrathibha: toChampion(aggregateIndividualScores(safePrograms, zoneFilter, true)[0]),
      categories,
    };
  });

  const overallScoreRows = sortTeamScores(overallScores);
  const leadingTeam = overallScoreRows[0] ?? { name: '', score: 0 };

  return {
    leadingTeam,
    trailingTeam: overallScoreRows[1] ?? null,
    kalaPrathibha: toChampion(aggregateIndividualScores(safePrograms, () => true)[0]),
    sarkhaPrathibha: toChampion(aggregateIndividualScores(safePrograms, () => true, true)[0]),
    zones,
  };
};

export const getDetailedTeamScores = (programs: Program[]): DetailedTeamScores => {
  const detailedScores: DetailedTeamScores = { totals: {} };

  (programs || [])
    .filter(program => program.status === ProgramStatus.COMPLETED)
    .forEach(program => {
      const eventKey = `${program.category}: ${program.name}`;

      (program.teams || []).forEach(team => {
        const teamName = normalizeTeamName(team.teamName || '');
        if (!teamName) return;

        const eventPoints = roundScore(calculateTeamEventPoints(program, team));
        if (!detailedScores[teamName]) detailedScores[teamName] = {};
        if (!detailedScores.totals[teamName]) detailedScores.totals[teamName] = 0;

        detailedScores[teamName][eventKey] = eventPoints;
        detailedScores.totals[teamName] = roundScore(detailedScores.totals[teamName] + eventPoints);
      });
    });

  return detailedScores;
};
