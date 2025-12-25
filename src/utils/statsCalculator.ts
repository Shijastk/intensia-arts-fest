// import { Program, ProgramStatus } from '../types';

// // Helper types for granular stats
// export interface CategoryChampion {
//     name: string;
//     points: number;
//     chestNumber: string;
//     teamName: string;
//     programCount: number;
// }

// export interface ZoneStats {
//     name: string; // "A Zone", "B Zone", "C Zone"
//     leadingTeam: { name: string; score: number } | null;
//     teamScores: Record<string, number>;
//     kalaPrathibha: CategoryChampion | null;
//     sargaPrathibha: CategoryChampion | null;
//     categories: Record<string, { // "Junior", "Senior"
//         kalaPrathibha: CategoryChampion | null;
//         sargaPrathibha: CategoryChampion | null;
//     }>;
// }

// export interface LeaderboardStats {
//     leadingTeam: {
//         name: string;
//         score: number;
//     } | null;
//     trailingTeam: {
//         name: string;
//         score: number;
//     } | null;
//     margin: number;
//     teamScores: Record<string, number>;
//     sarkhaPrathibha: CategoryChampion | null;
//     kalaPrathibha: CategoryChampion | null;
//     // New granular stats
//     zones: Record<string, ZoneStats>;
// }

// const POINTS = {
//     1: 10,
//     2: 7,
//     3: 5
// };

// export const calculateLeaderboardStats = (programs: Program[]): LeaderboardStats => {
//     // Global Stats
//     const globalTeamScores: Record<string, number> = { 'PRUDENTIA': 0, 'SAPIENTIA': 0 };
//     const globalParticipants: Record<string, any> = {};

//     // Zone Stats Container
//     const zones: Record<string, ZoneStats> = {
//         'A': { name: 'A Zone', leadingTeam: null, teamScores: { 'PRUDENTIA': 0, 'SAPIENTIA': 0 }, kalaPrathibha: null, sargaPrathibha: null, categories: {} },
//         'B': { name: 'B Zone', leadingTeam: null, teamScores: { 'PRUDENTIA': 0, 'SAPIENTIA': 0 }, kalaPrathibha: null, sargaPrathibha: null, categories: { 'Junior': { kalaPrathibha: null, sargaPrathibha: null }, 'Senior': { kalaPrathibha: null, sargaPrathibha: null } } },
//         'C': { name: 'C Zone', leadingTeam: null, teamScores: { 'PRUDENTIA': 0, 'SAPIENTIA': 0 }, kalaPrathibha: null, sargaPrathibha: null, categories: { 'Junior': { kalaPrathibha: null, sargaPrathibha: null }, 'Senior': { kalaPrathibha: null, sargaPrathibha: null } } }
//     };

//     // Helper to process participant points
//     const processParticipant = (
//         p: any,
//         teamName: string,
//         points: number,
//         isOffStage: boolean,
//         isGeneral: boolean,
//         zoneKey: string,
//         categoryKey: string
//     ) => {
//         const key = p.chestNumber;

//         // 1. Global Kala/Sarga Accumulation
//         if (!globalParticipants[key]) {
//             globalParticipants[key] = {
//                 name: p.name, chestNumber: p.chestNumber, teamName,
//                 kalaPoints: 0, sargaPoints: 0,
//                 programCount: 0
//             };
//         }

//         if (!isGeneral) {
//             globalParticipants[key].kalaPoints += points;
//             globalParticipants[key].programCount++;
//             if (isOffStage) {
//                 globalParticipants[key].sargaPoints += points;
//             }
//         }

//         // 2. Zone & Category Accumulation
//         // We need a separate structure to track points PER ZONE/CATEGORY for each participant
//         // because a participant *might* theoretically cross zones (unlikely but possible in code)
//         // We'll attach a temporary data structure to the zone object for calculation
//         if (!zones[zoneKey]) return; // logic guard

//         const zoneObj = zones[zoneKey] as any;
//         if (!zoneObj._participants) zoneObj._participants = {};

//         if (!zoneObj._participants[key]) {
//             zoneObj._participants[key] = {
//                 name: p.name, chestNumber: p.chestNumber, teamName,
//                 kalaPoints: 0, sargaPoints: 0,
//                 programCount: 0,
//                 category: categoryKey
//             };
//         }

