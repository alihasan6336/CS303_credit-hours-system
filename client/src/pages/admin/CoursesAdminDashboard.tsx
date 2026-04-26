import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { courseApi, adminApi } from "../../utils/api";
import AdminSidebar from "../../components/admin/AdminSidebar";

interface Course {
  _id: string;
  code: string;
  name: string;
  credits: number;
  day: string;
  time: string;
  room: string;
  instructor: string;
  major?: string;
  studentYear?: number;
  capacity?: number;
  enrolledCount?: number;
  isActive?: boolean;
}

interface EnrollmentStat {
  courseCode: string;
  courseName: string;
  enrolled: number;
  capacity: number;
}

const CoursesAdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollmentStats, setEnrollmentStats] = useState<EnrollmentStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [coursesRes] = await Promise.all([
        courseApi.getAllCourses(),
        adminApi.getStats().catch(() => null),
      ]);

      if (coursesRes.success) {
        const allCourses = coursesRes.courses as any[];
        setCourses(allCourses);

        // Build enrollment stats from courses
        const eStats = allCourses
          .filter((c: any) => c.capacity)
          .map((c: any) => ({
            courseCode: c.code,
            courseName: c.name,
            enrolled: c.enrolledCount || 0,
            capacity: c.capacity || 0,
          }))
          .sort((a: EnrollmentStat, b: EnrollmentStat) => b.enrolled - a.enrolled)
          .slice(0, 10);
        setEnrollmentStats(eStats);
      }
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  };

  const totalCourses = courses.length;
  const activeCourses = courses.filter((c) => c.isActive !== false).length;
  const totalCapacity = courses.reduce((sum, c) => sum + (c.capacity || 0), 0);
  const totalEnrolled = courses.reduce(
    (sum, c) => sum + (c.enrolledCount || 0),
    0
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
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
          <h1 className="text-3xl font-bold text-gray-800">
            Courses Admin Dashboard
          </h1>
          <p className="text-gray-500 mt-1">
            Manage courses, assignments, and student enrollments
          </p>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-amber-500">
            <p className="text-gray-500 text-sm">Total Courses</p>
            <p className="text-3xl font-bold text-gray-800">{totalCourses}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
            <p className="text-gray-500 text-sm">Active Courses</p>
            <p className="text-3xl font-bold text-green-600">
              {activeCourses}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
            <p className="text-gray-500 text-sm">Total Enrolled</p>
            <p className="text-3xl font-bold text-gray-800">{totalEnrolled}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
            <p className="text-gray-500 text-sm">Total Capacity</p>
            <p className="text-3xl font-bold text-gray-800">{totalCapacity}</p>
          </div>
        </div>

        {/* Two columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Popular Courses */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Top Enrolled Courses
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b">
                    <th className="pb-2">Code</th>
                    <th className="pb-2">Name</th>
                    <th className="pb-2">Enrolled</th>
                    <th className="pb-2">Capacity</th>
                    <th className="pb-2">Fill %</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollmentStats.map((course) => {
                    const fillPercent =
                      course.capacity > 0
                        ? Math.round(
                            (course.enrolled / course.capacity) * 100
                          )
                        : 0;
                    return (
                      <tr
                        key={course.courseCode}
                        className="border-b last:border-0"
                      >
                        <td className="py-3 font-mono text-sm text-amber-700">
                          {course.courseCode}
                        </td>
                        <td className="py-3 text-sm">{course.courseName}</td>
                        <td className="py-3 text-sm font-medium">
                          {course.enrolled}
                        </td>
                        <td className="py-3 text-sm text-gray-500">
                          {course.capacity}
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  fillPercent >= 90
                                    ? "bg-red-500"
                                    : fillPercent >= 70
                                    ? "bg-amber-500"
                                    : "bg-green-500"
                                }`}
                                style={{
                                  width: `${Math.min(100, fillPercent)}%`,
                                }}
                              />
                            </div>
                            <span className="text-xs text-gray-600">
                              {fillPercent}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {enrollmentStats.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-4 text-center text-gray-500"
                      >
                        No enrollment data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => navigate("/admin/manage-courses")}
                className="w-full flex items-center gap-4 p-4 bg-amber-50 hover:bg-amber-100 rounded-xl border border-amber-200 transition-colors"
              >
                <div className="w-12 h-12 bg-amber-500 rounded-lg flex items-center justify-center text-white text-xl">
                  📚
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-800">Manage Courses</p>
                  <p className="text-sm text-gray-500">
                    Add, edit, or remove courses
                  </p>
                </div>
              </button>

              <button
                onClick={() => navigate("/admin/courses")}
                className="w-full flex items-center gap-4 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 transition-colors"
              >
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-white text-xl">
                  📋
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-800">
                    Course Assignments
                  </p>
                  <p className="text-sm text-gray-500">
                    Assign courses to levels & semesters
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CoursesAdminDashboard;
