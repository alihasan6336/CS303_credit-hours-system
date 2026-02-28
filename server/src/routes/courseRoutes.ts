
import { Router } from 'express';
import {getCourses,getCourse, createCourse,enrollCourse,dropCourse,} from '../controllers/courseController';
import { protect } from '../middleware/protect';

const router = Router();

router.use(protect);

router.get('/',    getCourses);    
router.get('/:id', getCourse);     
router.post('/',   createCourse);  // Create course (admin)

router.post('/:id/enroll',   enrollCourse);  
router.delete('/:id/enroll', dropCourse);    

export default router;
