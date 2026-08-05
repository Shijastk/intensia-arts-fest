/**
 * Points Calculator for Arts Fest
 * Based on standard scoring: Individual (Max 10) | Group (Max 20)
 * Total Points = Grade Points + Rank Points
 */

// Individual Points Configuration
export const INDIVIDUAL_GRADE_POINTS: Record<string, number> = {
    'A+': 5,
    'A': 5,
    'B': 3,
    'C': 1,
    'No Grade': 0,
    '': 0
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
    'No Grade': 0,
    '': 0
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
 */
export const calculatePoints = (score: number, grade: string, isGroup: boolean, rank?: number): number => {
    const gradePts = isGroup ? (GROUP_GRADE_POINTS[grade] || 0) : (INDIVIDUAL_GRADE_POINTS[grade] || 0);
    let rankPts = 0;

    // Rank points are only awarded if the participant secures a top 3 position
    if (rank && rank >= 1 && rank <= 3) {
        rankPts = isGroup ? (GROUP_RANK_POINTS[rank] || 0) : (INDIVIDUAL_RANK_POINTS[rank] || 0);
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

export const getGradePoints = (grade: string, isGroup: boolean): number => {
    if (isGroup) {
        return GROUP_GRADE_POINTS[grade] || 0;
    }
    return INDIVIDUAL_GRADE_POINTS[grade] || 0;
};

export const AVAILABLE_GRADES = ['A+', 'A', 'B', 'C', 'No Grade'];

export const getGradeBreakdown = (isGroup: boolean): Array<{ grade: string; points: number }> => {
    return AVAILABLE_GRADES.map(grade => ({
        grade,
        points: getGradePoints(grade === 'No Grade' ? '' : grade, isGroup)
    }));
};