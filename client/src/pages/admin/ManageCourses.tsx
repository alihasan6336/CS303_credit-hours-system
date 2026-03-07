import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../../utils/api";
import type { Course, CourseFormData } from "../../types/course";
import { MAJORS, STUDENT_YEARS } from "../../types/course";

const ManageCourses: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem("student") || "{}");

  const [formData, setFormData] = useState<CourseFormData>({
    courseName: "",
    courseCode: "",
    major: "",
    studentYear: 1,
    creditHours: 3,
    instructorName: "",
    prerequisite: "",
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await courseApi.getAllCourses();
      // if (response.success) {
      //   setCourses(response.courses);
      // }

      // Mock data for now
      setCourses([
        {
          _id: "1",
          courseName: "Introduction to Programming",
          courseCode: "CS101",
          major: "Computer Science",
          studentYear: 1,
          creditHours: 3,
          instructorName: "Dr. Ahmed Hassan",
        },
        {
          _id: "2",
          courseName: "Data Structures",
          courseCode: "CS201",
          major: "Computer Science",
          studentYear: 2,
          creditHours: 4,
          instructorName: "Dr. Sara Ali",
          prerequisite: "CS101",
        },
        {
          _id: "3",
          courseName: "Database Systems",
          courseCode: "CS301",
          major: "Computer Science",
          studentYear: 3,
          creditHours: 3,
          instructorName: "Dr. Mohamed Khalil",
          prerequisite: "CS201",
        },
      ]);
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || "Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authApi.logout();
    navigate("/login");
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "studentYear" || name === "creditHours"
          ? parseInt(value)
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError("");

    try {
      // TODO: Replace with actual API call
      // const response = await courseApi.createCourse(formData);
      // if (response.success) {
      //   await fetchCourses();
      //   setShowModal(false);
      //   resetForm();
      // }

      // Mock success for now
      const newCourse: Course = {
        _id: Date.now().toString(),
        ...formData,
      };
      setCourses((prev) => [...prev, newCourse]);
      setShowModal(false);
      resetForm();
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || "Failed to add course");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (courseId: string) => {
    if (!confirm("Are you sure you want to delete this course?")) return;

    try {
      // TODO: Replace with actual API call
      // await courseApi.deleteCourse(courseId);
      setCourses((prev) => prev.filter((c) => c._id !== courseId));
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || "Failed to delete course");
    }
  };

  const resetForm = () => {
    setFormData({
      courseName: "",
      courseCode: "",
      major: "",
      studentYear: 1,
      creditHours: 3,
      instructorName: "",
      prerequisite: "",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-lg">Loading courses...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-linear-to-b from-indigo-800 to-indigo-900 text-white">
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
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left hover:bg-white/10 transition"
            onClick={() => navigate("/admin")}
          >
            <span>📊</span> Dashboard
          </button>
          <button
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left hover:bg-white/10 transition"
            onClick={() => navigate("/admin/accounts")}
          >
            <span>👥</span> Account Management
          </button>
          <button
            className="w-full flex items-center gap-3 px-4 py-3 bg-white/10 rounded-lg text-left"
            onClick={() => navigate("/admin/manage-courses")}
          >
            <span>📚</span> Manage Courses
          </button>
          <button
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left hover:bg-white/10 transition"
            onClick={() => navigate("/admin/courses")}
          >
            <span>📋</span> Course Assignments
          </button>
        </nav>

        <div className="absolute bottom-0 w-64 p-4 border-t border-indigo-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 rounded-lg transition"
          >
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Manage Courses
              </h1>
              <p className="text-gray-600 mt-1">
                Add and manage courses for different majors and years
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
            >
              <span className="text-xl">+</span> Add New Course
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Courses Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Course Code
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Course Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Major
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Year
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Credits
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Instructor
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Prerequisite
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {courses.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        No courses found. Click "Add New Course" to get started.
                      </td>
                    </tr>
                  ) : (
                    courses.map((course) => (
                      <tr
                        key={course._id}
                        className="hover:bg-gray-50 transition"
                      >
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {course.courseCode}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {course.courseName}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {course.major}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          Year {course.studentYear}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {course.creditHours}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {course.instructorName || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {course.prerequisite || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <button
                            onClick={() => handleDelete(course._id!)}
                            className="text-red-600 hover:text-red-800 transition"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Add Course Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">
                  Add New Course
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                >
                  ×
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Course Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="courseName"
                  value={formData.courseName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g., Introduction to Programming"
                />
              </div>

              {/* Course Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="courseCode"
                  value={formData.courseCode}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g., CS101"
                />
              </div>

              {/* Major */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Major <span className="text-red-500">*</span>
                </label>
                <select
                  name="major"
                  value={formData.major}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Select Major</option>
                  {MAJORS.map((major) => (
                    <option key={major} value={major}>
                      {major}
                    </option>
                  ))}
                </select>
              </div>

              {/* Student Year and Credit Hours */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Student Year <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="studentYear"
                    value={formData.studentYear}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    {STUDENT_YEARS.map((year) => (
                      <option key={year} value={year}>
                        Year {year}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Credit Hours <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="creditHours"
                    value={formData.creditHours}
                    onChange={handleInputChange}
                    required
                    min="1"
                    max="6"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Instructor Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instructor Name
                </label>
                <input
                  type="text"
                  name="instructorName"
                  value={formData.instructorName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g., Dr. Ahmed Hassan"
                />
              </div>

              {/* Prerequisite */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prerequisite Course
                </label>
                <select
                  name="prerequisite"
                  value={formData.prerequisite}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">None</option>
                  {courses.map((course) => (
                    <option key={course._id} value={course.courseCode}>
                      {course.courseCode} - {course.courseName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {formLoading ? "Adding..." : "Add Course"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCourses;
