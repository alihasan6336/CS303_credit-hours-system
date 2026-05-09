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
 * 3. Year & GPA-based rules (Fall / Spring):
 *    - Year 1 (any GPA, including 0) → standard 15–19 credit hours
 *    - Year 2, 3, or 4 with GPA < 1.0 → max 12 credit hours (academic probation)
 *    - Year 4 with GPA > 3.0 → max 21 credit hours (elevated limit)
 *    - Otherwise (GPA 1–3, any year) → standard 15–19 credit hours
 */
export async function getCreditLimitForStudent(
  student: { gpa?: number; level?: number; currentSemester: string; creditLimitOverride?: { min: number; max: number; isActive: boolean; reason: string } }
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

  // 3. Year & GPA-based rules (Fall / Spring)
  const gpa = student.gpa ?? 0;
  const level = student.level ?? 1;
  const defaultMin = settings?.minCreditHoursDefault ?? 15;
  const defaultMax = settings?.maxCreditHoursDefault ?? 19;
  const gpaBelow1Max = settings?.maxCreditHoursGpaBelow1 ?? 12;
  const gpaAbove3Max = settings?.maxCreditHoursGpaAbove3 ?? 21;

  // Rule A: Year 1 students always get the standard range (even if GPA is 0)
  if (level === 1) {
    return {
      minCredits: defaultMin,
      maxCredits: defaultMax,
      reason: `First-year student — standard limit ${defaultMin}–${defaultMax} credit hours`,
      isSummer: false,
      isOverride: false,
    };
  }

  // Rule B: Year 2, 3, or 4 with GPA < 1.0 → academic probation cap
  if (gpa < 1) {
    return {
      minCredits: 0,
      maxCredits: gpaBelow1Max,
      reason: `GPA below 1.0 (Year ${level}) — academic probation, maximum ${gpaBelow1Max} credit hours`,
      isSummer: false,
      isOverride: false,
    };
  }

  // Rule C: Year 4 with GPA > 3.0 → elevated limit
  if (level === 4 && gpa > 3) {
    return {
      minCredits: defaultMin,
      maxCredits: gpaAbove3Max,
      reason: `GPA above 3.0 and Year 4 — maximum ${gpaAbove3Max} credit hours`,
      isSummer: false,
      isOverride: false,
    };
  }

  // Rule D: All other cases (GPA 1–3, Year 2/3/4 or GPA > 3 but not Year 4) → standard range
  return {
    minCredits: defaultMin,
    maxCredits: defaultMax,
    reason: `GPA ${gpa.toFixed(2)}, Year ${level} — standard limit ${defaultMin}–${defaultMax} credit hours`,
    isSummer: false,
    isOverride: false,
  };
}
