import { Router } from 'express';
import {
  getAssignments,
  assignCourse,
  removeAssignment,
  getAvailableCourses,
  getAssignmentsByLevel,
} from '../controllers/courseAssignmentController';
import { protect } from '../middleware/protect';
import { isAdmin } from '../middleware/adminAuth';

const router = Router();

// All routes require authentication and admin role
router.use(protect);
router.use(isAdmin);

// Get all assignments
router.get('/', getAssignments);

// Get assignments grouped by level
router.get('/by-level', getAssignmentsByLevel);

// Get available courses for assignment
router.get('/available-courses', getAvailableCourses);

// Assign a course to a level
router.post('/', assignCourse);

// Remove an assignment
router.delete('/:id', removeAssignment);

export default router;
