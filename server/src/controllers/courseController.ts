

// GET    /api/courses            → list available courses
// GET    /api/courses/:id        → single course
// POST   /api/courses            → create course (admin)
// PUT    /api/courses/:id        → update course (admin)
// DELETE /api/courses/:id        → delete course (admin)
// POST   /api/courses/:id/enroll → enroll (Home.tsx "+ Add Course" button)
// DELETE /api/courses/:id/enroll → drop a course

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Course from '../models/Course';
import Enrollment from '../models/Enrollment';
import AuditLog from '../models/AuditLog';
import SystemSettings from '../models/SystemSettings';
import Student, { IStudent } from '../models/Student';
import { getCreditLimitForStudent } from '../utils/creditLimitCalculator';

// GET /api/courses
export const getCourses = async (req: Request, res: Response): Promise<void> => {
  try {
    const student = req.student; // From protect middleware
    const { level, major } = req.query;
    
    // Build filter based on query params (admin/advisor use)
    const filter: any = { isActive: true };

    // If a student is requesting, override query params with student context
    if (student) {
      // Must match major (or be general) AND match level (or be general/unspecified)
      filter.$and = [
        {
          $or: [
            { major: student.major },
            { major: { $exists: false } },
            { major: '' }
          ]
        },
        {
          $or: [
            { level: student.level },
            { level: { $exists: false } },
            { level: null }
          ]
        }
      ];
    } else {
      // Admin/advisor can filter by query params
      if (level) filter.level = Number(level);
      if (major) filter.major = major;
    }

    const courses = await Course.find(filter)
      .select('code name day time startTime endTime room credits instructor capacity enrolledCount major level group type prerequisites isActive')
      .lean();

    res.status(200).json({
      success: true,
      count: courses.length,
      courses: courses.map(c => ({
        _id: c._id,
        code: c.code,
        name: c.name,
        day: c.day,
        time: c.time,
        room: c.room,
        credits: c.credits,
        instructor: c.instructor,
        group: c.group,
        type: c.type,
        capacity: c.capacity,
        enrolledCount: c.enrolledCount,
        major: c.major,
        level: c.level,
        prerequisites: c.prerequisites,
      }))
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/courses/:id
export const getCourseByID = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid course ID format' });
      return;
    }

    const course = await Course.findById(id).lean();
    if (!course) {
      res.status(404).json({ success: false, message: 'Course not found' });
      return;
    }
    res.status(200).json({ success: true, course });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// GET /api/courses/my-courses
export const getMyCourses = async (req: Request, res: Response): Promise<void> => {
  try {
    const student = req.student!;
    const { semester, level } = req.query;

    const filter: any = { student: student._id };
    if (semester) filter.semester = semester;
    if (level) filter.level = level;

    const enrollments = await Enrollment.find(filter)
      .populate({
        path: 'course',
        select: 'code name day time room credits instructor capacity enrolledCount major level group type prerequisites',
      })
      .sort({ enrolledAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: enrollments.length,
      data: enrollments,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/courses
export const createCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, name, day, time, room, credits, instructor, capacity, major,group, level,studentYear, type, prerequisites } = req.body;
    const creator = req.adminUser;

    const timeStr = time || '08:00 - 09:30';
    const { start, end } = parseTimeString(timeStr);

    const course = await Course.create({
      code,
      name,
      day: day || 'Sunday',
      time: timeStr,
      startTime: start,
      endTime: end,
      room: room || 'TBA',
      credits,
      instructor,
      group: group || 'A',
      type: type || 'Lecture',
      capacity: capacity || 30,
      major,
      level,
      prerequisites,
    });

    // Audit log
    if (creator) {
      await AuditLog.create({
        actor: creator._id,
        action: 'course:create',
        targetCourse: course._id,
        details: { code, name, major, level },
        ipAddress: req.ip,
      });
    }

    res.status(201).json({
      success: true,
      course: {
        _id: course._id,
        code: course.code,
        name: course.name,
        day: course.day,
        time: course.time,
        room: course.room,
        credits: course.credits,
        instructor: course.instructor,
        group: course.group,
        type: course.type,
        capacity: course.capacity,
        enrolledCount: course.enrolledCount,
        major: course.major,
        level: course.level,
        prerequisites: course.prerequisites,
      }
    });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(409).json({
        success: false,
        message: `Course with code "${req.body.code}" and group "${req.body.group || 'A'}" already exists`,
      });
      return;
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/courses/:id - Soft delete
export const deleteCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid course ID format' });
      return;
    }

    const course = await Course.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!course) {
      res.status(404).json({ success: false, message: 'Course not found' });
      return;
    }

    // Audit log
    if (req.adminUser) {
      await AuditLog.create({
        actor: req.adminUser._id,
        action: 'course:delete',
        targetCourse: course._id,
        details: { code: course.code, softDelete: true },
        ipAddress: req.ip,
      });
    }

    res.status(200).json({
      success: true,
      message: `Course "${course.code}" deactivated (soft delete). Enrollment history preserved.`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/courses/:id - Update single course
export const updateCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid course ID format' });
      return;
    }

    const { code, name, day, time, room, credits, instructor,group,level, capacity, major, studentYear, type, prerequisites } = req.body;

    // Guard: cannot reduce capacity below current enrollment
    if (capacity !== undefined) {
      const existingCourse = await Course.findById(id).select('enrolledCount').lean();
      if (!existingCourse) {
        res.status(404).json({ success: false, message: 'Course not found' });
        return;
      }
      if (capacity < existingCourse.enrolledCount) {
        res.status(400).json({
          success: false,
          message: `Cannot set capacity to ${capacity} — ${existingCourse.enrolledCount} students are enrolled.`,
        });
        return;
      }
    }

    let startTime, endTime;
    if (time) {
      const { start, end } = parseTimeString(time);
      startTime = start;
      endTime = end;
    }

    const course = await Course.findByIdAndUpdate(
      id,
      { code, name, day, time, room, credits, instructor, capacity, major,group, level, studentYear, type, prerequisites },
      { new: true, runValidators: true }
    );

    if (!course) {
      res.status(404).json({ success: false, message: 'Course not found' });
      return;
    }

    // Audit log
    if (req.adminUser) {
      await AuditLog.create({
        actor: req.adminUser._id,
        action: 'course:update',
        targetCourse: course._id,
        details: { code, name, major, level, capacity },
        ipAddress: req.ip,
      });
    }

    res.status(200).json({
      success: true,
      course: {
        _id: course._id,
        code: course.code,
        name: course.name,
        day: course.day,
        time: course.time,
        room: course.room,
        credits: course.credits,
        instructor: course.instructor,
        group: course.group,
        type: course.type,
        capacity: course.capacity,
        enrolledCount: course.enrolledCount,
        major: course.major,
        level: course.level,
        prerequisites: course.prerequisites,
      }
    });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(409).json({
        success: false,
        message: `Course with code "${req.body.code}" and group "${req.body.group || 'A'}" already exists`,
      });
      return;
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/courses/bulk - Bulk update courses
export const bulkUpdateCourses = async (req: Request, res: Response): Promise<void> => {
  try {
    const { courses } = req.body;

    if (!Array.isArray(courses) || courses.length === 0) {
      res.status(400).json({ success: false, message: 'Courses array is required' });
      return;
    }

    const updatePromises = courses.map(async (courseUpdate) => {
      const { _id, ...updateData } = courseUpdate;
      return Course.findByIdAndUpdate(_id, updateData, { new: true, runValidators: true });
    });

    const updatedCourses = await Promise.all(updatePromises);

    // Audit log
    if (req.adminUser) {
      await AuditLog.create({
        actor: req.adminUser._id,
        action: 'course:update',
        details: { bulkUpdate: true, count: updatedCourses.filter(c => c).length },
        ipAddress: req.ip,
      });
    }

    res.status(200).json({
      success: true,
      message: `${updatedCourses.filter(c => c).length} course(s) updated successfully`,
      courses: updatedCourses.filter(c => c).map(c => ({
        _id: c!._id,
        code: c!.code,
        name: c!.name,
        major: c!.major,
        level: c!.level,
        credits: c!.credits,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/courses/:id/enrollments - Get students enrolled in a course
export const getCourseEnrollments = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid course ID format' });
      return;
    }

    const enrollments = await Enrollment.find({ course: id })
      .populate('student', 'fullName universityId email major level')
      .sort({ enrolledAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: enrollments.length,
      enrollments: enrollments.map(e => ({
        _id: e._id,
        student: e.student,
        semester: e.semester,
        level: e.level,
        enrolledAt: e.enrolledAt,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/courses/bulk-enroll - Bulk enrollment (optimizer support)
export const bulkEnrollCourses = async (req: Request, res: Response): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    let student: IStudent | null | undefined = req.student;
    const { courseIds, replaceExisting = false, studentId } = req.body;

    // If middleware didn't populate student (e.g. Admin is testing)
    if (!student && (req as any).adminUser) {
      // 1. Try finding a student with the same email as the admin
      const adminEmail = (req as any).adminUser.email;
      student = await Student.findOne({ email: adminEmail });
      
      // 2. Or if they provided a specific studentId in the body
      if (!student && studentId) {
        student = await Student.findById(studentId);
      }
    }

    if (!student) {
      res.status(403).json({ 
        success: false, 
        message: 'Only students can enroll in courses. (Admins: please provide a studentId in the body)' 
      });
      return;
    }

    if (!Array.isArray(courseIds) || courseIds.length === 0) {
      res.status(400).json({ success: false, message: 'Course IDs array is required' });
      return;
    }

    // 1. If replaceExisting, drop all active enrollments for current semester
    if (replaceExisting) {
      const currentEnrollments = await Enrollment.find({
        student: student._id,
        semester: student.currentSemester,
        status: 'active'
      });
      
      for (const enr of currentEnrollments) {
        await Course.findByIdAndUpdate(enr.course, { $inc: { enrolledCount: -1 } }, { session });
        await Enrollment.findByIdAndDelete(enr._id, { session });
      }
    }

    const results = [];
    const creditLimit = await getCreditLimitForStudent(student);
    let totalCredits = 0;

    // 2. Process each course
    for (const courseId of courseIds) {
      const course = await Course.findById(courseId).session(session);
      if (!course || !course.isActive) {
        throw new Error(`Course ${courseId} not found or inactive`);
      }

      // Check capacity
      if (course.enrolledCount >= course.capacity) {
        throw new Error(`Course ${course.code} is full`);
      }

      // Check for already enrolled
      const existing = await Enrollment.findOne({
        student: student._id,
        course: courseId,
        semester: student.currentSemester,
        status: 'active'
      }).session(session);

      if (existing) continue; // Skip if already enrolled

      // Create enrollment
      await Enrollment.create([{
        student: student._id,
        course: courseId,
        semester: student.currentSemester,
        level: student.level,
        status: 'active'
      }], { session });

      // Update count
      course.enrolledCount += 1;
      await course.save({ session });

      totalCredits += course.credits;
      results.push(course.code);
    }

    // 3. Final Credit check
    const enrolledEnrollments = await Enrollment.find({
      student: student._id,
      semester: student.currentSemester,
      status: 'active'
    }).populate('course', 'credits').session(session);
    
    const finalTotalCredits = enrolledEnrollments.reduce((sum, e) => sum + ((e.course as any).credits || 0), 0);
    
    if (finalTotalCredits > creditLimit.maxCredits) {
      throw new Error(`Total credits (${finalTotalCredits}) would exceed your limit (${creditLimit.maxCredits})`);
    }

    await session.commitTransaction();

    // 4. Create Audit Log (Background)
    AuditLog.create({
      actor: (req as any).adminUser?._id || (student as any)._id,
      action: 'BULK_ENROLL',
      details: { 
        studentId: student._id,
        courses: results,
        message: `Student enrolled in: ${results.join(', ')}`
      }
    }).catch(err => console.error('Audit log failed:', err));

    res.status(201).json({
      success: true,
      message: `Successfully enrolled in: ${results.join(', ')}`,
      enrolledCount: results.length
    });
  } catch (error: any) {
    await session.abortTransaction();
    res.status(400).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

// POST /api/courses/:id/enroll - ATOMIC enrollment (race condition safe)
export const enrollCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const student = req.student;
    const courseId = req.params.id as string;

    if (!student) {
      res.status(403).json({ success: false, message: 'Only students can enroll in courses.' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      res.status(400).json({ success: false, message: 'Invalid course ID format' });
      return;
    }

    // Get course details including prerequisites and schedule
    const course = await Course.findById(courseId).lean();
    if (!course) {
      res.status(404).json({ success: false, message: 'Course not found' });
      return;
    }

    if (!course.isActive) {
      res.status(400).json({ success: false, message: 'This course is no longer available.' });
      return;
    }

    // === PREREQUISITE CHECK ===
    // Check if student has completed all prerequisite courses
    if (course.prerequisites && course.prerequisites.length > 0) {
      const completedEnrollments = await Enrollment.find({
        student: student._id,
        status: { $in: ['completed'] },
      }).populate('course', 'code');

      const completedCourseCodes = completedEnrollments.map(
        (e) => (e.course as any).code
      );

      const missingPrereqs = course.prerequisites.filter(
        (prereq) => !completedCourseCodes.includes(prereq)
      );

      if (missingPrereqs.length > 0) {
        res.status(403).json({
          success: false,
          message: `Prerequisites not met. Missing: ${missingPrereqs.join(', ')}`,
          missingPrerequisites: missingPrereqs,
        });
        return;
      }
    }

    // === CREDIT HOUR LIMIT CHECK ===
    const creditLimit = await getCreditLimitForStudent(student);

    const enrolledEnrollments = await Enrollment.find({
      student: student._id,
      semester: student.currentSemester,
      status: 'active',
    }).populate('course', 'credits');

    const currentTotalCredits = enrolledEnrollments.reduce((sum, e) => sum + ((e.course as any).credits || 0), 0);
    
    if (currentTotalCredits + course.credits > creditLimit.maxCredits) {
      res.status(403).json({
        success: false,
        message: `Credit hour limit exceeded. ${creditLimit.reason}. Current: ${currentTotalCredits}, Adding: ${course.credits}, Maximum: ${creditLimit.maxCredits}.`,
        limit: creditLimit.maxCredits,
        current: currentTotalCredits,
        reason: creditLimit.reason,
      });
      return;
    }

    // === SCHEDULE CONFLICT CHECK ===
    // Check if student has time conflict with already enrolled courses
    const currentEnrollments = await Enrollment.find({
      student: student._id,
      semester: student.currentSemester,
      status: 'active',
    }).populate('course', 'day startTime endTime code name');

    for (const enrollment of currentEnrollments) {
      const enrolledCourse = enrollment.course as any;
      if (enrolledCourse.day === course.day) {
        // Optimized check using startTime and endTime
        if (course.startTime < enrolledCourse.endTime && enrolledCourse.startTime < course.endTime) {
          res.status(409).json({
            success: false,
            message: `Schedule conflict with ${enrolledCourse.code} (${enrolledCourse.name}) on ${course.day}`,
            conflict: {
              courseCode: enrolledCourse.code,
              courseName: enrolledCourse.name,
              day: enrolledCourse.day,
              startTime: enrolledCourse.startTime,
              endTime: enrolledCourse.endTime,
            },
          });
          return;
        }
      }
    }

    // ATOMIC: increment enrolledCount ONLY IF a seat is available
    const updatedCourse = await Course.findOneAndUpdate(
      {
        _id: courseId,
        isActive: true,
        $expr: { $lt: ['$enrolledCount', '$capacity'] },
      },
      { $inc: { enrolledCount: 1 } },
      { new: true, runValidators: false }
    );

    if (!updatedCourse) {
      res.status(400).json({ success: false, message: 'This course is full. No seats are available.' });
      return;
    }

    // Create Enrollment document
    try {
      await Enrollment.create({
        student: student._id,
        course: courseId,
        semester: student.currentSemester,
        level: student.level,
        status: 'active',
      });
    } catch (err: any) {
      if (err.code === 11000) {
        // Duplicate: rollback the increment
        await Course.findByIdAndUpdate(courseId, { $inc: { enrolledCount: -1 } });
        res.status(409).json({
          success: false,
          message: 'You are already enrolled in this course this semester.',
        });
        return;
      }
      // Unknown error: rollback and rethrow
      await Course.findByIdAndUpdate(courseId, { $inc: { enrolledCount: -1 } });
      throw err;
    }

    // Audit log
    await AuditLog.create({
      actor: student._id,
      action: 'enroll',
      targetCourse: courseId,
      details: { semester: student.currentSemester, level: student.level },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: `Successfully enrolled in ${updatedCourse.code}.`,
      seatsRemaining: updatedCourse.capacity - updatedCourse.enrolledCount,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper function to parse time string into minutes from midnight
export const parseTimeString = (timeStr: string) => {
  // Handles formats like "08:00 - 09:30", "08:00 – 09:30", "08:00 – 09:30"
  const parts = timeStr.split(/[-–—]/).map(p => p.trim());
  if (parts.length < 2) return { start: 480, end: 570 };

  const toMinutes = (time: string) => {
    try {
      const [hours, minutes] = time.split(':').map(Number);
      return (hours || 0) * 60 + (minutes || 0);
    } catch {
      return 0;
    }
  };

  return {
    start: toMinutes(parts[0]),
    end: toMinutes(parts[1])
  };
};

// Helper function to check if two time ranges overlap
function timesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
  const toMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const s1 = toMinutes(start1);
  const e1 = toMinutes(end1);
  const s2 = toMinutes(start2);
  const e2 = toMinutes(end2);

  return s1 < e2 && s2 < e1;
}

// DELETE /api/courses/:id/enroll
export const dropCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const student = req.student!;
    const courseId = req.params.id;

    const enrollment = await Enrollment.findOneAndDelete({
      student: student._id,
      course: courseId,
      semester: student.currentSemester,
    });

    if (!enrollment) {
      res.status(404).json({ success: false, message: 'Enrollment not found' });
      return;
    }

    await Course.findByIdAndUpdate(courseId, { $inc: { enrolledCount: -1 } });

    // Audit log
    await AuditLog.create({
      actor: student._id,
      action: 'drop',
      targetCourse: courseId,
      details: { semester: student.currentSemester },
      ipAddress: req.ip,
    });

    res.status(200).json({ success: true, message: 'Course dropped successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/courses/my-credit-limit - Get current student's credit hour limits
export const getMyCreditLimit = async (req: Request, res: Response): Promise<void> => {
  try {
    const student = req.student!;

    const creditLimit = await getCreditLimitForStudent(student);

    const enrolledEnrollments = await Enrollment.find({
      student: student._id,
      semester: student.currentSemester,
      status: 'active',
    }).populate('course', 'credits');

    const currentTotalCredits = enrolledEnrollments.reduce((sum, e) => sum + ((e.course as any).credits || 0), 0);

    res.status(200).json({
      success: true,
      creditLimit: {
        minCredits: creditLimit.minCredits,
        maxCredits: creditLimit.maxCredits,
        currentCredits: currentTotalCredits,
        remainingCredits: creditLimit.maxCredits - currentTotalCredits,
        reason: creditLimit.reason,
        isSummer: creditLimit.isSummer,
        isOverride: creditLimit.isOverride,
        semester: student.currentSemester,
        gpa: student.gpa,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
