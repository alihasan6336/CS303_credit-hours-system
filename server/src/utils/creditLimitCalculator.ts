import SystemSettings from '../models/SystemSettings';

export interface CreditLimitResult {
  minCredits: number;
  maxCredits: number;
  reason: string;
  isSummer: boolean;
  isOverride: boolean;
}

/**
 * Calculates the credit hour enrollment limits for a student based on:
 * 1. Admin override (if active) — takes absolute precedence
 * 2. Summer semester — hard cap (default 9)
 * 3. GPA-based rules:
 *    - GPA < 1.0 → max 12 credits
 *    - GPA > 3.0 → max 21 credits
 *    - Otherwise → default max (19)
 */
export async function getCreditLimitForStudent(
  student: { gpa?: number; currentSemester: string; creditLimitOverride?: { min: number; max: number; isActive: boolean; reason: string } }
): Promise<CreditLimitResult> {
  const settings = await SystemSettings.findOne().lean();

  // 1. Check admin override first
  if (student.creditLimitOverride?.isActive) {
    return {
      minCredits: student.creditLimitOverride.min,
      maxCredits: student.creditLimitOverride.max,
      reason: 'Admin override active',
      isSummer: student.currentSemester === 'Summer',
      isOverride: true,
    };
  }

  const isSummer = student.currentSemester === 'Summer';

  // 2. Summer semester hard cap
  if (isSummer) {
    const summerMax = settings?.maxCreditHoursSummer ?? 9;
    return {
      minCredits: 0,
      maxCredits: summerMax,
      reason: `Summer semester — maximum ${summerMax} credit hours`,
      isSummer: true,
      isOverride: false,
    };
  }

  // 3. GPA-based rules (Fall / Spring)
  const gpa = student.gpa ?? 0;
  const defaultMin = settings?.minCreditHoursDefault ?? 14;
  const defaultMax = settings?.maxCreditHoursDefault ?? 19;
  const gpaBelow1Max = settings?.maxCreditHoursGpaBelow1 ?? 12;
  const gpaAbove3Max = settings?.maxCreditHoursGpaAbove3 ?? 21;

  if (gpa < 1) {
    return {
      minCredits: 0,
      maxCredits: gpaBelow1Max,
      reason: `GPA below 1.0 — maximum ${gpaBelow1Max} credit hours`,
      isSummer: false,
      isOverride: false,
    };
  }

  if (gpa > 3) {
    return {
      minCredits: defaultMin,
      maxCredits: gpaAbove3Max,
      reason: `GPA above 3.0 — maximum ${gpaAbove3Max} credit hours`,
      isSummer: false,
      isOverride: false,
    };
  }

  // Default range
  return {
    minCredits: defaultMin,
    maxCredits: defaultMax,
    reason: `Standard limit — maximum ${defaultMax} credit hours`,
    isSummer: false,
    isOverride: false,
  };
}
