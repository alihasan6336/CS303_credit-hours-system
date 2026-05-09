import { Router } from 'express';
import {
  listAllPermissions,
  getAdminPermissions,
  setPermissions,
  grantPermissions,
  revokePermissions,
  clearPermissions,
} from '../controllers/permissionController';
import { adminProtect, requireRole } from '../middleware/adminProtect';
import { asyncWrap } from '../middleware/errorHandler';
import { adminActionLimiter } from '../middleware/rateLimiter';

const router = Router();

// All permission routes require super_admin role
router.use(adminProtect);
router.use(requireRole('superadmin'));
router.use(adminActionLimiter);

// Permission management routes
router.get('/', asyncWrap(listAllPermissions));
router.get('/:adminId', asyncWrap(getAdminPermissions));
router.post('/:adminId', asyncWrap(setPermissions));
router.patch('/:adminId/grant', asyncWrap(grantPermissions));
router.patch('/:adminId/revoke', asyncWrap(revokePermissions));
router.delete('/:adminId', asyncWrap(clearPermissions));

export default router;
