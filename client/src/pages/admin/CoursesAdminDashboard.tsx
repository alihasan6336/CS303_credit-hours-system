import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "../../utils/api";
import AdminSidebar from "../../components/admin/AdminSidebar";

interface CourseStat {
  code: string;
  name: string;
  enrolled: number;
  capacity: number;
}

const CoursesAdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [topCourses, setTopCourses] = useState<CourseStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await adminApi.getStats();
        if (response.success) {
          setStats(response.stats);
          setTopCourses(response.courses || []);
        }
      } catch (err: any) {
        console.warn("Failed to load courses stats:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#FCFCFE] font-sans">
      <AdminSidebar />

      <main className="flex-1 p-10 overflow-y-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Curriculum & Courses</h1>
          <p className="text-slate-400 font-medium mt-1">Manage academic catalog and program structure</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-100 border border-slate-50">
             <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Total Courses</p>
             <p className="text-5xl font-black text-slate-800">{stats?.totalCourses || 0}</p>
             <button 
               onClick={() => navigate("/admin/manage-courses")}
               className="mt-6 px-6 py-3 bg-amber-500 text-white rounded-2xl text-[10px] font-black tracking-widest uppercase hover:bg-amber-600 transition-all active:scale-95 shadow-lg shadow-amber-100"
             >
               Manage Catalog
             </button>
          </div>

          <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-100 border border-slate-50">
             <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Global Enrollment</p>
             <p className="text-5xl font-black text-indigo-600">{stats?.totalEnrollments || 0}</p>
             <button 
               onClick={() => navigate("/admin/courses")}
               className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black tracking-widest uppercase hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-100"
             >
               Level Assignments
             </button>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-slate-200/30 border border-slate-50">
          <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3">
             <span className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">🔥</span>
             Top Enrolled Courses
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {topCourses.map((c, i) => (
                <div key={i} className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100 group hover:bg-white hover:shadow-xl transition-all">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center font-black text-amber-600 shadow-sm group-hover:scale-110 transition-transform">{c.code}</div>
                      <div>
                         <p className="font-black text-slate-800 text-sm">{c.name}</p>
                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{c.enrolled} / {c.capacity} Students</p>
                      </div>
                   </div>
                   <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(100, (c.enrolled / c.capacity) * 100)}%` }}></div>
                   </div>
                </div>
             ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CoursesAdminDashboard;
