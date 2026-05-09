import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import AdminUser, { IAdminUser } from '../models/AdminUser';
import AdminPermission, { PermissionKey, ALL_PERMISSIONS } from '../models/AdminPermission';
import { permissionsFromAdminType, resolveAdminType } from '../utils/adminType';


interface JwtPayload {
  id: string;
  email: string;
  iat: number;
  exp: number;
}

// Admin protect middleware - verifies admin JWT and loads permissions
export const adminProtect = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1. Extract token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Access denied. No token provided. Please log in.',
      });
      return;
    }

    const token = authHeader.split(' ')[1];

    // 2. Verify token
    const decoded = verifyToken(token) as JwtPayload;

    // 3. Check admin exists in DB
    const user = await AdminUser.findById(decoded.id).lean();

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'The admin account belonging to this token no longer exists.',
      });
      return;
    }

    // 4. Check if admin is active
    if (!user.isActive) {
      res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Contact super admin.',
      });
      return;
    }

    // 5. Attach admin user to request
    req.adminUser = user as unknown as IAdminUser;
    
    // Safety check: force superadmin role for the primary admin email
    if (user.email === 'admin@admin.com') {
      req.adminUser.role = 'superadmin';
    }
    
    req.adminType = resolveAdminType(String(user._id), user.email, req.adminUser.role);

    // 6. Load permissions from DB
    if (req.adminUser.role === 'superadmin') {
      // super_admin always has all permissions
      req.adminPermissions = [...ALL_PERMISSIONS];
    } else {
      // Any other admin role (regular admin or specialized ones like it_admin)
      const permDoc = await AdminPermission.findOne({ admin: user._id })
        .select('permissions')
        .lean();
      const dbPermissions = (permDoc?.permissions ?? []) as PermissionKey[];
      const mappedPermissions = permissionsFromAdminType(req.adminType);
      req.adminPermissions = [...new Set([...dbPermissions, ...mappedPermissions])];
    }

    next();
  } catch (error: any) {
    const isExpired = error.name === 'TokenExpiredError';
    res.status(401).json({
      success: false,
      message: isExpired
        ? 'Your session has expired. Please log in again.'
        : 'Invalid token. Please log in again.',
    });
  }
};

// Require specific role(s)
export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.adminUser) {
      res.status(401).json({
        success: false,
        message: 'Access denied. Please log in as admin.',
      });
      return;
    }

    if (!roles.includes(req.adminUser.role)) {
      res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}.`,
      });
      return;
    }

    next();
  };
};

// Require specific permission
export const requirePermission = (key: PermissionKey) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.adminPermissions || !req.adminPermissions.includes(key)) {
      res.status(403).json({
        success: false,
        message: `Access denied. You do not have the "${key}" permission.`,
        requiredPermission: key,
      });
      return;
    }
    next();
  };
};
