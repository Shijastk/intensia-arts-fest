import { Program } from '../types';

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

const isOffStage = (category: string) => {
  const lowerCategory = category.toLowerCase();
  return lowerCategory.includes('no stage') || lowerCategory.includes('non stage') || lowerCategory.includes('off stage');
};

const isAZone = (category: string) => category.toLowerCase().startsWith('a zone');
const isBZone = (category: string) => category.toLowerCase().startsWith('b zone');
const isJunior = (category: string) => category.toLowerCase().includes('junior');
const isSenior = (category: string) => category.toLowerCase().includes('senior');

const sumPoints = (
  champion: IndividualChampion,
  filter: (category: string) => boolean
) => {
  return champion.programs
    .filter(program => filter(program.category))
    .reduce((sum, program) => sum + program.points, 0);
};

const pickTop = (
  data: IndividualChampion[],
  scoreFn: (champion: IndividualChampion) => number
) => {
  let best: IndividualChampion | null = null;
  let bestScore = 0;

  data.forEach(champion => {
    const score = scoreFn(champion);
    if (score > bestScore) {
      bestScore = score;
      best = { ...champion, totalPoints: score };
    }
  });

  return best;
};

export function getOverallIndividualChampions(programs: Program[]): IndividualChampion[] {
  const champions = new Map<string, IndividualChampion>();

  programs
    .filter(program => !program.isGroup)
    .forEach(program => {
      program.teams.forEach(team => {
        team.participants.forEach(participant => {
          if (typeof participant.points !== 'number') return;

          const key = `${participant.name}_${team.teamName}`;
          const entry = champions.get(key) || {
            participantName: participant.name,
            chestNumber: participant.chestNumber,
            teamName: team.teamName,
            totalPoints: 0,
            programs: [],
          };

          entry.totalPoints += participant.points;
          entry.programs.push({
            programName: program.name,
            category: program.category,
            points: participant.points,
          });
          champions.set(key, entry);
        });
      });
    });

  return Array.from(champions.values()).sort((a, b) => b.totalPoints - a.totalPoints);
}

export function getChampions(individualChampions: IndividualChampion[]) {
  return {
    overall: pickTop(individualChampions, champion => champion.totalPoints),
    overallOffStage: pickTop(individualChampions, champion => sumPoints(champion, isOffStage)),
    aZoneOverall: pickTop(individualChampions, champion => sumPoints(champion, isAZone)),
    aZoneOffStage: pickTop(individualChampions, champion => sumPoints(champion, category => isAZone(category) && isOffStage(category))),
    bZoneOverall: pickTop(individualChampions, champion => sumPoints(champion, isBZone)),
    bZoneOffStage: pickTop(individualChampions, champion => sumPoints(champion, category => isBZone(category) && isOffStage(category))),
    bZoneJunior: pickTop(individualChampions, champion => sumPoints(champion, category => isBZone(category) && isJunior(category))),
    bZoneSenior: pickTop(individualChampions, champion => sumPoints(champion, category => isBZone(category) && isSenior(category))),
  };
}
