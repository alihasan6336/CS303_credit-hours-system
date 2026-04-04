import { Router } from 'express';
import {
  getAdminStats,
  getStudents,
  getStudentById,
  createStudentAccount,
  createAdminAccount,
  updateAccount,
  deleteAccount,
  toggleAccountStatus,
  getAllEnrollments,
  adminEnroll,
  adminUnenroll,
  updateGrade,
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
router.get('/users', requireRole('admin', 'superadmin'), requirePermission('users:list'), asyncWrap(getStudents));
router.get('/users/:id', requireRole('admin', 'superadmin'), requirePermission('users:view'), asyncWrap(getStudentById));
router.post('/users/students', requireRole('admin', 'superadmin'), adminActionLimiter, requirePermission('users:create'), asyncWrap(createStudentAccount));
router.post('/users/admins', requireRole('superadmin'), adminActionLimiter, requirePermission('users:create'), asyncWrap(createAdminAccount));
router.put('/users/:id', requireRole('admin', 'superadmin'), adminActionLimiter, requirePermission('users:update'), asyncWrap(updateAccount));
router.delete('/users/:id', requireRole('superadmin'), adminActionLimiter, requirePermission('users:delete'), asyncWrap(deleteAccount));
router.patch('/users/:id/toggle', requireRole('admin', 'superadmin'), adminActionLimiter, requirePermission('users:toggle'), asyncWrap(toggleAccountStatus));

// Legacy path aliases (for backward compatibility)
router.get('/students', requireRole('admin', 'superadmin'), requirePermission('users:list'), asyncWrap(getStudents));
router.get('/students/:id', requireRole('admin', 'superadmin'), requirePermission('users:view'), asyncWrap(getStudentById));
router.post('/accounts/students', requireRole('admin', 'superadmin'), adminActionLimiter, requirePermission('users:create'), asyncWrap(createStudentAccount));
router.post('/accounts/admins', requireRole('superadmin'), adminActionLimiter, requirePermission('users:create'), asyncWrap(createAdminAccount));
router.put('/accounts/:id', requireRole('admin', 'superadmin'), adminActionLimiter, requirePermission('users:update'), asyncWrap(updateAccount));
router.delete('/accounts/:id', requireRole('superadmin'), adminActionLimiter, requirePermission('users:delete'), asyncWrap(deleteAccount));
router.patch('/accounts/:id/toggle', requireRole('admin', 'superadmin'), adminActionLimiter, requirePermission('users:toggle'), asyncWrap(toggleAccountStatus));

// Enrollment management
router.get('/enrollments', requireRole('admin', 'superadmin'), requirePermission('enrollments:list'), asyncWrap(getAllEnrollments));
router.post('/enrollments', requireRole('admin', 'superadmin'), adminActionLimiter, requirePermission('enrollments:create'), asyncWrap(adminEnroll));
router.delete('/enrollments/:id', requireRole('admin', 'superadmin'), adminActionLimiter, requirePermission('enrollments:delete'), asyncWrap(adminUnenroll));
router.patch('/enrollments/:id/grade', requireRole('admin', 'superadmin'), adminActionLimiter, requirePermission('enrollments:update'), asyncWrap(updateGrade));

export default router;
