import { Router, Request, Response } from 'express';
import {
  getAdminStats,
  getStudents,
  getStudentById,
  getStudentAcademicRecord,
  createStudentAccount,
  createAdminAccount,
  updateAccount,
  deleteAccount,
  toggleAccountStatus,
  getAllEnrollments,
  adminEnroll,
  adminUnenroll,
  updateGrade,
  createAccountUnified,
  updateStudentCreditOverride,
  resetPassword,
} from '../controllers/adminController';
import { adminProtect, requireRole, requirePermission } from '../middleware/adminProtect';
import { asyncWrap } from '../middleware/errorHandler';
import { adminActionLimiter } from '../middleware/rateLimiter';

const router = Router();

// All specialized admin roles plus the base roles
const ALL_ADMIN_ROLES = ['admin', 'superadmin', 'it_admin', 'table_admin', 'courses_admin', 'enrollment_admin'];

// All admin routes require admin authentication
router.use(adminProtect);

// Stats - all admins with permission
router.get('/stats', requireRole(...ALL_ADMIN_ROLES), requirePermission('users:stats'), asyncWrap(getAdminStats));

// Unified Account Creation Endpoint
router.post('/accounts', requireRole(...ALL_ADMIN_ROLES), adminActionLimiter, requirePermission('users:create'), asyncWrap(createAccountUnified));

// User management - /users aliases (RESTful)
router.get('/users', requireRole(...ALL_ADMIN_ROLES), requirePermission('users:list'), asyncWrap(getStudents));
router.get('/users/:id', requireRole(...ALL_ADMIN_ROLES), requirePermission('users:view'), asyncWrap(getStudentById));
router.post('/users/students', requireRole(...ALL_ADMIN_ROLES), adminActionLimiter, requirePermission('users:create'), asyncWrap(createStudentAccount));
router.post('/users/admins', requireRole('superadmin'), adminActionLimiter, requirePermission('users:create'), asyncWrap(createAdminAccount));
router.put('/users/:id', requireRole( 'superadmin', 'it_admin'), adminActionLimiter, requirePermission('users:update'), asyncWrap(updateAccount));
router.delete('/users/:id', requireRole('superadmin', 'it_admin'), adminActionLimiter, requirePermission('users:delete'), asyncWrap(deleteAccount));
router.patch('/users/:id/toggle', requireRole( 'superadmin', 'it_admin'), adminActionLimiter, requirePermission('users:toggle'), asyncWrap(toggleAccountStatus));
router.get('/users/:id/record', requireRole( 'superadmin', 'it_admin'), requirePermission('users:view'), asyncWrap(getStudentAcademicRecord));
router.post('/users/:id/reset-password', requireRole( 'superadmin', 'it_admin'), adminActionLimiter, requirePermission('users:password_reset'), asyncWrap(resetPassword));
router.patch('/users/:id/credit-override', requireRole('admin', 'superadmin'), adminActionLimiter, requirePermission('users:update'), asyncWrap(updateStudentCreditOverride));

// Legacy path aliases
router.get('/students', requireRole(...ALL_ADMIN_ROLES), requirePermission('users:list'), asyncWrap(getStudents));
router.get('/students/:id', requireRole(...ALL_ADMIN_ROLES), requirePermission('users:view'), asyncWrap(getStudentById));
router.post('/accounts/students', requireRole(...ALL_ADMIN_ROLES), adminActionLimiter, requirePermission('users:create'), asyncWrap(createStudentAccount));
router.post('/accounts/admins', requireRole('superadmin'), adminActionLimiter, requirePermission('users:create'), asyncWrap(createAdminAccount));
router.put('/accounts/:id', requireRole(...ALL_ADMIN_ROLES), adminActionLimiter, requirePermission('users:update'), asyncWrap(updateAccount));
router.delete('/accounts/:id', requireRole('superadmin'), adminActionLimiter, requirePermission('users:delete'), asyncWrap(deleteAccount));
router.patch('/accounts/:id/toggle', requireRole(...ALL_ADMIN_ROLES), adminActionLimiter, requirePermission('users:toggle'), asyncWrap(toggleAccountStatus));

// Enrollment management
router.get('/enrollments', requireRole(...ALL_ADMIN_ROLES), requirePermission('enrollments:list'), asyncWrap(getAllEnrollments));
router.post('/enrollments', requireRole(...ALL_ADMIN_ROLES), adminActionLimiter, requirePermission('enrollments:create'), asyncWrap(adminEnroll));
router.delete('/enrollments/:id', requireRole(...ALL_ADMIN_ROLES), adminActionLimiter, requirePermission('enrollments:delete'), asyncWrap(adminUnenroll));
router.patch('/enrollments/:id/grade', requireRole(...ALL_ADMIN_ROLES), adminActionLimiter, requirePermission('enrollments:update'), asyncWrap(updateGrade));

export default router;
