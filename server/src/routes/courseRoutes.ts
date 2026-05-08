
import { Router } from 'express';
import {
  getCourses,
  getCourseByID,
  getMyCourses,
  createCourse,
  updateCourse,
  bulkUpdateCourses,
  deleteCourse,
  enrollCourse,
  bulkEnrollCourses,
  dropCourse,
  getCourseEnrollments,
  getMyCreditLimit,
} from '../controllers/courseController';
import { protect } from '../middleware/protect';
import { adminProtect, requireRole, requirePermission } from '../middleware/adminProtect';
import { asyncWrap } from '../middleware/errorHandler';
import { enrollmentLimiter, adminActionLimiter } from '../middleware/rateLimiter';

const router = Router();

// Student routes (require student JWT)
router.get('/', protect, asyncWrap(getCourses));
router.get('/my-courses', protect, asyncWrap(getMyCourses));
router.get('/my-credit-limit', protect, asyncWrap(getMyCreditLimit));
router.get('/:id', protect, asyncWrap(getCourseByID));
router.post('/bulk-enroll', protect, asyncWrap(bulkEnrollCourses));
router.post('/:id/enroll', protect, enrollmentLimiter, asyncWrap(enrollCourse));
router.delete('/:id/enroll', protect, asyncWrap(dropCourse));

// Admin routes (require admin JWT + permissions)
// Courses Admin + Superadmin can create, update, and view courses
router.post('/', adminProtect, requireRole('superadmin', 'courses_admin'), requirePermission('courses:create'), adminActionLimiter, asyncWrap(createCourse));
router.put('/bulk', adminProtect, requireRole('superadmin', 'courses_admin', 'table_admin'), requirePermission('courses:update'), adminActionLimiter, asyncWrap(bulkUpdateCourses));
router.put('/:id', adminProtect, requireRole('superadmin', 'courses_admin', 'table_admin'), requirePermission('courses:update'), adminActionLimiter, asyncWrap(updateCourse));
// Courses Admin + Superadmin can delete courses
router.delete('/:id', adminProtect, requireRole('superadmin', 'courses_admin'), requirePermission('courses:delete'), adminActionLimiter, asyncWrap(deleteCourse));
// Courses Admin + Superadmin + Enrollment Admin can view course enrollments
router.get('/:id/enrollments', adminProtect, requireRole('superadmin', 'courses_admin', 'enrollment_admin'), requirePermission('courses:enrollments'), asyncWrap(getCourseEnrollments));

export default router;
