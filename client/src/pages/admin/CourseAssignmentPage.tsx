import React, { useEffect, useState } from "react";
import { courseAssignmentApi } from "../../utils/api";
import AdminSidebar from "../../components/admin/AdminSidebar";

interface Course {
  _id: string;
  code: string;
  name: string;
  credits: number;
  day?: string;
  time?: string;
  room?: string;
  instructor?: string;
  capacity?: number;
  enrolledCount?: number;
}

interface Assignment {
  _id: string;
  course: Course;
  level: number;
  semester: string;
  academicYear: string;
  isActive: boolean;
}

const CourseAssignmentPage: React.FC = () => {
  const [byLevel, setByLevel] = useState<Record<string, Assignment[]>>({
    "1": [],
    "2": [],
    "3": [],
    "4": [],
  });
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    semester: "Fall",
    academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
  });

  const [showModal, setShowModal] = useState(false);
  const [modalLevel, setModalLevel] = useState<number>(1);
  const [formLoading, setFormLoading] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState("");

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [byLevelRes, coursesRes] = await Promise.all([
        courseAssignmentApi.getAssignmentsByLevel(filters),
        courseAssignmentApi.getAvailableCourses(filters),
      ]);

      if (byLevelRes.success) {
        setByLevel(byLevelRes.byLevel);
      }
      if (coursesRes.success) {
        setAvailableCourses(coursesRes.courses);
      }
    } catch (err: any) {
      console.warn("Failed to load data:", err.message);
      // Continue with current data
    } finally {
      setLoading(false);
    }
  };

  const openAssignModal = (level: number) => {
    setModalLevel(level);
    setSelectedCourseId("");
    setShowModal(true);
  };

  const handleAssignCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) {
      setError("Please select a course");
      return;
    }

    setFormLoading(true);
    setError("");

    try {
      await courseAssignmentApi.assignCourse({
        courseId: selectedCourseId,
        level: modalLevel,
        semester: filters.semester,
        academicYear: filters.academicYear,
      });

      setShowModal(false);
      fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to assign course");
    } finally {
      setFormLoading(false);
    }
  };

  const handleRemoveAssignment = async (
    assignmentId: string,
    courseName: string,
  ) => {
    if (!window.confirm(`Remove ${courseName} from this level?`)) {
      return;
    }

    try {
      await courseAssignmentApi.removeAssignment(assignmentId);
      fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to remove assignment");
    }
  };

  const semesters = ["Fall", "Spring", "Summer"];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-lg">Loading course assignments...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />

      {/* Main Content */}
      <main className="flex-1 p-8">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Course Assignments
            </h1>
            <p className="text-gray-500 mt-1">
              Assign courses to academic levels
            </p>
          </div>
        </header>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Semester
              </label>
              <select
                value={filters.semester}
                onChange={(e) =>
                  setFilters({ ...filters, semester: e.target.value })
                }
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {semesters.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Academic Year
              </label>
              <input
                type="text"
                value={filters.academicYear}
                onChange={(e) =>
                  setFilters({ ...filters, academicYear: e.target.value })
                }
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="2024-2025"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        {/* Level Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className="bg-white rounded-xl shadow-sm overflow-hidden"
            >
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Level {level}
                  </h2>
                  <p className="text-indigo-200 text-sm">
                    {byLevel[level]?.length || 0} courses assigned
                  </p>
                </div>
                <button
                  onClick={() => openAssignModal(level)}
                  className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm transition-colors"
                >
                  + Assign Course
                </button>
              </div>

              <div className="p-4">
                {byLevel[level]?.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No courses assigned to this level
                  </p>
                ) : (
                  <div className="space-y-3">
                    {byLevel[level]?.map((assignment) => (
                      <div
                        key={assignment._id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-indigo-600 font-semibold">
                              {assignment.course.code}
                            </span>
                            <span className="text-gray-700">
                              {assignment.course.name}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {assignment.course.day} • {assignment.course.time} •
                            Room {assignment.course.room}
                          </div>
                          <div className="text-sm text-gray-500">
                            {assignment.course.instructor} •{" "}
                            {assignment.course.credits} credits
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            handleRemoveAssignment(
                              assignment._id,
                              assignment.course.name,
                            )
                          }
                          className="text-red-600 hover:text-red-800 text-sm ml-4"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Assign Course Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Assign Course to Level {modalLevel}
            </h2>

            <form onSubmit={handleAssignCourse} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Course
                </label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">-- Select a course --</option>
                  {availableCourses.map((course) => (
                    <option key={course._id} value={course._id}>
                      {course.code} - {course.name} ({course.credits} cr)
                    </option>
                  ))}
                </select>
                {availableCourses.length === 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    No courses available. All courses are already assigned to
                    this level/semester.
                  </p>
                )}
              </div>

              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                <p>
                  <strong>Semester:</strong> {filters.semester}
                </p>
                <p>
                  <strong>Academic Year:</strong> {filters.academicYear}
                </p>
                <p>
                  <strong>Level:</strong> {modalLevel}
                </p>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading || !selectedCourseId}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {formLoading ? "Assigning..." : "Assign Course"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseAssignmentPage;
