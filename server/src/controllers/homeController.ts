
// Returns exactly the shape that Home.tsx HomeProps.student expects:
//   { name, id, level, gpa, completedHours, major, semester, courses[] }
//
// courses[] items match Home.tsx Course interface:
//   { code, name, day, time, room, credits, instructor }

import { Request, Response } from 'express';
import Student from '../models/Student';
import Enrollment from '../models/Enrollment';
import CourseAssignment from '../models/CourseAssignment';
import { ICourse } from '../models/Course';

export const getHomeData = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const studentId = req.student!._id;

    const student = await Student.findById(studentId);
    if (!student) {
      res.status(404).json({ success: false, message: 'Student not found' });
      return;
    }

    // Get courses assigned to student's level
    const currentYear = new Date().getFullYear();
    const assignments = await CourseAssignment.find({
      level: student.level,
      semester: student.currentSemester,
      academicYear: `${currentYear}-${currentYear + 1}`,
      isActive: true,
    }).populate<{
      course: ICourse
    }>('course', 'code name day time room credits instructor');

    // Get student's enrollments to check which courses they're enrolled in
    const enrollments = await Enrollment.find({
      student: studentId,
      semester: student.currentSemester,
    }).select('course');

    const enrolledCourseIds = enrollments.map(e => e.course.toString());

    // Map assigned courses, marking which ones student is enrolled in
    const courses = assignments
      .filter((a) => a.course)
      .map((a) => ({
        code: a.course.code,
        name: a.course.name,
        day: a.course.day,
        time: a.course.time,
        room: a.course.room,
        credits: a.course.credits,
        instructor: a.course.instructor,
        isEnrolled: enrolledCourseIds.includes(a.course._id.toString()),
      }));

    const semesterLabel = `${student.currentSemester} ${currentYear}`;

    res.status(200).json({
      success: true,
      student: {
        id: student._id,
        fullName: student.fullName,
        universityId: student.universityId,
        email: student.email,
        major: student.major,
        academicYear: student.academicYear,
        currentSemester: student.currentSemester,
        completedCreditHours: student.completedCreditHours,
        phoneNumber: student.phoneNumber,
        gpa: student.gpa,
        level: student.level,
        role: student.role,
      },
      courses,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
