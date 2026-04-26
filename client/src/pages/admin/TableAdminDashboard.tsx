import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { courseApi, authApi } from "../../utils/api";
import AdminSidebar from "../../components/admin/AdminSidebar";

interface Course {
  _id: string;
  code: string;
  name: string;
  day: string;
  time: string;
  room: string;
  instructor: string;
}

const TableAdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem("student") || "{}");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await courseApi.getAllCourses();
        if (response.success) {
          setCourses(response.courses as any);
        }
      } catch (err: any) {
        console.warn("Failed to load courses:", err.message);
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
          <p className="mt-4 text-gray-600">Loading schedule data...</p>
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
          <h1 className="text-3xl font-bold text-gray-800">Table Management Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage course schedules, classrooms, and timetables</p>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-indigo-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Active Courses</p>
                <p className="text-3xl font-bold text-gray-800">{courses.length}</p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-2xl">📅</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-teal-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Assigned Rooms</p>
                <p className="text-3xl font-bold text-gray-800">
                  {new Set(courses.map(c => c.room).filter(r => r && r !== "TBA")).size}
                </p>
              </div>
              <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center text-2xl">🏫</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Potential Conflicts</p>
                <p className="text-3xl font-bold text-gray-800">0</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-2xl">⚠️</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => navigate("/admin/tables")}
              className="flex items-center gap-4 p-4 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-200 transition-colors"
            >
              <div className="w-12 h-12 bg-indigo-500 rounded-lg flex items-center justify-center text-white text-xl">🕒</div>
              <div className="text-left">
                <p className="font-semibold text-gray-800">Manage Weekly Schedule</p>
                <p className="text-sm text-gray-500">Update timeslots and avoid overlaps</p>
              </div>
            </button>

            <button
              onClick={() => navigate("/admin/tables")}
              className="flex items-center gap-4 p-4 bg-teal-50 hover:bg-teal-100 rounded-xl border border-teal-200 transition-colors"
            >
              <div className="w-12 h-12 bg-teal-500 rounded-lg flex items-center justify-center text-white text-xl">🏢</div>
              <div className="text-left">
                <p className="font-semibold text-gray-800">Room Allocation</p>
                <p className="text-sm text-gray-500">Assign classrooms to courses</p>
              </div>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TableAdminDashboard;