//         if (!isGeneral) {
//             zoneObj._participants[key].kalaPoints += points;
//             zoneObj._participants[key].programCount++;
//             if (isOffStage) {
//                 zoneObj._participants[key].sargaPoints += points;
//             }
//         }
//     };

//     programs.forEach(program => {
//         if (program.status !== ProgramStatus.COMPLETED) return;

//         const catLower = program.category.toLowerCase();

//         // Determine Zone
//         let zoneKey = '';
//         if (catLower.includes('a zone')) zoneKey = 'A';
//         else if (catLower.includes('b zone')) zoneKey = 'B';
//         else if (catLower.includes('c zone')) zoneKey = 'C';

//         // Determine Sub-Category (Junior/Senior)
//         let categoryKey = '';
//         if (catLower.includes('junior')) categoryKey = 'Junior';
//         else if (catLower.includes('senior')) categoryKey = 'Senior';

//         // Determine Type
//         const isGeneral = catLower.includes('general') || program.name.toLowerCase().includes('general');
//         const isOffStage = catLower.includes('no stage') || catLower.includes('non stage') || catLower.includes('off stage');

//         program.teams.forEach(team => {
//             // Process Team Points if valid rank
//             if (team.rank && POINTS[team.rank as keyof typeof POINTS]) {
//                 const points = POINTS[team.rank as keyof typeof POINTS];
//                 let teamName = team.teamName;

//                 // Normalizing Team Names
//                 if (teamName === 'Team Alpha') teamName = 'PRUDENTIA';
//                 if (teamName === 'Team Beta') teamName = 'SAPIENTIA';

//                 // Update Global Team Score
//                 if (globalTeamScores[teamName] !== undefined) {
//                     globalTeamScores[teamName] += points;
//                 }

//                 // Update Zone Team Score
//                 if (zoneKey && zones[zoneKey] && zones[zoneKey].teamScores[teamName] !== undefined) {
//                     zones[zoneKey].teamScores[teamName] += points;
//                 }

//                 // Process Individual Points
//                 team.participants.forEach(p => {
//                     const actualPoints = p.points || 0;
//                     processParticipant(p, teamName, actualPoints, isOffStage, isGeneral, zoneKey, categoryKey);
//                 });
//             }
//         });
//     });

//     // --- Finalize Results ---

//     // 1. Global Leaders
//     const globalTeams = Object.entries(globalTeamScores).map(([name, score]) => ({ name, score }));
//     globalTeams.sort((a, b) => b.score - a.score);

//     // 2. Global Champions (Kala/Sarga)
//     const allParticipants = Object.values(globalParticipants);
//     const globalKala = [...allParticipants].sort((a, b) => b.kalaPoints - a.kalaPoints)[0];
//     const globalSarga = [...allParticipants].sort((a, b) => b.sargaPoints - a.sargaPoints)[0];

//     // 3. Process Zone Stats
//     Object.keys(zones).forEach(zKey => {
//         const zone = zones[zKey] as any;
//         // Determine Zone Leader
//         const zTeams = Object.entries(zone.teamScores as Record<string, number>).map(([name, score]) => ({ name, score }));
//         zTeams.sort((a, b) => b.score - a.score);
//         zone.leadingTeam = zTeams[0];

//         // Process Participants in this Zone
//         const zParticipants = Object.values(zone._participants || {}) as any[];

//         if (zParticipants.length > 0) {
//             // Zone Kala Prathibha (Overall for Zone)
//             const zKala = [...zParticipants].sort((a, b) => b.kalaPoints - a.kalaPoints)[0];
//             zone.kalaPrathibha = zKala ? { ...zKala, points: zKala.kalaPoints } : null;

//             // Zone Sarga Prathibha (Offstage for Zone)
//             const zSarga = [...zParticipants].sort((a, b) => b.sargaPoints - a.sargaPoints)[0];
//             zone.sargaPrathibha = zSarga ? { ...zSarga, points: zSarga.sargaPoints } : null;

//             // Process Categories (Junior/Senior)
//             if (zone.categories) {
//                 Object.keys(zone.categories).forEach(catKey => {
//                     const catParticipants = zParticipants.filter(p => p.category === catKey);

