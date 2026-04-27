import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "../../utils/api";
import AdminSidebar from "../../components/admin/AdminSidebar";

const EnrollmentAdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [recentEnrollments, setRecentEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, enrollRes] = await Promise.all([
          adminApi.getStats(),
          adminApi.getEnrollments(1, 5) // Page 1, limit 5
        ]);

        if (statsRes.success) setStats(statsRes.stats);
        if (enrollRes.success) setRecentEnrollments(enrollRes.enrollments || []);
      } catch (err: any) {
        console.warn("Failed to load enrollment data:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans">
      <AdminSidebar />

      <main className="flex-1 p-10 overflow-y-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Student Registry</h1>
          <p className="text-slate-400 font-medium mt-1">Enrollment management and academic record auditing</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-100 border border-slate-50">
             <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Active Students</p>
             <p className="text-4xl font-black text-slate-800">{stats?.totalStudents || 0}</p>
          </div>
          <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-100 border border-slate-50">
             <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Total Enrollments</p>
             <p className="text-4xl font-black text-indigo-600">{stats?.totalEnrollments || 0}</p>
          </div>
          <div className="bg-slate-900 p-8 rounded-[2rem] shadow-2xl shadow-slate-200 border border-slate-800 flex flex-col justify-center">
             <button 
               onClick={() => navigate("/admin/accounts")}
               className="w-full py-4 bg-white text-slate-900 rounded-2xl text-[10px] font-black tracking-widest uppercase hover:bg-indigo-50 transition-all active:scale-95"
             >
               Manage Student Profiles
             </button>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-slate-200/40 border border-slate-50">
          <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3">
             <span className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-lg">📝</span>
             Recent Enrollments
          </h3>
          <div className="space-y-4">
             {recentEnrollments.map((e, i) => (
                <div key={i} className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100">
                   <div className="flex items-center gap-5">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-xl">👤</div>
                      <div>
                         <p className="font-black text-slate-800">{e.student?.fullName}</p>
                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{e.course?.code} — {e.course?.name}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-xs font-black text-slate-800">{e.semester}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(e.enrolledAt).toLocaleDateString()}</p>
                   </div>
                </div>
             ))}
             {recentEnrollments.length === 0 && (
                <p className="text-center py-10 text-slate-400 font-medium italic">No recent enrollment activity</p>
             )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default EnrollmentAdminDashboard;
