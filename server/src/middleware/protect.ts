// Usage:
//   router.get('/home', protect, homeController)


import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import Student from '../models/Student';
import AdminUser from '../models/AdminUser';

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Access denied(are you hack??). No token provided. Please log in.',
      });
      return;
    }

    const token = authHeader.split(' ')[1];  

    const decoded = verifyToken(token);

    const student = await Student.findById(decoded.id);

    if (!student) {
      const admin = await AdminUser.findById(decoded.id).lean();
      if (admin) {
        if (!admin.isActive) {
          res.status(403).json({
            success: false,
            message: 'Your account has been deactivated. Contact super admin.',
          });
          return;
        }
        (req as any).adminUser = admin;
        next();
        return;
      }

      res.status(401).json({
        success: false,
        message: 'The account belonging to this token no longer exists.',
      });
      return;
    }

    if (student.isActive === false) {
      res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.',
      });
      return;
    }

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