//                     if (catParticipants.length > 0) {
//                         const cKala = [...catParticipants].sort((a, b) => b.kalaPoints - a.kalaPoints)[0];
//                         const cSarga = [...catParticipants].sort((a, b) => b.sargaPoints - a.sargaPoints)[0];

//                         zone.categories[catKey].kalaPrathibha = cKala ? { ...cKala, points: cKala.kalaPoints } : null;
//                         zone.categories[catKey].sargaPrathibha = cSarga ? { ...cSarga, points: cSarga.sargaPoints } : null;
//                     }
//                 });
//             }
//         }

//         // Cleanup temp data
//         delete zone._participants;
//     });

//     const formatChampion = (c: any): CategoryChampion | null => {
//         if (!c || c.kalaPoints === 0) return null; // Filter out zero points
//         return {
//             name: c.name,
//             points: c.kalaPoints,
//             chestNumber: c.chestNumber,
//             teamName: c.teamName,
//             programCount: c.programCount
//         };
//     };

//     const formatSargaChampion = (c: any): CategoryChampion | null => {
//         if (!c || c.sargaPoints === 0) return null;
//         return {
//             name: c.name,
//             points: c.sargaPoints,
//             chestNumber: c.chestNumber,
//             teamName: c.teamName,
//             programCount: c.programCount
//         };
//     };

//     return {
//         leadingTeam: globalTeams[0],
//         trailingTeam: globalTeams[1] || { name: 'N/A', score: 0 },
//         margin: globalTeams[0].score - (globalTeams[1]?.score || 0),
//         teamScores: globalTeamScores,
//         kalaPrathibha: formatChampion(globalKala),
//         sarkhaPrathibha: formatSargaChampion(globalSarga),
//         zones // The granular data
//     };
// };


// ====================================================================
// INTERFACE DEFINITIONS
// ====================================================================
// ====================================================================
// INTERFACE DEFINITIONS
// ====================================================================
export enum ProgramStatus {
  PENDING = 'PENDING',
  JUDGING = 'JUDGING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface Participant {
  name: string;
  chestNumber: string;
  points?: number;
  codeLetter?: string;
  grade?: string;
  rank?: number;
  score?: number;
  isCodeRevealed?: boolean;
}

export interface Team {
  id: string;
  teamName: string;
  participants: Participant[];
  points?: number;
  score?: number;
  rank?: number;
  grade?: string;
}

export interface Program {
  id: string;
  name: string;
  category: string;
  status: ProgramStatus;
  teams: Team[];
  isGroup: boolean;
  isPublished?: boolean;
  isAllocatedToJudge?: boolean;
  participantsCount?: number;
  judgePanel?: string;
  venue?: string;
  startTime?: string;
  description?: string;
  createdAt?: any;
  updatedAt?: any;
  groupCount?: number;
  membersPerGroup?: number;
}

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
  teamScores: { [key: string]: number };
  leadingTeam: TeamScore | null;
  kalaPrathibha: CategoryChampion | null;
  sargaPrathibha: CategoryChampion | null;
  categories: { [key: string]: {
    kalaPrathibha: CategoryChampion | null;
    sargaPrathibha: CategoryChampion | null;
  }};
}

export interface LeaderboardStats {
  leadingTeam: TeamScore;
  trailingTeam: TeamScore | null;
  kalaPrathibha: CategoryChampion | null;
  sarkhaPrathibha: CategoryChampion | null;
  zones: { [key: string]: ZoneStats };
}

// ====================================================================
// CORE LOGIC FUNCTIONS
// ====================================================================

/**
 * Calculates the total scores for two teams (PRUDENTIA, SAPIENTIA) within a specific zone.
 * Uses correct scoring: Sum of all participants' points, but only one per codeLetter per event.
 */
