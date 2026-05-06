import React, { useEffect, useState } from "react";
import { courseApi } from "../../utils/api";
import type { Course, CourseFormData } from "../../types/course";
import { MAJORS, STUDENT_YEARS, DAYS } from "../../types/course";
import AdminSidebar from "../../components/admin/AdminSidebar";

const ManageCourses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState<CourseFormData>({
    courseName: "",
    courseCode: "",
    major: "",
    studentYear: 1,
    day: "Sunday",
    time: "09:00 - 10:30",
    creditHours: 3,
    instructorName: "",
    group: "A",
    prerequisite: "",
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const response = await courseApi.getAllCourses();
      if (response.success) {
        setCourses(
          response.courses.map((course) => ({
            _id: course._id,
            courseName: course.name,
            courseCode: course.code,
            major: course.major || "",
            studentYear: course.studentYear || 1,
            day: course.day,
            time: course.time,
            creditHours: course.credits,
            instructorName: course.instructor,
            group: course.group || "A",
            prerequisite: course.prerequisites?.join(", ") || "",
          })),
        );
      }
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || "Failed to load courses");
    } finally {
      setLoading(false);
    }
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
      const response = await courseApi.createCourse({
        code: formData.courseCode,
        name: formData.courseName,
        day: formData.day,
        time: formData.time,
        room: "TBA",
        credits: formData.creditHours,
        instructor: formData.instructorName,
        group: formData.group,
        capacity: 30,
        major: formData.major || undefined,
        studentYear: formData.studentYear || undefined,
        prerequisites: formData.prerequisite
          ? formData.prerequisite.split(",").map((p) => p.trim())
          : [],
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

  const handleDelete = async (courseId: string) => {
    if (!confirm("Are you sure you want to delete this course?")) return;

    try {
      await courseApi.deleteCourse(courseId);
      await fetchCourses();
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
      day: "Sunday",
      time: "09:00 - 10:30",
      creditHours: 3,
      instructorName: "",
      group: "A",
      prerequisite: "",
    });
  };

  const filteredCourses = courses.filter((course) => {
    const query = searchQuery.toLowerCase();
    return (
      course.courseCode.toLowerCase().includes(query) ||
      course.courseName.toLowerCase().includes(query) ||
      course.major.toLowerCase().includes(query) ||
      (course.instructorName && course.instructorName.toLowerCase().includes(query))
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-lg">Loading courses...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <AdminSidebar />

      {/* Main Content */}
      <main className="flex-1 p-8 flex flex-col min-w-0 min-h-0">
        <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col min-h-0">
          {/* Header */}
          <div className="flex justify-between items-center mb-8 shrink-0">
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
          
          <div className="mb-6 shrink-0">
            <input
              type="text"
              placeholder="Search by course code, name, major or instructor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 shrink-0">
              {error}
            </div>
          )}

          {/* Courses Table */}
          <div className="bg-white rounded-lg shadow-sm flex-1 flex flex-col min-h-0 border border-gray-200 overflow-hidden">
            <div className="overflow-auto flex-1">
              <table className="w-full relative">
                <thead className="bg-indigo-600 border-b border-indigo-700 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                      Course Code
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                      Course Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                      Major
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                      Year
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                      Credits
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                      Day
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                      Instructor
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                      Group
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                      Prerequisite
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredCourses.length === 0 ? (
                    <tr>
                      <td
                        colSpan={11}
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        No courses found. Click "Add New Course" to get started.
                      </td>
                    </tr>
                  ) : (
                    filteredCourses.map((course) => (
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
                          {course.day}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {course.time}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {course.instructorName || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {course.group || "A"}
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

              {/* Day and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Day <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="day"
                    value={formData.day}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    {DAYS.map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time Slot <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="time"
                    value={formData.time}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., 09:00 - 10:30"
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

              {/* Group */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Section / Group
                </label>
                <input
                  type="text"
                  name="group"
                  value={formData.group}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g., A, B, Morning, Evening"
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
