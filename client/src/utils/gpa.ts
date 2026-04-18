/**
 * Converts a letter grade (A, B+, etc.) to its equivalent 4.0 scale points.
 */
export const getGradePoints = (grade: string): number => {
    const mapping: Record<string, number> = {
        "A+": 4.0, "A": 4.0, "A-": 3.7,
        "B+": 3.3, "B": 3.0, "B-": 2.7,
        "C+": 2.3, "C": 2.0, "C-": 1.7,
        "D+": 1.3, "D": 1.0,
        "F": 0.0,
    };
    return mapping[grade.toUpperCase()] || 0;
};

/**
 * Groups a flat list of courses into semesters.
 */
export const groupCoursesBySemester = (courses: any[]) => {
    const grouped: Record<string, { semester: string; academicYear: string; courses: any[] }> = {};

    courses.forEach(c => {
        const key = `${c.academicYear}-${c.semester}`;
        if (!grouped[key]) {
            grouped[key] = {
                semester: c.semester,
                academicYear: c.academicYear,
                courses: []
            };
        }
        grouped[key].courses.push(c);
    });

    // Sort by year and semester (Fall then Spring usually)
    return Object.values(grouped).sort((a, b) => {
        if (a.academicYear !== b.academicYear) return b.academicYear.localeCompare(a.academicYear);
        return b.semester.localeCompare(a.semester); // Simple string sort for semester
    });
};

export const LEVEL_THRESHOLDS = {
    LEVEL_2: 32,
    LEVEL_3: 66,
    LEVEL_4: 96,
    GRADUATION: 146
};
