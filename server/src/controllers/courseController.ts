

// GET    /api/courses            → list available courses
// GET    /api/courses/:id        → single course
// POST   /api/courses            → create course (admin)
// POST   /api/courses/:id/enroll → enroll (Home.tsx "+ Add Course" button)
// DELETE /api/courses/:id/enroll → drop a course

import { Request, Response } from 'express';
import Course from '../models/Course';
import Enrollment from '../models/Enrollment';

// GET /api/courses
export const getCourses = async (req: Request, res: Response): Promise<void> => {
  try {
    const courses = await Course.find({ isActive: true }).select(
      'code name day time room credits instructor capacity enrolledCount'
    );

    res.status(200).json({ success: true, courses });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/courses/:id
export const getCourseByID = async (req: Request, res: Response): Promise<void> => {
  try {
    const course = await Course.findById(req.params.id);
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
export const getMyCourses = async ( req: Request,res: Response): Promise<void> => {
  try {
    const student = req.student!;

    const { semester, academicYear } = req.query;

    const filter: any = {
      student: student._id,
    };

    // Optional filtering
    if (semester) filter.semester = semester;
    if (academicYear) filter.academicYear = academicYear;

    const enrollments = await Enrollment.find(filter)
      .populate({
        path: "course",
        select: "code name day time room credits instructor capacity enrolledCount",
      })
      .sort({ enrolledAt: -1 });

    res.status(200).json({
      success: true,
      count: enrollments.length,
      data: enrollments,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// POST /api/courses
// Course interface: code, name, day, time, room, credits, instructor
export const createCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, name, day, time, room, credits, instructor, capacity } = req.body;

    const course = await Course.create({ code, name, day, time, room, credits, instructor, capacity });

    res.status(201).json({ success: true, course });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(409).json({
        success: false,
        message: `Course with code "${req.body.code}" already exists`,
      });
      return;
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/courses/:id/enroll
// Triggered by Home.tsx "+ Add Course" button
export const enrollCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const student  = req.student!;
    const courseId = req.params.id;

    const course = await Course.findById(courseId);
    if (!course) {
      res.status(404).json({ success: false, message: 'Course not found' });
      return;
    }

    if (course.enrolledCount >= course.capacity) {
      res.status(400).json({ success: false, message: 'Course is full' });
      return;
    }

    // Prevent duplicate
    const exists = await Enrollment.findOne({
      student:  student._id,
      course:   courseId,
      semester: student.currentSemester,
    });

    if (exists) {
      res.status(409).json({
        success: false,
        message: 'Already enrolled in this course this semester',
      });
      return;
    }

    const year = new Date().getFullYear();

    await Enrollment.create({
      student:      student._id,
      course:       courseId,
      semester:     student.currentSemester,
      academicYear: `${year}-${year + 1}`,
    });

    course.enrolledCount += 1;
    await course.save();

    res.status(201).json({ success: true, message: 'Successfully enrolled' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/courses/:id/enroll
export const dropCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const student  = req.student!;
    const courseId = req.params.id;

    const enrollment = await Enrollment.findOneAndDelete({
      student:  student._id,
      course:   courseId,
      semester: student.currentSemester,
    });

    if (!enrollment) {
      res.status(404).json({ success: false, message: 'Enrollment not found' });
      return;
    }

    await Course.findByIdAndUpdate(courseId, { $inc: { enrolledCount: -1 } });

    res.status(200).json({ success: true, message: 'Course dropped successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
