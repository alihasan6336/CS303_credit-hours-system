import { Router } from 'express';
import { 
  getSettings, 
  updateSettings, 
  openRegistration, 
  closeRegistration,
  showTable,
  hideTable 
} from '../controllers/settingsController';
import { protect } from '../middleware/protect';
import { adminProtect, requireRole, requirePermission } from '../middleware/adminProtect';
import { adminActionLimiter } from '../middleware/rateLimiter';
import { asyncWrap } from '../middleware/errorHandler';

const router = Router();

// Publicly readable (requires any kind of auth though)
router.get('/', protect, asyncWrap(getSettings));

// Super Admin + Table Admin can update general settings
router.put('/', adminProtect, requireRole('superadmin', 'table_admin'), requirePermission('system:settings'), adminActionLimiter, asyncWrap(updateSettings));

// Table Management endpoints - Table Admin only
router.post('/open-registration', adminProtect, requireRole('superadmin', 'table_admin'), requirePermission('registration:open'), adminActionLimiter, asyncWrap(openRegistration));
router.post('/close-registration', adminProtect, requireRole('superadmin', 'table_admin'), requirePermission('registration:close'), adminActionLimiter, asyncWrap(closeRegistration));
router.post('/show-table', adminProtect, requireRole('superadmin', 'table_admin'), requirePermission('table:open'), adminActionLimiter, asyncWrap(showTable));
router.post('/hide-table', adminProtect, requireRole('superadmin', 'table_admin'), requirePermission('table:close'), adminActionLimiter, asyncWrap(hideTable));

export default router;
