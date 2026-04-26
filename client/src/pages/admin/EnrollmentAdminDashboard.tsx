import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi, authApi } from "../../utils/api";
import AdminSidebar from "../../components/admin/AdminSidebar";

interface Stats {
  totalStudents: number;
  totalEnrollments: number;
  recentEnrollments?: number;
}

const EnrollmentAdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem("student") || "{}");

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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading enrollment data...</p>
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
          <h1 className="text-3xl font-bold text-gray-800">Enrollment Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage student course enrollments and academic records</p>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Enrollments</p>
                <p className="text-3xl font-bold text-gray-800">{stats?.totalEnrollments || 0}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl">✅</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Students</p>
                <p className="text-3xl font-bold text-gray-800">{stats?.totalStudents || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">🎓</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Avg. Courses/Student</p>
                <p className="text-3xl font-bold text-gray-800">
                  {stats ? (stats.totalEnrollments / (stats.totalStudents || 1)).toFixed(1) : 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-2xl">📊</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => navigate("/admin/accounts")}
              className="flex items-center gap-4 p-4 bg-green-50 hover:bg-green-100 rounded-xl border border-green-200 transition-colors"
            >
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center text-white text-xl">📝</div>
              <div className="text-left">
                <p className="font-semibold text-gray-800">Manage Student Enrollments</p>
                <p className="text-sm text-gray-500">Add or drop courses for students</p>
              </div>
            </button>

            <button
              onClick={() => navigate("/admin/accounts")}
              className="flex items-center gap-4 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 transition-colors"
            >
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-white text-xl">⭐</div>
              <div className="text-left">
                <p className="font-semibold text-gray-800">Grading & Results</p>
                <p className="text-sm text-gray-500">Update student grades and view records</p>
              </div>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EnrollmentAdminDashboard;
