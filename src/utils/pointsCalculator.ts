/**
 * Points Calculator for Arts Fest
 * Based on standard scoring: Individual (Max 10) | Group (Max 20)
 * Total Points = Grade Points + Rank Points
 * Custom overrides can be provided per-program via CustomProgramScore.
 */
import { CustomProgramScore, Participant, Program, Team } from '../types';

// Individual Points Configuration
export const INDIVIDUAL_GRADE_POINTS: Record<string, number> = {
    'A+': 5,
    'A': 5,
    'B': 3,
    'C': 1,
    'No Grade': 0
};

export const INDIVIDUAL_RANK_POINTS: Record<number, number> = {
    1: 5,
    2: 3,
    3: 1
};

// Group Points Configuration
export const GROUP_GRADE_POINTS: Record<string, number> = {
    'A+': 10,
    'A': 10,
    'B': 6,
    'C': 2,
    'No Grade': 0
};

export const GROUP_RANK_POINTS: Record<number, number> = {
    1: 10,
    2: 6,
    3: 2
};

// Kept for backward compatibility if imported elsewhere
export const GRADE_VALUES = INDIVIDUAL_GRADE_POINTS;

/**
 * Calculate final points based on score, grade, group status, and rank.
 * If a customConfig is provided, its grade and rank points are used instead of the globals.
 */
export const calculatePoints = (
    score: number,
    grade: string,
    isGroup: boolean,
    rank?: number,
    customConfig?: CustomProgramScore
): number => {
    let gradePts: number;
    let rankPts = 0;

    if (customConfig) {
        // Use program-specific custom grade points
        const gradeKey = grade as keyof CustomProgramScore['gradePoints'];
        gradePts = customConfig.gradePoints[gradeKey] ?? 0;
    } else {
        gradePts = isGroup ? (GROUP_GRADE_POINTS[grade] || 0) : (INDIVIDUAL_GRADE_POINTS[grade] || 0);
    }

    // Rank points are only awarded if the participant secures a top 3 position
    if (rank && rank >= 1 && rank <= 3) {
        if (customConfig) {
            const rankKey = rank as keyof CustomProgramScore['rankPoints'];
            rankPts = customConfig.rankPoints[rankKey] ?? 0;
        } else {
            rankPts = isGroup ? (GROUP_RANK_POINTS[rank] || 0) : (INDIVIDUAL_RANK_POINTS[rank] || 0);
        }
    }

    return gradePts + rankPts;
};

export const getGradeFromScore = (score: number): string => {
    if (score >= 80) return 'A+';
    if (score >= 70) return 'A';
    if (score >= 50) return 'B';
    if (score >= 30) return 'C';
    return '';
};

export const getGradePoints = (grade: string, isGroup: boolean, customConfig?: CustomProgramScore): number => {
    if (customConfig) {
        const gradeKey = grade as keyof CustomProgramScore['gradePoints'];
        return customConfig.gradePoints[gradeKey] ?? 0;
    }
    if (isGroup) {
        return GROUP_GRADE_POINTS[grade] || 0;
    }
    return INDIVIDUAL_GRADE_POINTS[grade] || 0;
};

export const AVAILABLE_GRADES = ['A+', 'A', 'B', 'C', 'No Grade'];

export const getGradeBreakdown = (isGroup: boolean, customConfig?: CustomProgramScore): Array<{ grade: string; points: number }> => {
    return AVAILABLE_GRADES.map(grade => ({
        grade,
        points: getGradePoints(grade === 'No Grade' ? '' : grade, isGroup, customConfig)
    }));
};

export interface ScoreInput {
    score?: string | number;
    grade?: string;
}

/** Reads the score/grade already stored on a program's teams (for re-ranking saved results). */
export const collectScoreInputs = (teams: Team[] | undefined): Record<string, ScoreInput> => {
    const inputs: Record<string, ScoreInput> = {};
    (teams || []).filter(Boolean).forEach(team => {
        (team.participants || []).filter(Boolean).forEach((p, i) => {
            const fromTeam = i === 0 && p.score === undefined ? { score: team.score, grade: team.grade } : {};
            inputs[p.chestNumber] = { score: p.score, grade: p.grade, ...fromTeam };
        });
    });
    return inputs;
};

