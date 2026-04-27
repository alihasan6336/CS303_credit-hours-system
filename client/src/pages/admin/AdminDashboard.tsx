import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  getStoredAdminUser, 
  getDashboardPathForAdmin, 
  hasResolvedAdminType 
} from "../../utils/adminAccess";
import SuperAdminDashboard from "./SuperAdminDashboard";

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = getStoredAdminUser();
  const dashboardPath = getDashboardPathForAdmin(user);

  useEffect(() => {
    // 1. If not a resolved admin type, stay here (will render error below)
    if (!hasResolvedAdminType(user)) return;

    // 2. Redirect to the calculated specialized dashboard if not already there
    if (dashboardPath !== "/admin") {
      navigate(dashboardPath, { replace: true });
    }
  }, [navigate, user, dashboardPath]);

  // If we shouldn't redirect, or if we are the super admin, render the Super Admin UI
  if (dashboardPath === "/admin" && (user.role === "superadmin" || user.email === "admin@admin.com")) {
    return <SuperAdminDashboard />;
  }

  // If not resolved, show the error state
  if (!hasResolvedAdminType(user)) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white border border-amber-200 rounded-xl shadow-sm p-6 text-center">
          <h1 className="text-2xl font-bold text-amber-700 mb-2">Admin Type Not Configured</h1>
          <p className="text-gray-700">Your account is logged in as admin, but no admin type is assigned yet.</p>
          <p className="text-sm text-gray-500 mt-4">Identifier: <span className="font-mono text-indigo-600">{user.email || "unknown"}</span></p>
        </div>
      </div>
    );
  }

  // Loading state while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 font-sans">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-6 shadow-xl shadow-indigo-100"></div>
        <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em]">Syncing Environment...</p>
      </div>
    </div>
  );
};

export default AdminDashboard;
