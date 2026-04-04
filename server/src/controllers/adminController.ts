import { Request, Response } from 'express';
import Student from '../models/Student';
import Course from '../models/Course';
import Enrollment from '../models/Enrollment';
import AuditLog from '../models/AuditLog';
import { recalculateStudentGPA } from '../utils/gpaCalculator';
import AdminUser from '../models/AdminUser';

// Helper to format student response
const formatStudent = (s: any) => {
    const isAdmin = s.role === 'admin' || s.role === 'superadmin';
    return {
        id: s._id,
        fullName: s.fullName,
        email: s.email,
        universityId: s.universityId,
        major: s.major,
        ...(isAdmin ? {} : {
            academicYear: s.academicYear,
            currentSemester: s.currentSemester,
            completedCreditHours: s.completedCreditHours,
        }),
        level: s.level,
        role: s.role,
        gpa: s.gpa,
    };
};

export const getAdminStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const totalStudents = await Student.countDocuments({ role: { $ne: 'superadmin' } });
        const totalCourses = await Course.countDocuments({ isActive: true });
        const totalAdmins = await AdminUser.countDocuments({ role: 'superadmin' });
        const totalEnrollments = await Enrollment.countDocuments();

        // Recent logins in last 24 hours
        const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentLogins = await Student.countDocuments({ lastLogin: { $gte: last24h } }) +
                            await AdminUser.countDocuments({ lastLogin: { $gte: last24h } });

        const studentsByLevel = await Student.aggregate([
            { $match: { role: { $ne: 'superadmin' } } },
            { $group: { _id: '$level', count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
        ]);

        const courses = await Course.find({ isActive: true })
            .select('code name enrolledCount capacity')
            .sort({ enrolledCount: -1 })
            .limit(10)
            .lean();

        res.status(200).json({
            success: true,
            stats: { totalStudents, totalCourses, totalAdmins, totalEnrollments, recentLogins },
            studentsByLevel: studentsByLevel.map((s: { _id: number; count: number }) => ({ level: s._id, count: s.count })),
            courses: courses.map((c: any) => ({ code: c.code, name: c.name, enrolled: c.enrolledCount, capacity: c.capacity })),
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getStudents = async (req: Request, res: Response): Promise<void> => {
    try {
        // Pagination
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
        const skip = (page - 1) * limit;
        const search = (req.query.search as string)?.trim();

        // Filter
        const { role } = req.query;
        const filter: any = {};
        if (role) filter.role = role;

        // Search by name or email
        if (search) {
            filter.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }

        const [students, total] = await Promise.all([
            Student.find(filter)
                .select('fullName email universityId major academicYear level role gpa completedCreditHours currentSemester')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Student.countDocuments(filter),
        ]);

        res.status(200).json({
            success: true,
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
            count: students.length,
            students: students.map(formatStudent),
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getStudentById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const student = await Student.findById(id)
            .populate('permissionsDoc', 'permissions grantedBy note updatedAt')
            .lean();

        if (!student) {
            res.status(404).json({ success: false, message: 'Student not found' });
            return;
        }

        res.status(200).json({ success: true, student: formatStudent(student) });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createStudentAccount = async (req: Request, res: Response): Promise<void> => {
    try {
        const { fullName, universityId, email, password, major, academicYear, currentSemester, completedCreditHours, phoneNumber } = req.body;
        const creator = req.adminUser;

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
            role: 'student',
        });

        // Audit log
        if (creator) {
            await AuditLog.create({
                actor: creator._id,
                action: 'user:create',
                targetUser: student._id,
                details: { role: student.role, email: student.email },
                ipAddress: req.ip,
            });
        }

        res.status(201).json({ success: true, student: { id: student._id, fullName: student.fullName, email: student.email, role: student.role } });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createAdminAccount = async (req: Request, res: Response): Promise<void> => {
    try {
        const { fullName, universityId, email, password, major, phoneNumber } = req.body;
        const creator = req.adminUser;

        if (!fullName || !email || !password) {
            res.status(400).json({ success: false, message: 'Full name, email and password are required' });
            return;
        }

        const duplicate = await Student.findOne({ $or: [{ email }, ...(universityId ? [{ universityId }] : [])] });
        if (duplicate) {
            res.status(409).json({ success: false, message: 'Email or University ID already exists' });
            return;
        }

        const admin = await Student.create({
            fullName,
            universityId: universityId || `AUTO-${Date.now()}`,
            email,
            password,
            major: major || 'Administration',
            academicYear: 'N/A',
            currentSemester: 'N/A',
            completedCreditHours: 0,
            phoneNumber: phoneNumber || '',
            role: 'admin',
        });

        // Audit log
        if (creator) {
            await AuditLog.create({
                actor: creator._id,
                action: 'admin:create',
                targetUser: admin._id,
                details: { role: admin.role, email: admin.email },
                ipAddress: req.ip,
            });
        }

        res.status(201).json({ success: true, student: { id: admin._id, fullName: admin.fullName, email: admin.email, role: admin.role } });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateAccount = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { fullName, email, isActive } = req.body;
        const caller = req.adminUser;

        const student = await Student.findById(id);
        if (!student) {
            res.status(404).json({ success: false, message: 'Account not found' });
            return;
        }

        if (fullName) student.fullName = fullName;
        if (email) student.email = email;
        if (isActive !== undefined) student.isActive = isActive;

        await student.save();

        // Audit log
        if (caller) {
            await AuditLog.create({
                actor: caller._id,
                action: 'user:update',
                targetUser: student._id,
                details: { fullName, email, isActive },
                ipAddress: req.ip,
            });
        }

        res.status(200).json({ success: true, student: formatStudent(student) });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteAccount = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const caller = req.adminUser;

        const student = await Student.findById(id);
        if (!student) {
            res.status(404).json({ success: false, message: 'Account not found' });
            return;
        }

        // Audit log before deletion
        if (caller) {
            await AuditLog.create({
                actor: caller._id,
                action: 'user:delete',
                targetUser: student._id,
                details: { email: student.email, role: student.role },
                ipAddress: req.ip,
            });
        }

        await Student.findByIdAndDelete(id);
        await Enrollment.deleteMany({ student: id });
        res.status(200).json({ success: true, message: 'Account deleted' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const toggleAccountStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const caller = req.adminUser;

        const student = await Student.findById(id);
        if (!student) {
            res.status(404).json({ success: false, message: 'Account not found' });
            return;
        }

        student.isActive = !student.isActive;
        await student.save();

        // Audit log
        if (caller) {
            await AuditLog.create({
                actor: caller._id,
                action: 'user:toggle',
                targetUser: student._id,
                details: { isActive: student.isActive },
                ipAddress: req.ip,
            });
        }

        res.status(200).json({ success: true, isActive: student.isActive, message: `Account ${student.isActive ? 'activated' : 'deactivated'}` });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getAllEnrollments = async (req: Request, res: Response): Promise<void> => {
    try {
        // Pagination
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
        const skip = (page - 1) * limit;

        const [enrollments, total] = await Promise.all([
            Enrollment.find()
                .populate('student', 'fullName universityId email level')
                .populate('course', 'code name credits')
                .sort({ enrolledAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Enrollment.countDocuments(),
        ]);

        res.status(200).json({
            success: true,
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
            count: enrollments.length,
            enrollments: enrollments.map((e: any) => ({
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
            })),
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const adminEnroll = async (req: Request, res: Response): Promise<void> => {
    try {
        const { studentId, courseId } = req.body;
        const caller = req.adminUser;

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

        // Audit log
        if (caller) {
            await AuditLog.create({
                actor: caller._id,
                action: 'enroll',
                targetCourse: courseId,
                details: { studentId, semester: student.currentSemester },
                ipAddress: req.ip,
            });
        }

        res.status(201).json({ success: true, message: 'Student enrolled successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const adminUnenroll = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const caller = req.adminUser;

        const enrollment = await Enrollment.findByIdAndDelete(id);
        if (!enrollment) {
            res.status(404).json({ success: false, message: 'Enrollment not found' });
            return;
        }
        await Course.findByIdAndUpdate(enrollment.course, { $inc: { enrolledCount: -1 } });

        // Audit log
        if (caller) {
            await AuditLog.create({
                actor: caller._id,
                action: 'drop',
                targetCourse: enrollment.course,
                details: { studentId: enrollment.student },
                ipAddress: req.ip,
            });
        }

        res.status(200).json({ success: true, message: 'Enrollment removed' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateGrade = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { grade } = req.body;
        const caller = req.adminUser;

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

        const enrollment = await Enrollment.findById(id)
            .populate('student', 'fullName universityId')
            .populate('course', 'code name');

        if (!enrollment) {
            res.status(404).json({ success: false, message: 'Enrollment not found' });
            return;
        }

        const oldGrade = enrollment.grade;
        enrollment.grade = numericGrade;
        enrollment.status = 'completed'; // Ensure status is updated to completed
        await enrollment.save();

        // Recalculate student GPA after grade update
        const studentId = (enrollment.student as any)._id || enrollment.student;
        await recalculateStudentGPA(studentId.toString());

        // Audit log
        if (caller) {
            await AuditLog.create({
                actor: caller._id,
                action: 'grade:update',
                targetCourse: enrollment.course,
                targetUser: enrollment.student,
                details: { 
                    enrollmentId: id,
                    oldGrade, 
                    newGrade: numericGrade 
                },
                ipAddress: req.ip,
            });
        }

        res.status(200).json({
            success: true,
            message: 'Grade updated successfully',
            enrollment: {
                _id: enrollment._id,
                student: enrollment.student,
                course: enrollment.course,
                semester: enrollment.semester,
                academicYear: enrollment.academicYear,
                grade: enrollment.grade,
            },
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
