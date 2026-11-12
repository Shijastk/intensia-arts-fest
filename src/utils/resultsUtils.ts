import { Program } from '../types';

// Shared result helpers for the public Results page, the Green Room and poster exports.
// (Previously copied separately into ResultsPage and GreenRoomPage.)

export interface ProgramWinner {
  name: string;
  teamName: string;
  chestNumber?: string;
  rank: number;
  points: number;
  score: number;
  grade: string;
}

/**
 * Zone of a program: the zone chosen in the program form (program.zone) wins; older programs
 * without one fall back to the "A zone"/"B zone"/"C zone" wording in their category.
 */
export const getProgramZone = (program: Pick<Program, 'zone' | 'category'>): string => {
  if (program.zone && program.zone.trim()) return program.zone.trim();
  const cat = (program.category || '').toLowerCase();
  const match = cat.match(/\b([a-z])\s*zone\b/);
  return match ? match[1].toUpperCase() : 'General';
};

/** Display name of a zone: the name given in Settings as-is; a bare letter from an old category becomes "Zone A". */
export const zoneLabel = (zone: string): string => (/^[A-Z]$/.test(zone) ? `Zone ${zone}` : zone);

/**
 * Zone used by the results filters. Only zones in the Settings list count: a program whose zone
 * was deleted (or renamed) in Settings is grouped under General. With no zones configured in
 * Settings the program's own zone is used, as before.
 */
export const getResultZone = (program: Pick<Program, 'zone' | 'category'>, settingsZones: string[] = []): string => {
  const zone = getProgramZone(program);
  if (settingsZones.length === 0 || zone === 'General') return zone;
  if (settingsZones.includes(zone)) return zone;
  const named = settingsZones.find(z => z === zoneLabel(zone)); // old "A zone" category vs "Zone A" in Settings
  return named ?? 'General';
};

/** Zones in Settings order, then any others alphabetically, General last. */
export const sortZones = (zones: string[], settingsZones: string[] = []): string[] => {
  const rank = (z: string) => (z === 'General' ? Infinity : settingsZones.includes(z) ? settingsZones.indexOf(z) : settingsZones.length);
  return [...zones].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
};

/**
 * Places 1-3 of a program, including every tied entry (ranks are competition-style: 1, 1, 3).
 * Group programs report one entry per sub-team; individual programs one per participant.
 */
export const getProgramWinners = (program: Pick<Program, 'isGroup' | 'teams' | 'membersPerGroup'>): ProgramWinner[] => {
  const teams = (program.teams || []).filter(Boolean);
  const winners: ProgramWinner[] = [];
  if (program.isGroup) {
    getGroupEntries(program).forEach(entry => {
      if (entry.rank >= 1 && entry.rank <= 3) {
        winners.push({ name: entry.name, teamName: entry.teamName, rank: entry.rank, points: entry.points, score: entry.score, grade: entry.grade });
      }
    });
  } else {
    teams.forEach(team => {
      (team.participants || []).filter(Boolean).forEach(p => {
        const rank = p.rank || 0;
        if (rank >= 1 && rank <= 3) {
          winners.push({ name: p.name, teamName: team.teamName, chestNumber: p.chestNumber, rank, points: p.points || 0, score: p.score || 0, grade: p.grade || '' });
        }
      });
    });
  }
  return winners.sort((a, b) => a.rank - b.rank || b.points - a.points || a.name.localeCompare(b.name));
};

export interface GroupEntry {
  name: string;
  teamName: string;
  rank: number;
  points: number;
  score: number;
  grade: string;
}

/**
 * The ranked entries of a group program. A team with more members than membersPerGroup
 * enters several sub-teams ("TEAM A", "TEAM B"), each ranked on its own, so each one has its
 * own place and points (stored on its members). A single group uses the team's own result.
 */
export const getGroupEntries = (program: Pick<Program, 'teams' | 'membersPerGroup'>): GroupEntry[] => {
  const limit = program.membersPerGroup && program.membersPerGroup > 0 ? program.membersPerGroup : 999;
  const entries: GroupEntry[] = [];
  (program.teams || []).filter(Boolean).forEach(team => {
    const members = (team.participants || []).filter(Boolean);
    // Older results stored only the team's result: keep using it.
    if (members.length <= limit || !members.some(m => m.rank !== undefined)) {
      entries.push({ name: team.teamName, teamName: team.teamName, rank: team.rank || 0, points: team.points || 0, score: team.score || 0, grade: team.grade || '' });
      return;
    }
    for (let i = 0; i < members.length; i += limit) {
      const chunk = members.slice(i, i + limit);
      const result = chunk.find(m => m.rank !== undefined) || chunk[0];
      entries.push({
        name: `${team.teamName} ${String.fromCharCode(65 + i / limit)}`,
        teamName: team.teamName,
        rank: result.rank || 0,
        points: result.points || 0,
        score: Number(result.score) || 0,
        grade: result.grade || ''
      });
    }
  });
  return entries;
};

export const winnersByPlace =(winners: ProgramWinner[]): Record<1 | 2 | 3, ProgramWinner[]> => ({
  1: winners.filter(w => w.rank === 1),
  2: winners.filter(w => w.rank === 2),
  3: winners.filter(w => w.rank === 3)
});

/**
 * The zone a team competes in: the single non-General zone of the programs it is registered
 * in, or 'General' when it has none or several.
 */
export const getTeamZones = (programs: Program[]): Record<string, string> => {
  const zonesByTeam: Record<string, Set<string>> = {};
  (programs || []).forEach(program => {
    const zone = getProgramZone(program);
    if (zone === 'General') return;
    (program.teams || []).filter(Boolean).forEach(team => {
      const name = (team.teamName || '').toUpperCase().trim();
      if (!name) return;
      (zonesByTeam[name] ||= new Set()).add(zone);
    });
  });
  const result: Record<string, string> = {};
  Object.entries(zonesByTeam).forEach(([name, zones]) => { result[name] = zones.size === 1 ? [...zones][0] : 'General'; });
  return result;
};
