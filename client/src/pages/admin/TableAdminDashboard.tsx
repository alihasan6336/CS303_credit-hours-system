import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "../../utils/api";
import AdminSidebar from "../../components/admin/AdminSidebar";

const TableAdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await adminApi.getStats();
        if (response.success) {
          setStats(response.stats);
        }
      } catch (err: any) {
        console.warn("Failed to load table stats:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#FBFEFF] font-sans">
      <AdminSidebar />

      <main className="flex-1 p-10 overflow-y-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Timeline Control</h1>
          <p className="text-slate-400 font-medium mt-1">Schedules, room assignments, and timetable health</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-100 border border-slate-50 flex flex-col items-center text-center">
             <div className="w-20 h-20 bg-teal-50 rounded-[1.5rem] flex items-center justify-center text-3xl mb-6 shadow-sm">📅</div>
             <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Live Schedules</p>
             <p className="text-5xl font-black text-slate-800 mb-8">{stats?.totalCourses || 0}</p>
             <button 
               onClick={() => navigate("/admin/tables")}
               className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-xs font-black tracking-[0.2em] uppercase shadow-xl shadow-teal-100 transition-all active:scale-95 mb-4"
             >
               Launch Timetable Tool
             </button>
             <button 
               onClick={() => navigate("/admin/student-timetables")}
               className="w-full py-4 bg-white border-2 border-teal-600 text-teal-600 hover:bg-teal-50 rounded-2xl text-xs font-black tracking-[0.2em] uppercase transition-all active:scale-95"
             >
               Manage Student Timetables
             </button>
          </div>

          <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-100 border border-slate-50 flex flex-col justify-center">
             <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
               <span className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-lg">📊</span>
               Resource Summary
             </h3>
             <div className="space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                   <span className="text-slate-400 font-bold text-xs uppercase">Active Students</span>
                   <span className="font-black text-slate-800">{stats?.totalStudents || 0}</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                   <span className="text-slate-400 font-bold text-xs uppercase">Total Enrollments</span>
                   <span className="font-black text-teal-600">{stats?.totalEnrollments || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                   <span className="text-slate-400 font-bold text-xs uppercase">Recent Activity</span>
                   <span className="font-black text-emerald-600">{stats?.recentLogins || 0}</span>
                </div>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TableAdminDashboard;
