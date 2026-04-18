import { Router } from 'express';
import {
  getAssignments,
  assignCourse,
  removeAssignment,
  getAvailableCourses,
  getAssignmentsByLevel,
} from '../controllers/courseAssignmentController';
import { protect } from '../middleware/protect';
import { adminProtect, requirePermission } from '../middleware/adminProtect';
import { asyncWrap } from '../middleware/errorHandler';
import { adminActionLimiter } from '../middleware/rateLimiter';

const router = Router();

// Get assignments by level - accessible to any authenticated user (for student dashboard)
router.get('/by-level', protect, asyncWrap(getAssignmentsByLevel));

// Admin-only routes require authentication + admin role + specific permissions
router.use(adminProtect);

// Get all assignments (admin view)
router.get('/', requirePermission('courses:list'), asyncWrap(getAssignments));

// Get available courses for assignment
router.get('/available-courses', requirePermission('courses:list'), asyncWrap(getAvailableCourses));

// Assign a course to a level (create assignment)
router.post('/', adminActionLimiter, requirePermission('courses:create'), asyncWrap(assignCourse));

// Remove an assignment (soft delete)
router.delete('/:id', adminActionLimiter, requirePermission('courses:delete'), asyncWrap(removeAssignment));

export default router;
