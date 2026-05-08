import React, { useEffect, useState } from "react";
import { courseApi, settingsApi } from "../../utils/api";
import AdminSidebar from "../../components/admin/AdminSidebar";

interface Course {
  _id: string;
  code: string;
  name: string;
  day: string;
  time: string;
  room: string;
  instructor: string;
  type: string;
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
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterYear, setFilterYear] = useState<number | "all">("all");
  const [filterMajor, setFilterMajor] = useState<string>("all");

  // Enrollment table controls
  const [tableVisible, setTableVisible] = useState(false);
  const [enrollmentOpenLevels, setEnrollmentOpenLevels] = useState<number[]>([]);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchCourses();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await settingsApi.getSettings();
      if (data.success) {
        setTableVisible(data.settings.tableVisible);
        setEnrollmentOpenLevels(data.settings.enrollmentOpenLevels || []);
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    }
  };

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const response = await courseApi.getAllCourses();
      if (response.success) {
        setCourses(response.courses.map(course => ({
          ...course,
          type: course.type || "Lecture"
        })));
      }
    } catch (err) {
      console.error("Failed to load courses for table:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenLevel = async (level: number) => {
    setUpdating(`open-${level}`);
    try {
      const data = await settingsApi.openRegistration([level]);
      if (data.success) {
        setEnrollmentOpenLevels(data.enrollmentOpenLevels);
      }
    } catch (err) {
      console.error("Failed to open enrollment for level:", err);
    } finally {
      setUpdating(null);
    }
  };

  const handleCloseLevel = async (level: number) => {
    setUpdating(`close-${level}`);
    try {
      const data = await settingsApi.closeRegistration([level]);
      if (data.success) {
        setEnrollmentOpenLevels(data.enrollmentOpenLevels);
      }
    } catch (err) {
      console.error("Failed to close enrollment for level:", err);
    } finally {
      setUpdating(null);
    }
  };

  const handleOpenAll = async () => {
    setUpdating("open-all");
    try {
      const data = await settingsApi.openRegistration();
      if (data.success) {
        setEnrollmentOpenLevels(data.enrollmentOpenLevels);
      }
    } catch (err) {
      console.error("Failed to open enrollment for all:", err);
    } finally {
      setUpdating(null);
    }
  };

  const handleCloseAll = async () => {
    setUpdating("close-all");
    try {
      const data = await settingsApi.closeRegistration();
      if (data.success) {
        setEnrollmentOpenLevels(data.enrollmentOpenLevels);
      }
    } catch (err) {
      console.error("Failed to close enrollment for all:", err);
    } finally {
      setUpdating(null);
    }
  };

  const handleShowTable = async () => {
    setUpdating("show-table");
    try {
      const data = await settingsApi.showTable();
      if (data.success) setTableVisible(true);
    } catch (err) {
      console.error("Failed to show table:", err);
    } finally {
      setUpdating(null);
    }
  };

  const handleHideTable = async () => {
    setUpdating("hide-table");
    try {
      const data = await settingsApi.hideTable();
      if (data.success) setTableVisible(false);
    } catch (err) {
      console.error("Failed to hide table:", err);
    } finally {
      setUpdating(null);
    }
  };

  const filteredCourses = courses.filter((c) => {
    if (filterYear !== "all") {
      const match = c.code.match(/\d{3}/);
      if (match) {
        const num = parseInt(match[0], 10);
        const courseLevel = Math.floor(num / 100);
        if (courseLevel !== filterYear) return false;
      } else if (c.studentYear !== filterYear) {
        return false;
      }
    }
    if (filterMajor !== "all" && c.major !== filterMajor) return false;
    return true;
  });

  const getCoursesForSlot = (day: string, time: string) => {
    // Basic time matching (can be improved based on exact time overlap logic)
    return filteredCourses.filter(
      (c) => c.day === day && c.time.includes(time.split(" ")[0]),
    );
  };

  // Extract unique majors
  const uniqueMajors = Array.from(
    new Set(courses.map((c) => c.major).filter(Boolean)),
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-lg">Loading schedule...</div>
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
              Table Management
            </h1>
            <p className="text-gray-500 mt-1">
              View and manage course schedules and conflicts.
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
                title="Filter by major"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
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
                Level / Year
              </label>
              <select
                value={filterYear}
                onChange={(e) =>
                  setFilterYear(
                    e.target.value === "all" ? "all" : Number(e.target.value),
                  )
                }
                title="Filter by level/year"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
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

        {/* Enrollment Table Controls */}
        <div className="mb-8 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Table Control</h2>
                <p className="text-sm text-slate-300 mt-0.5">Manage which year levels can register for courses</p>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-8">
            {/* Status Bar */}
            <div className="flex flex-wrap items-center gap-4">
              {/* Registration Status */}
              <div className="flex-1 min-w-[240px] bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${enrollmentOpenLevels.length > 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                    <svg className={`w-5 h-5 ${enrollmentOpenLevels.length > 0 ? 'text-green-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {enrollmentOpenLevels.length > 0 ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      )}
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Registration Status</p>
                    {enrollmentOpenLevels.length > 0 ? (
                      <p className="text-sm font-bold text-green-700">
                        Open for Year {enrollmentOpenLevels.join(', ')}
                      </p>
                    ) : (
                      <p className="text-sm font-bold text-red-700">Closed for All Years</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Table Visibility Status */}
              <div className="flex-1 min-w-[240px] bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tableVisible ? 'bg-blue-100' : 'bg-gray-200'}`}>
                    <svg className={`w-5 h-5 ${tableVisible ? 'text-blue-600' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Table Visibility</p>
                    <p className="text-sm font-bold text-gray-800">{tableVisible ? 'Visible to Students' : 'Hidden from Students'}</p>
                  </div>
                  <button
                    onClick={tableVisible ? handleHideTable : handleShowTable}
                    disabled={updating === "show-table" || updating === "hide-table"}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 ${
                      tableVisible
                        ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        : "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-200"
                    }`}
                  >
                    {updating === "show-table" || updating === "hide-table"
                      ? "Updating..."
                      : tableVisible
                      ? "Hide"
                      : "Show"}
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleOpenAll}
                disabled={updating === "open-all"}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-all disabled:opacity-50 shadow-md shadow-emerald-200 active:scale-95"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {updating === "open-all" ? "Opening..." : "Open All Years"}
              </button>
              <button
                onClick={handleCloseAll}
                disabled={updating === "close-all"}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-semibold hover:bg-rose-700 transition-all disabled:opacity-50 shadow-md shadow-rose-200 active:scale-95"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                {updating === "close-all" ? "Closing..." : "Close All Years"}
              </button>
            </div>

            {/* Divider */}
            <div className="h-px bg-gray-100"></div>

            {/* Per-Year Cards */}
            <div>
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Per-Year Controls</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[1, 2, 3, 4].map((level) => {
                  const isOpen = enrollmentOpenLevels.includes(level);
                  const isUpdating = updating === `open-${level}` || updating === `close-${level}`;

                  return (
                    <div
                      key={level}
                      className={`relative rounded-2xl border-2 p-6 transition-all duration-300 ${
                        isOpen
                          ? "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white shadow-md shadow-emerald-100"
                          : "border-gray-200 bg-gradient-to-br from-gray-50 to-white shadow-sm"
                      }`}
                    >
                      {/* Status Badge */}
                      <div className="absolute top-4 right-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
                            isOpen
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? "bg-emerald-500 animate-pulse" : "bg-gray-400"}`}></span>
                          {isOpen ? "OPEN" : "CLOSED"}
                        </span>
                      </div>

                      {/* Year Number */}
                      <div className="mb-5">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold mb-3 ${isOpen ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                          {level}
                        </div>
                        <h4 className="text-lg font-bold text-gray-800">Year {level}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {isOpen ? "Students can enroll" : "Registration blocked"}
                        </p>
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => (isOpen ? handleCloseLevel(level) : handleOpenLevel(level))}
                        disabled={isUpdating}
                        className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 active:scale-95 ${
                          isOpen
                            ? "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                            : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-200"
                        }`}
                      >
                        {isUpdating ? (
                          <span className="inline-flex items-center gap-2">
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Updating...
                          </span>
                        ) : isOpen ? (
                          <span className="inline-flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                            Close Enrollment
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Open Enrollment
                          </span>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Schedule Grid */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[800px]">
              <thead>
                <tr>
                  <th className="border-b border-r border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-600 w-32 text-center">
                    Day / Time
                  </th>
                  {TIME_SLOTS.map((time) => (
                    <th
                      key={time}
                      className="border-b border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-600 text-center w-1/5"
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
                          className="border-r border-gray-200 last:border-0 p-2 align-top h-32"
                        >
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
                                <span className="font-bold block">
                                  {c.code}
                                </span>
                                <span className="truncate block" title={c.name}>
                                  {c.name}
                                </span>
                                <div className="mt-1 flex items-center justify-between text-gray-500">
                                  <span>{c.room || "TBA"}</span>
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${c.type === "Lab" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}
                                  >
                                    {c.type || "Lecture"}
                                  </span>
                                </div>
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
