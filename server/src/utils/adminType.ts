import { PermissionKey } from '../models/AdminPermission';

export type AdminType = 'it_admin' | 'schedule_admin' | 'courses_admin';

const DEFAULT_IT_IDENTIFIERS = ['it@university.edu'];
const DEFAULT_SCHEDULE_IDENTIFIERS = ['schedule@university.edu'];
const DEFAULT_COURSES_IDENTIFIERS = ['courses@university.edu'];

const parseIdentifiers = (rawValue: string | undefined, fallback: string[]): Set<string> => {
  const source = rawValue?.trim() ? rawValue : fallback.join(',');
  return new Set(
    source
      .split(',')
      .map((v) => v.trim().toLowerCase())
      .filter(Boolean)
  );
};

const IT_ADMIN_IDENTIFIERS = parseIdentifiers(
  process.env.IT_ADMIN_IDENTIFIERS,
  DEFAULT_IT_IDENTIFIERS
);
const SCHEDULE_ADMIN_IDENTIFIERS = parseIdentifiers(
  process.env.SCHEDULE_ADMIN_IDENTIFIERS,
  DEFAULT_SCHEDULE_IDENTIFIERS
);
const COURSES_ADMIN_IDENTIFIERS = parseIdentifiers(
  process.env.COURSES_ADMIN_IDENTIFIERS,
  DEFAULT_COURSES_IDENTIFIERS
);

const ADMIN_TYPE_PERMISSIONS: Record<AdminType, PermissionKey[]> = {
  it_admin: ['users:list', 'users:view', 'users:create', 'users:update', 'users:toggle', 'users:stats'],
  schedule_admin: ['courses:list', 'courses:view', 'courses:update'],
  courses_admin: [
    'courses:list',
    'courses:view',
    'courses:create',
    'courses:update',
    'courses:enrollments',
    'enrollments:list',
    'enrollments:create',
    'enrollments:update',
  ],
};

const matchesIdentifiers = (identifiers: Set<string>, adminId: string, adminEmail: string): boolean => {
  return identifiers.has(adminId.toLowerCase()) || identifiers.has(adminEmail.toLowerCase());
};

export const resolveAdminType = (adminId: string, adminEmail: string): AdminType | null => {
  if (matchesIdentifiers(IT_ADMIN_IDENTIFIERS, adminId, adminEmail)) return 'it_admin';
  if (matchesIdentifiers(SCHEDULE_ADMIN_IDENTIFIERS, adminId, adminEmail)) return 'schedule_admin';
  if (matchesIdentifiers(COURSES_ADMIN_IDENTIFIERS, adminId, adminEmail)) return 'courses_admin';
  return null;
};

export const permissionsFromAdminType = (adminType: AdminType | null): PermissionKey[] => {
  if (!adminType) return [];
  return ADMIN_TYPE_PERMISSIONS[adminType];
};
