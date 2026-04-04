import { Router } from 'express';
import {
  listEnrollments,
  createEnrollment,
  deleteEnrollment,
} from '../controllers/enrollmentController';
import { adminProtect, requireRole, requirePermission } from '../middleware/adminProtect';
import { asyncWrap } from '../middleware/errorHandler';
import { adminActionLimiter } from '../middleware/rateLimiter';

const router = Router();

// All enrollment routes require admin authentication
router.use(adminProtect);

// GET /api/admin/enrollments - List all enrollments (with filtering)
router.get('/', requireRole('admin', 'superadmin'), requirePermission('enrollments:list'), asyncWrap(listEnrollments));

// POST /api/admin/enrollments - Create enrollment for a student
router.post('/', requireRole('admin', 'superadmin'), adminActionLimiter, requirePermission('enrollments:create'), asyncWrap(createEnrollment));

// DELETE /api/admin/enrollments/:id - Delete enrollment
router.delete('/:id', requireRole('admin', 'superadmin'), adminActionLimiter, requirePermission('enrollments:delete'), asyncWrap(deleteEnrollment));

export default router;
