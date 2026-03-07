import { Request, Response } from 'express';
import Student from '../models/Student';
import Course from '../models/Course';
import Enrollment from '../models/Enrollment';

export const getAdminStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const totalStudents = await Student.countDocuments({ role: { $ne: 'superadmin' } });
        const totalCourses = await Course.countDocuments({ isActive: true });
        const totalAdmins = await Student.countDocuments({ role: 'superadmin' });
        const totalEnrollments = await Enrollment.countDocuments();

        const studentsByLevel = await Student.aggregate([
            { $match: { role: { $ne: 'superadmin' } } },
            { $group: { _id: '$level', count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
        ]);

        const courses = await Course.find({ isActive: true })
            .select('code name enrolledCount capacity')
            .sort({ enrolledCount: -1 })
            .limit(10);

        res.status(200).json({
            success: true,
            stats: { totalStudents, totalCourses, totalAdmins, totalEnrollments },
            studentsByLevel: studentsByLevel.map((s) => ({ level: s._id, count: s.count })),
            courses: courses.map((c) => ({ code: c.code, name: c.name, enrolled: c.enrolledCount, capacity: c.capacity })),
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getStudents = async (req: Request, res: Response): Promise<void> => {
    try {
        const { role } = req.query;
        const filter: any = {};
        if (role) filter.role = role;

        const students = await Student.find(filter)
            .select('fullName email universityId major academicYear level role gpa completedCreditHours currentSemester')
            .sort({ createdAt: -1 });

        res.status(200).json({ 
            success: true, 
            students: students.map(s => ({
                id: s._id,
                fullName: s.fullName,
                email: s.email,
                universityId: s.universityId,
                major: s.major,
                academicYear: s.academicYear,
                level: s.level,
                role: s.role,
                gpa: s.gpa,
                completedCreditHours: s.completedCreditHours,
                currentSemester: s.currentSemester,
            }))
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createAccount = async (req: Request, res: Response): Promise<void> => {
    try {
        const { fullName, universityId, email, password, major, academicYear, currentSemester, completedCreditHours, phoneNumber, role } = req.body;

        if (!fullName || !email || !password) {
            res.status(400).json({ success: false, message: 'Full name, email and password are required' });
            return;
        }

        const duplicate = await Student.findOne({ $or: [{ email }, ...(universityId ? [{ universityId }] : [])] });
        if (duplicate) {
            res.status(409).json({ success: false, message: 'Email or University ID already exists' });
            return;
        }

        const student = await Student.create({
            fullName,
            universityId: universityId || `AUTO-${Date.now()}`,
            email,
            password,
            major: major || 'Computer Science',
            academicYear: academicYear || '1st Year',
            currentSemester: currentSemester || 'Fall',
            completedCreditHours: Number(completedCreditHours) || 0,
            phoneNumber: phoneNumber || '',
            role: role || 'student',
        });

        res.status(201).json({ success: true, student: { id: student._id, fullName: student.fullName, email: student.email, role: student.role } });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteAccount = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const student = await Student.findByIdAndDelete(id);
        if (!student) {
            res.status(404).json({ success: false, message: 'Account not found' });
            return;
        }
        await Enrollment.deleteMany({ student: id });
        res.status(200).json({ success: true, message: 'Account deleted' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getAllEnrollments = async (req: Request, res: Response): Promise<void> => {
    try {
        const enrollments = await Enrollment.find()
            .populate('student', 'fullName universityId email level')
            .populate('course', 'code name credits')
            .sort({ enrolledAt: -1 });

        res.status(200).json({ 
            success: true, 
            enrollments: enrollments.map(e => ({
                _id: e._id,
                student: {
                    _id: (e.student as any)._id,
                    fullName: (e.student as any).fullName,
                    universityId: (e.student as any).universityId,
                    email: (e.student as any).email,
                    level: (e.student as any).level,
                },
                course: {
                    _id: (e.course as any)._id,
                    code: (e.course as any).code,
                    name: (e.course as any).name,
                    credits: (e.course as any).credits,
                },
                semester: e.semester,
                academicYear: e.academicYear,
                enrolledAt: e.enrolledAt,
            }))
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const adminEnroll = async (req: Request, res: Response): Promise<void> => {
    try {
        const { studentId, courseId } = req.body;

        const student = await Student.findById(studentId);
        if (!student) { res.status(404).json({ success: false, message: 'Student not found' }); return; }

        const course = await Course.findById(courseId);
        if (!course) { res.status(404).json({ success: false, message: 'Course not found' }); return; }

        if (course.enrolledCount >= course.capacity) {
            res.status(400).json({ success: false, message: 'Course is full' });
            return;
        }

        const exists = await Enrollment.findOne({ student: studentId, course: courseId, semester: student.currentSemester });
        if (exists) {
            res.status(409).json({ success: false, message: 'Already enrolled' });
            return;
        }

        const year = new Date().getFullYear();
        await Enrollment.create({
            student: studentId,
            course: courseId,
            semester: student.currentSemester,
            academicYear: `${year}-${year + 1}`,
        });

        course.enrolledCount += 1;
        await course.save();

        res.status(201).json({ success: true, message: 'Student enrolled successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const adminUnenroll = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const enrollment = await Enrollment.findByIdAndDelete(id);
        if (!enrollment) {
            res.status(404).json({ success: false, message: 'Enrollment not found' });
            return;
        }
        await Course.findByIdAndUpdate(enrollment.course, { $inc: { enrolledCount: -1 } });
        res.status(200).json({ success: true, message: 'Enrollment removed' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
