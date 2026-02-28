// Handles all auth pages:
//   Register.tsx   → register()
//   Login.tsx      → login()
//   ForgotPassword.tsx → forgotPassword() + resetPassword()

import { Request, Response } from 'express';
import crypto from 'crypto';
import Student from '../models/Student';
import { signToken } from '../utils/jwt';

// Matches every field that Login.tsx and Home.tsx read from the response
const buildStudentPayload = (student: InstanceType<typeof Student>) => ({
  id:                   student._id,
  fullName:             student.fullName,
  universityId:         student.universityId,
  email:                student.email,
  major:                student.major,
  academicYear:         student.academicYear,
  currentSemester:      student.currentSemester,
  completedCreditHours: student.completedCreditHours,
  phoneNumber:          student.phoneNumber,
  gpa:                  student.gpa,
  level:                student.level,
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
      academicYear,
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
        field:   duplicate.email === email ? 'email' : 'universityId',
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
      academicYear,
      currentSemester,
      completedCreditHours: Number(completedCreditHours),
      phoneNumber: phoneNumber || '',
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


// Returns: { success, token, student }
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, rememberMe } = req.body;

    // Explicitly select password field (select: false in schema)
    const student = await Student.findOne({ email }).select('+password');

    // Unified error — don't reveal whether email or password was wrong
    if (!student || !(await student.comparePassword(password))) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
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
      resetPasswordToken:   hashedToken,
      resetPasswordExpires: { $gt: Date.now() },   
    }).select('+password');

    if (!student) {
      res.status(400).json({
        success: false,
        message: 'Reset link is invalid or has expired. Please request a new one.',
      });
      return;
    }

    student.password              = password;
    student.resetPasswordToken    = undefined;
    student.resetPasswordExpires  = undefined;
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
    // req.student is set by the protect middleware
    const student = await Student.findById(req.student!._id);

    if (!student) {
      res.status(404).json({ success: false, message: 'Student not found' });
      return;
    }

    res.status(200).json({
      success: true,
      student: buildStudentPayload(student),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
