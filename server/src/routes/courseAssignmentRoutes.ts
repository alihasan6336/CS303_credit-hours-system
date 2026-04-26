import { Router } from 'express';
import {
  getAssignments,
  assignCourse,
  removeAssignment,
  getAvailableCourses,
  getAssignmentsByLevel,
} from '../controllers/courseAssignmentController';
import { protect } from '../middleware/protect';
import { adminProtect, requireRole, requirePermission } from '../middleware/adminProtect';
import { asyncWrap } from '../middleware/errorHandler';
import { adminActionLimiter } from '../middleware/rateLimiter';

const router = Router();

// Get assignments by level - accessible to any authenticated user (for student dashboard)
router.get('/by-level', protect, asyncWrap(getAssignmentsByLevel));

// Admin-only routes require authentication + admin role + specific permissions
router.use(adminProtect);

// Get all assignments (admin view)
// Courses Admin + Table Admin + Superadmin can view assignments
router.get('/', requireRole('superadmin', 'courses_admin', 'table_admin'), requirePermission('courses:list'), asyncWrap(getAssignments));

// Get available courses for assignment
// Courses Admin + Table Admin + Superadmin can view available courses
router.get('/available-courses', requireRole('superadmin', 'courses_admin', 'table_admin'), requirePermission('courses:list'), asyncWrap(getAvailableCourses));

// Assign a course to a level (create assignment)
// Courses Admin + Superadmin can assign courses
router.post('/', requireRole('superadmin', 'courses_admin'), adminActionLimiter, requirePermission('courses:create'), asyncWrap(assignCourse));

// Remove an assignment (soft delete)
// Only Superadmin can remove assignments (for safety)
router.delete('/:id', requireRole('superadmin'), adminActionLimiter, requirePermission('courses:delete'), asyncWrap(removeAssignment));

export default router;
