/**
 * Points Calculator for Arts Fest
 * Calculates points based on Score (0-100) and Grade (A+, A, B, C, or no grade)
 */

// Grade to points mapping (simplified to 5 grades only)
// Grade to points mapping (5 grades)
const GRADE_POINTS: Record<string, number> = {
    'A+': 5,
    'A': 4,
    'B': 3,
    'C': 2,
    '': 1 // No grade = 1 point
};
// Updated map to ensure proper export if needed elsewhere
export const GRADE_VALUES = GRADE_POINTS;

/**
 * Calculate points based on score and grade
 * @param score - Score out of 100
 * @param grade - Grade (A+, A, B, C, or empty)
 * @param isGroup - Whether this is a group program
 * @returns Calculated points
 */
export const calculatePoints = (score: number, grade: string, isGroup: boolean): number => {
    // Standard logic
    const maxPoints = isGroup ? 10 : 5; // User said "4 point different" -> maybe scaling is wrong? 
    // Wait, typical Arts: Ind=5, Group=10? Or Ind=10, Group=20?
    // User complaint "calculate 4 point diffrent". 
    // If I had 10/20 and they want 5/10?
    // Let's ASSUME standard Kerala School Kalolsavam rules:
    // Individual: A=5, B=3, C=1.
    // Group: A=10, B=?, C=?.
    // My code had Ind=10, Group=20.
    // Maybe that is too high?

    // BUT the main bug is likely the STATE UPDATE not happening in ProgramAccordion (saving old points).
    // I will keep this file mostly as is but fix the RECALCULATION in ProgramAccordion.
    // However, I'll take a safe bet and revert to 10/5 scaling if that was the "difference" implied?
    // No, "4 point different" is specific.
    // Score 80 + A (4). Ind: 0.8*5 + 4 = 8. Group: 0.8*10 + 8 = 16.
    // If they expected 4 points less? 
    // Let's NOT change the formula blindly without confirmation.
    // I will focus on the SAVE bug in ProgramAccordion.

    const maxP = isGroup ? 20 : 10;
    const sPoints = (score / 100) * (maxP / 2);
    const gPoints = (GRADE_POINTS[grade] || 0) * (isGroup ? 2 : 1);
    const total = sPoints + gPoints;

    // Round to nearest 0.5 to avoid .7, .3, .4 values
    return Math.min(Math.round(total * 2) / 2, maxP);
};

/**
 * Get grade based on score
 * @param score - Score out of 100
 * @returns Grade string
 */
export const getGradeFromScore = (score: number): string => {
    if (score >= 80) return 'A+';
    if (score >= 70) return 'A';
    if (score >= 50) return 'B';
    if (score >= 30) return 'C';
    return '';
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
