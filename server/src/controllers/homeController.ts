
// Returns exactly the shape that Home.tsx HomeProps.student expects:
//   { name, id, level, gpa, completedHours, major, semester, courses[] }
//
// courses[] items match Home.tsx Course interface:
//   { code, name, day, time, room, credits, instructor }

import { Request, Response } from 'express';
import Student from '../models/Student';
import Enrollment from '../models/Enrollment';
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

    const enrollments = await Enrollment.find({
      student:  studentId,
      semester: student.currentSemester,
    }).populate<{ course: ICourse }>(
      'course',
      'code name day time room credits instructor'   
    );

    const courses = enrollments
      .filter((e) => e.course)
      .map((e) => ({
        code:       e.course.code,
        name:       e.course.name,
        day:        e.course.day,
        time:       e.course.time,
        room:       e.course.room,
        credits:    e.course.credits,
        instructor: e.course.instructor,
      }));

    const semesterLabel = `${student.currentSemester} ${new Date().getFullYear()}`;

    res.status(200).json({
      success: true,
      student: {
        name:           student.fullName,       
        id:             student.universityId,   
        level:          student.level,
        gpa:            student.gpa,
        completedHours: student.completedCreditHours,
        major:          student.major,
        semester:       semesterLabel,
        courses,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
