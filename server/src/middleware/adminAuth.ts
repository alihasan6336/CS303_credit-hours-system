import { Request, Response, NextFunction } from 'express';

// Middleware to check if user is admin or superadmin
export const isAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.student;
    
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Access denied. Please log in.',
      });
      return;
    }

    if (user.role !== 'admin' && user.role !== 'superadmin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
      return;
    }

    next();
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Middleware to check if user is superadmin only
export const isSuperAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.student;
    
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Access denied. Please log in.',
      });
      return;
    }

    if (user.role !== 'superadmin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Super admin privileges required.',
      });
      return;
    }

    next();
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
