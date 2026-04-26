// Extends Express's Request so that req.student is fully typed everywhere —
import 'express';
import { IStudent } from '../models/Student';

declare global {
  namespace Express {
    interface Request {
      /**
       * Set by the `protect` middleware after verifying the JWT.
       * Available on every protected route as req.student
       */
      student?: import('../models/Student').IStudent;
      /**
       * Set by the `adminProtect` middleware after verifying the JWT.
       * Available on every admin route as req.adminUser
       */
      adminUser?: import('../models/AdminUser').IAdminUser;
      /**
       * List of permission keys granted to the current admin.
       */
      adminPermissions?: import('../models/AdminPermission').PermissionKey[];
      /**
       * Resolved operational admin type based on id/email mapping.
       */
      adminType?: import('../utils/adminType').AdminType | null;
    }
  }
}
