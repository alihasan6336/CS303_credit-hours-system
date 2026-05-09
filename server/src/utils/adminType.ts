import { PermissionKey } from '../models/AdminPermission';

export type AdminType = 'super_admin' | 'it_admin' | 'table_admin' | 'courses_admin' | 'enrollment_admin' | 'none';

const ADMIN_TYPE_PERMISSIONS: Record<string, PermissionKey[]> = {
  it_admin: ['users:list', 'users:view', 'users:create', 'users:update', 'users:toggle', 'users:stats'],
  table_admin: [
    'users:list', 'users:view',
    'courses:list', 'courses:view', 'courses:update',
    'enrollments:list', 'enrollments:create', 'enrollments:update', 'enrollments:delete',
    'users:stats'
  ],
  courses_admin: [
    'courses:list', 'courses:view', 'courses:create', 'courses:update', 'courses:delete', 'courses:enrollments',
    'enrollments:list', 'enrollments:create', 'enrollments:update',
    'users:stats'
  ],
  enrollment_admin: [
    'users:list', 'users:view',
    'enrollments:list', 'enrollments:create', 'enrollments:update', 'enrollments:delete',
    'users:stats'
  ],
  super_admin: [
    'users:list', 'users:view', 'users:create', 'users:update', 'users:delete', 'users:toggle', 'users:stats', 'users:password_reset',
    'courses:list', 'courses:view', 'courses:create', 'courses:update', 'courses:delete', 'courses:enrollments',
    'enrollments:list', 'enrollments:create', 'enrollments:update', 'enrollments:delete',
    'system:settings', 'system:audit'
  ],
  none: []
};

export const resolveAdminType = (id: string, email: string, role: string): AdminType => {
  const normalizedRole = role.toLowerCase();
  const normalizedEmail = email.toLowerCase();

  if (normalizedRole === 'superadmin' || normalizedEmail === 'admin@admin.com') return 'super_admin';
  if (normalizedRole === 'it_admin') return 'it_admin';
  if (normalizedRole === 'table_admin' || normalizedRole === 'schedule_admin') return 'table_admin';
  if (normalizedRole === 'courses_admin') return 'courses_admin';
  if (normalizedRole === 'enrollment_admin') return 'enrollment_admin';

  return 'none';
};

export const permissionsFromAdminType = (adminType: AdminType | string | null): PermissionKey[] => {
  if (!adminType) return [];
  const typeKey = String(adminType);
  return ADMIN_TYPE_PERMISSIONS[typeKey] || [];
};
