import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "../../utils/api";
import AdminSidebar from "../../components/admin/AdminSidebar";

const SuperAdminDashboard: React.FC = () => {
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
        console.warn("Failed to load SuperAdmin stats:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#FDFDFF] font-sans">
      <AdminSidebar />

      <main className="flex-1 p-10 overflow-y-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">System Command</h1>
          <p className="text-slate-400 font-medium mt-1">Full administrative control and global oversight</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { label: "Students", val: stats?.totalStudents, color: "blue" },
            { label: "Admins", val: stats?.totalAdmins, color: "amber" },
            { label: "Courses", val: stats?.totalCourses, color: "emerald" },
            { label: "Enrollments", val: stats?.totalEnrollments, color: "indigo" }
          ].map((item, idx) => (
            <div key={idx} className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-100 border border-slate-50">
               <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">{item.label}</p>
               <p className={`text-4xl font-black text-${item.color}-600`}>{item.val || 0}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-slate-200/30 border border-slate-50">
          <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3">
             <span className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center text-lg">⚙️</span>
             Master Portals
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
             {[
               { label: "Accounts", path: "/admin/accounts", icon: "👥" },
               { label: "Catalog", path: "/admin/manage-courses", icon: "📚" },
               { label: "Assignments", path: "/admin/courses", icon: "📋" },
               { label: "Timetable", path: "/admin/tables", icon: "📅" }
             ].map((btn, idx) => (
               <button
                 key={idx}
                 onClick={() => navigate(btn.path)}
                 className="flex flex-col items-center justify-center p-8 bg-slate-50 hover:bg-white hover:shadow-xl transition-all rounded-[2rem] border border-transparent hover:border-slate-100 group"
               >
                 <span className="text-3xl mb-4 group-hover:scale-125 transition-transform">{btn.icon}</span>
                 <span className="font-black text-slate-800 text-xs uppercase tracking-widest">{btn.label}</span>
               </button>
             ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SuperAdminDashboard;
