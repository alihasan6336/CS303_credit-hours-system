import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import Student from '../models/Student';

const signToken = (id: string): string =>
  jwt.sign(
    { id },
    process.env.JWT_SECRET as string,
    { expiresIn: process.env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] }
  );
                        ///// register function //////
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

    const existing = await Student.findOne({
      $or: [{ email }, { universityId }],
    });

    if (existing) {
      res.status(400).json({
        success: false,
        message:
          existing.email === email
            ? 'Email is already registered'
            : 'University ID is already registered',
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

    const token = signToken(student._id.toString());

    res.status(201).json({
      success: true,
      token,
      student: {
        id: student._id,
        fullName: student.fullName,
        universityId: student.universityId,
        email: student.email,
        major: student.major,
        academicYear: student.academicYear,
        currentSemester: student.currentSemester,
        completedCreditHours: student.completedCreditHours,
        gpa: student.gpa,
        level: student.level,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
                      ///// login function ///////
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
      return;
    }

    const student = await Student.findOne({ email }).select('+password');

    if (!student || !(await student.comparePassword(password))) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    const expiresIn = rememberMe ? '30d' : '1d';
    const token = jwt.sign(
      { id: student._id },
      process.env.JWT_SECRET as string,
      { expiresIn }
    );

    res.status(200).json({
      success: true,
      token,
      student: {
        id: student._id,
        fullName: student.fullName,
        universityId: student.universityId,
        email: student.email,
        major: student.major,
        academicYear: student.academicYear,
        currentSemester: student.currentSemester,
        completedCreditHours: student.completedCreditHours,
        gpa: student.gpa,
        level: student.level,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
                     ///// forget function //////
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
        message: 'If that email exists, reset instructions have been sent',
      });
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');

    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    student.resetPasswordToken = hashedToken;
    student.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000);
    await student.save({ validateBeforeSave: false });

    const resetURL = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    console.log('Password reset link (send via email):', resetURL);

    res.status(200).json({
      success: true,
      message: 'If that email exists, reset instructions have been sent',
      ...(process.env.NODE_ENV === 'development' && { resetURL }),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
                     ///// reset function /////
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
        message: 'Token is invalid or has expired',
      });
      return;
    }

    student.password = password;
    student.resetPasswordToken = undefined;
    student.resetPasswordExpires = undefined;
    await student.save();

    const newToken = signToken(student._id.toString());
    res.status(200).json({ success: true, token: newToken });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

