import React, { useState, useEffect } from "react";
import { adminApi, courseApi } from "../../utils/api";
import { getStoredAdminUser } from "../../utils/adminAccess";

interface EnrollmentData {
  _id: string;
  course: { _id: string; code: string; name: string; credits: number };
  semester: string;
  grade?: number;
  status?: string;
  enrolledAt: string;
}

interface CourseData {
  _id: string;
  code: string;
  name: string;
  credits: number;
}

interface StudentEnrollmentModalProps {
  studentId: string;
  studentName: string;
  isOpen: boolean;
  onClose: () => void;
}

const StudentEnrollmentModal: React.FC<StudentEnrollmentModalProps> = ({
  studentId,
  studentName,
  isOpen,
  onClose,
}) => {
  const [enrollments, setEnrollments] = useState<EnrollmentData[]>([]);
  const [availableCourses, setAvailableCourses] = useState<CourseData[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Edit Mode state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editGrade, setEditGrade] = useState<string>("");

  const [activeTab, setActiveTab] = useState<"enrollment" | "course-details">("enrollment");

  const adminUser = getStoredAdminUser();
  const role = (adminUser?.role || "").toLowerCase();
  const canEditGrade = role === "superadmin" || role === "enrollment_admin";

  useEffect(() => {
    if (isOpen && studentId) {
      fetchData();
      setActiveTab("enrollment");
      setEditingId(null);
    }
  }, [isOpen, studentId]);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const enrollRes = await adminApi.getEnrollments();
      if (enrollRes.success) {
        const studentEnrollments = enrollRes.enrollments.filter(
          (e: any) => e.student._id === studentId || e.student === studentId
        );
        setEnrollments(studentEnrollments as any);
      }

      const coursesRes = await courseApi.getAllCourses();
      if (coursesRes.success) {
        setAvailableCourses(coursesRes.courses);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) return;

    setLoading(true);
    try {
      await adminApi.enrollStudent(studentId, selectedCourseId);
      setSelectedCourseId("");
      await fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to enroll student");
      setLoading(false);
    }
  };

  const handleDrop = async (enrollmentId: string, courseName: string) => {
    if (!window.confirm(`Are you sure you want to drop ${courseName}?`)) return;

    setLoading(true);
    try {
      await adminApi.unenrollStudent(enrollmentId);
      await fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to drop course");
      setLoading(false);
    }
  };

  const handleEditClick = (enrollment: EnrollmentData) => {
    setEditingId(enrollment._id);
    setEditGrade(enrollment.grade !== undefined && enrollment.grade !== null ? String(enrollment.grade) : "");
  };

  const handleSaveGrade = async (enrollmentId: string) => {
    const numGrade = Number(editGrade);
    if (isNaN(numGrade) || numGrade < 0 || numGrade > 100) {
      setError("Please enter a valid grade between 0 and 100.");
      return;
    }

    setLoading(true);
    try {
      await adminApi.updateEnrollmentGrade(enrollmentId, numGrade);
      setEditingId(null);
      await fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to update grade");
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl mx-auto flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-white rounded-t-xl shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Manage Enrollments
            </h2>
            <p className="text-sm text-gray-500 mt-1">Student: {studentName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {canEditGrade && (
          <div className="flex border-b border-gray-200 px-6 bg-gray-50 shrink-0">
            <button
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === "enrollment"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("enrollment")}
            >
              Enrollments
            </button>
            <button
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === "course-details"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("course-details")}
            >
              Edit Course Details (Grades)
            </button>
          </div>
        )}

        <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          {activeTab === "enrollment" ? (
            <>
              {/* Add New Course */}
              <div className="mb-8 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Enroll in Course</h3>
                <form onSubmit={handleEnroll} className="flex gap-3">
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    disabled={loading}
                  >
                    <option value="">-- Select a course to enroll --</option>
                    {availableCourses
                      .filter((c) => !enrollments.find((e) => e.course._id === c._id))
                      .map((course) => (
                        <option key={course._id} value={course._id}>
                          {course.code} - {course.name} ({course.credits} cr)
                        </option>
                      ))}
                  </select>
                  <button
                    type="submit"
                    disabled={!selectedCourseId || loading}
                    className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
                  >
                    Enroll
                  </button>
                </form>
              </div>

              {/* Current Enrollments */}
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Current Enrollments</h3>
              {loading && enrollments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Loading...</div>
              ) : enrollments.length === 0 ? (
                <div className="text-center py-8 bg-white rounded-xl border border-gray-200 text-gray-500 shadow-sm">
                  No current enrollments for this student.
                </div>
              ) : (
                <div className="overflow-hidden border border-gray-200 rounded-xl bg-white shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-100/50 border-b border-gray-200">
                        <th className="px-5 py-4 text-sm font-semibold text-gray-700">Course</th>
                        <th className="px-5 py-4 text-sm font-semibold text-gray-700">Semester</th>
                        <th className="px-5 py-4 text-sm font-semibold text-gray-700 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {enrollments.map((enrollment) => (
                        <tr key={enrollment._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-4">
                            <div className="font-semibold text-indigo-700">{enrollment.course.code}</div>
                            <div className="text-sm text-gray-600 mt-0.5">{enrollment.course.name}</div>
                          </td>
                          <td className="px-5 py-4 text-sm font-medium text-gray-600">
                            {enrollment.semester}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button
                              onClick={() => handleDrop(enrollment._id, enrollment.course.name)}
                              disabled={loading}
                              className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                            >
                              Drop
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Course Details / Grade Edit Tab */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Edit Enrollments & Grades</h3>
              </div>
              
              {loading && enrollments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Loading...</div>
              ) : enrollments.length === 0 ? (
                <div className="text-center py-8 bg-white rounded-xl border border-gray-200 text-gray-500 shadow-sm">
                  No current enrollments for this student.
                </div>
              ) : (
                <div className="overflow-hidden border border-gray-200 rounded-xl bg-white shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-100/50 border-b border-gray-200">
                        <th className="px-5 py-4 text-sm font-semibold text-gray-700">Course</th>
                        <th className="px-5 py-4 text-sm font-semibold text-gray-700">Semester</th>
                        <th className="px-5 py-4 text-sm font-semibold text-gray-700">Status</th>
                        <th className="px-5 py-4 text-sm font-semibold text-gray-700">Grade / Score</th>
                        <th className="px-5 py-4 text-sm font-semibold text-gray-700 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {enrollments.map((enrollment) => {
                        const isEditing = editingId === enrollment._id;
                        const numericGrade = enrollment.grade !== undefined ? Number(enrollment.grade) : null;
                        let passFailLabel = "N/A";
                        let statusColor = "text-gray-500 bg-gray-100";
                        
                        if (numericGrade !== null) {
                          if (numericGrade >= 60) { // 60 is the passing grade
                            passFailLabel = "Passed";
                            statusColor = "text-green-700 bg-green-100";
                          } else {
                            passFailLabel = "Failed";
                            statusColor = "text-red-700 bg-red-100";
                          }
                        }

                        return (
                          <tr key={enrollment._id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-5 py-4">
                              <div className="font-semibold text-indigo-700">{enrollment.course.code}</div>
                              <div className="text-sm text-gray-600 mt-0.5">{enrollment.course.name}</div>
                            </td>
                            <td className="px-5 py-4 text-sm font-medium text-gray-600">
                              {enrollment.semester}
                            </td>
                            <td className="px-5 py-4">
                               <span className={`px-2.5 py-1 text-xs font-semibold rounded-md ${statusColor}`}>
                                 {enrollment.status === 'completed' ? passFailLabel : (enrollment.status || 'Active')}
                               </span>
                            </td>
                            <td className="px-5 py-4">
                              {isEditing ? (
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  className="w-24 px-3 py-1.5 border border-indigo-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                                  value={editGrade}
                                  onChange={(e) => setEditGrade(e.target.value)}
                                  placeholder="e.g. 85"
                                />
                              ) : (
                                <div className="font-semibold text-gray-800">
                                  {enrollment.grade !== undefined && enrollment.grade !== null 
                                    ? <span className="text-lg">{enrollment.grade} <span className="text-xs text-gray-400 font-normal">/ 100</span></span>
                                    : <span className="text-sm text-gray-400 italic">Not graded</span>}
                                </div>
                              )}
                            </td>
                            <td className="px-5 py-4 text-right">
                              {isEditing ? (
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => handleSaveGrade(enrollment._id)}
                                    disabled={loading}
                                    className="px-3 py-1.5 bg-green-600 text-white rounded-md text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 shadow-sm"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingId(null)}
                                    disabled={loading}
                                    className="px-3 py-1.5 border border-gray-300 text-gray-700 bg-white rounded-md text-sm font-semibold hover:bg-gray-50 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleEditClick(enrollment)}
                                  disabled={loading}
                                  className="px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-800 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                                >
                                  Edit Grade
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentEnrollmentModal;
