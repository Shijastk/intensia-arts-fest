import { Program } from '../types';

/**
 * Fixes team assignments based on chest numbers
 * PRUDENTIA: 200-299
 * SAPIENTIA: 300-399
 * 
 * NOTE: Team names are swapped before saving to Firebase because
 * usePrograms hook applies a reverse swap when loading data
 */
export const fixTeamAssignments = (programs: Program[]): Program[] => {
    const fixedPrograms = programs.map(program => {
        // Collect all participants from all teams
        const allParticipants: Array<{ participant: any; originalTeam: string }> = [];

        program.teams.forEach(team => {
            team.participants.forEach(participant => {
                allParticipants.push({
                    participant: { ...participant },
                    originalTeam: team.teamName
                });
            });
        });

        // Create new team structure
        // NOTE: We create teams with swapped names because usePrograms will swap them back
        const prudentiaTeam = {
            id: `t-prudentia-${Date.now()}`,
            teamName: 'SAPIENTIA', // Will be swapped to PRUDENTIA by usePrograms
            participants: [] as any[],
            score: undefined,
            rank: undefined,
            grade: undefined,
            points: undefined
        };

        const sapientiaTeam = {
            id: `t-sapientia-${Date.now()}`,
            teamName: 'PRUDENTIA', // Will be swapped to SAPIENTIA by usePrograms
            participants: [] as any[],
            score: undefined,
            rank: undefined,
            grade: undefined,
            points: undefined
        };

        // Redistribute participants based on chest number
        allParticipants.forEach(({ participant }) => {
            const chestNum = parseInt(participant.chestNumber);

            if (chestNum >= 200 && chestNum <= 299) {
                // Belongs to PRUDENTIA (but save as SAPIENTIA due to swap)
                prudentiaTeam.participants.push(participant);
            } else if (chestNum >= 300 && chestNum <= 399) {
                // Belongs to SAPIENTIA (but save as PRUDENTIA due to swap)
                sapientiaTeam.participants.push(participant);
            } else {
                // Unknown range - keep in original team or skip
                console.warn(`Participant ${participant.name} (${participant.chestNumber}) is outside expected ranges`);
            }
        });

        // Preserve team-level data (scores, ranks) from original teams
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
