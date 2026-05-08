import { ICourse } from '../models/Course';

export interface OptimizedSchedule {
  courses: ICourse[];
  totalCredits: number;
  uniqueDays: string[];
  dayCount: number;
  gapMinutes: number;
  score: number;
  inRange?: boolean;
}

export interface ProgressCallback {
  (explored: number, best: OptimizedSchedule | null): void;
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

const getGapScore = (courses: ICourse[]): { totalGap: number; penalty: number } => {
  if (courses.length < 2) return { totalGap: 0, penalty: 0 };
  
  const sorted = [...courses].sort((a, b) => a.startTime - b.startTime);
  
  let totalGap = 0;
  let penalty = 0;
  for (let i = 0; i < sorted.length - 1; i++) {
    const gap = sorted[i+1].startTime - sorted[i].endTime;
    if (gap > 0) {
      totalGap += gap;
      // Penalize gaps larger than 120 minutes (2 hours) heavily
      if (gap > 120) penalty += (gap - 120) * 2;
    }
  }
  return { totalGap, penalty };
};

const calculateScheduleQuality = (courses: ICourse[]): { 
  dayCount: number; 
  totalGap: number; 
  score: number;
} => {
  const dayGroups: Record<string, ICourse[]> = {};
  courses.forEach(c => {
    if (!dayGroups[c.day]) dayGroups[c.day] = [];
    dayGroups[c.day].push(c);
  });
  
  const uniqueDays = Object.keys(dayGroups);
  const dayCount = uniqueDays.length;
  
  let totalGap = 0;
  let totalPenalty = 0;
  
  // 1. Calculate gaps and gap penalties
  uniqueDays.forEach(day => {
    const { totalGap: dg, penalty: dp } = getGapScore(dayGroups[day]);
    totalGap += dg;
    totalPenalty += dp;
  });

  // Final score: Lower is better
  // Days are most important (10000 pts per day), then gaps, then large gap penalties
  const score = (dayCount * 10000) + (totalGap) + totalPenalty;

  return { dayCount, totalGap, score };
};

/**
 * Heuristic: Estimate credits for remaining courses
 * Used for pruning branches that can't possibly reach minCredits
 */
const estimateRemainingCredits = (
  remainingCourses: string[],
  courseGroups: Record<string, ICourse[]>
): number => {
  let max = 0;
  for (const key of remainingCourses) {
    const courses = courseGroups[key];
    if (courses.length > 0) {
      max += courses[0].credits;
    }
  }
  return max;
};

/**
 * AI-Powered Schedule Optimizer with Optimizations
 * - Early termination when finding 3-day schedules
 * - Aggressive pruning
 * - Progress callbacks
 * - Timeout support
 */
export const optimizeSchedule = (
  availableCourses: ICourse[],
  minCredits: number,
  maxCredits: number,
  onProgress?: ProgressCallback,
  timeoutMs: number = 30000
): OptimizedSchedule | null => {
  // Group available courses by their "Logical Identity" (name or code)
  const courseGroups: Record<string, ICourse[]> = {};
  availableCourses.forEach(c => {
    const key = c.code; // Group by course code
    if (!courseGroups[key]) courseGroups[key] = [];
    courseGroups[key].push(c);
  });

  // Sort sections by time to prioritize better options first
  Object.values(courseGroups).forEach(sections => {
    sections.sort((a, b) => a.startTime - b.startTime);
  });

  const uniqueCourseKeys = Object.keys(courseGroups);
  let bestSchedule: OptimizedSchedule | null = null;
  let exploredCount = 0;
  const startTime = Date.now();
  
  // Memoization for conflict checks
  const conflictCache = new Map<string, boolean>();

  const backtrack = (
    keyIndex: number,
    currentCourses: ICourse[],
    currentCredits: number,
    remainingKeys: string[]
  ): void => {
    // **Pruning 1: Timeout check**
    if (Date.now() - startTime > timeoutMs) {
      return;
    }

    exploredCount++;
    
    // **Pruning 2: Report progress every 1000 explorations**
    if (onProgress && exploredCount % 1000 === 0) {
      onProgress(exploredCount, bestSchedule);
    }

    // **Pruning 3: Early termination removed to find best balanced schedules**

    // Evaluation Logic
    if (currentCredits >= minCredits && currentCredits <= maxCredits) {
      const { dayCount, totalGap, score } = calculateScheduleQuality(currentCourses);
      const uniqueDays = getUniqueDays(currentCourses);

      // Comparison logic: Better if score is lower
      const isBetter = !bestSchedule || (!bestSchedule.inRange) || (score < bestSchedule.score);

      if (isBetter) {
        bestSchedule = {
          courses: [...currentCourses],
          totalCredits: currentCredits,
          uniqueDays,
          dayCount,
          gapMinutes: totalGap,
          score,
          inRange: true
        };
      }
    } else if (!bestSchedule && currentCredits > 0 && currentCredits < minCredits) {
      // Fallback for "Incomplete" selection
      const { dayCount, totalGap, score } = calculateScheduleQuality(currentCourses);
      const uniqueDays = getUniqueDays(currentCourses);
      bestSchedule = {
        courses: [...currentCourses],
        totalCredits: currentCredits,
        uniqueDays,
        dayCount,
        gapMinutes: totalGap,
        score,
        inRange: false
      };
    }

    // **Pruning 4: Hard limit on credits - no point exploring further**
    if (currentCredits > maxCredits) return;

    // **Pruning 5: Credit feasibility - can't possibly reach minCredits**
    if (keyIndex < uniqueCourseKeys.length) {
      const remainingCredits = estimateRemainingCredits(remainingKeys, courseGroups);
      if (currentCredits + remainingCredits < minCredits) {
        return;
      }
    }

    if (keyIndex >= uniqueCourseKeys.length) return;

    // Try including or excluding the course at current keyIndex
    const courseKey = uniqueCourseKeys[keyIndex];
    const sections = courseGroups[courseKey];
    const nextIndex = keyIndex + 1;
    const nextRemainingKeys = remainingKeys.slice(1);

    // Branch 1: Skip this course entirely (try first for faster pruning)
    backtrack(nextIndex, currentCourses, currentCredits, nextRemainingKeys);

    // Branch 2: Try each section/group of this course
    for (const section of sections) {
      // Check for conflict with existing selections
      const cacheKey = `${currentCourses.map(c => c._id).join(',')}|${section._id}`;
      let conflict: boolean;
      
      if (conflictCache.has(cacheKey)) {
        conflict = conflictCache.get(cacheKey)!;
      } else {
        conflict = currentCourses.some(c => hasConflict(c, section));
        conflictCache.set(cacheKey, conflict);
      }
      
      if (!conflict) {
        currentCourses.push(section);
        backtrack(nextIndex, currentCourses, currentCredits + section.credits, nextRemainingKeys);
        currentCourses.pop();
      }
    }
  };

  backtrack(0, [], 0, uniqueCourseKeys);
  return bestSchedule;
};
