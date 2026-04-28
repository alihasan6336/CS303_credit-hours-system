import { Router } from 'express';
import { autoGenerateSchedule } from '../controllers/scheduleController';
import { protect } from '../middleware/protect';
import { asyncWrap } from '../middleware/errorHandler';

const router = Router();

// POST /api/schedule/generate - AI Optimizer
router.post('/generate', protect, asyncWrap(autoGenerateSchedule));

export default router;
