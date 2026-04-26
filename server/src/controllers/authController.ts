// Handles all auth pages:
//   Register.tsx   → register()
//   Login.tsx      → login()
//   ForgotPassword.tsx → forgotPassword() + resetPassword()

import { Request, Response } from 'express';
import crypto from 'crypto';
import Student from '../models/Student';
import AdminUser from '../models/AdminUser';
import { signToken, verifyToken } from '../utils/jwt';
import { resolveAdminType } from '../utils/adminType';

// Matches every field that Login.tsx and Home.tsx read from the response
const buildStudentPayload = (student: InstanceType<typeof Student>) => ({
  id: student._id,
  fullName: student.fullName,
  universityId: student.universityId,
  email: student.email,
  major: student.major,
  level: student.level,
  currentSemester: student.currentSemester,
  completedCreditHours: student.completedCreditHours,
  phoneNumber: student.phoneNumber,
  gpa: student.gpa,
  role: student.role || 'student',
});

// Admin payload builder
const buildAdminPayload = (admin: InstanceType<typeof AdminUser>) => ({
  id: admin._id,
  fullName: admin.fullName,
  email: admin.email,
  role: admin.role,
  adminType: resolveAdminType(admin._id.toString(), admin.email),
  isActive: admin.isActive,
});

// POST /api/auth/register

// Returns: { success, token, student }
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      fullName,
      universityId,
      email,
      password,
      major,
      level,
      currentSemester,
      completedCreditHours,
      phoneNumber,
    } = req.body;

    const duplicate = await Student.findOne({
      $or: [{ email }, { universityId }],
    });

    if (duplicate) {
      res.status(409).json({
        success: false,
        field: duplicate.email === email ? 'email' : 'universityId',
        message:
          duplicate.email === email
            ? 'This email is already registered'
            : 'This University ID is already registered',
      });
      return;
    }

    const student = await Student.create({
      fullName,
      universityId,
      email,
      password,
      major,
      level: Number(level),
      currentSemester,
      completedCreditHours: Number(completedCreditHours),
      phoneNumber: phoneNumber || '',
      gpa: 0,
    });

    const token = signToken(student._id.toString(), student.email, false);

    res.status(201).json({
      success: true,
      token,
      student: buildStudentPayload(student),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/login
// Unified login for both students and admins
// Returns: { success, token, student } or { success, token, admin }
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, rememberMe } = req.body;

    // 1. First check AdminUser collection (admins and superadmins)
    const admin = await AdminUser.findOne({ email }).select('+password');
    
    if (admin) {
      // Check if account is active
      if (!admin.isActive) {
        res.status(401).json({
          success: false,
          message: 'Your account has been deactivated. Contact super admin.',
        });
        return;
      }

      // Verify password
      if (!(await admin.comparePassword(password))) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
        return;
      }

      // Update lastLogin
      admin.lastLogin = new Date();
      await admin.save({ validateBeforeSave: false });

      // Sign JWT
      const token = signToken(
        admin._id.toString(),
        admin.email,
        Boolean(rememberMe)
      );

      res.status(200).json({
        success: true,
        token,
        student: buildAdminPayload(admin),
      });
      return;
    }

    // 2. If not admin, check Student collection
    const student = await Student.findOne({ email }).select('+password');

    // Unified error — don't reveal whether email or password was wrong
    if (!student || !(await student.comparePassword(password))) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    // Check if student account is active
    if (student.isActive === false) {
      res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.',
      });
      return;
    }

    // Sign JWT — pass rememberMe boolean from Login.tsx checkbox
    const token = signToken(
      student._id.toString(),
      student.email,
      Boolean(rememberMe)
    );

    res.status(200).json({
      success: true,
      token,
      student: buildStudentPayload(student),
      role: student.role || 'student',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/forgot-password

// Always returns 200 to prevent email enumeration.
export const forgotPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;

    const student = await Student.findOne({ email });

    if (!student) {
      res.status(200).json({
        success: true,
        message: 'If that email is registered, reset instructions have been sent.',
      });
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');

    student.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    student.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000);

    await student.save({ validateBeforeSave: false });

    const resetURL = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    console.log('[DEV] Password reset link:', resetURL);

    res.status(200).json({
      success: true,
      message: 'If that email is registered, reset instructions have been sent.',
      ...(process.env.NODE_ENV === 'development' && { resetURL }),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/reset-password/:token

// Body: { password, confirmPassword }
// Returns: { success, token, student } 
export const resetPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const hashedToken = crypto
      .createHash('sha256')
      .update(token as string)
      .digest('hex');

    const student = await Student.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    }).select('+password');

    if (!student) {
      res.status(400).json({
        success: false,
        message: 'Reset link is invalid or has expired. Please request a new one.',
      });
      return;
    }

    student.password = password;
    student.resetPasswordToken = undefined;
    student.resetPasswordExpires = undefined;
    await student.save();

    const newToken = signToken(student._id.toString(), student.email, false);

    res.status(200).json({
      success: true,
      token: newToken,
      student: buildStudentPayload(student),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/auth/me
//  returns the currently logged-in student's profile.
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.student?._id || req.adminUser?._id;
    const isAdmin = !!req.adminUser;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const user = isAdmin
      ? await AdminUser.findById(userId)
      : await Student.findById(userId);

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.status(200).json({
      success: true,
      student: isAdmin 
        ? buildAdminPayload(user as InstanceType<typeof AdminUser>)
        : buildStudentPayload(user as InstanceType<typeof Student>),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/refresh
// Refresh access token using current valid token
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'No token provided',
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    // Check if user still exists and is active
    let user = await AdminUser.findById(decoded.id);
    let isAdmin = true;

    if (!user) {
      user = await Student.findById(decoded.id);
      isAdmin = false;
    }

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        success: false,
        message: 'Account has been deactivated',
      });
      return;
    }

    // Issue new token
    const newToken = signToken(user._id.toString(), user.email, false);

    res.status(200).json({
      success: true,
      token: newToken,
      student: isAdmin 
        ? buildAdminPayload(user as InstanceType<typeof AdminUser>)
        : buildStudentPayload(user as InstanceType<typeof Student>),
    });
  } catch (error: any) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};

// PATCH /api/auth/change-password
// Change password while logged in (requires current password)
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        message: 'Current password and new password are required',
      });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters',
      });
      return;
    }

    // Get user ID from token (set by protect middleware)
    const userId = (req as any).student?._id || (req as any).adminUser?._id;
    const isAdmin = !!(req as any).adminUser;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
      return;
    }

    // Find user with password
    const user = isAdmin
      ? await AdminUser.findById(userId).select('+password')
      : await Student.findById(userId).select('+password');

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
      return;
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/auth/profile
// Update own profile (students only)
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const studentId = req.student?._id;

    if (!studentId) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated as student',
      });
      return;
    }

    const { fullName, phoneNumber, major, level, currentSemester } = req.body;

    const student = await Student.findById(studentId);
    if (!student) {
      res.status(404).json({ success: false, message: 'Student not found' });
      return;
    }

    // Update allowed fields
    if (fullName) student.fullName = fullName;
    if (phoneNumber !== undefined) student.phoneNumber = phoneNumber;
    if (major) student.major = major;
    if (level) student.level = level;
    if (currentSemester) student.currentSemester = currentSemester;

    await student.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      student: buildStudentPayload(student),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
