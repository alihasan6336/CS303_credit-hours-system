import { Request, Response } from 'express';
import Course from '../models/Course';
import Student from '../models/Student';
import SystemSettings from '../models/SystemSettings';
import { optimizeSchedule } from '../utils/scheduleOptimizer';
import { getAIAdviceForSchedule } from '../utils/aiScheduleAssistant';

export const autoGenerateSchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    const student = req.student!;
    const { preferredCourseIds } = req.body;

    // 1. Get student's current needs (Major and Level)
    const major = student.major;
    const level = student.level;

    // 2. Fetch context-aware available courses
    const query: any = { 
      isActive: true,
      $or: [
        { major: major },
        { major: { $exists: false } },
        { major: '' }
      ]
    };

    if (preferredCourseIds && Array.isArray(preferredCourseIds) && preferredCourseIds.length > 0) {
      query.code = { $in: preferredCourseIds };
    }

    const availableCourses = await Course.find(query).lean();
    
    // 3. Fetch System Settings for default limits
    const settings = await SystemSettings.findOne().lean();
    
    // 4. Determine Credit Limits
    const minCredits = student.creditLimitOverride?.isActive 
      ? student.creditLimitOverride.min 
      : (settings?.minCreditHoursDefault || 14);
    const maxCredits = student.creditLimitOverride?.isActive 
      ? student.creditLimitOverride.max 
      : (settings?.maxCreditHoursDefault || 19);

    // Only courses for the student's level and major (if applicable)
    if (availableCourses.length === 0) {
      res.status(404).json({
        success: false,
        message: 'No available courses found for your major and level.'
      });
      return;
    }

    // 4. Run Optimizer
    // We need to cast availableCourses to ICourse[] as optimizeSchedule expects
    const optimized = optimizeSchedule(availableCourses as any, minCredits, maxCredits);

    if (!optimized) {
      res.status(400).json({
        success: false,
        message: `I couldn't find ANY conflict-free combination from your selection.`,
        details: `Your current selection might have too many overlapping classes. Try picking courses at different times.`,
        constraints: { minCredits, maxCredits }
      });
      return;
    }

    if (optimized && !optimized.inRange) {
      res.status(400).json({
        success: false,
        message: `Your selection only totals ${optimized.totalCredits} credits.`,
        details: `The system requires a minimum of ${minCredits} credits. Please select 1 or 2 more courses to reach the requirement.`,
        constraints: { minCredits, maxCredits }
      });
      return;
    }

    // 5. Get AI Advice (Optional if key exists)
    const advice = await getAIAdviceForSchedule(
      optimized.courses,
      optimized.totalCredits,
      optimized.uniqueDays
    );

    // 6. Return Result
    res.status(200).json({
      success: true,
      message: 'Schedule optimized for minimum days on campus.',
      schedule: {
        courses: optimized.courses,
        totalCredits: optimized.totalCredits,
        dayCount: optimized.dayCount,
        uniqueDays: optimized.uniqueDays
      },
      aiAdvice: advice
    });

  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
