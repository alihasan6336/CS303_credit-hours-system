import React, { useEffect, useState } from "react";
import { courseApi } from "../../utils/api";
import { alertSuccess, alertError, confirmDelete } from "../../utils/alerts";
import type { Course, CourseFormData } from "../../types/course";
import { MAJORS, STUDENT_YEARS, DAYS, COURSE_TYPES } from "../../types/course";
import AdminSidebar from "../../components/admin/AdminSidebar";
import { getStoredAdminUser } from "../../utils/adminAccess";

const ManageCourses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(
    new Set(),
  );

  const user = getStoredAdminUser();
  const canEditCourses =
    user.role === "superadmin" ||
    (user.adminType || "").toLowerCase() === "courses_admin";

  const [formData, setFormData] = useState<CourseFormData>({
    courseName: "",
    courseCode: "",
    major: "",
    studentYear: 1,
    day: "Sunday",
    time: "09:00 - 10:30",
    room: "",
    creditHours: 3,
    instructorName: "",
    group: "A",
    courseType: "Lecture",
    capacity: 30,
    prerequisite: "",
  });

  const [bulkEditData, setBulkEditData] = useState({
    day: "Sunday",
    time: "09:00 - 10:30",
    room: "",
    instructorName: "",
    major: "",
    capacity: "",
    courseType: "",
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
            studentYear: course.level || 1,
            day: course.day,
            time: course.time,
            room: course.room || "",
            creditHours: course.credits,
            instructorName: course.instructor,
            group: course.group || "A",
            courseType: course.type || "Lecture",
            capacity: course.capacity || 30,
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
        name === "studentYear" || name === "creditHours" || name === "capacity"
          ? parseInt(value)
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError("");

    try {
      if (editingCourse) {
        // Update existing course
        const response = await courseApi.updateCourse(editingCourse._id!, {
          code: formData.courseCode,
          name: formData.courseName,
          day: formData.day,
          time: formData.time,
          room: formData.room || "TBA",
          credits: formData.creditHours,
          instructor: formData.instructorName,
          group: formData.group,
          type: formData.courseType,
          capacity: formData.capacity,
          major: formData.major || undefined,
          level: formData.studentYear || undefined,
          prerequisites: formData.prerequisite
            ? formData.prerequisite.split(",").map((p) => p.trim())
            : [],
        });

        if (response.success) {
          alertSuccess("Course updated successfully");
          await fetchCourses();
          setShowEditModal(false);
          setEditingCourse(null);
          resetForm();
        }
      } else {
        // Create new course
        const response = await courseApi.createCourse({
          code: formData.courseCode,
          name: formData.courseName,
          day: formData.day,
          time: formData.time,
          room: formData.room || "TBA",
          credits: formData.creditHours,
          instructor: formData.instructorName,
          group: formData.group,
          type: formData.courseType,
          capacity: formData.capacity,
          major: formData.major || undefined,
          level: formData.studentYear || undefined,
          prerequisites: formData.prerequisite
            ? formData.prerequisite.split(",").map((p) => p.trim())
            : [],
        });

        if (response.success) {
          alertSuccess("Course created successfully");
          await fetchCourses();
          setShowModal(false);
          resetForm();
        }
      }
    } catch (err: unknown) {
      const error = err as Error;
      alertError(error.message || "Failed to save course");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (courseId: string, courseName?: string) => {
    const confirmed = await confirmDelete(courseName || "this course");
    if (!confirmed) return;

    try {
      await courseApi.deleteCourse(courseId);
      alertSuccess("Course deleted successfully");
      await fetchCourses();
    } catch (err: unknown) {
      const error = err as Error;
      alertError(error.message || "Failed to delete course");
    }
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      courseName: course.courseName,
      courseCode: course.courseCode,
      major: course.major || "",
      studentYear: course.studentYear || 1,
      day: course.day,
      time: course.time,
      room: course.room || "",
      creditHours: course.creditHours,
      instructorName: course.instructorName || "",
      group: course.group || "A",
      courseType: course.courseType || "Lecture",
      capacity: course.capacity || 30,
      prerequisite: course.prerequisite || "",
    });
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingCourse(null);
    resetForm();
  };

  const handleBulkEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCourses.size === 0) {
      setError("Please select at least one course");
      return;
    }

    setFormLoading(true);
    setError("");

    try {
      const coursesToUpdate = filteredCourses
        .filter((c) => selectedCourses.has(c._id!))
        .map((c) => {
          const update: any = { _id: c._id! };
          if (bulkEditData.day) update.day = bulkEditData.day;
          if (bulkEditData.time) update.time = bulkEditData.time;
          if (bulkEditData.room) update.room = bulkEditData.room;
          if (bulkEditData.instructorName)
            update.instructor = bulkEditData.instructorName;
          if (bulkEditData.major) update.major = bulkEditData.major;
          if (bulkEditData.capacity)
            update.capacity = parseInt(bulkEditData.capacity);
          if (bulkEditData.courseType) update.type = bulkEditData.courseType;
          return update;
        });

      const response = await courseApi.bulkUpdate(coursesToUpdate);

      if (response.success) {
        alertSuccess("Courses updated successfully");
        await fetchCourses();
        setShowBulkEditModal(false);
        setSelectedCourses(new Set());
        setBulkEditData({
          day: "Sunday",
          time: "09:00 - 10:30",
          room: "",
          instructorName: "",
          major: "",
          capacity: "",
          courseType: "",
        });
      }
    } catch (err: unknown) {
      const error = err as Error;
      alertError(error.message || "Failed to bulk update courses");
    } finally {
      setFormLoading(false);
    }
  };

  const toggleSelectCourse = (courseId: string) => {
    const newSelected = new Set(selectedCourses);
    if (newSelected.has(courseId)) {
      newSelected.delete(courseId);
    } else {
      newSelected.add(courseId);
    }
    setSelectedCourses(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedCourses.size === filteredCourses.length) {
      setSelectedCourses(new Set());
    } else {
      setSelectedCourses(new Set(filteredCourses.map((c) => c._id!)));
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
      room: "",
      creditHours: 3,
      instructorName: "",
      group: "A",
      courseType: "Lecture",
      capacity: 30,
      prerequisite: "",
    });
  };

  const filteredCourses = courses.filter((course) => {
    const query = searchQuery.toLowerCase();
    return (
      course.courseCode.toLowerCase().includes(query) ||
      course.courseName.toLowerCase().includes(query) ||
      course.major.toLowerCase().includes(query) ||
      (course.instructorName &&
        course.instructorName.toLowerCase().includes(query))
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
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(true)}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
              >
                <span className="text-xl">+</span> Add New Course
              </button>
              {canEditCourses && selectedCourses.size > 0 && (
                <button
                  onClick={() => setShowBulkEditModal(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                >
                  <span className="text-xl">✎</span> Bulk Edit (
                  {selectedCourses.size})
                </button>
              )}
            </div>
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
                    {canEditCourses && (
                      <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider w-16">
                        <div
                          onClick={toggleSelectAll}
                          className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all cursor-pointer shadow-sm
                            ${
                              selectedCourses.size > 0 &&
                              selectedCourses.size === filteredCourses.length
                                ? "bg-white border-white scale-110"
                                : "bg-indigo-700/50 border-indigo-400/50 hover:bg-indigo-500/50 hover:border-indigo-300"
                            }`}
                        >
                          {selectedCourses.size > 0 &&
                            selectedCourses.size === filteredCourses.length && (
                              <svg
                                className="w-3.5 h-3.5 text-indigo-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={3}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                        </div>
                      </th>
                    )}
                    {canEditCourses && (
                      <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                        Edit
                      </th>
                    )}
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                      Delete
                    </th>
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
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                      Capacity
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                      Day
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                      Room
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredCourses.length === 0 ? (
                    <tr>
                      <td
                        colSpan={canEditCourses ? 15 : 13}
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
                        {canEditCourses && (
                          <td className="px-6 py-4">
                            <div
                              onClick={() => toggleSelectCourse(course._id!)}
                              className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all cursor-pointer
                                ${
                                  selectedCourses.has(course._id!)
                                    ? "bg-indigo-600 border-indigo-600 scale-110 shadow-md shadow-indigo-200"
                                    : "bg-white border-gray-300 hover:border-indigo-400 hover:bg-indigo-50"
                                }`}
                            >
                              {selectedCourses.has(course._id!) && (
                                <svg
                                  className="w-3.5 h-3.5 text-white"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={3}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              )}
                            </div>
                          </td>
                        )}
                        {canEditCourses && (
                          <td className="px-6 py-4 text-sm">
                            <button
                              onClick={() => handleEditCourse(course)}
                              className="w-8 h-8 flex items-center justify-center bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg transition-all shadow-sm group"
                              title="Edit course"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                />
                              </svg>
                            </button>
                          </td>
                        )}
                        <td className="px-6 py-4 text-sm">
                          <button
                            onClick={() => handleDelete(course._id!, course.courseName)}
                            className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-all shadow-sm group"
                            title="Delete course"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
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
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${course.courseType === "Lab" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}
                          >
                            {course.courseType}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {course.capacity || 30}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {course.day}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {course.time}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {course.room || "-"}
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
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Add/Edit Course Modal */}
      {(showModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingCourse ? "Edit Course" : "Add New Course"}
                </h2>
                <button
                  onClick={() => {
                    if (editingCourse) {
                      handleCloseEditModal();
                    } else {
                      setShowModal(false);
                      resetForm();
                    }
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

              {/* Course Type and Capacity */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="courseType"
                    value={formData.courseType}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    {COURSE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Capacity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    required
                    min="1"
                    max="500"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Day, Time, and Room */}
              <div className="grid grid-cols-3 gap-4">
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Room
                  </label>
                  <input
                    type="text"
                    name="room"
                    value={formData.room}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., B-101"
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
                    if (editingCourse) {
                      handleCloseEditModal();
                    } else {
                      setShowModal(false);
                      resetForm();
                    }
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
                  {formLoading
                    ? editingCourse
                      ? "Updating..."
                      : "Adding..."
                    : editingCourse
                      ? "Update Course"
                      : "Add Course"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Edit Modal */}
      {showBulkEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">
                  Bulk Edit Courses ({selectedCourses.size} selected)
                </h2>
                <button
                  onClick={() => {
                    setShowBulkEditModal(false);
                    setSelectedCourses(new Set());
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                >
                  ×
                </button>
              </div>
            </div>

            <form onSubmit={handleBulkEdit} className="p-6 space-y-4">
              <p className="text-sm text-gray-500">
                Leave a field empty to keep the current value unchanged.
              </p>

              {/* Major */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Major
                </label>
                <select
                  value={bulkEditData.major}
                  onChange={(e) =>
                    setBulkEditData({ ...bulkEditData, major: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">— Keep current —</option>
                  {MAJORS.map((major) => (
                    <option key={major} value={major}>
                      {major}
                    </option>
                  ))}
                </select>
              </div>

              {/* Course Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Type (Lecture / Lab)
                </label>
                <select
                  value={bulkEditData.courseType}
                  onChange={(e) =>
                    setBulkEditData({
                      ...bulkEditData,
                      courseType: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">— Keep current —</option>
                  {COURSE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Capacity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Capacity
                </label>
                <input
                  type="number"
                  value={bulkEditData.capacity}
                  onChange={(e) =>
                    setBulkEditData({
                      ...bulkEditData,
                      capacity: e.target.value,
                    })
                  }
                  min="1"
                  max="500"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Leave empty to keep current"
                />
              </div>

              {/* Day */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Day
                </label>
                <select
                  value={bulkEditData.day}
                  onChange={(e) =>
                    setBulkEditData({ ...bulkEditData, day: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  {DAYS.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>

              {/* Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Slot
                </label>
                <input
                  type="text"
                  value={bulkEditData.time}
                  onChange={(e) =>
                    setBulkEditData({ ...bulkEditData, time: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g., 09:00 - 10:30"
                />
              </div>

              {/* Room */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Room
                </label>
                <input
                  type="text"
                  value={bulkEditData.room}
                  onChange={(e) =>
                    setBulkEditData({ ...bulkEditData, room: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Leave empty to keep current"
                />
              </div>

              {/* Instructor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instructor Name
                </label>
                <input
                  type="text"
                  value={bulkEditData.instructorName}
                  onChange={(e) =>
                    setBulkEditData({
                      ...bulkEditData,
                      instructorName: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Leave empty to keep current"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowBulkEditModal(false);
                    setSelectedCourses(new Set());
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {formLoading
                    ? "Updating..."
                    : `Update ${selectedCourses.size} Courses`}
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
