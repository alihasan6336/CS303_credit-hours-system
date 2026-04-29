import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../../utils/api";
import StudentLayout from "../../layout/StudentLayout";
import { Sparkles } from "lucide-react";

interface Course {
  code: string;
  name: string;
  day: string;
  time: string;
  room: string;
  credits: number;
  instructor: string;
  group?: string;
}

interface StudentData {
  name: string;
  id: string;
  level: number;
  gpa: number;
  completedHours: number;
  major: string;
  semester: string;
  courses: Course[];
}

const emptyStudent: StudentData = {
  name: "",
  id: "",
  level: 0,
  gpa: 0,
  completedHours: 0,
  major: "",
  semester: "",
  courses: [],
};

const StudentDashboard: React.FC = () => {
  const [currentStudent, setCurrentStudent] =
    useState<StudentData>(emptyStudent);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("student") || "{}");

  const totalCredits = currentStudent.courses.reduce(
    (sum, c) => sum + c.credits,
    0,
  );
  const maxHours = 120;
  const progressPct = Math.round(
    (currentStudent.completedHours / maxHours) * 100,
  );

  useEffect(() => {
    let token = localStorage.getItem("authToken");
    const student = localStorage.getItem("student");

    if (!token || !student) {
      navigate("/login");
      return;
    }

    authApi
      .home()
      .then((response) => {
        if (!response.success || !response.student) return;

        const s = response.student;
        const courses: Course[] = response.courses || [];

        setCurrentStudent((prev) => ({
          ...prev,
          name: s.fullName,
          id: s.universityId,
          level: s.level,
          gpa: s.gpa,
          completedHours: s.completedCreditHours,
          major: s.major,
          semester: `${s.currentSemester} ${s.academicYear}`,
          courses,
        }));
      })
      .catch((error) => {
        console.warn("Failed to fetch home data:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [navigate]);

  if (loading) {
    return (
      <StudentLayout user={user}>
        <div className="flex items-center justify-center h-screen">
          <div className="text-lg">Loading dashboard...</div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout user={user}>
      <main className="flex-1 p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Student Dashboard
          </h1>
          <p className="text-gray-500 mt-1">
            {currentStudent.semester} {currentStudent.major ? `• ${currentStudent.major}` : ""}
          </p>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Enrolled Courses</p>
                <p className="text-3xl font-bold text-gray-800">
                  {currentStudent.courses.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
                📚
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Current Credits</p>
                <p className="text-3xl font-bold text-gray-800">
                  {totalCredits}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-2xl">
                ⚡
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">GPA</p>
                <p className="text-3xl font-bold text-gray-800">
                  {currentStudent.gpa.toFixed(2)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl">
                🏆
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Completed Hours</p>
                <p className="text-3xl font-bold text-gray-800">
                  {currentStudent.completedHours}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-2xl">
                ✅
              </div>
            </div>
          </div>
        </div>

        {/* Progress + Info Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Degree Progress */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Degree Progress
            </h3>
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">
                  {currentStudent.completedHours} / {maxHours} hours
                </span>
                <span className="text-sm font-semibold text-indigo-600">
                  {progressPct}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-indigo-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-4">
              <span>Year {currentStudent.level}</span>
              <span>
                {maxHours - currentStudent.completedHours} hrs remaining
              </span>
            </div>
          </div>

          {/* Student Info */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Student Information
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-3 border-b">
                <span className="text-sm text-gray-600">Student ID</span>
                <span className="font-mono text-sm font-medium text-gray-800">
                  {currentStudent.id}
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b">
                <span className="text-sm text-gray-600">Major</span>
                <span className="text-sm font-medium text-gray-800">
                  {currentStudent.major}
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b">
                <span className="text-sm text-gray-600">Level</span>
                <span className="text-sm font-medium text-gray-800">
                  Year {currentStudent.level}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Semester</span>
                <span className="text-sm font-medium text-gray-800">
                  {currentStudent.semester}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Registered Courses */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Registered Courses
            </h3>
            <div className="flex gap-3">
              <button 
                onClick={() => navigate("/ai-schedule")}
                className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-indigo-600 hover:to-purple-700 transition-all flex items-center gap-2 shadow-sm"
              >
                <Sparkles size={16} />
                AI Optimize
              </button>
              <button 
                onClick={() => navigate("/courses")}
                className="px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                + Add Course
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b">
                  <th className="pb-3">Code</th>
                  <th className="pb-3">Course Name</th>
                  <th className="pb-3">Instructor</th>
                  <th className="pb-3">Day</th>
                  <th className="pb-3">Time</th>
                  <th className="pb-3">Room</th>
                  <th className="pb-3">Group</th>
                  <th className="pb-3">Credits</th>
                </tr>
              </thead>
              <tbody>
                {currentStudent.courses.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-4 text-center text-gray-500">
                      No courses enrolled yet
                    </td>
                  </tr>
                ) : (
                  currentStudent.courses.map((course) => (
                    <tr
                      key={course.code}
                      className="border-b last:border-0 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 font-mono text-sm text-indigo-600">
                        {course.code}
                      </td>
                      <td className="py-3 text-sm font-medium text-gray-800">
                        {course.name}
                      </td>
                      <td className="py-3 text-sm text-gray-600">
                        {course.instructor}
                      </td>
                      <td className="py-3 text-sm">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                          {course.day}
                        </span>
                      </td>
                      <td className="py-3 text-sm text-gray-600">
                        {course.time}
                      </td>
                      <td className="py-3 text-sm text-gray-600">
                        {course.room}
                      </td>
                      <td className="py-3 text-sm">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                          {course.group || "A"}
                        </span>
                      </td>
                      <td className="py-3 text-sm">
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                          {course.credits} cr
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </StudentLayout>
  );
};

export default StudentDashboard;
