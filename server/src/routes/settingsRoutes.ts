import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController';
import { protect } from '../middleware/protect';
import { adminProtect, requireRole } from '../middleware/adminProtect';
import { asyncWrap } from '../middleware/errorHandler';

const router = Router();

// Publicly readable (requires any kind of auth though)
router.get('/', protect, asyncWrap(getSettings));

// Strictly Super Admin only
router.put('/', adminProtect, requireRole('superadmin'), asyncWrap(updateSettings));

export default router;