const calculateZoneScores = (programs: Program[], targetZone: string): { [key: string]: number } => {
  
  const scores: { [key: string]: number } = {
    "PRUDENTIA": 0,
    "SAPIENTIA": 0,
  };

  
  // 1. Filter events by 'COMPLETED' status and target zone
  const completedTargetZoneEvents = programs.filter(
    (event) =>
      event.status === ProgramStatus.COMPLETED &&
      event.category.toLowerCase().includes(targetZone.toLowerCase())
  );

  for (const event of completedTargetZoneEvents) {
    for (const team of event.teams) {
      const teamName = team.teamName.toUpperCase();
      if (!(teamName in scores)) continue;

      let eventPoints = 0;

      // 2. CORRECTED SCORING LOGIC
      if (event.isGroup) {
        // Logic for Group Events: 
        if (event.name?.toLowerCase().includes('quiz')) {
          // For quiz events: Take one participant per code letter
          const participants = team.participants || [];
          const uniqueByCodeLetter = new Map<string, number>();
          
          participants.forEach(p => {
            const codeLetter = p.codeLetter || '';
            const points = p.points || 0;
            if (codeLetter && !uniqueByCodeLetter.has(codeLetter)) {
              uniqueByCodeLetter.set(codeLetter, points);
            }
          });
          
          eventPoints = Array.from(uniqueByCodeLetter.values()).reduce((sum, points) => sum + points, 0);
        } else {
          // For other group events: Use team.points or sum of all participants' points
          if (team.points !== undefined) {
            eventPoints = team.points;
          } else {
            // Fallback: sum all participants' points
            const participants = team.participants || [];
            eventPoints = participants.reduce((sum, p) => sum + (p.points || 0), 0);
          }
        }
      } else {
        // Logic for Individual Events: 
        // Sum of all participants' points, but only one per codeLetter
        const participants = team.participants || [];
        const uniqueByCodeLetter = new Map<string, number>();
        
        participants.forEach(p => {
          const codeLetter = p.codeLetter || '';
          const points = p.points || 0;
          if (codeLetter && !uniqueByCodeLetter.has(codeLetter)) {
            uniqueByCodeLetter.set(codeLetter, points);
          }
        });
        
        eventPoints = Array.from(uniqueByCodeLetter.values()).reduce((sum, points) => sum + points, 0);
      }

      scores[teamName] += eventPoints;
    }
  }

  // Format the scores to one decimal place
  const formattedScores: { [key: string]: number } = {};
  for (const team in scores) {
    formattedScores[team] = parseFloat(scores[team].toFixed(1));
  }

  return formattedScores;
};

/**
 * Aggregates individual scores based on filters to find toppers.
 * IMPORTANT: For this function, we sum ALL participant points (not deduplicated by codeLetter)
 * because this is for individual champion calculations.
 */
function aggregateIndividualScores(
  programs: Program[],
  zoneFilter: RegExp,
  nonStageOnly: boolean = false
): { name: string; chestNumber: string; teamName: string; totalPoints: number }[] {
  const individualScores = new Map<string, { 
    name: string; 
    chestNumber: string; 
    teamName: string; 
    totalPoints: number; 
  }>(); 

  const filteredPrograms = programs.filter(program => 
    program.status === ProgramStatus.COMPLETED &&
    program.isGroup === false && // Only individual programs
    zoneFilter.test(program.category) &&
    (!nonStageOnly || program.category.toLowerCase().includes('no stage') || program.category.toLowerCase().includes('non stage'))
  );

  filteredPrograms.forEach(program => {
    program.teams.forEach(team => {
      team.participants.forEach(participant => {
        const points = participant.points || 0;
        if (points > 0 && participant.chestNumber) {
          const chestNumber = participant.chestNumber;

          const currentScore = individualScores.get(chestNumber) || {
            name: participant.name,
            chestNumber: chestNumber,
            teamName: team.teamName,
            totalPoints: 0,
          };

          currentScore.totalPoints += points;
          individualScores.set(chestNumber, currentScore);
        }
      });
    });
  });
  
  // Sort and map to the required output format
  return Array.from(individualScores.values()).map(s => ({
    name: s.name,
    chestNumber: s.chestNumber,
    teamName: s.teamName,
    totalPoints: parseFloat(s.totalPoints.toFixed(1))
  })).sort((a, b) => b.totalPoints - a.totalPoints);
}

/**
 * Helper function to get all zones from program categories
 */
const getAllZones = (programs: Program[]): string[] => {
  const zones = new Set<string>();
  
  programs.forEach(program => {
    const category = program.category || '';
    // Extract zone letter from category (e.g., "A zone no stage" -> "A")
    const match = category.match(/^([A-Z])\s+zone/i);
    if (match && match[1]) {
      zones.add(match[1].toUpperCase());
    }
  });
  
  return Array.from(zones).sort();
};

