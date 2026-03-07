import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Course } from "../../types/course";
import { authApi } from "../../utils/api";

const AvailableCourses: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolledCourses, setEnrolledCourses] = useState<string[]>([]);
  const [registering, setRegistering] = useState<string | null>(null);
  const [error, setError] = useState("");

  const user = JSON.parse(localStorage.getItem("student") || "{}");

  useEffect(() => {
    // TEMPORARY: Authentication check bypassed for testing
    // const token = localStorage.getItem("authToken");
    // if (!token) {
    //   navigate("/login");
    //   return;
    // }

    fetchCourses();
  }, [navigate]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await courseApi.getAvailableCourses();
      // if (response.success) {
      //   setCourses(response.courses);
      //   setEnrolledCourses(response.enrolledCourseIds || []);
      // }

      // Mock data for now
      const mockCourses: Course[] = [
        {
          _id: "1",
          courseName: "Data Structures and Algorithms",
          courseCode: "CS201",
          major: "Computer Science",
          studentYear: 2,
          creditHours: 4,
          instructorName: "Dr. Sarah Ahmed",
          prerequisite: "CS101",
        },
        {
          _id: "2",
          courseName: "Database Management Systems",
          courseCode: "CS301",
          major: "Computer Science",
          studentYear: 3,
          creditHours: 3,
          instructorName: "Dr. Mohamed Khalil",
          prerequisite: "CS201",
        },
        {
          _id: "3",
          courseName: "Web Development",
          courseCode: "CS305",
          major: "Computer Science",
          studentYear: 3,
          creditHours: 3,
          instructorName: "Dr. Fatima Hassan",
        },
        {
          _id: "4",
          courseName: "Mobile Application Development",
          courseCode: "CS402",
          major: "Computer Science",
          studentYear: 4,
          creditHours: 3,
          instructorName: "Dr. Ali Mansour",
          prerequisite: "CS305",
        },
        {
          _id: "5",
          courseName: "Machine Learning",
          courseCode: "CS410",
          major: "Computer Science",
          studentYear: 4,
          creditHours: 4,
          instructorName: "Dr. Layla Ibrahim",
          prerequisite: "CS201",
        },
        {
          _id: "6",
          courseName: "Computer Networks",
          courseCode: "CS321",
          major: "Computer Science",
          studentYear: 3,
          creditHours: 3,
          instructorName: "Dr. Omar Farouk",
        },
      ];

      setCourses(mockCourses);
      setEnrolledCourses(["1"]); // Mock enrolled courses
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
      // TODO: Replace with actual API call
      // const response = await courseApi.registerForCourse(courseId);
      // if (response.success) {
      //   setEnrolledCourses([...enrolledCourses, courseId]);
      // }

      // Mock success
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setEnrolledCourses([...enrolledCourses, courseId]);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to register for course";
      setError(message);
    } finally {
      setRegistering(null);
    }
  };

  const handleGoBack = () => {
    navigate("/home");
  };

  const handleSignOut = () => {
    authApi.logout();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleGoBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <svg
                  className="w-6 h-6 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Available Courses
                </h1>
                <p className="text-sm text-gray-600">
                  Courses available for your program and academic level
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-indigo-50 rounded-lg">
                <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {user.fullName
                    ?.split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .slice(0, 2) || "ST"}
                </div>
                <div className="text-sm">
                  <div className="font-medium text-gray-900">
                    {user.fullName}
                  </div>
                  <div className="text-gray-600">{user.major}</div>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                Sign Out
              </button>
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

        {/* Courses Table */}
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
                          {isEnrolled ? (
                            <span className="inline-flex items-center px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                              ✓ Enrolled
                            </span>
                          ) : (
                            <button
                              onClick={() => handleRegister(course._id!)}
                              disabled={isProcessing}
                              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                            >
                              {isProcessing ? "Registering..." : "Register"}
                            </button>
                          )}
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
      </main>
    </div>
  );
};

export default AvailableCourses;
