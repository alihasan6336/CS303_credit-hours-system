import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi, authApi } from "../../utils/api";
import AdminSidebar from "../../components/admin/AdminSidebar";

interface Stats {
  totalStudents: number;
  totalCourses: number;
  totalAdmins: number;
  totalSuperAdmins: number;
  totalEnrollments: number;
  recentLogins: number;
}

interface StudentsByLevel {
  level: number;
  count: number;
}

interface CourseStat {
  code: string;
  name: string;
  enrolled: number;
  capacity: number;
}

const SuperAdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [studentsByLevel, setStudentsByLevel] = useState<StudentsByLevel[]>([]);
  const [courses, setCourses] = useState<CourseStat[]>([]);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem("student") || "{}");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await adminApi.getStats();
        if (response.success) {
          setStats(response.stats);
          setStudentsByLevel(response.studentsByLevel);
          setCourses(response.courses);
        }
      } catch (err: any) {
        console.warn("Failed to load stats:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleLogout = () => {
    authApi.logout();
    navigate("/login");
  };

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
          <h1 className="text-3xl font-bold text-gray-800">Super Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">Complete system overview and control</p>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-blue-500">
            <p className="text-gray-500 text-xs">Students</p>
            <p className="text-2xl font-bold text-gray-800">{stats?.totalStudents || 0}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-purple-500">
            <p className="text-gray-500 text-xs">Courses</p>
            <p className="text-2xl font-bold text-gray-800">{stats?.totalCourses || 0}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-green-500">
            <p className="text-gray-500 text-xs">Enrollments</p>
            <p className="text-2xl font-bold text-gray-800">{stats?.totalEnrollments || 0}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-orange-500">
            <p className="text-gray-500 text-xs">Admins</p>
            <p className="text-2xl font-bold text-gray-800">{stats?.totalAdmins || 0}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-red-500">
            <p className="text-gray-500 text-xs">Super Admins</p>
            <p className="text-2xl font-bold text-gray-800">{stats?.totalSuperAdmins || 0}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-teal-500">
            <p className="text-gray-500 text-xs">Logins (24h)</p>
            <p className="text-2xl font-bold text-gray-800">{stats?.recentLogins || 0}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Master Controls</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button onClick={() => navigate("/admin/accounts")} className="flex items-center gap-4 p-4 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors">
              <div className="w-12 h-12 bg-slate-600 rounded-lg flex items-center justify-center text-white text-xl">👥</div>
              <div className="text-left">
                <p className="font-semibold text-gray-800">Users</p>
                <p className="text-xs text-gray-500">Accounts & Admins</p>
              </div>
            </button>
            <button onClick={() => navigate("/admin/manage-courses")} className="flex items-center gap-4 p-4 bg-amber-50 hover:bg-amber-100 rounded-xl border border-amber-200 transition-colors">
              <div className="w-12 h-12 bg-amber-600 rounded-lg flex items-center justify-center text-white text-xl">📚</div>
              <div className="text-left">
                <p className="font-semibold text-gray-800">Courses</p>
                <p className="text-xs text-gray-500">Curriculum Mgmt</p>
              </div>
            </button>
            <button onClick={() => navigate("/admin/courses")} className="flex items-center gap-4 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 transition-colors">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xl">📋</div>
              <div className="text-left">
                <p className="font-semibold text-gray-800">Levels</p>
                <p className="text-xs text-gray-500">Assignments</p>
              </div>
            </button>
            <button onClick={() => navigate("/admin/tables")} className="flex items-center gap-4 p-4 bg-teal-50 hover:bg-teal-100 rounded-xl border border-teal-200 transition-colors">
              <div className="w-12 h-12 bg-teal-600 rounded-lg flex items-center justify-center text-white text-xl">📅</div>
              <div className="text-left">
                <p className="font-semibold text-gray-800">Schedules</p>
                <p className="text-xs text-gray-500">Timetables</p>
              </div>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SuperAdminDashboard;