/**
 * Ranks a program's entries and returns its teams with score/grade/rank/points filled in.
 * Shared by the judge submission (JudgesPage) and the admin "Edit Results" (ProgramAccordion)
 * so both produce identical results.
 *
 * - Group programs: one entry per sub-team (chunks of membersPerGroup); the score is read
 *   from the sub-team's first member (the representative), as the judge screen enters it.
 * - Individual programs: one entry per participant.
 * - Entries with no score (absent / not judged) are NOT ranked and get rank 0, 0 points.
 * - Ties use competition ranking (1, 1, 3) and tied entries receive the same points.
 */
export const rankProgramResults = (
    program: Pick<Program, 'isGroup' | 'membersPerGroup' | 'teams'>,
    inputs: Record<string, ScoreInput | undefined>,
    customConfig?: CustomProgramScore
): Team[] => {
    const teams = (program.teams || []).filter(Boolean);
    const toNumber = (v: unknown) => {
        const n = typeof v === 'number' ? v : parseFloat(String(v ?? ''));
        return Number.isFinite(n) ? n : 0;
    };

    type Entry = { teamId: string; members: Participant[]; score: number; grade: string; rank: number; points: number; scored: boolean };
    const entries: Entry[] = [];
    teams.forEach(team => {
        const members = (team.participants || []).filter(Boolean);
        if (program.isGroup) {
            const limit = program.membersPerGroup && program.membersPerGroup > 0 ? program.membersPerGroup : 999;
            for (let i = 0; i < members.length; i += limit) {
                const chunk = members.slice(i, i + limit);
                if (chunk.length === 0) continue;
                const input = inputs[chunk[0].chestNumber];
                const score = toNumber(input?.score);
                entries.push({ teamId: team.id, members: chunk, score, grade: input?.grade || '', rank: 0, points: 0, scored: score > 0 });
            }
        } else {
            members.forEach(p => {
                const input = inputs[p.chestNumber];
                const score = toNumber(input?.score);
                entries.push({ teamId: team.id, members: [p], score, grade: input?.grade || '', rank: 0, points: 0, scored: score > 0 });
            });
        }
    });

    const ranked = entries.filter(e => e.scored).sort((a, b) => b.score - a.score);
    ranked.forEach((entry, i) => {
        entry.rank = i > 0 && entry.score === ranked[i - 1].score ? ranked[i - 1].rank : i + 1;
        entry.points = calculatePoints(entry.score, entry.grade, !!program.isGroup, entry.rank, customConfig);
    });
    // Absent / unscored entries keep any grade that was typed but earn no rank or points.
    entries.filter(e => !e.scored).forEach(e => { e.rank = 0; e.points = 0; });

    return teams.map(team => {
        const teamEntries = entries.filter(e => e.teamId === team.id);
        const participants = (team.participants || []).filter(Boolean).map(p => {
            const entry = teamEntries.find(e => e.members.some(m => m.chestNumber === p.chestNumber));
            return entry ? { ...p, score: entry.score, grade: entry.grade, points: entry.points, rank: entry.rank } : p;
        });
        const best = teamEntries.filter(e => e.scored).sort((a, b) => b.score - a.score)[0];
        return {
            ...team,
            participants,
            score: best ? best.score : 0,
            grade: best ? best.grade : '',
            rank: best ? best.rank : 0,
            // Group: the team's best sub-team counts once. Individual: sum of its members' points.
            points: program.isGroup ? (best ? best.points : 0) : participants.reduce((sum, p) => sum + (p.points || 0), 0)
        };
    });
};

/**
 * Returns a default CustomProgramScore template based on whether the program is a group or individual.
 * Useful as a starting template when creating a new custom score override.
 */
export const getDefaultCustomScore = (isGroup: boolean): CustomProgramScore => ({
    gradePoints: isGroup
        ? { 'A+': 10, 'A': 10, 'B': 6, 'C': 2, 'No Grade': 0 }
        : { 'A+': 5, 'A': 5, 'B': 3, 'C': 1, 'No Grade': 0 },
    rankPoints: isGroup
        ? { 1: 10, 2: 6, 3: 2 }
        : { 1: 5, 2: 3, 3: 1 },
});