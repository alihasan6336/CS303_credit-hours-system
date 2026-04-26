import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { authApi } from "../../utils/api";
import {
  canAccessFeature,
  getDashboardPathForAdmin,
  getStoredAdminUser,
} from "../../utils/adminAccess";

const AdminSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getStoredAdminUser();
  const isSuperAdmin = user.role === "superadmin";
  const adminType = user.adminType;

  const handleLogout = () => {
    authApi.logout();
    navigate("/login");
  };

  const isActive = (path: string) => location.pathname === path;

  // Determine dashboard path
  const dashboardPath = getDashboardPathForAdmin(user);

  // Define menu items based on permissions
  const menuItems = [
    {
      label: "Dashboard",
      path: dashboardPath,
      icon: "📊",
      visible: true,
    },
    {
      label: "Manage Accounts",
      path: "/admin/accounts",
      icon: "👥",
      visible: canAccessFeature(user, "manageAccounts"),
    },
    {
      label: "Manage Courses",
      path: "/admin/manage-courses",
      icon: "📚",
      visible: canAccessFeature(user, "manageCourses"),
    },
    {
      label: "Course Assignments",
      path: "/admin/courses",
      icon: "📋",
      visible: canAccessFeature(user, "courseAssignments"),
    },
    {
      label: "Table Management",
      path: "/admin/tables",
      icon: "📅",
      visible: canAccessFeature(user, "tableManagement"),
    },
  ];

  return (
    <aside className="w-64 bg-gradient-to-b from-indigo-800 to-indigo-900 text-white flex flex-col min-h-screen sticky top-0">
      <div className="p-6">
        <div className="text-2xl font-bold mb-1">
          {isSuperAdmin ? "🛡️ Super Admin" : 
           adminType === "it_admin" ? "🖥️ IT Admin" :
           adminType === "schedule_admin" ? "📅 Schedule Admin" :
           adminType === "courses_admin" ? "📚 Courses Admin" : "🎓 Admin Panel"}
        </div>
        <p className="text-indigo-200 text-sm">Credit Hours System</p>
      </div>

      <div className="px-4 py-3 mx-4 bg-indigo-700/50 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-semibold">
            {user.fullName?.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
          </div>
          <div>
            <p className="font-medium truncate max-w-[120px]">{user.fullName}</p>
            <p className="text-xs text-indigo-200 capitalize">
              {isSuperAdmin ? "Super Admin" : adminType?.replace("_", " ") || "Admin"}
            </p>
          </div>
        </div>
      </div>

      <nav className="mt-6 px-4 space-y-1 flex-1">
        {menuItems.filter(item => item.visible).map((item) => (
          <button
            key={item.path}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
              isActive(item.path) ? "bg-white/10 font-bold" : "hover:bg-white/5"
            }`}
            onClick={() => navigate(item.path)}
          >
            <span>{item.icon}</span> {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-indigo-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-200 transition-colors"
        >
          <span>🚪</span> Sign Out
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