/**
 * Helper function to extract category type from full category string
 */
const extractCategoryType = (category: string, zoneKey: string): string => {
  // Remove zone prefix and any extra whitespace
  const withoutZone = category.replace(new RegExp(`${zoneKey}\\s*zone`, 'i'), '').trim();
  
  // If there's nothing left, return 'general'
  if (!withoutZone) return 'general';
  
  // Return the remaining category type
  return withoutZone.toLowerCase();
};

/**
 * Main function to calculate all leaderboard statistics.
 */
export const calculateLeaderboardStats = (programs: Program[]): LeaderboardStats => {
  const allTeams = ['PRUDENTIA', 'SAPIENTIA'];
  const zoneKeys = getAllZones(programs);
  
  const overallScores: { [key: string]: number } = {
    'PRUDENTIA': 0,
    'SAPIENTIA': 0,
  };
  
  const zoneStats: { [key: string]: ZoneStats } = {};

  // 1. Calculate scores for each zone using the corrected scoring logic
  for (const zoneKey of zoneKeys) {
    const teamScores = calculateZoneScores(programs, zoneKey);

    const fullTeamScores: { [key: string]: number } = {};
    allTeams.forEach(teamName => {
      const score = teamScores[teamName] ?? 0;
      fullTeamScores[teamName] = score;
      overallScores[teamName] += score;
    });

    // Determine leading team for the zone
    const scoresArray = Object.entries(fullTeamScores).map(([name, score]) => ({ name, score }));
    scoresArray.sort((a, b) => b.score - a.score);

    const leadingTeam = scoresArray.length > 0 && scoresArray[0].score > 0 ? scoresArray[0] : null;

    // 2. Calculate Individual Toppers for the zone
    let zoneKP: CategoryChampion | null = null;
    let zoneSP: CategoryChampion | null = null;
    
    const zoneRegex = new RegExp(`^${zoneKey}\\s*zone`, 'i');
    
    const zoneOverallToppers = aggregateIndividualScores(programs, zoneRegex, false);
    const topKP = zoneOverallToppers[0];
    if (topKP) zoneKP = { ...topKP, points: topKP.totalPoints };

    const zoneNonStageToppers = aggregateIndividualScores(programs, zoneRegex, true);
    const topSP = zoneNonStageToppers[0];
    if (topSP) zoneSP = { ...topSP, points: topSP.totalPoints };

    // 3. Calculate category-level champions
    const categories: { [key: string]: { 
      kalaPrathibha: CategoryChampion | null; 
      sargaPrathibha: CategoryChampion | null;
    }} = {};
    
    // Get all categories in this zone
    const zonePrograms = programs.filter(p => 
      p.status === ProgramStatus.COMPLETED && 
      zoneRegex.test(p.category)
    );
    
    const zoneCategories = new Set<string>();
    zonePrograms.forEach(p => {
      const categoryType = extractCategoryType(p.category, zoneKey);
      zoneCategories.add(categoryType);
    });
    
    // For each category, find champions
    zoneCategories.forEach(categoryType => {
      // Create regex that matches this specific zone + category type
      const categoryRegex = new RegExp(`^${zoneKey}\\s*zone.*${categoryType.replace(/\s+/g, '.*')}`, 'i');
      
      const categoryOverallToppers = aggregateIndividualScores(programs, categoryRegex, false);
      const categoryNonStageToppers = aggregateIndividualScores(programs, categoryRegex, true);
      
      categories[categoryType] = {
        kalaPrathibha: categoryOverallToppers[0] ? { 
          ...categoryOverallToppers[0], 
          points: categoryOverallToppers[0].totalPoints 
        } : null,
        sargaPrathibha: categoryNonStageToppers[0] ? { 
          ...categoryNonStageToppers[0], 
          points: categoryNonStageToppers[0].totalPoints 
        } : null,
      };
    });

    zoneStats[zoneKey] = {
      name: `${zoneKey} Zone`,
      teamScores: fullTeamScores,
      leadingTeam: leadingTeam,
      kalaPrathibha: zoneKP,
      sargaPrathibha: zoneSP,
      categories: categories,
    };
  }

  // 4. Calculate Overall Festival Leaderboard and Toppers
  const overallScoresArray = Object.entries(overallScores).map(([name, score]) => ({ 
    name, 
    score: parseFloat(score.toFixed(1)) 
  }));
  
  overallScoresArray.sort((a, b) => b.score - a.score);

  const leadingTeam = overallScoresArray[0] ?? { name: '', score: 0 };
  const trailingTeam = overallScoresArray.length > 1 ? overallScoresArray[1] : null;

  // Calculate overall champions
  const overallToppers = aggregateIndividualScores(programs, /./i, false);
  const overallKP = overallToppers[0];
  
  const overallNonStageToppers = aggregateIndividualScores(programs, /./i, true);
  const overallSP = overallNonStageToppers[0];

  return {
    leadingTeam,
    trailingTeam,
    kalaPrathibha: overallKP ? { 
      ...overallKP, 
      points: overallKP.totalPoints 
    } : null,
    sarkhaPrathibha: overallSP ? { 
      ...overallSP, 
      points: overallSP.totalPoints 
    } : null,
    zones: zoneStats,
  };
};

