import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Course } from "../../types/course";
import { authApi, courseApi, settingsApi } from "../../utils/api";
import StudentLayout from "../../layout/StudentLayout";

const AvailableCourses: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolledCourses, setEnrolledCourses] = useState<string[]>([]);
  const [registering, setRegistering] = useState<string | null>(null);
  const [dropping, setDropping] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [enrollmentOpen, setEnrollmentOpen] = useState(false);
  const [openLevels, setOpenLevels] = useState<number[]>([]);
  const [tableVisible, setTableVisible] = useState(true);

  const user = JSON.parse(localStorage.getItem("student") || "{}");

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/login");
      return;
    }

    fetchCourses();
    fetchEnrollmentStatus();
  }, [navigate]);

  const fetchEnrollmentStatus = async () => {
    try {
      const data = await settingsApi.getSettings();
      if (data.success) {
        const levels = data.settings.enrollmentOpenLevels || [];
        setOpenLevels(levels);
        setEnrollmentOpen(data.settings.isRegistrationOpen && levels.includes(user.level));
        setTableVisible(data.settings.tableVisible !== false);
      }
    } catch (err) {
      console.error("Failed to fetch enrollment status", err);
    }
  };

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const [coursesResponse, homeResponse] = await Promise.all([
        courseApi.getAllCourses(),
        authApi.home(),
      ]);

      if (coursesResponse.success) {
        // Map backend names to frontend names if they differ
        const mappedCourses = coursesResponse.courses.map((c: any) => ({
          _id: c._id,
          courseName: c.name,
          courseCode: c.code,
          major: c.major || "Computer Science",
          studentYear: c.level || 0,
          day: c.day,
          time: c.time,
          creditHours: c.credits,
          instructorName: c.instructor,
          group: c.group || "A",
          courseType: c.courseType || "Lecture",
          prerequisite: c.prerequisites?.join(", ") || "",
        }));
        setCourses(mappedCourses);
      }

      if (homeResponse.success && homeResponse.student) {
        // Find which courses the student is enrolled in from home response
        const enrolledIds = homeResponse.courses
          ?.map((c: any) => {
            // Find the course ID in the full courses list by matching code
            const fullCourse = coursesResponse.courses.find(
              (fc) => fc.code === c.code,
            );
            return fullCourse?._id;
          })
          .filter((id) => id) as string[];

        setEnrolledCourses(enrolledIds || []);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load courses";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (courseId: string) => {
    setRegistering(courseId);
    setError("");

    try {
      const response = await courseApi.enroll(courseId);
      if (response.success !== false) {
        setEnrolledCourses([...enrolledCourses, courseId]);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to register for course";
      setError(message);
    } finally {
      setRegistering(null);
    }
  };

  const handleDrop = async (courseId: string) => {
    setDropping(courseId);
    setError("");

    try {
      const response = await courseApi.drop(courseId);
      if (response.success !== false) {
        setEnrolledCourses(enrolledCourses.filter((id) => id !== courseId));
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to drop course";
      setError(message);
    } finally {
      setDropping(null);
    }
  };

  if (loading) {
    return (
      <StudentLayout user={user}>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading courses...</p>
          </div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout user={user}>
      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Available Courses
                </h1>
                <p className="text-sm text-gray-600">
                  Courses available for your program and academic level
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Enrollment Status Banner */}
          {!enrollmentOpen && (
            <div className="mb-6 p-5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-4">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m10-6a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-amber-800">Enrollment Closed for Year {user.level}</h3>
                <p className="text-amber-700 text-sm">
                  The enrollment table is currently closed for your year level. You cannot register or drop courses at this time.
                  {openLevels.length > 0 && (
                    <span className="ml-1">Open for: Year {openLevels.join(', ')}.</span>
                  )}
                </p>
              </div>
            </div>
          )}
          {enrollmentOpen && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-green-700 font-medium text-sm">Enrollment is open for Year {user.level} — you can register and drop courses.</p>
            </div>
          )}

          {/* Table Hidden Message */}
          {!tableVisible && (
            <div className="mb-6 p-8 bg-gray-50 border border-gray-200 rounded-xl flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a10.05 10.05 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.05 10.05 0 01-3.37 4.68m0 0A9.953 9.953 0 0112 19a9.953 9.953 0 01-3.59-.687m0 0L21 21" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-1">Course Table Unavailable</h3>
              <p className="text-sm text-gray-600 max-w-md">
                The course table is currently hidden by the administration. Please check back later or contact your advisor for course information.
              </p>
            </div>
          )}

          {/* Courses Table */}
          {tableVisible && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                      Course Code
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                      Course Name
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                      Instructor
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                      Credits
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                      Prerequisite
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                      Year
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                      Day & Time
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                      Group
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {courses.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        <div className="flex flex-col items-center gap-3">
                          <svg
                            className="w-16 h-16 text-gray-300"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                            />
                          </svg>
                          <p className="text-lg font-medium">
                            No courses available
                          </p>
                          <p className="text-sm">
                            Check back later for new courses
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    courses.map((course) => {
                      const isEnrolled = enrolledCourses.includes(
                        course._id || "",
                      );
                      const isProcessing = registering === course._id;

                      return (
                        <tr
                          key={course._id}
                          className="border-b last:border-0 hover:bg-gray-50 transition"
                        >
                          <td className="px-6 py-4">
                            <span className="font-mono font-semibold text-gray-900">
                              {course.courseCode}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">
                              {course.courseName}
                            </div>
                            <div className="text-sm text-gray-600">
                              {course.major}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-700">
                            {course.instructorName || "-"}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                              {course.creditHours} cr
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {course.prerequisite ? (
                              <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
                                {course.prerequisite}
                              </span>
                            ) : (
                              <span className="text-gray-400">None</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-700">
                              Year {course.studentYear}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-indigo-700">
                              {course.day}
                            </div>
                            <div className="text-sm text-gray-600">
                              {course.time}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 text-gray-700 rounded text-sm font-medium">
                              {course.group}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col items-start gap-2">
                              {isEnrolled ? (
                                <div className="flex flex-col gap-2">
                                  <span className="inline-flex items-center justify-center px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                                    ✓ Enrolled
                                  </span>
                                  <button
                                    onClick={() => handleDrop(course._id!)}
                                    disabled={dropping === course._id || !enrollmentOpen}
                                    className="inline-flex items-center justify-center px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {dropping === course._id
                                      ? "Dropping..."
                                      : enrollmentOpen ? "Drop" : "Closed"}
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleRegister(course._id!)}
                                  disabled={isProcessing || !enrollmentOpen}
                                  className={`px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed ${
                                    enrollmentOpen
                                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                      : 'bg-gray-300 text-gray-500'
                                  }`}
                                >
                                  {isProcessing ? "Registering..." : enrollmentOpen ? "Register" : "Closed"}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {courses.length > 0 && (
              <div className="px-6 py-4 bg-gray-50 border-t">
                <p className="text-sm text-gray-600">
                  Showing {courses.length} available course
                  {courses.length !== 1 ? "s" : ""}
                </p>
              </div>
            )}
          </div>
          )}
        </main>
      </div>
    </StudentLayout>
  );
};

export default AvailableCourses;
