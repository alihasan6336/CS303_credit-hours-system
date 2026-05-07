import { Request, Response } from 'express';
import Enrollment from '../models/Enrollment';
import Student from '../models/Student';
import Course from '../models/Course';
import AuditLog from '../models/AuditLog';
import { recalculateStudentGPA } from '../utils/gpaCalculator';
import { getCreditLimitForStudent } from '../utils/creditLimitCalculator';

// GET /api/admin/enrollments - List all enrollments (admin)
export const listEnrollments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId, courseId, semester, level, status, page = '1', limit = '20' } = req.query;

    const filter: any = {};
    if (studentId) filter.student = studentId;
    if (courseId) filter.course = courseId;
    if (semester) filter.semester = semester;
    if (level) filter.level = level;
    if (status) filter.status = status;

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, parseInt(limit as string));
    const skip = (pageNum - 1) * limitNum;

    const [enrollments, total] = await Promise.all([
      Enrollment.find(filter)
        .populate('student', 'fullName universityId email level major')
        .populate('course', 'code name credits day time room instructor')
        .sort({ enrolledAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Enrollment.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
      count: enrollments.length,
      enrollments,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/admin/enrollments - Create enrollment for a student (admin)
export const createEnrollment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId, courseId, semester, level } = req.body;
    const caller = (req as any).adminUser;

    // Validate required fields
    if (!studentId || !courseId) {
      res.status(400).json({ success: false, message: 'Student ID and Course ID are required' });
      return;
    }

    // Check student exists
    const student = await Student.findById(studentId);
    if (!student) {
      res.status(404).json({ success: false, message: 'Student not found' });
      return;
    }

    // Check course exists and has capacity
    const course = await Course.findById(courseId);
    if (!course) {
      res.status(404).json({ success: false, message: 'Course not found' });
      return;
    }

    if (course.enrolledCount >= course.capacity) {
      res.status(400).json({ success: false, message: 'Course is full' });
      return;
    }

    // Determine semester and level
    const enrollmentSemester = semester || student.currentSemester;
    const enrollmentLevel = level || student.level;

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      student: studentId,
      course: courseId,
      semester: enrollmentSemester,
      level: enrollmentLevel,
    });

    if (existingEnrollment) {
      res.status(409).json({ success: false, message: 'Student is already enrolled in this course' });
      return;
    }

    // Credit limit validation
    const creditLimit = await getCreditLimitForStudent(student);
    const currentEnrollments = await Enrollment.find({
      student: studentId,
      semester: enrollmentSemester,
      status: 'active',
    }).populate('course', 'credits');
    const currentTotalCredits = currentEnrollments.reduce((sum, e) => sum + ((e.course as any).credits || 0), 0);

    if (currentTotalCredits + course.credits > creditLimit.maxCredits) {
      res.status(403).json({
        success: false,
        message: `Credit hour limit exceeded. ${creditLimit.reason}. Current: ${currentTotalCredits}, Adding: ${course.credits}, Maximum: ${creditLimit.maxCredits}. Use credit-override to bypass if needed.`,
        limit: creditLimit.maxCredits,
        current: currentTotalCredits,
        reason: creditLimit.reason,
      });
      return;
    }

    // Create enrollment
    const enrollment = await Enrollment.create({
      student: studentId,
      course: courseId,
      semester: enrollmentSemester,
      level: enrollmentLevel,
      status: 'active',
    });

    // Increment course enrolled count
    course.enrolledCount += 1;
    await course.save();

    // Audit log
    if (caller) {
      await AuditLog.create({
        actor: caller._id,
        action: 'admin:enroll',
        targetUser: studentId,
        targetCourse: courseId,
        details: { semester: enrollmentSemester, level: enrollmentLevel },
        ipAddress: req.ip,
      });
    }

    // Populate and return
    const populatedEnrollment = await Enrollment.findById(enrollment._id)
      .populate('student', 'fullName universityId email')
      .populate('course', 'code name credits');

    res.status(201).json({
      success: true,
      message: 'Enrollment created successfully',
      enrollment: populatedEnrollment,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/admin/enrollments/:id - Delete enrollment (admin)
export const deleteEnrollment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const caller = (req as any).adminUser;

    const enrollment = await Enrollment.findById(id);
    if (!enrollment) {
      res.status(404).json({ success: false, message: 'Enrollment not found' });
      return;
    }

    // Decrement course enrolled count
    await Course.findByIdAndUpdate(enrollment.course, { $inc: { enrolledCount: -1 } });

    // Delete enrollment
    await Enrollment.findByIdAndDelete(id);

    // Audit log
    if (caller) {
      await AuditLog.create({
        actor: caller._id,
        action: 'admin:unenroll',
        targetUser: enrollment.student,
        targetCourse: enrollment.course,
        details: { semester: enrollment.semester, level: enrollment.level },
        ipAddress: req.ip,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Enrollment deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/admin/enrollments/:id/grade - Update grade and recalculate GPA
export const updateGrade = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { grade } = req.body;
    const caller = (req as any).adminUser;

    // Validate grade
    if (grade === undefined || grade === null) {
      res.status(400).json({ success: false, message: 'Grade is required' });
      return;
    }

    const numericGrade = Number(grade);
    if (isNaN(numericGrade) || numericGrade < 0 || numericGrade > 100) {
      res.status(400).json({ success: false, message: 'Grade must be a number between 0 and 100' });
      return;
    }

    // Find enrollment with student and course populated
    const enrollment = await Enrollment.findById(id)
      .populate('student', '_id fullName')
      .populate('course', 'code name credits');

    if (!enrollment) {
      res.status(404).json({ success: false, message: 'Enrollment not found' });
      return;
    }

    const oldGrade = enrollment.grade;
    const studentId = (enrollment.student as any)._id;

    // Update grade and status
    enrollment.grade = numericGrade;
    enrollment.status = 'completed';
    await enrollment.save();

    // Recalculate student GPA using the utility
    await recalculateStudentGPA(studentId);

    // Audit log
    if (caller) {
      await AuditLog.create({
        actor: caller._id,
        action: 'grade:update',
        targetUser: studentId,
        targetCourse: enrollment.course,
        details: {
          enrollmentId: id,
          oldGrade,
          newGrade: numericGrade,
          courseCode: (enrollment.course as any).code,
        },
        ipAddress: req.ip,
      });
    }

    // Get updated student
    const updatedStudent = await Student.findById(studentId).select('gpa completedCreditHours');

    res.status(200).json({
      success: true,
      message: 'Grade updated successfully',
      enrollment: {
        _id: enrollment._id,
        grade: enrollment.grade,
        status: enrollment.status,
        course: enrollment.course,
      },
      gpa: updatedStudent?.gpa,
      completedCreditHours: updatedStudent?.completedCreditHours,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

