export type AdminType = "it_admin" | "schedule_admin" | "courses_admin";

type AdminFeature =
  | "dashboard"
  | "manageAccounts"
  | "manageCourses"
  | "courseAssignments"
  | "tableManagement";

interface AdminUser {
  role?: string;
  adminType?: AdminType;
}

const FEATURE_ACCESS: Record<AdminType, AdminFeature[]> = {
  it_admin: ["dashboard", "manageAccounts"],
  schedule_admin: ["dashboard", "tableManagement"],
  courses_admin: ["dashboard", "manageCourses", "courseAssignments"],
};

const FEATURE_PATHS: Record<AdminFeature, string> = {
  dashboard: "/admin",
  manageAccounts: "/admin/accounts",
  manageCourses: "/admin/manage-courses",
  courseAssignments: "/admin/courses",
  tableManagement: "/admin/tables",
};

export const getStoredAdminUser = (): AdminUser => {
  try {
    return JSON.parse(localStorage.getItem("student") || "{}");
  } catch {
    return {};
  }
};

export const isAdminUser = (user: AdminUser): boolean =>
  user.role === "admin" || user.role === "superadmin";

export const getDashboardPathForAdmin = (user: AdminUser): string => {
  if (user.role === "superadmin") return "/admin";
  switch (user.adminType) {
    case "it_admin":
      return "/admin/it";
    case "schedule_admin":
      return "/admin/schedule";
    case "courses_admin":
      return "/admin/courses-admin";
    default:
      return "/admin";
  }
};

export const canAccessFeature = (user: AdminUser, feature: AdminFeature): boolean => {
  if (user.role === "superadmin") return true;
  if (user.role !== "admin" || !user.adminType) return false;
  return FEATURE_ACCESS[user.adminType]?.includes(feature) ?? false;
};

export const canAccessPath = (user: AdminUser, path: string): boolean => {
  if (path === "/admin") return true;
  const feature = (Object.keys(FEATURE_PATHS) as AdminFeature[]).find(
    (key) => FEATURE_PATHS[key] === path
  );
  return feature ? canAccessFeature(user, feature) : false;
};
