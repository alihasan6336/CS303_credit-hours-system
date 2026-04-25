import { Request, Response } from 'express';
import Student from '../models/Student';
import Enrollment from '../models/Enrollment';
import { recalculateStudentGPA, percentageToGradePoints } from '../utils/gpaCalculator';

/**
 * GET /api/gpa/me
 * Get current user's GPA breakdown and history
 */
export const getMyGPABreakdown = async (req: Request, res: Response): Promise<void> => {
  try {
    const studentId = req.student!._id;

    const [student, enrollments] = await Promise.all([
      Student.findById(studentId).select('gpa completedCreditHours'),
      Enrollment.find({ student: studentId, status: 'completed' })
        .populate('course', 'code name credits')
        .sort({ updatedAt: -1 })
        .lean()
    ]);

    if (!student) {
      res.status(404).json({ success: false, message: 'Student not found' });
      return;
    }

    const courses = enrollments.map((e: any) => ({
      code: e.course.code,
      name: e.course.name,
      credits: e.course.credits,
      grade: e.grade,
      gradePoints: percentageToGradePoints(e.grade || 0),
      semester: e.semester,
      level: e.level
    }));

    res.status(200).json({
      success: true,
      gpa: student.gpa,
      totalCredits: student.completedCreditHours,
      breakdown: courses
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/gpa/recalculate
 * Triggers a fresh calculation of the student's gpa from all completed courses
 */
export const triggerRecalculate = async (req: Request, res: Response): Promise<void> => {
  try {
    const studentId = req.student?._id || req.body.studentId;
    
    if (!studentId) {
      res.status(400).json({ success: false, message: 'Student ID is required' });
      return;
    }

    const { gpa, completedCreditHours } = await recalculateStudentGPA(studentId.toString());

    res.status(200).json({
      success: true,
      message: 'GPA recalculated successfully',
      data: { gpa, completedCreditHours }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/gpa/predict
 * Body: { potentialGrades: [{ courseId: string, grade: number }] }
 * Calculates what the final GPA would be if these grades were achieved
 */
export const predictGPA = async (req: Request, res: Response): Promise<void> => {
  try {
    const studentId = req.student!._id;
    const { potentialGrades } = req.body; // Array of { courseId: string, grade: number }

    if (!Array.isArray(potentialGrades)) {
      res.status(400).json({ success: false, message: 'potentialGrades must be an array' });
      return;
    }

    // 1. Get all CURRENTLY completed enrollments
    const completedEnrollments = await Enrollment.find({
      student: studentId,
      status: 'completed',
      grade: { $ne: null },
    }).populate('course', 'credits');

    // 2. Get the specific courses provided in potentialGrades
    const courseIds = potentialGrades.map(pg => pg.courseId);
    const predictedCourses = await Enrollment.find({
      student: studentId,
      course: { $in: courseIds }
    }).populate('course', 'credits');

    let totalQualityPoints = 0;
    let totalCredits = 0;

    // Add existing completed courses
    for (const e of completedEnrollments) {
      const credits = (e.course as any).credits || 0;
      const gp = percentageToGradePoints(e.grade || 0);
      totalQualityPoints += gp * credits;
      totalCredits += credits;
    }

    // Add predicted courses
    for (const pg of potentialGrades) {
      const enrollment = predictedCourses.find(e => e.course._id.toString() === pg.courseId);
      if (enrollment) {
        const credits = (enrollment.course as any).credits || 0;
        const gp = percentageToGradePoints(pg.grade);
        totalQualityPoints += gp * credits;
        totalCredits += credits;
      }
    }

    const predictedGPA = totalCredits > 0 ? Number((totalQualityPoints / totalCredits).toFixed(2)) : 0;

    res.status(200).json({
      success: true,
      currentGPA: req.student!.gpa,
      predictedGPA,
      totalCreditsAfter: totalCredits
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
