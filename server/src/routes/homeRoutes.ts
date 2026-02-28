// GET /api/home
//   Returns the complete dashboard payload that Home.tsx needs:
//   { student: { name, id, level, gpa, completedHours, major, semester, courses } }
import { Router } from 'express';
import { getHomeData } from '../controllers/homeController';
import { protect } from '../middleware/protect';

const router = Router();

// Every route in this file goes through protect first
router.use(protect);

// Home.tsx dashboard data
router.get('/', getHomeData);

export default router;
