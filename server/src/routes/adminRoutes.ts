import { Router } from 'express';
import { getAdminStats, getStudents, createAccount, deleteAccount, getAllEnrollments, adminEnroll, adminUnenroll } from '../controllers/adminController';
import { protect } from '../middleware/protect';
import { isAdmin, isSuperAdmin } from '../middleware/adminAuth';

const router = Router();

// All admin routes require authentication
router.use(protect);

// Stats - accessible by admin and superadmin
router.get('/stats', isAdmin, getAdminStats);

// Get students - accessible by admin and superadmin
router.get('/students', isAdmin, getStudents);

// Account management - only superadmin can create accounts
router.post('/accounts', isSuperAdmin, createAccount);
router.delete('/accounts/:id', isSuperAdmin, deleteAccount);

// Enrollment management - accessible by admin and superadmin
router.get('/enrollments', isAdmin, getAllEnrollments);
router.post('/enrollments', isAdmin, adminEnroll);
router.delete('/enrollments/:id', isAdmin, adminUnenroll);

export default router;
