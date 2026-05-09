import { Router } from 'express';
import { getMyGPABreakdown, triggerRecalculate, predictGPA } from '../controllers/gpaController';
import { protect } from '../middleware/protect';
import { adminProtect, requireRole, requirePermission } from '../middleware/adminProtect';
import { asyncWrap } from '../middleware/errorHandler';

const router = Router();

// Student-accessible routes
router.use(protect); // Ensure student is logged in

// GET /api/gpa/me - Get current GPA details
router.get('/me', asyncWrap(getMyGPABreakdown));

// POST /api/gpa/recalculate - Student recalculates own GPA
router.post('/recalculate', asyncWrap(triggerRecalculate));

// POST /api/gpa/predict - Predict GPA based on hypothetical grades
router.post('/predict', asyncWrap(predictGPA));

// Admin-accessible recalculation (optional: could be part of student routes)
router.post('/admin/recalculate/:studentId', 
  adminProtect, 
  requireRole('admin', 'superadmin'), 
  requirePermission('enrollments:update'), 
  async (req, res, next) => {
    req.body.studentId = req.params.studentId;
    next();
  },
  asyncWrap(triggerRecalculate)
);

export default router;
