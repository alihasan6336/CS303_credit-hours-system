import mongoose, { Document, Schema } from 'mongoose';
import { IAdminUser } from './AdminUser';

export const ALL_PERMISSIONS = [
  'users:list', 'users:view', 'users:create', 'users:update',
  'users:delete', 'users:toggle', 'users:stats',
  'courses:list', 'courses:view', 'courses:create',
  'courses:update', 'courses:delete', 'courses:enrollments',
  'enrollments:list', 'enrollments:create', 'enrollments:update', 'enrollments:delete',
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
