import { Program } from '../types';

/**
 * Fixes team assignments based on chest numbers
 * PRUDENTIA: 200-299
 * SAPIENTIA: 300-399
 * 
 * ✅ FIXED: Team names are now saved correctly without swapping
 */
export const fixTeamAssignments = (programs: Program[]): Program[] => {
    const fixedPrograms = programs.map(program => {
        // Collect all participants from all teams
        const allParticipants: Array<{ participant: any; originalTeam: string }> = [];

        if (program.teams) {
            program.teams.forEach(team => {
                if (team.participants) {
                    team.participants.forEach(participant => {
                        allParticipants.push({
                            participant: { ...participant },
                            originalTeam: team.teamName
                        });
                    });
                }
            });
        }

        // Create new team structure with CORRECT team names
        // Use a random component to avoid ID collisions in synchronous map
        const prudentiaTeam = {
            id: `t-prudentia-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            teamName: 'PRUDENTIA', // ✅ CORRECT: Chest 200-299 → PRUDENTIA
            participants: [] as any[],
            score: undefined,
            rank: undefined,
            grade: undefined,
            points: undefined
        };

        const sapientiaTeam = {
            id: `t-sapientia-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            teamName: 'SAPIENTIA', // ✅ CORRECT: Chest 300-399 → SAPIENTIA
            participants: [] as any[],
            score: undefined,
            rank: undefined,
            grade: undefined,
            points: undefined
        };

        // Redistribute participants based on chest number
        allParticipants.forEach(({ participant }) => {
            const chestNum = parseInt(participant.chestNumber);

            if (!isNaN(chestNum)) {
                if (chestNum >= 200 && chestNum <= 299) {
                    // ✅ CORRECT: Chest 200-299 → PRUDENTIA
                    prudentiaTeam.participants.push(participant);
                } else if (chestNum >= 300 && chestNum <= 399) {
                    // ✅ CORRECT: Chest 300-399 → SAPIENTIA
                    sapientiaTeam.participants.push(participant);
                } else {
                    // Unknown range - keep in original team or skip
                    console.warn(`Participant ${participant.name} (${participant.chestNumber}) is outside expected ranges`);
                }
            } else {
                console.warn(`Participant ${participant.name} has invalid chest number: ${participant.chestNumber}`);
            }
        });

        // Preserve team-level data (scores, ranks) from original teams
        // We look for the team with the matching NAME to preserve the score associated with that name/slot
        if (program.teams) {
            const originalPrudentiaTeam = program.teams.find(t => t.teamName === 'PRUDENTIA');
            const originalSapientiaTeam = program.teams.find(t => t.teamName === 'SAPIENTIA');

            if (originalPrudentiaTeam) {
                prudentiaTeam.score = originalPrudentiaTeam.score;
                prudentiaTeam.rank = originalPrudentiaTeam.rank;
                prudentiaTeam.grade = originalPrudentiaTeam.grade;
                prudentiaTeam.points = originalPrudentiaTeam.points;
            }

            if (originalSapientiaTeam) {
                sapientiaTeam.score = originalSapientiaTeam.score;
                sapientiaTeam.rank = originalSapientiaTeam.rank;
                sapientiaTeam.grade = originalSapientiaTeam.grade;
                sapientiaTeam.points = originalSapientiaTeam.points;
            }
        }

        // Build new teams array (only include teams with participants)
        const newTeams = [];
        if (prudentiaTeam.participants.length > 0) {
            newTeams.push(prudentiaTeam);
        }
        if (sapientiaTeam.participants.length > 0) {
            newTeams.push(sapientiaTeam);
        }

        return {
            ...program,
            teams: newTeams
        };
    });

    return fixedPrograms;
};

/**
 * Generates a report of what will be changed
 */
export const generateFixReport = (programs: Program[]): {
    totalPrograms: number;
    affectedPrograms: number;
    movedParticipants: Array<{
        name: string;
        chestNumber: string;
        from: string;
        to: string;
        programName: string;
    }>;
} => {
    const movedParticipants: Array<{
        name: string;
        chestNumber: string;
        from: string;
        to: string;
        programName: string;
    }> = [];

    let affectedPrograms = 0;

    programs.forEach(program => {
        let programAffected = false;

        program.teams.forEach(team => {
            team.participants.forEach(participant => {
                const chestNum = parseInt(participant.chestNumber);
                let correctTeam = '';

                if (chestNum >= 200 && chestNum <= 299) {
                    correctTeam = 'PRUDENTIA';
                } else if (chestNum >= 300 && chestNum <= 399) {
                    correctTeam = 'SAPIENTIA';
                }

                if (correctTeam && correctTeam !== team.teamName) {
                    movedParticipants.push({
                        name: participant.name,
                        chestNumber: participant.chestNumber,
                        from: team.teamName,
                        to: correctTeam,
                        programName: program.name
                    });
                    programAffected = true;
                }
            });
        });

        if (programAffected) {
            affectedPrograms++;
        }
    });

    return {
        totalPrograms: programs.length,
        affectedPrograms,
        movedParticipants
    };
};
