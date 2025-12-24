import { Program, ProgramStatus } from '../types';

// Helper types for granular stats
export interface CategoryChampion {
    name: string;
    points: number;
    chestNumber: string;
    teamName: string;
    programCount: number;
}

export interface ZoneStats {
    name: string; // "A Zone", "B Zone", "C Zone"
    leadingTeam: { name: string; score: number } | null;
    teamScores: Record<string, number>;
    kalaPrathibha: CategoryChampion | null;
    sargaPrathibha: CategoryChampion | null;
    categories: Record<string, { // "Junior", "Senior"
        kalaPrathibha: CategoryChampion | null;
        sargaPrathibha: CategoryChampion | null;
    }>;
}

export interface LeaderboardStats {
    leadingTeam: {
        name: string;
        score: number;
    } | null;
    trailingTeam: {
        name: string;
        score: number;
    } | null;
    margin: number;
    teamScores: Record<string, number>;
    sarkhaPrathibha: CategoryChampion | null;
    kalaPrathibha: CategoryChampion | null;
    // New granular stats
    zones: Record<string, ZoneStats>;
}

const POINTS = {
    1: 10,
    2: 7,
    3: 5
};

export const calculateLeaderboardStats = (programs: Program[]): LeaderboardStats => {
    // Global Stats
    const globalTeamScores: Record<string, number> = { 'PRUDENTIA': 0, 'SAPIENTIA': 0 };
    const globalParticipants: Record<string, any> = {};

    // Zone Stats Container
    const zones: Record<string, ZoneStats> = {
        'A': { name: 'A Zone', leadingTeam: null, teamScores: { 'PRUDENTIA': 0, 'SAPIENTIA': 0 }, kalaPrathibha: null, sargaPrathibha: null, categories: {} },
        'B': { name: 'B Zone', leadingTeam: null, teamScores: { 'PRUDENTIA': 0, 'SAPIENTIA': 0 }, kalaPrathibha: null, sargaPrathibha: null, categories: { 'Junior': { kalaPrathibha: null, sargaPrathibha: null }, 'Senior': { kalaPrathibha: null, sargaPrathibha: null } } },
        'C': { name: 'C Zone', leadingTeam: null, teamScores: { 'PRUDENTIA': 0, 'SAPIENTIA': 0 }, kalaPrathibha: null, sargaPrathibha: null, categories: { 'Junior': { kalaPrathibha: null, sargaPrathibha: null }, 'Senior': { kalaPrathibha: null, sargaPrathibha: null } } }
    };

    // Helper to process participant points
    const processParticipant = (
        p: any,
        teamName: string,
        points: number,
        isOffStage: boolean,
        isGeneral: boolean,
        zoneKey: string,
        categoryKey: string
    ) => {
        const key = p.chestNumber;

        // 1. Global Kala/Sarga Accumulation
        if (!globalParticipants[key]) {
            globalParticipants[key] = {
                name: p.name, chestNumber: p.chestNumber, teamName,
                kalaPoints: 0, sargaPoints: 0,
                programCount: 0
            };
        }

        if (!isGeneral) {
            globalParticipants[key].kalaPoints += points;
            globalParticipants[key].programCount++;
            if (isOffStage) {
                globalParticipants[key].sargaPoints += points;
            }
        }

        // 2. Zone & Category Accumulation
        // We need a separate structure to track points PER ZONE/CATEGORY for each participant
        // because a participant *might* theoretically cross zones (unlikely but possible in code)
        // We'll attach a temporary data structure to the zone object for calculation
        if (!zones[zoneKey]) return; // logic guard

        const zoneObj = zones[zoneKey] as any;
        if (!zoneObj._participants) zoneObj._participants = {};

        if (!zoneObj._participants[key]) {
            zoneObj._participants[key] = {
                name: p.name, chestNumber: p.chestNumber, teamName,
                kalaPoints: 0, sargaPoints: 0,
                programCount: 0,
                category: categoryKey
            };
        }

        if (!isGeneral) {
            zoneObj._participants[key].kalaPoints += points;
            zoneObj._participants[key].programCount++;
            if (isOffStage) {
                zoneObj._participants[key].sargaPoints += points;
            }
        }
    };

    programs.forEach(program => {
        if (program.status !== ProgramStatus.COMPLETED) return;

        const catLower = program.category.toLowerCase();

        // Determine Zone
        let zoneKey = '';
        if (catLower.includes('a zone')) zoneKey = 'A';
        else if (catLower.includes('b zone')) zoneKey = 'B';
        else if (catLower.includes('c zone')) zoneKey = 'C';

        // Determine Sub-Category (Junior/Senior)
        let categoryKey = '';
        if (catLower.includes('junior')) categoryKey = 'Junior';
        else if (catLower.includes('senior')) categoryKey = 'Senior';

        // Determine Type
        const isGeneral = catLower.includes('general') || program.name.toLowerCase().includes('general');
        const isOffStage = catLower.includes('no stage') || catLower.includes('non stage') || catLower.includes('off stage');

        program.teams.forEach(team => {
            // Process Team Points if valid rank
            if (team.rank && POINTS[team.rank as keyof typeof POINTS]) {
                const points = POINTS[team.rank as keyof typeof POINTS];
                let teamName = team.teamName;

                // Normalizing Team Names
                if (teamName === 'Team Alpha') teamName = 'PRUDENTIA';
                if (teamName === 'Team Beta') teamName = 'SAPIENTIA';

                // Update Global Team Score
                if (globalTeamScores[teamName] !== undefined) {
                    globalTeamScores[teamName] += points;
                }

                // Update Zone Team Score
                if (zoneKey && zones[zoneKey] && zones[zoneKey].teamScores[teamName] !== undefined) {
                    zones[zoneKey].teamScores[teamName] += points;
                }

                // Process Individual Points
                team.participants.forEach(p => {
                    const actualPoints = p.points || 0;
                    processParticipant(p, teamName, actualPoints, isOffStage, isGeneral, zoneKey, categoryKey);
                });
            }
        });
    });

    // --- Finalize Results ---

    // 1. Global Leaders
    const globalTeams = Object.entries(globalTeamScores).map(([name, score]) => ({ name, score }));
    globalTeams.sort((a, b) => b.score - a.score);

    // 2. Global Champions (Kala/Sarga)
    const allParticipants = Object.values(globalParticipants);
    const globalKala = [...allParticipants].sort((a, b) => b.kalaPoints - a.kalaPoints)[0];
    const globalSarga = [...allParticipants].sort((a, b) => b.sargaPoints - a.sargaPoints)[0];

    // 3. Process Zone Stats
    Object.keys(zones).forEach(zKey => {
        const zone = zones[zKey] as any;
        // Determine Zone Leader
        const zTeams = Object.entries(zone.teamScores as Record<string, number>).map(([name, score]) => ({ name, score }));
        zTeams.sort((a, b) => b.score - a.score);
        zone.leadingTeam = zTeams[0];

        // Process Participants in this Zone
        const zParticipants = Object.values(zone._participants || {}) as any[];

        if (zParticipants.length > 0) {
            // Zone Kala Prathibha (Overall for Zone)
            const zKala = [...zParticipants].sort((a, b) => b.kalaPoints - a.kalaPoints)[0];
            zone.kalaPrathibha = zKala ? { ...zKala, points: zKala.kalaPoints } : null;

            // Zone Sarga Prathibha (Offstage for Zone)
            const zSarga = [...zParticipants].sort((a, b) => b.sargaPoints - a.sargaPoints)[0];
            zone.sargaPrathibha = zSarga ? { ...zSarga, points: zSarga.sargaPoints } : null;

            // Process Categories (Junior/Senior)
            if (zone.categories) {
                Object.keys(zone.categories).forEach(catKey => {
                    const catParticipants = zParticipants.filter(p => p.category === catKey);

                    if (catParticipants.length > 0) {
                        const cKala = [...catParticipants].sort((a, b) => b.kalaPoints - a.kalaPoints)[0];
                        const cSarga = [...catParticipants].sort((a, b) => b.sargaPoints - a.sargaPoints)[0];

                        zone.categories[catKey].kalaPrathibha = cKala ? { ...cKala, points: cKala.kalaPoints } : null;
                        zone.categories[catKey].sargaPrathibha = cSarga ? { ...cSarga, points: cSarga.sargaPoints } : null;
                    }
                });
            }
        }

        // Cleanup temp data
        delete zone._participants;
    });

    const formatChampion = (c: any): CategoryChampion | null => {
        if (!c || c.kalaPoints === 0) return null; // Filter out zero points
        return {
            name: c.name,
            points: c.kalaPoints,
            chestNumber: c.chestNumber,
            teamName: c.teamName,
            programCount: c.programCount
        };
    };

    const formatSargaChampion = (c: any): CategoryChampion | null => {
        if (!c || c.sargaPoints === 0) return null;
        return {
            name: c.name,
            points: c.sargaPoints,
            chestNumber: c.chestNumber,
            teamName: c.teamName,
            programCount: c.programCount
        };
    };

    return {
        leadingTeam: globalTeams[0],
        trailingTeam: globalTeams[1] || { name: 'N/A', score: 0 },
        margin: globalTeams[0].score - (globalTeams[1]?.score || 0),
        teamScores: globalTeamScores,
        kalaPrathibha: formatChampion(globalKala),
        sarkhaPrathibha: formatSargaChampion(globalSarga),
        zones // The granular data
    };
};
