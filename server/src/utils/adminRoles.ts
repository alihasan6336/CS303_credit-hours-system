import { PermissionKey } from '../models/AdminPermission';

export type AdminRole = 'superadmin' | 'it_admin' | 'table_admin' | 'courses_admin' | 'enrollment_admin' | 'admin';

// Default permissions for each admin role
export const ROLE_PERMISSIONS: Record<AdminRole, PermissionKey[]> = {
  // Super admin - has ALL permissions
  superadmin: [
    'users:list', 'users:view', 'users:create', 'users:update',
    'users:delete', 'users:toggle', 'users:stats', 'users:password_reset',
    'courses:list', 'courses:view', 'courses:create',
    'courses:update', 'courses:delete', 'courses:enrollments',
    'enrollments:list', 'enrollments:create', 'enrollments:update', 'enrollments:delete',
    'table:view', 'table:open', 'table:close', 'table:edit', 'table:assign',
    'registration:open', 'registration:close',
    'system:settings',
  ],
  
  // IT Admin - manages users/students only
  it_admin: [
    'users:list', 'users:view', 'users:create', 'users:update',
    'users:delete', 'users:toggle', 'users:stats', 'users:password_reset',
  ],
  
  // Table Management Admin - manages enrollment tables and registration periods
  table_admin: [
    'table:view', 'table:open', 'table:close', 'table:edit', 'table:assign',
    'registration:open', 'registration:close',
    'system:settings',
    'enrollments:list',
    'users:list', 'users:view',
    'courses:list', 'courses:view',
  ],
  
  // Courses Admin - manages courses only
  courses_admin: [
    'courses:list', 'courses:view', 'courses:create',
    'courses:update', 'courses:delete', 'courses:enrollments',
  ],
  
  // Enrollment Admin - manages student enrollments only
  enrollment_admin: [
    'enrollments:list', 'enrollments:create', 'enrollments:update', 'enrollments:delete',
    'users:list', 'users:view',
    'courses:list', 'courses:view',
    'table:view',
  ],
  
  // Default admin - read-only access (legacy)
  admin: [
    'users:list', 'users:view',
    'courses:list', 'courses:view',
    'enrollments:list',
  ],
};

// Check if a role has a specific permission
export const hasPermission = (role: AdminRole, permission: PermissionKey): boolean => {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
};

// Get all permissions for a role
export const getRolePermissions = (role: AdminRole): PermissionKey[] => {
  return ROLE_PERMISSIONS[role] ?? [];
};

// Check if role can manage other admins (only superadmin)
export const canManageAdmins = (role: AdminRole): boolean => {
  return role === 'superadmin';
};

// Check if role can access specific domain
export const canAccessDomain = (role: AdminRole, domain: 'users' | 'courses' | 'enrollments' | 'table'): boolean => {
  const domainPermissions: Record<string, PermissionKey[]> = {
    users: ['users:list', 'users:create', 'users:update', 'users:delete'],
    courses: ['courses:list', 'courses:create', 'courses:update', 'courses:delete'],
    enrollments: ['enrollments:list', 'enrollments:create', 'enrollments:update', 'enrollments:delete'],
    table: ['table:view', 'table:open', 'table:close', 'table:edit'],
  };
  
  const permissions = domainPermissions[domain] || [];
  return permissions.some(p => hasPermission(role, p as PermissionKey));
};
