import { ICourse } from '../models/Course';

export interface OptimizedSchedule {
  courses: ICourse[];
  totalCredits: number;
  uniqueDays: string[];
  dayCount: number;
  gapMinutes: number; // New: total minutes of gaps between classes
  inRange?: boolean;
}

/**
 * Checks if two courses have a schedule conflict
 */
const hasConflict = (c1: ICourse, c2: ICourse): boolean => {
  if (c1.day !== c2.day) return false;
  
  // Check for time overlap
  // (StartA < EndB) and (EndA > StartB)
  return c1.startTime < c2.endTime && c1.endTime > c2.startTime;
};

/**
 * Calculates the number of unique days in a schedule
 */
const getUniqueDays = (courses: ICourse[]): string[] => {
  const days = new Set(courses.map(c => c.day));
  return Array.from(days);
};

const getGapMinutesForDay = (courses: ICourse[]): number => {
  if (courses.length < 2) return 0;
  
  // Sort courses by start time
  const sorted = [...courses].sort((a, b) => a.startTime - b.startTime);
  
  let totalGap = 0;
  for (let i = 0; i < sorted.length - 1; i++) {
    const gap = sorted[i+1].startTime - sorted[i].endTime;
    if (gap > 0) totalGap += gap;
  }
  return totalGap;
};

const getTotalGapMinutes = (courses: ICourse[]): number => {
  const dayGroups: Record<string, ICourse[]> = {};
  courses.forEach(c => {
    if (!dayGroups[c.day]) dayGroups[c.day] = [];
    dayGroups[c.day].push(c);
  });
  
  let total = 0;
  Object.values(dayGroups).forEach(dayCourses => {
    total += getGapMinutesForDay(dayCourses);
  });
  return total;
};

/**
 * AI-Powered Schedule Optimizer
 */
export const optimizeSchedule = (
  availableCourses: ICourse[],
  minCredits: number,
  maxCredits: number
): OptimizedSchedule | null => {
  // Group available courses by their "Logical Identity" (name or code)
  const courseGroups: Record<string, ICourse[]> = {};
  availableCourses.forEach(c => {
    const key = c.code; // Group by course code
    if (!courseGroups[key]) courseGroups[key] = [];
    courseGroups[key].push(c);
  });

  const uniqueCourseKeys = Object.keys(courseGroups);
  let bestSchedule: OptimizedSchedule | null = null;

  const backtrack = (
    keyIndex: number,
    currentCourses: ICourse[],
    currentCredits: number
  ) => {
    // Evaluation Logic
    if (currentCredits >= minCredits && currentCredits <= maxCredits) {
      const uniqueDays = getUniqueDays(currentCourses);
      const dayCount = uniqueDays.length;
      const gapMinutes = getTotalGapMinutes(currentCourses);

      // Comparison logic: Better if (Less Days) or (Same Days AND Less Gaps)
      const isBetter = !bestSchedule || 
        (!bestSchedule.inRange) || 
        (dayCount < bestSchedule.dayCount) || 
        (dayCount === bestSchedule.dayCount && gapMinutes < bestSchedule.gapMinutes);

      if (isBetter) {
        bestSchedule = {
          courses: [...currentCourses],
          totalCredits: currentCredits,
          uniqueDays,
          dayCount,
          gapMinutes,
          inRange: true
        };
      }
    } else if (!bestSchedule && currentCredits > 0 && currentCredits < minCredits) {
      // Fallback for "Incomplete" selection
      const uniqueDays = getUniqueDays(currentCourses);
      bestSchedule = {
        courses: [...currentCourses],
        totalCredits: currentCredits,
        uniqueDays,
        dayCount: uniqueDays.length,
        gapMinutes: getTotalGapMinutes(currentCourses),
        inRange: false
      };
    }

    if (currentCredits > maxCredits || keyIndex >= uniqueCourseKeys.length) return;

    // Try including or excluding the course at current keyIndex
    const courseKey = uniqueCourseKeys[keyIndex];
    const sections = courseGroups[courseKey];

    // Branch 1: Skip this course entirely
    backtrack(keyIndex + 1, currentCourses, currentCredits);

    // Branch 2: Try each section/group of this course
    for (const section of sections) {
      // Check for conflict with existing selections
      const conflict = currentCourses.some(c => hasConflict(c, section));
      
      if (!conflict) {
        currentCourses.push(section);
        backtrack(keyIndex + 1, currentCourses, currentCredits + section.credits);
        currentCourses.pop();
      }
    }
  };

  backtrack(0, [], 0);
  return bestSchedule;
};
