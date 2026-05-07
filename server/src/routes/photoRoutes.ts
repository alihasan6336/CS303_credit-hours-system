import { Router } from 'express';
import multer from 'multer';
import { uploadPhoto, getMyPhoto, deletePhoto } from '../controllers/photoController';
import { protect } from '../middleware/protect';

const router = Router();

// In-memory storage (buffer) — no local disk writes
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  fileFilter: (_req: any, file: any, cb: any) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed') as any, false);
    }
  },
});

// Upload photo
router.post('/upload', protect, upload.single('photo'), uploadPhoto);

// Get current user's photo URL
router.get('/me', protect, getMyPhoto);

// Delete current user's photo
router.delete('/me', protect, deletePhoto);

export default router;
