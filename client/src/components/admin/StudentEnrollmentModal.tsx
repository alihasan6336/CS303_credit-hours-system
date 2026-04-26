import React, { useState, useEffect } from "react";
import { adminApi, courseApi } from "../../utils/api";

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

  useEffect(() => {
    if (isOpen && studentId) {
      fetchData();
    }
  }, [isOpen, studentId]);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      // Get all enrollments
      const enrollRes = await adminApi.getEnrollments();
      
      // Filter for this specific student
      if (enrollRes.success) {
        const studentEnrollments = enrollRes.enrollments.filter(
          (e: any) => e.student._id === studentId || e.student === studentId
        );
        setEnrollments(studentEnrollments as any);
      }

      // Get available courses to add
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl mx-auto flex flex-col max-h-[90vh]">
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

        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Add New Course */}
          <div className="mb-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Enroll in Course</h3>
            <form onSubmit={handleEnroll} className="flex gap-3">
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
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
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200 text-gray-500">
              No current enrollments for this student.
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-sm font-semibold text-gray-600">Course</th>
                    <th className="px-4 py-3 text-sm font-semibold text-gray-600">Semester</th>
                    <th className="px-4 py-3 text-sm font-semibold text-gray-600">Grade</th>
                    <th className="px-4 py-3 text-sm font-semibold text-gray-600 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {enrollments.map((enrollment) => (
                    <tr key={enrollment._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-indigo-600">{enrollment.course.code}</div>
                        <div className="text-sm text-gray-600">{enrollment.course.name}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{enrollment.semester}</td>
                      <td className="px-4 py-3">
                        {enrollment.grade !== undefined && enrollment.grade !== null ? (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                            {enrollment.grade}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDrop(enrollment._id, enrollment.course.name)}
                          disabled={loading}
                          className="text-sm text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
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
        </div>
      </div>
    </div>
  );
};

export default StudentEnrollmentModal;
