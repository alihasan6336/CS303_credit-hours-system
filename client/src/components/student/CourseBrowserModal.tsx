import React, { useEffect, useState } from "react";
import { courseAssignmentApi } from "../../utils/api";

interface CourseAssignmentData {
  _id: string;
  course: {
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
    prerequisites?: string[];
  };
  level: number;
  semester: string;
  academicYear: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  enrolledCourses: { code: string; day: string; time: string }[];
  completedCourseCodes: string[];
  studentLevel: number;
  totalCurrentCredits: number;
  onEnroll: (course: any) => void;
}

const CourseBrowserModal: React.FC<Props> = ({
  isOpen,
  onClose,
  enrolledCourses,
  completedCourseCodes,
  studentLevel,
  totalCurrentCredits,
  onEnroll,
}) => {
  const [assignments, setAssignments] = useState<CourseAssignmentData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAvailableAssignments();
    }
  }, [isOpen]);

  const fetchAvailableAssignments = async () => {
    setLoading(true);
    try {
      const response = await courseAssignmentApi.getAssignmentsByLevel();
      if (response.success) {
        // Flat list of all assignments for simplicity in UI
        const all = Object.values(response.byLevel).flat();
        setAssignments(all);
      }
    } catch (error) {
      console.error("Failed to fetch available courses:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const checkScheduleConflict = (course: any) => {
    return enrolledCourses.some(
      (enrolled) => enrolled.day === course.day && enrolled.time === course.time
    );
  };

  const getMissingPrerequisites = (course: any) => {
    const prereqs = course.prerequisites || [];
    return prereqs.filter((pre: string) => !completedCourseCodes.includes(pre));
  };

  const isEligibleForLevel = (asg: CourseAssignmentData) => {
    const course = asg.course;
    // Rule:
    // 1. Course is student's level or below
    // 2. OR Student has completed all prerequisites
    if (asg.level <= studentLevel) return true;
    const prereqs = course.prerequisites || [];
    if (prereqs.length === 0) return true;
    if (getMissingPrerequisites(course).length === 0) return true;
    
    return false;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-lg w-11/12 max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Available Courses</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 font-bold text-xl"
          >
            &times;
          </button>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <p className="text-gray-500 font-bold">Loading courses...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                  <tr className="text-left py-2 border-b">
                  <th className="pb-3 text-gray-600 font-bold text-base">Code</th>
                  <th className="pb-3 text-gray-600 font-bold text-base">Course Name</th>
                  <th className="pb-3 text-gray-600 font-bold text-base">Instructor</th>
                  <th className="pb-3 text-gray-600 font-bold text-base">Credits</th>
                  <th className="pb-3 text-gray-600 font-bold text-base">Schedule</th>
                  <th className="pb-3 text-gray-600 font-bold text-base">Seats</th>
                  <th className="pb-3 text-left text-base text-gray-600 font-bold">Action</th>
                </tr>
              </thead>
              <tbody>
                {assignments
                  .filter(isEligibleForLevel)
                  .map((asg) => {
                  const course = {
                    ...asg.course,
                    _id: asg.course._id // Ensure ID is passed for enrollment
                  };
                  const hasConflict = checkScheduleConflict(course);
                  const missingPre = getMissingPrerequisites(course);
                  const isAlreadyEnrolled = enrolledCourses.some((c) => c.code === course.code);
                  
                  const isFull = course.enrolledCount >= course.capacity;
                  const wouldExceedLimit = totalCurrentCredits + course.credits > 19;
                  
                  const canEnroll = !hasConflict && missingPre.length === 0 && !isFull && !isAlreadyEnrolled && !wouldExceedLimit;

                  return (
                    <tr
                      key={course.code}
                      className={`border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors ${
                        hasConflict || (wouldExceedLimit && !isAlreadyEnrolled) ? "bg-red-50" : ""
                      }`}
                    >
                      <td className="py-4 font-mono font-bold text-indigo-600 text-base">
                        {course.code}
                      </td>
                      <td className="py-4 font-bold text-base">{course.name}</td>
                      <td className="py-4 text-gray-700 text-base">{course.instructor}</td>
                      <td className="py-4">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm font-bold">
                          {course.credits} cr
                        </span>
                      </td>
                      <td className="py-4 text-gray-700 text-base">
                        <div>
                          {course.day} {course.time}
                        </div>
                        <div className="text-sm text-gray-500 font-medium">{course.room}</div>
                      </td>
                      <td className="py-4">
                        <span
                          className={`text-base font-black ${
                            isFull ? "text-red-500" : "text-green-600"
                          }`}
                        >
                          {course.enrolledCount}/{course.capacity}
                        </span>
                      </td>
                      <td className="py-4 text-left">
                        <div className="flex flex-col items-start gap-1">
                          {isAlreadyEnrolled ? (
                            <span className="px-4 py-2 bg-green-100 text-green-700 rounded font-black text-sm border border-green-200">
                               Enrolled
                            </span>
                          ) : (
                            <button
                              disabled={!canEnroll}
                              onClick={() => onEnroll(course)}
                              className={`px-4 py-2 rounded font-black text-sm transition-colors ${
                                canEnroll
                                  ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md"
                                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
                              }`}
                            >
                              {isFull ? "Full" : wouldExceedLimit ? "Limit Reached" : "Enroll"}
                            </button>
                          )}
                          {missingPre.length > 0 && (
                            <span className="text-sm text-red-600 font-bold">
                              Missing: {missingPre.join(", ")}
                            </span>
                          )}
                          {hasConflict && (
                            <span className="text-sm text-red-600 font-bold">Schedule Conflict</span>
                          )}
                          {wouldExceedLimit && !isAlreadyEnrolled && (
                            <span className="text-xs text-red-600 font-bold">Exceeds 19hr Limit</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseBrowserModal;
