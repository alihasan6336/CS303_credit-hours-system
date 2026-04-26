import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "../../utils/api";
import AdminSidebar from "../../components/admin/AdminSidebar";

interface Stats {
  totalStudents: number;
  totalCourses: number;
  totalAdmins: number;
  totalEnrollments: number;
  recentLogins?: number;
  totalSuperAdmins?: number;
}

const ITAdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await adminApi.getStats();
        if (response.success) {
          setStats(response.stats);
        }
      } catch (err: any) {
        console.warn("Failed to load stats:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">IT Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Manage user accounts and system access
          </p>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Students</p>
                <p className="text-3xl font-bold text-gray-800">
                  {stats?.totalStudents || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
                🎓
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Admins</p>
                <p className="text-3xl font-bold text-gray-800">
                  {stats?.totalAdmins || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-2xl">
                👤
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Super Admins</p>
                <p className="text-3xl font-bold text-gray-800">
                  {stats?.totalSuperAdmins || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-2xl">
                🛡️
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Recent Logins (24h)</p>
                <p className="text-3xl font-bold text-gray-800">
                  {stats?.recentLogins || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl">
                🔑
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate("/admin/accounts")}
              className="flex items-center gap-4 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 transition-colors"
            >
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-white text-xl">
                👥
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-800">Manage Accounts</p>
                <p className="text-sm text-gray-500">
                  Create, edit, or delete user accounts
                </p>
              </div>
            </button>

            <button
              onClick={() => navigate("/admin/accounts")}
              className="flex items-center gap-4 p-4 bg-green-50 hover:bg-green-100 rounded-xl border border-green-200 transition-colors"
            >
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center text-white text-xl">
                ➕
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-800">Register Student</p>
                <p className="text-sm text-gray-500">
                  Add a new student account
                </p>
              </div>
            </button>

            <button
              onClick={() => navigate("/admin/accounts")}
              className="flex items-center gap-4 p-4 bg-purple-50 hover:bg-purple-100 rounded-xl border border-purple-200 transition-colors"
            >
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center text-white text-xl">
                🔧
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-800">Register Admin</p>
                <p className="text-sm text-gray-500">
                  Add a new admin account
                </p>
              </div>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ITAdminDashboard;
