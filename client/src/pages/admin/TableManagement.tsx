import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { courseApi, authApi } from "../../utils/api";

interface Course {
  _id: string;
  code: string;
  name: string;
  day: string;
  time: string;
  room: string;
  instructor: string;
  major?: string;
  studentYear?: number;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];
const TIME_SLOTS = [
  "08:00 - 09:30",
  "09:00 - 10:30",
  "10:00 - 11:30",
  "12:00 - 13:30",
  "14:00 - 15:30",
];

const TableManagement: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterYear, setFilterYear] = useState<number | "all">("all");
  const [filterMajor, setFilterMajor] = useState<string>("all");

  const user = JSON.parse(localStorage.getItem("student") || "{}");

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const response = await courseApi.getAllCourses();
      if (response.success) {
        setCourses(response.courses as any);
      }
    } catch (err) {
      console.error("Failed to load courses for table:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authApi.logout();
    navigate("/login");
  };

  const filteredCourses = courses.filter((c) => {
    if (filterYear !== "all" && c.studentYear !== filterYear) return false;
    if (filterMajor !== "all" && c.major !== filterMajor) return false;
    return true;
  });

  const getCoursesForSlot = (day: string, time: string) => {
    // Basic time matching (can be improved based on exact time overlap logic)
    return filteredCourses.filter(
      (c) => c.day === day && c.time.includes(time.split(" ")[0])
    );
  };

  // Extract unique majors
  const uniqueMajors = Array.from(new Set(courses.map((c) => c.major).filter(Boolean)));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-lg">Loading schedule...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-indigo-800 to-indigo-900 text-white flex flex-col">
        <div className="p-6">
          <div className="text-2xl font-bold mb-2">🎓 Admin Panel</div>
          <p className="text-indigo-200 text-sm">Credit Hours System</p>
        </div>

        <div className="px-4 py-3 mx-4 bg-indigo-700/50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-semibold">
              {user.fullName?.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
            </div>
            <div>
              <p className="font-medium">{user.fullName}</p>
              <p className="text-xs text-indigo-200 capitalize">{user.role}</p>
            </div>
          </div>
        </div>

        <nav className="mt-6 px-4 space-y-1 flex-1">
          <button
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 rounded-lg text-left transition-colors"
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
          <button
            className="w-full flex items-center gap-3 px-4 py-3 bg-white/10 rounded-lg text-left"
            onClick={() => navigate("/admin/tables")}
          >
            <span>📅</span> Table Management
          </button>
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

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Table Management</h1>
            <p className="text-gray-500 mt-1">View and manage course schedules and conflicts.</p>
          </div>
          
          <div className="flex gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Major</label>
              <select
                value={filterMajor}
                onChange={(e) => setFilterMajor(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="all">All Majors</option>
                {uniqueMajors.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Level / Year</label>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value === "all" ? "all" : Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="all">All Levels</option>
                {[1, 2, 3, 4].map((y) => (
                  <option key={y} value={y}>Year {y}</option>
                ))}
              </select>
            </div>
          </div>
        </header>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[800px]">
              <thead>
                <tr>
                  <th className="border-b border-r border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-600 w-32 text-center">
                    Day / Time
                  </th>
                  {TIME_SLOTS.map((time) => (
                    <th key={time} className="border-b border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-600 text-center w-1/5">
                      {time}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAYS.map((day) => (
                  <tr key={day} className="border-b border-gray-200 last:border-0">
                    <td className="border-r border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold text-gray-700 text-center">
                      {day}
                    </td>
                    {TIME_SLOTS.map((time) => {
                      const coursesInSlot = getCoursesForSlot(day, time);
                      const isConflict = coursesInSlot.length > 1;

                      return (
                        <td key={`${day}-${time}`} className="border-r border-gray-200 last:border-0 p-2 align-top h-32">
                          <div className="flex flex-col gap-2 h-full">
                            {coursesInSlot.map((c) => (
                              <div
                                key={c._id}
                                className={`p-2 rounded border text-xs flex-1 flex flex-col justify-center ${
                                  isConflict
                                    ? "bg-red-50 border-red-200 text-red-800"
                                    : "bg-indigo-50 border-indigo-200 text-indigo-800"
                                }`}
                              >
                                <span className="font-bold block">{c.code}</span>
                                <span className="truncate block" title={c.name}>{c.name}</span>
                                <span className="text-gray-500 mt-1 block">{c.room}</span>
                              </div>
                            ))}
                            {coursesInSlot.length === 0 && (
                              <div className="text-gray-300 text-xs text-center my-auto flex-1 flex items-center justify-center">
                                Empty Slot
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TableManagement;
