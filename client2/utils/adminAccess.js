
const normalize = (val) => (val || "").trim().toLowerCase();

const FEATURE_ACCESS = {
  it_admin: ["dashboard", "accounts"],
  table_admin: ["dashboard", "table"],
  courses_admin: ["dashboard", "courses"],
  enrollment_admin: ["dashboard", "enrollment", "accounts"],
};

export const canAccessTab = (user, tabKey) => {
  if (!user) return false;
  const role = normalize(user.role);
  const email = normalize(user.email);
  if (role === "superadmin" || email === "admin@admin.com") return true;
  if (tabKey === "settings") return true;

  const type = normalize(user.adminType || (role !== "admin" ? role : ""));
  if (type) {
    const accessKey = Object.keys(FEATURE_ACCESS).find(key => type.includes(key));
    if (accessKey && FEATURE_ACCESS[accessKey].includes(tabKey)) return true;
  }

  if (user.permissions && user.permissions.includes(tabKey)) {
    return true;
  }
  return false;
};
