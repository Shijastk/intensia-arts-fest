import { Program } from '../types';

export interface IndividualChampion {
  participantName: string;
  chestNumber?: string;
  teamName: string;
  totalPoints: number;
  programs: {
    programName: string;
    category: string;
    points: number;
  }[];
}

export function getOverallIndividualChampions(
  programs: Program[]
): IndividualChampion[] {
  const map = new Map<string, IndividualChampion>();

  programs
    .filter(program => program.isGroup === false) // ✅ individual only
    .forEach(program => {
      if (!Array.isArray(program.teams)) return;

      program.teams.forEach(team => {
        if (!Array.isArray(team.participants)) return;

        team.participants.forEach(participant => {
          if (typeof participant.points !== 'number') return;

          const key = `${participant.name}_${team.teamName}`;

          if (!map.has(key)) {
            map.set(key, {
              participantName: participant.name,
              chestNumber: participant.chestNumber,
              teamName: team.teamName,
              totalPoints: 0,
              programs: []
            });
          }

          const entry = map.get(key)!;

          entry.totalPoints += participant.points;
          entry.programs.push({
            programName: program.name,
            category: program.category,
            points: participant.points
          });
        });
      });
    });

  // 🔥 Highest scorer first
  return Array.from(map.values()).sort(
    (a, b) => b.totalPoints - a.totalPoints
  );
}


export interface ProgramEntry {
  programName: string;
  category: string;
  points: number;
}

export interface IndividualChampion {
  participantName: string;
  chestNumber?: string;
  teamName: string;
  totalPoints: number;
  programs: ProgramEntry[];
}

/* ------------------ HELPERS ------------------ */

const isOffStage = (c: string) =>
  c.toLowerCase().includes("no stage") || c.toLowerCase().includes("non stage");
const isAZone = (c: string) => c.toLowerCase().startsWith("a zone");
const isBZone = (c: string) => c.toLowerCase().startsWith("b zone");
const isJunior = (c: string) => c.toLowerCase().includes("junior");
const isSenior = (c: string) => c.toLowerCase().includes("senior");

/* ------------------ CALCULATORS ------------------ */

function sumPoints(
  champion: IndividualChampion,
  filter: (c: string) => boolean
) {
  return champion.programs
    .filter(p => filter(p.category))
    .reduce((sum, p) => sum + p.points, 0);
}

function pickTop(
  data: IndividualChampion[],
  scoreFn: (c: IndividualChampion) => number
) {
  let best: IndividualChampion | null = null;
  let bestScore = -Infinity;

  for (const c of data) {
    const score = scoreFn(c);
    if (score > bestScore) {
      bestScore = score;
      best = { ...c, totalPoints: score };
    }
  }

  return best;
}

/* ------------------ EXPORTS ------------------ */

export function getChampions(individualChampions: IndividualChampion[]) {
  return {
    // 🏆 OVERALL
    overall: pickTop(individualChampions, c => c.totalPoints),

    // 🎭 OVERALL OFF STAGE
    overallOffStage: pickTop(
      individualChampions,
      c => sumPoints(c, isOffStage)
    ),

    // 🅰️ A ZONE
    aZoneOverall: pickTop(
      individualChampions,
      c => sumPoints(c, isAZone)
    ),

    aZoneOffStage: pickTop(
      individualChampions,
      c => sumPoints(c, cat => isAZone(cat) && isOffStage(cat))
    ),

    // 🅱️ B ZONE
    bZoneOverall: pickTop(
      individualChampions,
      c => sumPoints(c, isBZone)
    ),

    bZoneOffStage: pickTop(
      individualChampions,
      c => sumPoints(c, cat => isBZone(cat) && isOffStage(cat))
    ),

    bZoneJunior: pickTop(
      individualChampions,
      c => sumPoints(c, cat => isBZone(cat) && isJunior(cat))
    ),

    bZoneSenior: pickTop(
      individualChampions,
      c => sumPoints(c, cat => isBZone(cat) && isSenior(cat))
    )
  };
}
