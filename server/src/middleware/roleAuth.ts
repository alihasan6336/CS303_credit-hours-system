import { Request, Response, NextFunction } from 'express';
import { PermissionKey } from '../models/AdminPermission';
import { hasPermission, AdminRole, canManageAdmins } from '../utils/adminRoles';

// Extend Express Request to include admin
declare global {
  namespace Express {
    interface Request {
      admin?: {
        _id: string;
        role: AdminRole;
        email: string;
        fullName: string;
        permissions?: PermissionKey[];
      };
    }
  }
}

// Middleware to check if user has specific permission
export const requirePermission = (permission: PermissionKey) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const admin = req.admin;
      
      if (!admin) {
        res.status(401).json({
          success: false,
          message: 'Access denied. Please log in.',
        });
        return;
      }

      // Super admin bypasses all permission checks
      if (admin.role === 'superadmin') {
        next();
        return;
      }

      // Check if admin has the required permission
      const hasPerm = hasPermission(admin.role, permission);
      
      if (!hasPerm) {
        res.status(403).json({
          success: false,
          message: `Access denied. Required permission: ${permission}`,
        });
        return;
      }

      next();
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
};

// Middleware to check if user has any of the specified permissions
export const requireAnyPermission = (...permissions: PermissionKey[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const admin = req.admin;
      
      if (!admin) {
        res.status(401).json({
          success: false,
          message: 'Access denied. Please log in.',
        });
        return;
      }

      // Super admin bypasses all permission checks
      if (admin.role === 'superadmin') {
        next();
        return;
      }

      // Check if admin has any of the required permissions
      const hasAnyPerm = permissions.some(p => hasPermission(admin.role, p));
      
      if (!hasAnyPerm) {
        res.status(403).json({
          success: false,
          message: `Access denied. Requires one of: ${permissions.join(', ')}`,
        });
        return;
      }

      next();
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
};

// Middleware to check if user has all specified permissions
export const requireAllPermissions = (...permissions: PermissionKey[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const admin = req.admin;
      
      if (!admin) {
        res.status(401).json({
          success: false,
          message: 'Access denied. Please log in.',
        });
        return;
      }

      // Super admin bypasses all permission checks
      if (admin.role === 'superadmin') {
        next();
        return;
      }

      // Check if admin has all required permissions
      const missingPerms = permissions.filter(p => !hasPermission(admin.role, p));
      
      if (missingPerms.length > 0) {
        res.status(403).json({
          success: false,
          message: `Access denied. Missing permissions: ${missingPerms.join(', ')}`,
        });
        return;
      }

      next();
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
};

// Middleware to check for specific role
export const requireRole = (...roles: AdminRole[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const admin = req.admin;
      
      if (!admin) {
        res.status(401).json({
          success: false,
          message: 'Access denied. Please log in.',
        });
        return;
      }

      if (!roles.includes(admin.role)) {
        res.status(403).json({
          success: false,
          message: `Access denied. Requires role: ${roles.join(' or ')}`,
        });
        return;
      }

      next();
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
};

// Middleware to check if user can manage other admins (superadmin only)
export const canCreateAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const admin = req.admin;
    
    if (!admin) {
      res.status(401).json({
        success: false,
        message: 'Access denied. Please log in.',
      });
      return;
    }

    if (!canManageAdmins(admin.role)) {
      res.status(403).json({
        success: false,
        message: 'Access denied. Only super admin can create or manage other admins.',
      });
      return;
    }

    next();
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Domain-based access middleware
export const requireDomainAccess = (domain: 'users' | 'courses' | 'enrollments' | 'table') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const admin = req.admin;
      
      if (!admin) {
        res.status(401).json({
          success: false,
          message: 'Access denied. Please log in.',
        });
        return;
      }

      // Super admin bypasses all checks
      if (admin.role === 'superadmin') {
        next();
        return;
      }

      // Check domain-specific permissions
      const domainPermissions: Record<string, PermissionKey[]> = {
        users: ['users:list', 'users:create', 'users:update', 'users:delete'],
        courses: ['courses:list', 'courses:create', 'courses:update', 'courses:delete'],
        enrollments: ['enrollments:list', 'enrollments:create', 'enrollments:update', 'enrollments:delete'],
        table: ['table:view', 'table:open', 'table:close', 'table:edit', 'table:assign'],
      };

      const permissions = domainPermissions[domain] || [];
      const hasAccess = permissions.some(p => hasPermission(admin.role, p));

      if (!hasAccess) {
        res.status(403).json({
          success: false,
          message: `Access denied. You don't have ${domain} management permissions.`,
        });
        return;
      }

      next();
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
};
