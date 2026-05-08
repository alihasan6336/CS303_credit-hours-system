import { Router } from 'express';
import { autoGenerateSchedule, recommendCourses } from '../controllers/scheduleController';
import { protect } from '../middleware/protect';
import { asyncWrap } from '../middleware/errorHandler';

const router = Router();

// POST /api/schedule/generate - AI Optimizer
router.post('/generate', protect, asyncWrap(autoGenerateSchedule));

// POST /api/schedule/recommend - AI Smart Recommendation
router.post('/recommend', protect, asyncWrap(recommendCourses));

export default router;
