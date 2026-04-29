import React, { useEffect, useState, useCallback } from "react";
import { adminApi } from "../../utils/api";
import AdminSidebar from "../../components/admin/AdminSidebar";
import StudentsTable from "../../components/admin/StudentsTable";
import StudentEnrollmentModal from "../../components/admin/StudentEnrollmentModal";
import { getStoredAdminUser } from "../../utils/adminAccess";

const StudentSchedules: React.FC = () => {
  const user = getStoredAdminUser();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [stats, setStats] = useState<any>(null);

  const fetchStats = useCallback(async () => {
    try {
      const response = await adminApi.getStats();
      if (response.success) setStats(response.stats);
    } catch (err) {
      console.warn("Stats fetch failed:", err);
    }
  }, []);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminApi.getStudents("student", page, 10, searchQuery);
      if (response.success) {
        setStudents(response.students);
        setTotalPages(response.pages);
      }
    } catch (err) {
      console.error("Failed to load students:", err);
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery]);

  useEffect(() => {
    fetchStats();
    fetchStudents();
  }, [fetchStats, fetchStudents]);

  const handleEditCourses = (studentId: string, studentName: string) => {
    setSelectedStudent({ id: studentId, fullName: studentName });
    setShowCourseModal(true);
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <AdminSidebar />

      <main className="flex-1 p-8">
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900">Student Timetables</h1>
            <p className="text-slate-500 font-medium mt-1">Manage course registrations and individual student schedules.</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100 text-center min-w-[120px]">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Students</p>
              <p className="text-xl font-black text-teal-600">{stats?.totalStudents || 0}</p>
            </div>
            <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100 text-center min-w-[120px]">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Enrollments</p>
              <p className="text-xl font-black text-indigo-600">{stats?.totalEnrollments || 0}</p>
            </div>
          </div>
        </header>

        <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="mb-8 flex flex-col md:flex-row gap-6 justify-between items-center">
            <div className="relative w-full md:w-[450px]">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">🔍</span>
              <input
                type="text"
                placeholder="Find student by name, ID or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-slate-50/50 border border-slate-100 rounded-[1.25rem] focus:ring-2 focus:ring-teal-500 outline-none transition-all placeholder:text-slate-300 font-medium"
              />
            </div>
            <div className="flex flex-col items-end">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Results View</p>
              <p className="text-sm text-slate-600 font-bold">
                Showing <span className="text-teal-600">{students.length}</span> students matching search
              </p>
            </div>
          </div>

          <StudentsTable
            students={students}
            isLoading={loading}
            onManageEnrollments={handleEditCourses}
            currentUserRole={user.role}
          />

          {/* Pagination */}
          <div className="mt-8 flex justify-center gap-2">
             {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-10 h-10 rounded-xl font-bold transition-all ${
                    page === p ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {p}
                </button>
             ))}
          </div>
        </div>

        {selectedStudent && (
          <StudentEnrollmentModal
            studentId={selectedStudent.id}
            studentName={selectedStudent.fullName}
            isOpen={showCourseModal}
            onClose={() => setShowCourseModal(false)}
          />
        )}
      </main>
    </div>
  );
};

export default StudentSchedules;
