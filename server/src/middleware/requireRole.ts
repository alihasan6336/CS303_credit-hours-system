import { Request, Response, NextFunction } from 'express';

// Ensure this is used AFTER the standard 'protect' middleware
export const requireRole = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.student || !roles.includes(req.student.role)) {
            res.status(403).json({
                success: false,
                message: 'Access denied. You do not have permission to perform this action.',
            });
            return;
        }
        next();
    };
};
