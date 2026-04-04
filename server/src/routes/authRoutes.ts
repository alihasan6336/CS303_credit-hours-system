// PUBLIC routes  — no JWT required (Login, Register, ForgotPassword pages)
// PROTECTED routes — JWT required (getMe, used to rehydrate session)

// Middleware pipeline for each route:
//   PUBLIC:    validate → controller
//   PROTECTED: protect  → controller

import { Router } from 'express';
import {
  register,
  login,
  forgotPassword,
  resetPassword,
  getMe,
  refreshToken,
  changePassword,
  updateProfile,
} from '../controllers/authController';
import { protect } from '../middleware/protect';
import {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
} from '../middleware/validateRequest';

const router = Router();


// Register.tsx → POST /api/auth/register
router.post('/register', validateRegister, register);

// Login.tsx → POST /api/auth/login
router.post('/login', validateLogin, login);

// ForgotPassword.tsx → POST /api/auth/forgot-password
router.post('/forgot-password', validateForgotPassword, forgotPassword);

// Reset password link clicked from email
router.post('/reset-password/:token', validateResetPassword, resetPassword);


// Rehydrate logged-in student (call on app load / page refresh)
// GET /api/auth/me  →  Authorization: Bearer <token>
router.get('/me', protect, getMe);

// Refresh token - POST /api/auth/refresh
router.post('/refresh', refreshToken);

// Change password while logged in - PATCH /api/auth/change-password
router.patch('/change-password', protect, changePassword);

// Update own profile - PUT /api/auth/profile
router.put('/profile', protect, updateProfile);

export default router;
