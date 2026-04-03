import { Router } from 'express';
import {
  getAdminStats,
  getStudents,
  getStudentById,
  createAccount,
  updateAccount,
  deleteAccount,
  toggleAccountStatus,
  getAllEnrollments,
  adminEnroll,
  adminUnenroll,
} from '../controllers/adminController';
import { adminProtect, requireRole, requirePermission } from '../middleware/adminProtect';
import { asyncWrap } from '../middleware/errorHandler';
import { adminActionLimiter } from '../middleware/rateLimiter';

const router = Router();

// All admin routes require admin authentication
router.use(adminProtect);

// Stats - super_admin only, requires users:stats permission
router.get('/stats', requireRole('superadmin'), requirePermission('users:stats'), asyncWrap(getAdminStats));

// User management
router.get('/students', requireRole('admin', 'superadmin'), requirePermission('users:list'), asyncWrap(getStudents));
router.get('/students/:id', requireRole('admin', 'superadmin'), requirePermission('users:view'), asyncWrap(getStudentById));
router.post('/accounts', requireRole('superadmin'), adminActionLimiter, requirePermission('users:create'), asyncWrap(createAccount));
router.put('/accounts/:id', requireRole('admin', 'superadmin'), adminActionLimiter, requirePermission('users:update'), asyncWrap(updateAccount));
router.delete('/accounts/:id', requireRole('superadmin'), adminActionLimiter, requirePermission('users:delete'), asyncWrap(deleteAccount));
router.patch('/accounts/:id/toggle', requireRole('admin', 'superadmin'), adminActionLimiter, requirePermission('users:toggle'), asyncWrap(toggleAccountStatus));

// Enrollment management
router.get('/enrollments', requireRole('admin', 'superadmin'), requirePermission('enrollments:list'), asyncWrap(getAllEnrollments));
router.post('/enrollments', requireRole('admin', 'superadmin'), adminActionLimiter, asyncWrap(adminEnroll));
router.delete('/enrollments/:id', requireRole('admin', 'superadmin'), adminActionLimiter, asyncWrap(adminUnenroll));

export default router;
