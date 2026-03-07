import { Request, Response } from 'express';
import Course from '../models/Course';
import CourseAssignment from '../models/CourseAssignment';

// Get all course assignments
export const getAssignments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { level, semester, academicYear } = req.query;
    
    const filter: any = { isActive: true };
    if (level) filter.level = Number(level);
    if (semester) filter.semester = semester;
    if (academicYear) filter.academicYear = academicYear;

    const assignments = await CourseAssignment.find(filter)
      .populate('course', 'code name day time room credits instructor capacity enrolledCount')
      .sort({ level: 1, 'course.code': 1 });

    res.status(200).json({ success: true, assignments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Assign a course to a level
export const assignCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { courseId, level, semester, academicYear } = req.body;

    if (!courseId || !level || !semester || !academicYear) {
      res.status(400).json({ success: false, message: 'Course ID, level, semester, and academic year are required' });
      return;
    }

    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      res.status(404).json({ success: false, message: 'Course not found' });
      return;
    }

    // Check if already assigned
    const existing = await CourseAssignment.findOne({
      course: courseId,
      level,
      semester,
      academicYear,
    });

    if (existing) {
      res.status(409).json({ success: false, message: 'Course already assigned to this level for the specified semester' });
      return;
    }

    const assignment = await CourseAssignment.create({
      course: courseId,
      level,
      semester,
      academicYear,
    });

    await assignment.populate('course', 'code name day time room credits instructor capacity enrolledCount');

    res.status(201).json({ success: true, assignment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Remove a course assignment
export const removeAssignment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const assignment = await CourseAssignment.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!assignment) {
      res.status(404).json({ success: false, message: 'Assignment not found' });
      return;
    }

    res.status(200).json({ success: true, message: 'Assignment removed' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get courses available for assignment (not yet assigned to a specific level/semester/year)
export const getAvailableCourses = async (req: Request, res: Response): Promise<void> => {
  try {
    const { level, semester, academicYear } = req.query;

    if (!level || !semester || !academicYear) {
      const courses = await Course.find({ isActive: true }).sort({ code: 1 });
      res.status(200).json({ success: true, courses });
      return;
    }

    // Get already assigned course IDs
    const assigned = await CourseAssignment.find({
      level: Number(level),
      semester,
      academicYear,
      isActive: true,
    }).select('course');

    const assignedIds = assigned.map(a => a.course);

    const courses = await Course.find({
      isActive: true,
      _id: { $nin: assignedIds },
    }).sort({ code: 1 });

    res.status(200).json({ success: true, courses });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get assignments grouped by level for admin view
export const getAssignmentsByLevel = async (req: Request, res: Response): Promise<void> => {
  try {
    const { semester, academicYear } = req.query;

    const filter: any = { isActive: true };
    if (semester) filter.semester = semester;
    if (academicYear) filter.academicYear = academicYear;

    const assignments = await CourseAssignment.find(filter)
      .populate('course', 'code name day time room credits instructor capacity enrolledCount')
      .sort({ level: 1, 'course.code': 1 });

    // Group by level
    const byLevel: Record<number, any[]> = { 1: [], 2: [], 3: [], 4: [] };
    assignments.forEach(a => {
      if (byLevel[a.level]) {
        byLevel[a.level].push(a);
      }
    });

    res.status(200).json({ success: true, byLevel });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
