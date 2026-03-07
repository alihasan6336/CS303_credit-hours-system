import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi, authApi } from "../../utils/api";

interface Stats {
  totalStudents: number;
  totalCourses: number;
  totalAdmins: number;
  totalEnrollments: number;
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

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [studentsByLevel, setStudentsByLevel] = useState<StudentsByLevel[]>([]);
  const [courses, setCourses] = useState<CourseStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        setError(err.message || "Failed to load dashboard data");
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
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-lg text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-indigo-800 to-indigo-900 text-white">
        <div className="p-6">
          <div className="text-2xl font-bold mb-2">🎓 Admin Panel</div>
          <p className="text-indigo-200 text-sm">Credit Hours System</p>
        </div>

        <div className="px-4 py-3 mx-4 bg-indigo-700/50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-semibold">
              {user.fullName
                ?.split(" ")
                .map((n: string) => n[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div>
              <p className="font-medium">{user.fullName}</p>
              <p className="text-xs text-indigo-200 capitalize">{user.role}</p>
            </div>
          </div>
        </div>

        <nav className="mt-6 px-4 space-y-1">
          <button
            className="w-full flex items-center gap-3 px-4 py-3 bg-white/10 rounded-lg text-left"
            onClick={() => navigate("/admin")}
          >
            <span>📊</span> Dashboard
          </button>
          <button
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 rounded-lg text-left transition-colors"
            onClick={() => navigate("/admin/accounts")}
          >
            <span>👥</span> Manage Accounts
          </button>
          <button
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 rounded-lg text-left transition-colors"
            onClick={() => navigate("/admin/manage-courses")}
          >
            <span>📚</span> Manage Courses
          </button>
          <button
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 rounded-lg text-left transition-colors"
            onClick={() => navigate("/admin/courses")}
          >
            <span>📋</span> Course Assignments
          </button>
        </nav>

        <div className="absolute bottom-0 left-0 w-64 p-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-200 transition-colors"
          >
            <span>🚪</span> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">Overview of system statistics</p>
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

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Courses</p>
                <p className="text-3xl font-bold text-gray-800">
                  {stats?.totalCourses || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-2xl">
                📚
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Enrollments</p>
                <p className="text-3xl font-bold text-gray-800">
                  {stats?.totalEnrollments || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl">
                ✅
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
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Students by Level */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Students by Level
            </h3>
            <div className="space-y-3">
              {studentsByLevel.map((item) => (
                <div key={item.level} className="flex items-center gap-4">
                  <span className="w-20 text-sm text-gray-600">
                    Level {item.level}
                  </span>
                  <div className="flex-1 bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-indigo-500 h-4 rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          (item.count / (stats?.totalStudents || 1)) * 100,
                        )}%`,
                      }}
                    />
                  </div>
                  <span className="w-12 text-sm font-medium text-gray-700">
                    {item.count}
                  </span>
                </div>
              ))}
              {studentsByLevel.length === 0 && (
                <p className="text-gray-500 text-center py-4">
                  No data available
                </p>
              )}
            </div>
          </div>

          {/* Popular Courses */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Popular Courses
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b">
                    <th className="pb-2">Code</th>
                    <th className="pb-2">Name</th>
                    <th className="pb-2">Enrolled</th>
                    <th className="pb-2">Capacity</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course) => (
                    <tr key={course.code} className="border-b last:border-0">
                      <td className="py-3 font-mono text-sm text-indigo-600">
                        {course.code}
                      </td>
                      <td className="py-3 text-sm">{course.name}</td>
                      <td className="py-3 text-sm">{course.enrolled}</td>
                      <td className="py-3 text-sm text-gray-500">
                        {course.capacity}
                      </td>
                    </tr>
                  ))}
                  {courses.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-4 text-center text-gray-500"
                      >
                        No courses available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
