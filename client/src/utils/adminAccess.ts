export type AdminType = "it_admin" | "table_admin" | "courses_admin" | "enrollment_admin";

type AdminFeature =
  | "dashboard"
  | "manageAccounts"
  | "manageCourses"
  | "courseAssignments"
  | "tableManagement"
  | "studentTimetables";

interface AdminUser {
  role?: string;
  adminType?: string; // Can be mixed case from DB
  fullName?: string;
  email?: string;
}

// Normalize role/type for logic
const normalize = (val?: string) => (val || "").trim().toLowerCase();

const FEATURE_ACCESS: Record<string, AdminFeature[]> = {
  it_admin: ["dashboard", "manageAccounts"],
  table_admin: ["dashboard", "tableManagement", "studentTimetables"],
  courses_admin: ["dashboard", "manageCourses", "courseAssignments"],
  enrollment_admin: ["dashboard", "manageAccounts"],
};

const FEATURE_PATHS: Record<AdminFeature, string> = {
  dashboard: "/admin",
  manageAccounts: "/admin/accounts",
  manageCourses: "/admin/manage-courses",
  courseAssignments: "/admin/courses",
  tableManagement: "/admin/tables",
  studentTimetables: "/admin/student-timetables",
};

export const getStoredAdminUser = (): AdminUser => {
  try {
    return JSON.parse(localStorage.getItem("student") || "{}");
  } catch {
    return {};
  }
};

// Check if a role string represents any kind of admin
export const isAdminRole = (role?: string): boolean => {
  const r = normalize(role);
  return (
    r === "admin" || 
    r === "superadmin" || 
    r.includes("admin") || // Catch it_admin, courses_admin, etc.
    r.includes("management")
  );
};

export const isAdminUser = (user: AdminUser): boolean => {
  return isAdminRole(user.role);
};

export const getDashboardPathForAdmin = (user: AdminUser): string => {
  return "/admin";
};

export const hasResolvedAdminType = (user: AdminUser): boolean => {
  const role = normalize(user.role);
  const email = normalize(user.email);
  // Default Super Admin or Superadmin role
  if (role === "superadmin" || email === "admin@admin.com") return true;
  // If specialized admin, must have a recognized specialized role
  const specializedRoles = ['it_admin', 'table_admin', 'courses_admin', 'enrollment_admin'];
  return !!user.adminType || specializedRoles.includes(role);
};

export const canAccessFeature = (user: AdminUser, feature: AdminFeature): boolean => {
  const role = normalize(user.role);
  if (role === "superadmin") return true;
  if (!isAdminUser(user)) return false;
  
  const type = (user.adminType || (role !== "admin" ? role : "")).toLowerCase();
  
  // Find normalized key in FEATURE_ACCESS
  const accessKey = Object.keys(FEATURE_ACCESS).find(key => type.includes(key)) || "";
  return FEATURE_ACCESS[accessKey]?.includes(feature) ?? false;
};

export const canAccessPath = (user: AdminUser, path: string): boolean => {
  if (!isAdminUser(user)) return false;
  if (path === "/admin") return true;
  
  // Dashboard routes are always accessible if they are the user's home
  if (path === getDashboardPathForAdmin(user)) return true;

  const feature = (Object.keys(FEATURE_PATHS) as AdminFeature[]).find(
    (key) => FEATURE_PATHS[key] === path
  );
  return feature ? canAccessFeature(user, feature) : false;
};
