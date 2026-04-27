import React, { useEffect, useState } from "react";
import { courseApi } from "../../utils/api";
import AdminSidebar from "../../components/admin/AdminSidebar";

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
  credits?: number;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];
const TIME_SLOTS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
];

const ScheduleAdminDashboard: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMajor, setFilterMajor] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<number | "all">("all");

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
      console.error("Failed to load courses:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter((c) => {
    if (filterMajor !== "all" && c.major !== filterMajor) return false;
    if (filterYear !== "all" && c.studentYear !== filterYear) return false;
    return true;
  });

  const getCoursesForSlot = (day: string, time: string) => {
    return filteredCourses.filter(
      (c) => c.day === day && c.time && c.time.includes(time)
    );
  };

  // Find conflicts
  const conflicts: { day: string; time: string; courses: Course[] }[] = [];
  DAYS.forEach((day) => {
    TIME_SLOTS.forEach((time) => {
      const inSlot = getCoursesForSlot(day, time);
      if (inSlot.length > 1) {
        conflicts.push({ day, time, courses: inSlot });
      }
    });
  });

  const uniqueMajors = Array.from(
    new Set(courses.map((c) => c.major).filter(Boolean))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Schedule Admin Dashboard
            </h1>
            <p className="text-gray-500 mt-1">
              Manage course schedules and detect conflicts
            </p>
          </div>

          <div className="flex gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Major
              </label>
              <select
                value={filterMajor}
                onChange={(e) => setFilterMajor(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="all">All Majors</option>
                {uniqueMajors.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Level
              </label>
              <select
                value={filterYear}
                onChange={(e) =>
                  setFilterYear(
                    e.target.value === "all" ? "all" : Number(e.target.value)
                  )
                }
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="all">All Levels</option>
                {[1, 2, 3, 4].map((y) => (
                  <option key={y} value={y}>
                    Year {y}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </header>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-teal-500">
            <p className="text-gray-500 text-sm">Total Scheduled Courses</p>
            <p className="text-3xl font-bold text-gray-800">
              {filteredCourses.length}
            </p>
          </div>
          <div
            className={`bg-white rounded-xl shadow-sm p-6 border-l-4 ${
              conflicts.length > 0 ? "border-red-500" : "border-green-500"
            }`}
          >
            <p className="text-gray-500 text-sm">Schedule Conflicts</p>
            <p
              className={`text-3xl font-bold ${
                conflicts.length > 0 ? "text-red-600" : "text-green-600"
              }`}
            >
              {conflicts.length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
            <p className="text-gray-500 text-sm">Unique Rooms</p>
            <p className="text-3xl font-bold text-gray-800">
              {new Set(filteredCourses.map((c) => c.room).filter(Boolean)).size}
            </p>
          </div>
        </div>

        {/* Conflicts Warning */}
        {conflicts.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <h3 className="text-red-800 font-semibold mb-2">
              ⚠️ Schedule Conflicts Detected
            </h3>
            <div className="space-y-2">
              {conflicts.map((c, i) => (
                <div
                  key={i}
                  className="text-sm text-red-700 bg-red-100 px-3 py-2 rounded-lg"
                >
                  <strong>
                    {c.day} at {c.time}
                  </strong>
                  : {c.courses.map((cr) => cr.code).join(", ")} ({c.courses.length}{" "}
                  courses overlapping)
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Weekly Timetable */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">
              Weekly Timetable
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[900px]">
              <thead>
                <tr>
                  <th className="border-b border-r border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-600 w-28 text-center">
                    Day / Time
                  </th>
                  {TIME_SLOTS.map((time) => (
                    <th
                      key={time}
                      className="border-b border-gray-200 bg-gray-50 px-3 py-3 text-sm font-semibold text-gray-600 text-center"
                    >
                      {time}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAYS.map((day) => (
                  <tr
                    key={day}
                    className="border-b border-gray-200 last:border-0"
                  >
                    <td className="border-r border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold text-gray-700 text-center">
                      {day}
                    </td>
                    {TIME_SLOTS.map((time) => {
                      const coursesInSlot = getCoursesForSlot(day, time);
                      const isConflict = coursesInSlot.length > 1;

                      return (
                        <td
                          key={`${day}-${time}`}
                          className="border-r border-gray-200 last:border-0 p-2 align-top h-24"
                        >
                          <div className="flex flex-col gap-1 h-full">
                            {coursesInSlot.map((c) => (
                              <div
                                key={c._id}
                                className={`p-2 rounded border text-xs flex-1 ${
                                  isConflict
                                    ? "bg-red-50 border-red-200 text-red-800"
                                    : "bg-teal-50 border-teal-200 text-teal-800"
                                }`}
                              >
                                <span className="font-bold block">
                                  {c.code}
                                </span>
                                <span className="truncate block text-gray-500">
                                  {c.room}
                                </span>
                              </div>
                            ))}
                            {coursesInSlot.length === 0 && (
                              <div className="text-gray-300 text-xs text-center my-auto flex-1 flex items-center justify-center">
                                —
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

export default ScheduleAdminDashboard;
