import React, { useState, useEffect } from "react";
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
  const [user, setUser] = useState(getStoredAdminUser());
  
  // Listen for localStorage changes to update photo and other user data
  useEffect(() => {
    const handleStorageChange = () => {
      const updatedUser = getStoredAdminUser();
      setUser(updatedUser);
    };
    
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Also refresh user data when returning to admin pages (for same-tab updates)
  useEffect(() => {
    const updatedUser = getStoredAdminUser();
    setUser(updatedUser);
  }, [location.pathname]);

  const isSuperAdmin = user.role === "superadmin";
  const userType = (user.adminType || user.role || "").toLowerCase();

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
      icon: "🗓️",
      visible: canAccessFeature(user, "tableManagement"),
    },
    {
      label: "Student Timetables",
      path: "/admin/student-timetables",
      icon: "📅",
      visible: canAccessFeature(user, "studentTimetables"),
    },
  ];

  return (
    <aside className="w-64 bg-gradient-to-b from-indigo-800 to-indigo-900 text-white flex flex-col min-h-screen sticky top-0">
      <div className="p-6">
        <div className="text-2xl font-bold mb-1">
          {isSuperAdmin ? "🛡️ Super Admin" : 
           userType.includes("it") ? "🖥️ IT Admin" :
           userType.includes("table") || userType.includes("schedule") ? "📅 Table Admin" :
           userType.includes("courses") ? "📚 Courses Admin" : 
           userType.includes("enrollment") ? "✍️ Enrollment Admin" : "🎓 Admin Panel"}
        </div>
        <p className="text-indigo-200 text-sm">Credit Hours System</p>
      </div>

      <div className="px-4 py-3 mx-4 bg-indigo-700/50 rounded-lg group hover:bg-indigo-700/70 transition-colors cursor-pointer relative" onClick={() => navigate("/admin/profile-photo")}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-semibold overflow-hidden border border-indigo-500/30">
            {user.photoUrl ? (
              <img src={user.photoUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              user.fullName?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
            )}
          </div>
          <div>
            <p className="font-medium truncate max-w-[120px]">{user.fullName}</p>
            <p className="text-xs text-indigo-200 capitalize">
              {isSuperAdmin ? "Super Admin" : userType.replace("_", " ") || "Admin"}
            </p>
          </div>
        </div>
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg flex justify-end items-center px-4 transition-colors">
          <span className="text-white/0 group-hover:text-white/70 text-xs text-right">Edit Photo</span>
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
