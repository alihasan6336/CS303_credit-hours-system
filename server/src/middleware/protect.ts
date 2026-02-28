
// Usage:
//   router.get('/home', protect, homeController)


import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import Student from '../models/Student';

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // ── 1. Extract token from header 
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Access denied(are you hack??). No token provided. Please log in.',
      });
      return;
    }

    const token = authHeader.split(' ')[1];  

    // ── 2. Verify token (throws if invalid or expired) 
    const decoded = verifyToken(token);

    // ── 3. Check student still exists in DB 
    const student = await Student.findById(decoded.id);

    if (!student) {
      res.status(401).json({
        success: false,
        message: 'The account belonging to this token no longer exists.',
      });
      return;
    }

    // ── 4. Attach student to request (typed — no "as any" needed)
    req.student = student;

    next();
  } catch (error: any) {
    const isExpired = error.name === 'TokenExpiredError';
    res.status(401).json({
      success: false,
      message: isExpired
        ? 'Your session has expired ^_^. Please log in again.'
        : 'Invalid token (are you hack ?). Please log in again.',
    });
  }
};
