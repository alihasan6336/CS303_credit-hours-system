import { Router } from 'express';
import { listAuditLogs, myAuditLogs, userAuditLogs } from '../controllers/auditController';
import { adminProtect, requireRole } from '../middleware/adminProtect';
import { asyncWrap } from '../middleware/errorHandler';

const router = Router();

// All audit routes require admin authentication
router.use(adminProtect);

// Own action history - all admin roles
router.get('/mine', asyncWrap(myAuditLogs));

// Full audit log and user-specific logs - super_admin only
router.get('/', requireRole('superadmin'), asyncWrap(listAuditLogs));
router.get('/user/:id', requireRole('superadmin'), asyncWrap(userAuditLogs));

export default router;
