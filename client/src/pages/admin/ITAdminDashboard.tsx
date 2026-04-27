import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "../../utils/api";
import AdminSidebar from "../../components/admin/AdminSidebar";

interface Stats {
  totalStudents: number;
  totalAdmins: number;
  totalSuperAdmins: number;
  recentLogins: number;
}

const ITAdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await adminApi.getStats();
        if (response.success) {
          setStats(response.stats);
        }
      } catch (err: any) {
        console.warn("Failed to load IT stats:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#FDFDFF] font-sans">
      <AdminSidebar />

      <main className="flex-1 p-10 overflow-y-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">IT Infrastructure</h1>
          <p className="text-slate-400 font-medium mt-1">Global system state and user directory management</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-100 border border-slate-50">
             <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Total Students</p>
             <p className="text-4xl font-black text-slate-800">{stats?.totalStudents || 0}</p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-100 border border-slate-50">
             <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Total Admins</p>
             <p className="text-4xl font-black text-blue-600">{stats?.totalAdmins || 0}</p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-100 border border-slate-50">
             <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Super Admins</p>
             <p className="text-4xl font-black text-purple-600">{stats?.totalSuperAdmins || 0}</p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-100 border border-slate-50">
             <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Recent Logins (24h)</p>
             <p className="text-4xl font-black text-emerald-600">{stats?.recentLogins || 0}</p>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-slate-200/30 border border-slate-50">
          <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3">
             <span className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">🔐</span>
             System Administration
          </h3>
          <div className="max-w-md">
            <button
              onClick={() => navigate("/admin/accounts")}
              className="group w-full p-8 bg-slate-50 hover:bg-white hover:shadow-2xl hover:shadow-blue-100 transition-all rounded-[2rem] border border-transparent hover:border-blue-100 text-left flex items-center justify-between"
            >
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
                  👥
                </div>
                <div>
                  <h4 className="font-black text-slate-800 text-lg">Manage Accounts</h4>
                  <p className="text-sm text-slate-400 font-medium">Create, edit, or remove all user types</p>
                </div>
              </div>
              <span className="text-slate-300 group-hover:text-blue-600 font-black text-2xl transition-colors">→</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ITAdminDashboard;
