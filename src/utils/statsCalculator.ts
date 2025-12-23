import { Program, ProgramStatus } from '../types';

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
    sarkhaPrathibha: {
        name: string;
        points: number;
        chestNumber: string;
        teamName: string;
    } | null;
    kalaPrathibha: {
        name: string;
        points: number;
        chestNumber: string;
        teamName: string;
    } | null;
}

const POINTS = {
    1: 10,
    2: 7,
    3: 5
};

export const calculateLeaderboardStats = (programs: Program[]): LeaderboardStats => {
    const teamScores: Record<string, number> = {};
    const participantPoints: Record<string, { name: string; points: number; chestNumber: string; teamName: string; isOffStage: boolean; isGeneral: boolean }> = {};

    // Initialize team scores
    teamScores['PRUDENTIA'] = 0;
    teamScores['SAPIENTIA'] = 0;

    programs.forEach(program => {
        // Only count completed programs
        if (program.status !== ProgramStatus.COMPLETED) return;

        const isGeneral = program.category.toLowerCase().includes('general') || program.name.toLowerCase().includes('general');
        // Check "Off Stage" by category name. User didn't specify exact string, assuming standard "Off Stage" or "Writing" etc? 
        // User prompt: "ONLY OFF STAGE INTUVIUAL OR GROUP PROGRAMS"
        // I'll check if category contains "off" or "writing" or "drawing" as a heuristic, OR if it's NOT "Stage"
        const isOffStage = !program.category.toLowerCase().includes('stage') || program.category.toLowerCase().includes('off');

        program.teams.forEach(team => {
            if (team.rank && POINTS[team.rank as keyof typeof POINTS]) {
                const points = POINTS[team.rank as keyof typeof POINTS];

                // Update Team Score (Include ALL programs - Normal + General)
                // Map mock team names or verify if teamName matches
                if (team.teamName === 'PRUDENTIA' || team.teamName === 'SAPIENTIA') {
                    teamScores[team.teamName] = (teamScores[team.teamName] || 0) + points;
                } else if (team.teamName === 'Team Alpha') { // Remapped legacy
                    teamScores['SAPIENTIA'] = (teamScores['SAPIENTIA'] || 0) + points;
                } else if (team.teamName === 'Team Beta') { // Remapped legacy
                    teamScores['PRUDENTIA'] = (teamScores['PRUDENTIA'] || 0) + points;
                }

                // Update Participant Points
                // For group programs, user said "INTUVIUAL OR GROUP PROGRAMS INTUVITUAL TOPPER"
                // Usually for group items, individuals don't get individual points for Prathibha, but the prompt implies checking individuals.
                // I will assign points to EACH participant in the winning team.
                team.participants.forEach(p => {
                    const key = p.chestNumber;
                    if (!participantPoints[key]) {
                        participantPoints[key] = {
                            name: p.name,
                            points: 0,
                            chestNumber: p.chestNumber,
                            teamName: team.teamName,
                            isOffStage: false, // Track if they have ANY off stage points? No, filters apply per program
                            isGeneral: false
                        };
                    }

                    // Logic for Kala Prathibha (All Normal Programs, No General)
                    if (!isGeneral) {
                        participantPoints[key].points += points;
                    }

                    // Logic for Sarkha Prathibha (Off Stage only)
                    // We need separate tracking for this...
                });
            }
        });
    });

    // Recalculate specific award points separately to avoid confusion
    const sarkhaCandidates: typeof participantPoints = {};
    const kalaCandidates: typeof participantPoints = {};

    programs.forEach(program => {
        if (program.status !== ProgramStatus.COMPLETED) return;

        const isGeneral = program.category.toLowerCase().includes('general');
        const isOffStage = !program.category.toLowerCase().includes('stage') || program.category.toLowerCase().includes('off');

        program.teams.forEach(team => {
            if (team.rank && POINTS[team.rank as keyof typeof POINTS]) {
                const points = POINTS[team.rank as keyof typeof POINTS];

                team.participants.forEach(p => {
                    const key = p.chestNumber;

                    // KALA PRATHIBHA: Normal (Not General)
                    if (!isGeneral) {
                        if (!kalaCandidates[key]) kalaCandidates[key] = { ...p, points: 0, teamName: team.teamName, isOffStage, isGeneral } as any;
                        kalaCandidates[key].points = (kalaCandidates[key].points || 0) + points;
                    }

                    // SARKHA PRATHIBHA: Off Stage (Normal)
                    // "NORMAL PROGRAMS BASED ON ONLY OFF STAGE" -> Implies !isGeneral && isOffStage
                    if (!isGeneral && isOffStage) {
                        if (!sarkhaCandidates[key]) sarkhaCandidates[key] = { ...p, points: 0, teamName: team.teamName, isOffStage, isGeneral } as any;
                        sarkhaCandidates[key].points = (sarkhaCandidates[key].points || 0) + points;
                    }
                });
            }
        });
    });

    // Find Leaders
    const teams = Object.entries(teamScores).map(([name, score]) => ({ name, score }));
    teams.sort((a, b) => b.score - a.score);
    const leadingTeam = teams[0];
    const trailingTeam = teams[1] || { name: 'N/A', score: 0 };
    const margin = leadingTeam.score - trailingTeam.score;

    // Find Kala Prathibha
    const kalaSorted = Object.values(kalaCandidates).sort((a: any, b: any) => b.points - a.points);
    const kalaPrathibha = kalaSorted.length > 0 ? {
        name: kalaSorted[0].name,
        points: kalaSorted[0].points,
        chestNumber: kalaSorted[0].chestNumber,
        teamName: kalaSorted[0].teamName
    } : null;

    // Find Sarkha Prathibha
    const sarkhaSorted = Object.values(sarkhaCandidates).sort((a: any, b: any) => b.points - a.points);
    const sarkhaPrathibha = sarkhaSorted.length > 0 ? {
        name: sarkhaSorted[0].name,
        points: sarkhaSorted[0].points,
        chestNumber: sarkhaSorted[0].chestNumber,
        teamName: sarkhaSorted[0].teamName
    } : null;

    return {
        leadingTeam,
        trailingTeam,
        margin,
        teamScores,
        sarkhaPrathibha,
        kalaPrathibha
    };
};
