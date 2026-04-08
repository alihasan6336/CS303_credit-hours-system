import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi, courseApi } from "../../utils/api";
import StudentLayout from "../../layout/StudentLayout";
import Timetable from "../../components/Timetable";

interface Course {
  code: string;
  name: string;
  day: string;
  time: string;
  room: string;
  credits: number;
  instructor: string;
  _id?: string;
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

const defaultStudent: StudentData = {
  name: "Loading...",
  id: "---",
  level: 1,
  gpa: 0.0,
  completedHours: 0,
  major: "Loading...",
  semester: "Loading...",
  courses: [],
};

const StudentDashboard: React.FC = () => {
  const [currentStudent, setCurrentStudent] =
    useState<StudentData>(defaultStudent);
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
    const token = localStorage.getItem("authToken");

    if (!token) {
      navigate("/login");
      return;
    }

    fetchDashboardData();
  }, [navigate]);

  const fetchDashboardData = () => {
    setLoading(true);
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
          courses: courses
            .filter((c: any) => c.isEnrolled)
            .map(c => ({
              ...c,
              _id: (c as any)._id
            })),
        }));
      })
      .catch((error) => {
        console.warn("Failed to fetch home data:", error);
        if (error.message.includes("Not authorized") || error.message.includes("token")) {
          navigate("/login");
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleDropCourse = async (courseId: string) => {
    try {
      if (!courseId) return;
      const response = await courseApi.dropCourse(courseId);
      if (response.success) {
        // Refresh the dashboard data
        fetchDashboardData();
      }
    } catch (error) {
      console.error("Failed to drop course:", error);
      alert("Failed to drop course");
    }
  };

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
            {currentStudent.semester} • {currentStudent.major}
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
            <button 
              onClick={() => navigate("/courses")}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              + Add Course
            </button>
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
                  <th className="pb-3">Credits</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {currentStudent.courses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-4 text-center text-gray-500">
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
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                          {course.credits} cr
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleDropCourse(course._id!)}
                          className="px-3 py-1 bg-red-50 text-red-600 rounded-md text-xs font-medium hover:bg-red-100 transition-colors"
                        >
                          Drop
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Weekly Timetable */}
        {currentStudent.courses.length > 0 && (
          <div className="mt-8 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Weekly Timetable
              </h3>
            </div>
            <Timetable courses={currentStudent.courses} />
          </div>
        )}
      </main>
    </StudentLayout>
  );
};

export default StudentDashboard;
