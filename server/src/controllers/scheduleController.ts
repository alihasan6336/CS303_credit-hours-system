import { Request, Response } from 'express';
import Course from '../models/Course';
import Student from '../models/Student';
import SystemSettings from '../models/SystemSettings';
import { optimizeSchedule, OptimizedSchedule } from '../utils/scheduleOptimizer';
import { getAIAdviceForSchedule } from '../utils/aiScheduleAssistant';
import { getCreditLimitForStudent } from '../utils/creditLimitCalculator';

/**
 * Auto-generate an optimized schedule with progress updates via Server-Sent Events
 * Supports timeout and real-time progress reporting
 */
export const autoGenerateSchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    const student = req.student;
    const { preferredCourseIds, major: reqMajor, level: reqLevel } = req.body;

    // 1. Get student's current needs (Major and Level) or fallback for Admins
    const major = student?.major || reqMajor || '';
    const level = student?.level || reqLevel || null;

    // 2. Fetch context-aware available courses
    const query: any = { isActive: true };
    const andConditions: any[] = [];

    if (major) {
      andConditions.push({
        $or: [
          { major: major },
          { major: { $exists: false } },
          { major: '' }
        ]
      });
    }

    if (level) {
      andConditions.push({
        $or: [
          { level: level },
          { level: { $exists: false } },
          { level: null }
        ]
      });
    }

    if (preferredCourseIds && Array.isArray(preferredCourseIds) && preferredCourseIds.length > 0) {
      andConditions.push({ code: { $in: preferredCourseIds } });
    }

    if (andConditions.length > 0) {
      query.$and = andConditions;
    }

    const availableCourses = await Course.find(query).lean();

    // 3. Determine Credit Limits using centralized calculator (GPA-based + summer + override)
    const creditLimit = await getCreditLimitForStudent(
      student || { currentSemester: 'Fall', gpa: 3.5 }
    );
    const minCredits = creditLimit.minCredits;
    const maxCredits = creditLimit.maxCredits;

    // Only courses for the student's level and major (if applicable)
    if (availableCourses.length === 0) {
      res.status(404).json({
        success: false,
        message: 'No available courses found for your major and level.'
      });
      return;
    }

    // Set SSE headers for streaming progress
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    let lastProgressUpdate = Date.now();
    let optimized: OptimizedSchedule | null = null;

    // Run Optimizer with progress callback
    optimized = optimizeSchedule(
      availableCourses as any,
      minCredits,
      maxCredits,
      (explored, best) => {
        // Send progress update every 500ms to avoid flooding
        const now = Date.now();
        if (now - lastProgressUpdate > 500 || !best) {
          res.write(`data: ${JSON.stringify({
            type: 'progress',
            explored,
            hasBest: !!best,
            bestDayCount: best?.dayCount || null,
            bestCredits: best?.totalCredits || null
          })}\n\n`);
          lastProgressUpdate = now;
        }
      },
      30000 // 30 second timeout
    );

    if (!optimized) {
      res.write(`data: ${JSON.stringify({
        type: 'error',
        success: false,
        message: `I couldn't find ANY conflict-free combination from your selection.`,
        details: `Your current selection might have too many overlapping classes. Try picking courses at different times.`,
        constraints: { minCredits, maxCredits }
      })}\n\n`);
      res.end();
      return;
    }

    if (optimized && !optimized.inRange) {
      res.write(`data: ${JSON.stringify({
        type: 'error',
        success: false,
        message: `Your selection only totals ${optimized.totalCredits} credits.`,
        details: `The system requires a minimum of ${minCredits} credits. Please select 1 or 2 more courses to reach the requirement.`,
        constraints: { minCredits, maxCredits }
      })}\n\n`);
      res.end();
      return;
    }

    // 5. Get AI Advice (Optional if key exists)
    const advice = await getAIAdviceForSchedule(
      optimized.courses,
      optimized.totalCredits,
      optimized.uniqueDays
    );

    // 6. Send Final Result
    res.write(`data: ${JSON.stringify({
      type: 'success',
      success: true,
      message: 'Schedule optimized for minimum days on campus.',
      schedule: {
        courses: optimized.courses,
        totalCredits: optimized.totalCredits,
        dayCount: optimized.dayCount,
        uniqueDays: optimized.uniqueDays
      },
      aiAdvice: advice
    })}\n\n`);
    
    res.end();

  } catch (error: any) {
    res.write(`data: ${JSON.stringify({
      type: 'error',
      success: false,
      message: error.message
    })}\n\n`);
    res.end();
  }
};
