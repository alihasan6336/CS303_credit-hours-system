import { Router } from 'express';
import {
  listEnrollments,
  createEnrollment,
  deleteEnrollment,
  updateGrade,
} from '../controllers/enrollmentController';
import { adminProtect, requireRole, requirePermission } from '../middleware/adminProtect';
import { asyncWrap } from '../middleware/errorHandler';
import { adminActionLimiter } from '../middleware/rateLimiter';

const router = Router();

// All enrollment routes require admin authentication
router.use(adminProtect);

// GET /api/admin/enrollments - List all enrollments (with filtering)
// Enrollment Admin + Table Admin + Superadmin can list enrollments
router.get('/', requireRole('superadmin', 'enrollment_admin', 'table_admin'), requirePermission('enrollments:list'), asyncWrap(listEnrollments));

// POST /api/admin/enrollments - Create enrollment for a student
// Enrollment Admin + Superadmin can create enrollments
router.post('/', requireRole('superadmin', 'enrollment_admin'), adminActionLimiter, requirePermission('enrollments:create'), asyncWrap(createEnrollment));

// PATCH /api/admin/enrollments/:id/grade - Update grade
// Enrollment Admin + Superadmin can update grades
router.patch('/:id/grade', requireRole('superadmin', 'enrollment_admin'), adminActionLimiter, requirePermission('enrollments:update'), asyncWrap(updateGrade));

// DELETE /api/admin/enrollments/:id - Delete enrollment
// Enrollment Admin + Superadmin can delete enrollments
router.delete('/:id', requireRole('superadmin', 'enrollment_admin'), adminActionLimiter, requirePermission('enrollments:delete'), asyncWrap(deleteEnrollment));

export default router;
