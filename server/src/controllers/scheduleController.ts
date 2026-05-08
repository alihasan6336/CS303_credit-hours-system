import { Request, Response } from 'express';
import Course from '../models/Course';
import Student from '../models/Student';
import Enrollment from '../models/Enrollment';
import SystemSettings from '../models/SystemSettings';
import { optimizeSchedule, OptimizedSchedule } from '../utils/scheduleOptimizer';
import { getAIAdviceForSchedule, generateAIScheduleSelection } from '../utils/aiScheduleAssistant';
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

    // === ENROLLMENT STATUS CHECK ===
    // Check if enrollment table is open for this student
    if (student) {
      const settings = await SystemSettings.findOne().lean();
      const openLevels = settings?.enrollmentOpenLevels || [];
      if (!settings?.isRegistrationOpen || !openLevels.includes(student.level)) {
        res.status(403).json({
          success: false,
          message: `Enrollment is currently closed for Year ${student.level} students. Please wait for the enrollment table to open.`,
          enrollmentClosed: true,
          openLevels,
        });
        return;
      }
    }

    // 2. Fetch existing enrollments to check credit limits and time conflicts
    let existingEnrollments: any[] = [];
    let currentCredits = 0;
    if (student) {
      existingEnrollments = await Enrollment.find({
        student: student._id,
        semester: student.currentSemester,
        status: 'active'
      }).populate('course', 'code name credits day time startTime endTime');
      
      currentCredits = existingEnrollments.reduce((sum, e) => sum + ((e.course as any)?.credits || 0), 0);
    }

    // 2. Fetch context-aware available courses
    const query: any = { isActive: true };
    const andConditions: any[] = [];

    const hasPreferredCourses = preferredCourseIds && Array.isArray(preferredCourseIds) && preferredCourseIds.length > 0;

    if (!hasPreferredCourses && major) {
      andConditions.push({
        $or: [
          { major: major },
          { major: { $exists: false } },
          { major: '' }
        ]
      });
    }

    if (!hasPreferredCourses && level) {
      andConditions.push({
        $or: [
          { level: level },
          { level: { $exists: false } },
          { level: null }
        ]
      });
    }

    if (hasPreferredCourses) {
      andConditions.push({ code: { $in: preferredCourseIds } });
    }

    if (andConditions.length > 0) {
      query.$and = andConditions;
    }

    let availableCourses = await Course.find(query).lean();
    
    // Filter out courses that conflict with existing enrollments
    if (existingEnrollments.length > 0) {
      const existingCourses = existingEnrollments.map(e => e.course).filter(Boolean);
      availableCourses = availableCourses.filter((course: any) => {
        // Check if this course is already enrolled
        const alreadyEnrolled = existingCourses.some((ec: any) => ec._id?.toString() === course._id.toString());
        if (alreadyEnrolled) return false;
        
        // Check for time conflicts
        const hasTimeConflict = existingCourses.some((ec: any) => {
          if (ec.day !== course.day) return false;
          // Time overlap: (StartA < EndB) and (EndA > StartB)
          return ec.startTime < course.endTime && ec.endTime > course.startTime;
        });
        return !hasTimeConflict;
      });
    }
    
    console.log(`[Schedule] Found ${availableCourses.length} available courses for query:`, JSON.stringify(query));
    console.log(`[Schedule] Student currently has ${currentCredits} credits enrolled`);

    // 3. Determine Credit Limits using centralized calculator (GPA-based + summer + override)
    const creditLimit = await getCreditLimitForStudent(
      student || { currentSemester: 'Fall', gpa: 3.5 }
    );
    
    // Adjust max credits to account for already enrolled courses
    const remainingMaxCredits = Math.max(0, creditLimit.maxCredits - currentCredits);
    
    console.log(`[Schedule] Credit limits: min=${creditLimit.minCredits}, max=${creditLimit.maxCredits}, remaining=${remainingMaxCredits}`);
    const minCredits = creditLimit.minCredits;
    const maxCredits = remainingMaxCredits;

    // Check if student is already at max credits
    if (remainingMaxCredits === 0) {
      res.status(400).json({
        success: false,
        message: `You have already enrolled in ${currentCredits} credits, which is your maximum allowed. You cannot add more courses.`,
        currentCredits,
        maxCredits: creditLimit.maxCredits,
        alreadyAtMax: true
      });
      return;
    }

    // Only courses for the student's level and major (if applicable)
    if (availableCourses.length === 0) {
      const message = existingEnrollments.length > 0 
        ? 'No additional courses available. All available courses conflict with your current schedule or you are already enrolled in all available courses.'
        : 'No available courses found for your major and level.';
      res.status(404).json({
        success: false,
        message
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

/**
 * AI-Driven Course Recommendation
 */
export const recommendCourses = async (req: Request, res: Response): Promise<void> => {
  try {
    const student = req.student;
    
    // === ENROLLMENT STATUS CHECK ===
    if (student) {
      const settings = await SystemSettings.findOne().lean();
      const openLevels = settings?.enrollmentOpenLevels || [];
      if (!settings?.isRegistrationOpen || !openLevels.includes(student.level)) {
        res.status(403).json({
          success: false,
          message: `Enrollment is currently closed for Year ${student.level} students.`,
          enrollmentClosed: true,
          openLevels,
        });
        return;
      }
    }
    
    // 1. Fetch available courses based on context
    const query: any = { isActive: true };
    if (student) {
      query.$and = [
        { $or: [{ major: student.major }, { major: { $exists: false } }, { major: '' }] },
        { $or: [{ level: student.level }, { level: { $exists: false } }, { level: null }] }
      ];
    }
    
    let availableCourses = await Course.find(query).lean();
    
    // 2. Fetch existing enrollments and filter out conflicts
    let currentCredits = 0;
    if (student) {
      const existingEnrollments = await Enrollment.find({
        student: student._id,
        semester: student.currentSemester,
        status: 'active'
      }).populate('course', 'code name credits day time startTime endTime');
      
      const existingCourses = existingEnrollments.map(e => e.course).filter(Boolean);
      currentCredits = existingCourses.reduce((sum: number, c: any) => sum + (c?.credits || 0), 0);
      
      // Filter out conflicting and already enrolled courses
      availableCourses = availableCourses.filter((course: any) => {
        const alreadyEnrolled = existingCourses.some((ec: any) => ec._id?.toString() === course._id.toString());
        if (alreadyEnrolled) return false;
        
        const hasTimeConflict = existingCourses.some((ec: any) => {
          if (ec.day !== course.day) return false;
          return ec.startTime < course.endTime && ec.endTime > course.startTime;
        });
        return !hasTimeConflict;
      });
    }
    
    // 3. Get Credit Limits
    const creditLimit = await getCreditLimitForStudent(student || { currentSemester: 'Fall', gpa: 3.5 });
    
    // Adjust for already enrolled credits
    const remainingMaxCredits = Math.max(0, creditLimit.maxCredits - currentCredits);
    const remainingMinCredits = Math.max(0, creditLimit.minCredits - currentCredits);

    // 3. Call AI Selection with adjusted limits
    const recommendedCodes = await generateAIScheduleSelection(
      availableCourses as any,
      remainingMinCredits,
      remainingMaxCredits
    );

    if (!recommendedCodes) {
      res.status(200).json({ success: true, recommendations: [] });
      return;
    }

    const recommendedCourses = availableCourses.filter(c => recommendedCodes.includes(c.code));

    res.status(200).json({
      success: true,
      recommendations: recommendedCourses.map(c => ({
        _id: c._id,
        code: c.code,
        name: c.name,
        credits: c.credits,
        day: c.day,
        time: c.time
      }))
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
