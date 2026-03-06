import { Router } from 'express';
import { getAdminStats, getStudents, createAccount, deleteAccount, getAllEnrollments, adminEnroll, adminUnenroll } from '../controllers/adminController';
import { protect } from '../middleware/protect';

const router = Router();

router.use(protect);

router.get('/stats', getAdminStats);
router.get('/students', getStudents);
router.post('/accounts', createAccount);
router.delete('/accounts/:id', deleteAccount);
router.get('/enrollments', getAllEnrollments);
router.post('/enrollments', adminEnroll);
router.delete('/enrollments/:id', adminUnenroll);

export default router;
