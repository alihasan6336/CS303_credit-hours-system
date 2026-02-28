
// Lightweight field-presence validation that mirrors frontend form validation
// in Login.tsx, Register.tsx, and ForgotPassword.tsx.
//

import { Request, Response, NextFunction } from 'express';

const missing = (body: Record<string, any>, fields: string[]): string[] =>
  fields.filter((f) => !body[f] || String(body[f]).trim() === '');

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

// validateRegister
// Guards POST /api/auth/register
export const validateRegister = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const {
    fullName,
    universityId,
    email,
    password,
    confirmPassword,
    major,
    academicYear,
    currentSemester,
    completedCreditHours,
    acceptTerms,
  } = req.body;

  const errors: Record<string, string> = {};

  if (!fullName?.trim())       errors.fullName = 'Full name is required';
  if (!universityId?.trim())   errors.universityId = 'University ID is required';

  if (!email?.trim()) {
    errors.email = 'Email is required';
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!password) {
    errors.password = 'Password is required';
  } else if (password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }

  if (!confirmPassword) {
    errors.confirmPassword = 'Please confirm your password';
  } else if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  if (!major)           errors.major = 'Please select your major';
  if (!academicYear)    errors.academicYear = 'Please select your academic year';
  if (!currentSemester) errors.currentSemester = 'Please select the current semester';

  if (!String(completedCreditHours).trim()) {
    errors.completedCreditHours = 'Completed credit hours is required';
  } else if (isNaN(Number(completedCreditHours)) || Number(completedCreditHours) < 0) {
    errors.completedCreditHours = 'Please enter a valid number';
  }

  if (!acceptTerms) errors.acceptTerms = 'You must accept the terms and conditions';

  if (Object.keys(errors).length > 0) {
    res.status(400).json({ success: false, errors });
    return;
  }

  next();
};

// validateLogin
// Guards POST /api/auth/login
export const validateLogin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { email, password } = req.body;
  const errors: Record<string, string> = {};

  if (!email?.trim()) {
    errors.email = 'Email is required';
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!password) {
    errors.password = 'Password is required';
  } else if (password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }

  if (Object.keys(errors).length > 0) {
    res.status(400).json({ success: false, errors });
    return;
  }

  next();
};

// validateForgotPassword
// Guards POST /api/auth/forgot-password
export const validateForgotPassword = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { email } = req.body;
  const errors: Record<string, string> = {};

  if (!email?.trim()) {
    errors.email = 'Email is required';
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (Object.keys(errors).length > 0) {
    res.status(400).json({ success: false, errors });
    return;
  }

  next();
};

// validateResetPassword
// Guards POST /api/auth/reset-password/:token
export const validateResetPassword = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { password, confirmPassword } = req.body;
  const errors: Record<string, string> = {};

  if (!password) {
    errors.password = 'Password is required';
  } else if (password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }

  if (!confirmPassword) {
    errors.confirmPassword = 'Please confirm your password';
  } else if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  if (Object.keys(errors).length > 0) {
    res.status(400).json({ success: false, errors });
    return;
  }

  next();
};
