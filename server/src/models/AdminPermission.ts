import mongoose, { Document, Schema } from 'mongoose';
import { IAdminUser } from './AdminUser';

export const ALL_PERMISSIONS = [
  // User management (IT Admin)
  'users:list', 'users:view', 'users:create', 'users:update',
  'users:delete', 'users:toggle', 'users:stats', 'users:password_reset',
  // Course management (Courses Admin)
  'courses:list', 'courses:view', 'courses:create',
  'courses:update', 'courses:delete', 'courses:enrollments',
  // Enrollment management (Enrollment Admin)
  'enrollments:list', 'enrollments:create', 'enrollments:update', 'enrollments:delete',
  // Table/Registration management (Table Admin)
  'table:view', 'table:open', 'table:close', 'table:edit', 'table:assign',
  'registration:open', 'registration:close',
  'system:settings', 'system:audit',
] as const;

export type PermissionKey = typeof ALL_PERMISSIONS[number];

export interface IAdminPermission extends Document {
  admin: mongoose.Types.ObjectId | IAdminUser;
  permissions: PermissionKey[];
  grantedBy: mongoose.Types.ObjectId | IAdminUser;
  note: string;
  createdAt: Date;
  updatedAt: Date;
}

const AdminPermissionSchema = new Schema<IAdminPermission>(
  {
    admin: {
      type: Schema.Types.ObjectId,
      ref: 'AdminUser',
      required: true,
      unique: true,
    },
    permissions: {
      type: [String],
      enum: ALL_PERMISSIONS,
      default: [],
      set: (arr: string[]) => [...new Set(arr)].sort(),
    },
    grantedBy: {
      type: Schema.Types.ObjectId,
      ref: 'AdminUser',
      required: true,
    },
    note: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IAdminPermission>('AdminPermission', AdminPermissionSchema);
