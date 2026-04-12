import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Course } from "../../types/course";
import { courseAssignmentApi, courseApi } from "../../utils/api";
import StudentLayout from "../../layout/StudentLayout";
import { mockAvailableCourses } from "../../utils/mockData";

const AvailableCourses: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolledCourses, setEnrolledCourses] = useState<string[]>([]);
  const [registering, setRegistering] = useState<string | null>(null);
  const [error, setError] = useState("");

  const user = JSON.parse(localStorage.getItem("student") || "{}");

  useEffect(() => {
    fetchCourses();
  }, [navigate]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const [assignmentsResponse, enrollmentsResponse] = await Promise.all([
        courseAssignmentApi.getAssignmentsByLevel().catch(() => ({ success: false })),
        courseApi.getMyCourses().catch(() => ({ success: false }))
      ]);

      if (assignmentsResponse.success && (enrollmentsResponse as any).success) {
        const myLevelAssignments = (assignmentsResponse as any).byLevel[user.level] || [];
        const availableCourses = myLevelAssignments.map((a: any) => ({
          _id: a.course._id,
          courseCode: a.course.code,
          courseName: a.course.name,
          instructorName: a.course.instructor,
          creditHours: a.course.credits,
          studentYear: a.level,
          major: user.major || "Computer Science",
          prerequisite: a.course.prerequisites?.[0] || ""
        }));
        setCourses(availableCourses);
        setEnrolledCourses((enrollmentsResponse as any).data.map((e: any) => e.course._id));
      } else {
        // Fallback to mock data for demo
        const fallbackCourses = mockAvailableCourses.map(c => ({
          _id: c._id,
          courseCode: c.code,
          courseName: c.name,
          instructorName: c.instructor,
          creditHours: c.credits,
          studentYear: user.level || 3,
          major: user.major || "Computer Science",
          prerequisite: c.prerequisites[0] || ""
        })) as any[];
        setCourses(fallbackCourses);
        
        const persistedEnrolledStr = localStorage.getItem(`mock_enrolled_${user.universityId}`);
        if (persistedEnrolledStr) {
          const persisted = JSON.parse(persistedEnrolledStr);
          setEnrolledCourses(persisted.map((c: any) => c._id));
        }
      }
    } catch (err) {
      console.warn("Using mock fallback due to error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (courseId: string) => {
    setRegistering(courseId);
    setError("");

    try {
      // Mock registration for standalone page persistence
      const courseToRegister = mockAvailableCourses.find(c => c._id === courseId);
      if (courseToRegister) {
        const persistedEnrolledStr = localStorage.getItem(`mock_enrolled_${user.universityId}`);
        const currentEnrolled = persistedEnrolledStr ? JSON.parse(persistedEnrolledStr) : [];
        if (!currentEnrolled.some((c: any) => c._id === courseId)) {
           const updated = [...currentEnrolled, { ...courseToRegister, _id: courseId }];
           localStorage.setItem(`mock_enrolled_${user.universityId}`, JSON.stringify(updated));
           setEnrolledCourses([...enrolledCourses, courseId]);
        }
      }
      
      await courseApi.enrollCourse(courseId).catch(() => {});
    } catch (err) {
      console.warn("Mock enrollment handled");
    } finally {
      setRegistering(null);
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
    </StudentLayout>
  );
};

export default AvailableCourses;
