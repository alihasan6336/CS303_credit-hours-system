import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi, courseApi } from "../../utils/api";
import type { Course, CourseFormData } from "../../types/course";
import { MAJORS, STUDENT_YEARS } from "../../types/course";

// API returns different field names, we map them to frontend Course type
interface CourseFromApi {
  _id: string;
  code: string;
  name: string;
  day: string;
  time: string;
  room: string;
  credits: number;
  instructor: string;
  capacity: number;
  enrolledCount: number;
  major?: string;
  studentYear?: number;
  prerequisite?: string;
}

const ManageCourses: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [bulkEditData, setBulkEditData] = useState({
    major: "",
    studentYear: 0,
    credits: 0,
  });

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

  const [editFormData, setEditFormData] = useState<CourseFormData>({
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

  // Map API response to frontend Course type
  const mapApiToCourse = (apiCourse: CourseFromApi): Course => ({
    _id: apiCourse._id,
    courseName: apiCourse.name,
    courseCode: apiCourse.code,
    major: apiCourse.major || "",
    studentYear: apiCourse.studentYear || 1,
    creditHours: apiCourse.credits,
    instructorName: apiCourse.instructor,
    prerequisite: apiCourse.prerequisite || "",
  });

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const response = await courseApi.getAllCourses();
      if (response.success) {
        setCourses(response.courses.map(mapApiToCourse));
      }
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

  const handleEditInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
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
      const response = await courseApi.createCourse({
        code: formData.courseCode,
        name: formData.courseName,
        day: "Sunday", // Default values for required fields
        time: "08:00 - 09:30",
        room: "TBA",
        credits: formData.creditHours,
        instructor: formData.instructorName || "TBA",
        capacity: 30,
        major: formData.major,
        studentYear: formData.studentYear,
        prerequisite: formData.prerequisite || undefined,
      });

      if (response.success) {
        await fetchCourses();
        setShowModal(false);
        resetForm();
      }
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || "Failed to add course");
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setEditFormData({
      courseName: course.courseName,
      courseCode: course.courseCode,
      major: course.major,
      studentYear: course.studentYear,
      creditHours: course.creditHours,
      instructorName: course.instructorName || "",
      prerequisite: course.prerequisite || "",
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;
    
    setFormLoading(true);
    setError("");

    try {
      const response = await courseApi.updateCourse(editingCourse._id!, {
        code: editFormData.courseCode,
        name: editFormData.courseName,
        day: "Sunday",
        time: "08:00 - 09:30",
        room: "TBA",
        credits: editFormData.creditHours,
        instructor: editFormData.instructorName || "TBA",
        capacity: 30,
        major: editFormData.major,
        studentYear: editFormData.studentYear,
        prerequisite: editFormData.prerequisite || undefined,
      });

      if (response.success) {
        await fetchCourses();
        setShowEditModal(false);
        setEditingCourse(null);
      }
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || "Failed to update course");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (courseId: string) => {
    if (!confirm("Are you sure you want to delete this course?")) return;

    try {
      const response = await courseApi.deleteCourse(courseId);
      if (response.success) {
        setCourses((prev) => prev.filter((c) => c._id !== courseId));
        setSelectedCourses((prev) => prev.filter((id) => id !== courseId));
      }
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || "Failed to delete course");
    }
  };

  const handleSelectCourse = (courseId: string) => {
    setSelectedCourses((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const handleSelectAll = () => {
    if (selectedCourses.length === courses.length) {
      setSelectedCourses([]);
    } else {
      setSelectedCourses(courses.map((c) => c._id!));
    }
  };

  const handleBulkEdit = () => {
    if (selectedCourses.length === 0) {
      setError("Please select at least one course to edit");
      return;
    }
    setBulkEditData({
      major: "",
      studentYear: 0,
      credits: 0,
    });
    setShowBulkEditModal(true);
  };

  const handleBulkEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError("");

    try {
      const updates = selectedCourses.map((courseId) => {
        const course = courses.find((c) => c._id === courseId);
        if (!course) return null;
        
        return {
          _id: courseId,
          ...(bulkEditData.major && { major: bulkEditData.major }),
          ...(bulkEditData.studentYear > 0 && { studentYear: bulkEditData.studentYear }),
          ...(bulkEditData.credits > 0 && { credits: bulkEditData.credits }),
        };
      }).filter(Boolean);

      if (updates.length === 0) {
        setError("No changes to apply");
        setFormLoading(false);
        return;
      }

      const response = await courseApi.bulkUpdateCourses(updates as any);

      if (response.success) {
        await fetchCourses();
        setShowBulkEditModal(false);
        setSelectedCourses([]);
      }
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || "Failed to bulk update courses");
    } finally {
      setFormLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCourses.length === 0) {
      setError("Please select at least one course to delete");
      return;
    }
    
    if (!confirm(`Are you sure you want to delete ${selectedCourses.length} course(s)?`)) return;

    try {
      await Promise.all(selectedCourses.map((id) => courseApi.deleteCourse(id)));
      setCourses((prev) => prev.filter((c) => !selectedCourses.includes(c._id!)));
      setSelectedCourses([]);
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || "Failed to delete courses");
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

          {/* Bulk Actions */}
          {selectedCourses.length > 0 && (
            <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center justify-between">
              <span className="text-indigo-700 font-medium">
                {selectedCourses.length} course(s) selected
              </span>
              <div className="flex gap-3">
                <button
                  onClick={handleBulkEdit}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  Bulk Edit
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  Bulk Delete
                </button>
                <button
                  onClick={() => setSelectedCourses([])}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Courses Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedCourses.length === courses.length && courses.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                    </th>
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
                        colSpan={9}
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        No courses found. Click "Add New Course" to get started.
                      </td>
                    </tr>
                  ) : (
                    courses.map((course) => (
                      <tr
                        key={course._id}
                        className={`hover:bg-gray-50 transition ${selectedCourses.includes(course._id!) ? "bg-indigo-50" : ""}`}
                      >
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedCourses.includes(course._id!)}
                            onChange={() => handleSelectCourse(course._id!)}
                            className="w-4 h-4 rounded border-gray-300"
                          />
                        </td>
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
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(course)}
                              className="text-indigo-600 hover:text-indigo-800 transition"
                            >
                              Edit
                            </button>
                            <span className="text-gray-300">|</span>
                            <button
                              onClick={() => handleDelete(course._id!)}
                              className="text-red-600 hover:text-red-800 transition"
                            >
                              Delete
                            </button>
                          </div>
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

      {/* Edit Course Modal */}
      {showEditModal && editingCourse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">
                  Edit Course
                </h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingCourse(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                >
                  ×
                </button>
              </div>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {/* Course Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="courseName"
                  value={editFormData.courseName}
                  onChange={handleEditInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                  value={editFormData.courseCode}
                  onChange={handleEditInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Major */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Major <span className="text-red-500">*</span>
                </label>
                <select
                  name="major"
                  value={editFormData.major}
                  onChange={handleEditInputChange}
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
                    value={editFormData.studentYear}
                    onChange={handleEditInputChange}
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
                    value={editFormData.creditHours}
                    onChange={handleEditInputChange}
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
                  value={editFormData.instructorName}
                  onChange={handleEditInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Prerequisite */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prerequisite Course
                </label>
                <select
                  name="prerequisite"
                  value={editFormData.prerequisite}
                  onChange={handleEditInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">None</option>
                  {courses
                    .filter((c) => c._id !== editingCourse._id)
                    .map((course) => (
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
                    setShowEditModal(false);
                    setEditingCourse(null);
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
                  {formLoading ? "Updating..." : "Update Course"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Edit Modal */}
      {showBulkEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">
                  Bulk Edit ({selectedCourses.length} courses)
                </h2>
                <button
                  onClick={() => setShowBulkEditModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                >
                  ×
                </button>
              </div>
            </div>

            <form onSubmit={handleBulkEditSubmit} className="p-6 space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                Only fill the fields you want to update. Leave empty to keep current values.
              </p>

              {/* Major */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Major
                </label>
                <select
                  value={bulkEditData.major}
                  onChange={(e) =>
                    setBulkEditData((prev) => ({ ...prev, major: e.target.value }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Keep Current</option>
                  {MAJORS.map((major) => (
                    <option key={major} value={major}>
                      {major}
                    </option>
                  ))}
                </select>
              </div>

              {/* Student Year */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Student Year
                </label>
                <select
                  value={bulkEditData.studentYear}
                  onChange={(e) =>
                    setBulkEditData((prev) => ({
                      ...prev,
                      studentYear: parseInt(e.target.value),
                    }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="0">Keep Current</option>
                  {STUDENT_YEARS.map((year) => (
                    <option key={year} value={year}>
                      Year {year}
                    </option>
                  ))}
                </select>
              </div>

              {/* Credit Hours */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Credit Hours
                </label>
                <input
                  type="number"
                  value={bulkEditData.credits || ""}
                  onChange={(e) =>
                    setBulkEditData((prev) => ({
                      ...prev,
                      credits: parseInt(e.target.value) || 0,
                    }))
                  }
                  min="1"
                  max="6"
                  placeholder="Keep Current"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowBulkEditModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {formLoading ? "Updating..." : "Update Selected"}
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
