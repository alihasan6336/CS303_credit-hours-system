import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "../../utils/api";
import AdminSidebar from "../../components/admin/AdminSidebar";
import {
  Users,
  ShieldCheck,
  BookOpen,
  GraduationCap,
  Calendar,
  ClipboardList,
  Layout,
  ArrowRight,
  Activity,
  Briefcase,
  Database,
} from "lucide-react";

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime] = useState(new Date());

  // Custom auth logic
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("student") || "{}");
      setUser(storedUser);
    } catch {
      setUser({});
    }

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

  const formatGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const isSuperAdmin =
    user?.role === "superadmin" || user?.email === "admin@admin.com";
  const role = user?.adminType || user?.role || "";
  const adminType = role.toLowerCase();

  const statCards = [
    {
      label: "Total Students",
      value: stats?.totalStudents || 0,
      icon: <GraduationCap className="w-6 h-6 text-blue-600" />,
      bgColor: "bg-blue-50",
      color: "text-blue-600",
    },
    {
      label: "Total Staff",
      value: stats?.totalAdmins || 0,
      icon: <ShieldCheck className="w-6 h-6 text-emerald-600" />,
      bgColor: "bg-emerald-50",
      color: "text-emerald-600",
    },
    {
      label: "Active Courses",
      value: stats?.totalCourses || 0,
      icon: <BookOpen className="w-6 h-6 text-amber-600" />,
      bgColor: "bg-amber-50",
      color: "text-amber-600",
    },
    {
      label: "Total Enrollments",
      value: stats?.totalEnrollments || 0,
      icon: <Briefcase className="w-6 h-6 text-indigo-600" />,
      bgColor: "bg-indigo-50",
      color: "text-indigo-600",
    },
  ];

  const allModuleCards = [
    {
      id: "accounts",
      title: "Account Management",
      desc: "Manage student and admin accounts, system roles, and access permissions.",
      path: "/admin/accounts",
      icon: <Users className="w-8 h-8 text-indigo-600" />,
      color: "group-hover:border-indigo-200 group-hover:bg-indigo-50/50",
    },
    {
      id: "catalog",
      title: "Course Catalog",
      desc: "Create and edit university courses, adjust parameters and prerequisites.",
      path: "/admin/manage-courses",
      icon: <Database className="w-8 h-8 text-blue-600" />,
      color: "group-hover:border-blue-200 group-hover:bg-blue-50/50",
    },
    {
      id: "assignments",
      title: "Course Assignments",
      desc: "Map existing courses to appropriate academic levels, semesters, and majors.",
      path: "/admin/courses",
      icon: <ClipboardList className="w-8 h-8 text-emerald-600" />,
      color: "group-hover:border-emerald-200 group-hover:bg-emerald-50/50",
    },
    {
      id: "tables",
      title: "Timetable Dashboard",
      desc: "Manage scheduling, resolve physical room conflicts, and adjust active timeslots.",
      path: "/admin/tables",
      icon: <Calendar className="w-8 h-8 text-amber-600" />,
      color: "group-hover:border-amber-200 group-hover:bg-amber-50/50",
    },
    {
      id: "student-tables",
      title: "Student Schedules",
      desc: "View and manage individual student schedules.",
      path: "/admin/student-timetables",
      icon: <Calendar className="w-8 h-8 text-purple-600" />,
      color: "group-hover:border-purple-200 group-hover:bg-purple-50/50",
    },
  ];

  const moduleCards = allModuleCards.filter((module) => {
    if (isSuperAdmin) return true;
    if (adminType.includes("it_admin")) {
      return module.id === "accounts";
    }
    if (adminType.includes("table_admin")) {
      return module.id === "tables" || module.id === "student-tables";
    }
    if (adminType.includes("courses_admin")) {
      return module.id === "catalog" || module.id === "assignments";
    }
    if (adminType.includes("enrollment_admin")) {
      return module.id === "accounts"; // Given previous permissions mapping
    }
    return false;
  });

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-gray-500 font-medium tracking-wide">
          Initializing Command Center...
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50/50 font-sans overflow-hidden">
      <AdminSidebar />

      <main className="flex-1 p-6 lg:p-12 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {/* Top Banner */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold shadow-sm">
                  <Activity className="w-3.5 h-3.5" /> Systems Operational
                </span>
                <span className="text-gray-400 text-sm font-medium">
                  {currentTime.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
                {formatGreeting()}, {user?.fullName?.split(" ")[0] || "Admin"}
              </h1>
              <p className="text-gray-500 mt-2 font-medium text-lg">
                Here's what's happening across your platform today.
              </p>
            </div>
            {isSuperAdmin && (
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate("/admin/accounts")}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm shadow-indigo-200 flex items-center gap-2"
                >
                  <Users className="w-4 h-4" /> Add Users
                </button>
              </div>
            )}
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {statCards.map((stat, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl flex flex-col p-6 border border-gray-200/75 shadow-sm hover:shadow-md hover:border-gray-300 transition-all"
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${stat.bgColor}`}
                >
                  {stat.icon}
                </div>
                <div>
                  <h3 className="text-3xl font-extrabold text-gray-900 mb-1">
                    {stat.value}
                  </h3>
                  <p className="text-gray-500 text-sm font-semibold tracking-wide uppercase">
                    {stat.label}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Modules Section */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Layout className="w-5 h-5 text-gray-400" />
              <h2 className="text-xl font-bold text-gray-800">
                Assigned Modules
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {moduleCards.length > 0 ? (
                moduleCards.map((module, idx) => (
                  <button
                    key={idx}
                    onClick={() => navigate(module.path)}
                    className={`group flex items-start p-6 md:p-8 bg-white rounded-2xl border border-gray-200/75 shadow-sm transition-all text-left w-full hover:shadow-md ${module.color}`}
                  >
                    <div className="mr-5 mt-1 shrink-0 bg-gray-50/50 group-hover:bg-white rounded-xl p-3 transition-colors">
                      {module.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-700 transition-colors mb-2">
                        {module.title}
                      </h3>
                      <p className="text-gray-500 text-sm leading-relaxed mb-4">
                        {module.desc}
                      </p>
                      <div className="flex items-center text-sm font-semibold text-indigo-600 opacity-0 group-hover:opacity-100 transition-all transform -translate-x-2 group-hover:translate-x-0">
                        Access Module <ArrowRight className="w-4 h-4 ml-1" />
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="col-span-1 md:col-span-2 p-10 bg-white rounded-2xl border border-dashed border-gray-300 text-center text-gray-500">
                  No modules assigned to your administrative role.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
