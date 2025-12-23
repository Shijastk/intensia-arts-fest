/**
 * Points Calculator for Arts Fest
 * Calculates points based on Score (0-100) and Grade (A+, A, B, C, or no grade)
 */

// Grade to points mapping (simplified to 5 grades only)
const GRADE_POINTS: Record<string, number> = {
    'A+': 5,
    'A': 4,
    'B': 3,
    'C': 2,
    '': 1 // No grade = 1 point
};

/**
 * Calculate points based on score and grade
 * @param score - Score out of 100
 * @param grade - Grade (A+, A, B, C, or empty for no grade)
 * @param isGroup - Whether this is a group program
 * @returns Calculated points (max 10 for individual, max 20 for group)
 */
export const calculatePoints = (score: number, grade: string, isGroup: boolean): number => {
    const maxPoints = isGroup ? 20 : 10;

    // Score component (0-100 maps to 0-5 or 0-10 for group)
    const scorePoints = (score / 100) * (maxPoints / 2);

    // Grade component (0-5 or 0-10 for group)
    const gradePoints = (GRADE_POINTS[grade] || 0) * (isGroup ? 2 : 1);

    // Total points
    const totalPoints = scorePoints + gradePoints;

    // Cap at max points
    return Math.min(Math.round(totalPoints * 10) / 10, maxPoints); // Round to 1 decimal
};

/**
 * Get grade points value
 */
export const getGradePoints = (grade: string, isGroup: boolean): number => {
    return (GRADE_POINTS[grade] || 0) * (isGroup ? 2 : 1);
};

/**
 * Get all available grades (simplified to 5 grades)
 */
export const AVAILABLE_GRADES = ['A+', 'A', 'B', 'C', 'No Grade'];

/**
 * Get grade point breakdown for display
 */
export const getGradeBreakdown = (isGroup: boolean): Array<{ grade: string; points: number }> => {
    return AVAILABLE_GRADES.map(grade => ({
        grade,
        points: getGradePoints(grade === 'No Grade' ? '' : grade, isGroup)
    }));
};
