
import { Router } from 'express';
import {getCourses,getCourseByID, createCourse, updateCourse, bulkUpdateCourses, deleteCourse, enrollCourse, dropCourse, getMyCourses} from '../controllers/courseController';
import { protect } from '../middleware/protect';

const router = Router();

router.use(protect);

router.get("/", getCourses);

router.get("/my-courses", getMyCourses);

router.put("/bulk", protect, bulkUpdateCourses); // Bulk update - must be before /:id

router.get("/:id", getCourseByID);

router.post("/", protect, createCourse); //admin

router.put("/:id", protect, updateCourse); //admin

router.delete("/:id", protect, deleteCourse); //admin

router.post('/:id/enroll',   enrollCourse);  
router.delete('/:id/enroll', dropCourse);    

export default router;