/**
 * SIMPLIFIED Utility function to get detailed team scores per event (for debugging)
 */
export const getDetailedTeamScores = (programs: Program[]): {
  prudentia: { [eventKey: string]: number },
  sapientia: { [eventKey: string]: number },
  totals: { prudentia: number, sapientia: number }
} => {
  const detailedScores = {
    prudentia: {} as { [eventKey: string]: number },
    sapientia: {} as { [eventKey: string]: number },
    totals: { prudentia: 0, sapientia: 0 }
  };

  const completedEvents = programs.filter(p => p.status === ProgramStatus.COMPLETED);

  completedEvents.forEach(event => {
    // Create unique event key that includes category and name
    const eventKey = `${event.category}: ${event.name}`;
    
    let prudentiaPoints = 0;
    let sapientiaPoints = 0;

    event.teams.forEach(team => {
      const teamName = team.teamName.toUpperCase();
      let eventPoints = 0;

      if (event.isGroup) {
        if (event.name?.toLowerCase().includes('quiz')) {
          // For quiz events: deduplicate by codeLetter
          const participants = team.participants || [];
          const uniqueByCodeLetter = new Map<string, number>();
          
          participants.forEach(p => {
            const codeLetter = p.codeLetter || '';
            const points = p.points || 0;
            if (codeLetter && !uniqueByCodeLetter.has(codeLetter)) {
              uniqueByCodeLetter.set(codeLetter, points);
            }
          });
          
          eventPoints = Array.from(uniqueByCodeLetter.values()).reduce((sum, points) => sum + points, 0);
        } else {
          // For other group events
          if (team.points !== undefined) {
            eventPoints = team.points;
          } else {
            const participants = team.participants || [];
            eventPoints = participants.reduce((sum, p) => sum + (p.points || 0), 0);
          }
        }
      } else {
        // For individual events: deduplicate by codeLetter
        const participants = team.participants || [];
        const uniqueByCodeLetter = new Map<string, number>();
        
        participants.forEach(p => {
          const codeLetter = p.codeLetter || '';
          const points = p.points || 0;
          if (codeLetter && !uniqueByCodeLetter.has(codeLetter)) {
            uniqueByCodeLetter.set(codeLetter, points);
          }
        });
        
        eventPoints = Array.from(uniqueByCodeLetter.values()).reduce((sum, points) => sum + points, 0);
      }

      if (teamName === 'PRUDENTIA') {
        detailedScores.prudentia[eventKey] = eventPoints;
        prudentiaPoints = eventPoints;
        detailedScores.totals.prudentia += eventPoints;
      } else if (teamName === 'SAPIENTIA') {
        detailedScores.sapientia[eventKey] = eventPoints;
        sapientiaPoints = eventPoints;
        detailedScores.totals.sapientia += eventPoints;
      }
    });
  });

  // Format totals to one decimal place
  detailedScores.totals.prudentia = parseFloat(detailedScores.totals.prudentia.toFixed(1));
  detailedScores.totals.sapientia = parseFloat(detailedScores.totals.sapientia.toFixed(1));

  return detailedScores;
};