import { Router } from 'express'; // 
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
  updateStudentCreditOverride,
  resetPassword,

} from '../controllers/adminController';
import { adminProtect, requireRole, requirePermission } from '../middleware/adminProtect';
import { asyncWrap } from '../middleware/errorHandler';
import { adminActionLimiter } from '../middleware/rateLimiter';

const router = Router();

// All admin routes require admin authentication
router.use(adminProtect);

// Stats - super_admin only, requires users:stats permission
router.get('/stats', requireRole('superadmin'), requirePermission('users:stats'), asyncWrap(getAdminStats));

// User management - /users aliases (RESTful)
// IT Admin + Superadmin can manage users
router.get('/users', requireRole( 'superadmin', 'it_admin'), requirePermission('users:list'), asyncWrap(getStudents));
router.get('/users/:id', requireRole( 'superadmin', 'it_admin'), requirePermission('users:view'), asyncWrap(getStudentById));
router.post('/users/students', requireRole( 'superadmin', 'it_admin'), adminActionLimiter, requirePermission('users:create'), asyncWrap(createStudentAccount));
router.post('/users/admins', requireRole('superadmin'), adminActionLimiter, requirePermission('users:create'), asyncWrap(createAdminAccount));
router.put('/users/:id', requireRole('admin', 'superadmin'), adminActionLimiter, requirePermission('users:update'), asyncWrap(updateAccount));
router.delete('/users/:id', requireRole('superadmin'), adminActionLimiter, requirePermission('users:delete'), asyncWrap(deleteAccount));
router.patch('/users/:id/toggle', requireRole('admin', 'superadmin'), adminActionLimiter, requirePermission('users:toggle'), asyncWrap(toggleAccountStatus));
router.get('/users/:id/record', requireRole('admin', 'superadmin'), requirePermission('users:view'), asyncWrap(getStudentAcademicRecord));
router.patch('/users/:id/credit-override', requireRole('admin', 'superadmin'), adminActionLimiter, requirePermission('users:update'), asyncWrap(updateStudentCreditOverride));
router.post('/users/:id/reset-password', requireRole( 'superadmin', 'it_admin'), adminActionLimiter, requirePermission('users:password_reset'), asyncWrap(resetPassword));

// Legacy path aliases (for backward compatibility)
router.get('/students', requireRole( 'superadmin', 'it_admin'), requirePermission('users:list'), asyncWrap(getStudents));
router.get('/students/:id', requireRole('superadmin', 'it_admin'), requirePermission('users:view'), asyncWrap(getStudentById));
router.post('/accounts/students', requireRole( 'superadmin', 'it_admin'), adminActionLimiter, requirePermission('users:create'), asyncWrap(createStudentAccount));
router.post('/accounts/admins', requireRole('superadmin'), adminActionLimiter, requirePermission('users:create'), asyncWrap(createAdminAccount));
router.put('/accounts/:id', requireRole( 'superadmin', 'it_admin'), adminActionLimiter, requirePermission('users:update'), asyncWrap(updateAccount));
router.delete('/accounts/:id', requireRole('superadmin', 'it_admin'), adminActionLimiter, requirePermission('users:delete'), asyncWrap(deleteAccount));
router.patch('/accounts/:id/toggle', requireRole('superadmin', 'it_admin'), adminActionLimiter, requirePermission('users:toggle'), asyncWrap(toggleAccountStatus));

// Enrollment management - Enrollment Admin + Superadmin + Table Admin
router.get('/enrollments', requireRole( 'superadmin', 'enrollment_admin', 'table_admin'), requirePermission('enrollments:list'), asyncWrap(getAllEnrollments));
router.post('/enrollments', requireRole( 'superadmin', 'enrollment_admin'), adminActionLimiter, requirePermission('enrollments:create'), asyncWrap(adminEnroll));
router.delete('/enrollments/:id', requireRole( 'superadmin', 'enrollment_admin'), adminActionLimiter, requirePermission('enrollments:delete'), asyncWrap(adminUnenroll));
router.patch('/enrollments/:id/grade', requireRole( 'superadmin', 'enrollment_admin'), adminActionLimiter, requirePermission('enrollments:update'), asyncWrap(updateGrade));

export default router;
