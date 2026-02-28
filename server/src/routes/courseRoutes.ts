
import { Router } from 'express';
import {getCourses,getCourseByID, createCourse,enrollCourse,dropCourse,getMyCourses} from '../controllers/courseController';
import { protect } from '../middleware/protect';

const router = Router();

router.use(protect);

router.get("/", getCourses);

router.get("/my-courses", getMyCourses);

router.get("/:id", getCourseByID);

router.post("/", protect, createCourse); //admin

router.post('/:id/enroll',   enrollCourse);  
router.delete('/:id/enroll', dropCourse);    

export default router;
