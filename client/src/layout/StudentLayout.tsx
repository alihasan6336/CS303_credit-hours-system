import { NavLink } from "react-router-dom";
import { Home, BookOpen, LogOut, GraduationCap, Calculator, History } from "lucide-react";
import { authApi } from "../utils/api";

interface StudentLayoutProps {
  children: React.ReactNode;
  user?: {
    fullName?: string;
    major?: string;
    role?: string;
  };
}

const StudentLayout: React.FC<StudentLayoutProps> = ({ children, user = {} }) => {
  const handleLogout = () => {
    authApi.logout();
    window.location.href = "/login";
  };

  const navItems = [
    { label: "Dashboard", path: "/home", icon: Home },
    { label: "Available Courses", path: "/courses", icon: BookOpen },
    { label: "Academic History", path: "/academic-history", icon: History },
    { label: "GPA Calculator", path: "/gpa-calculator", icon: Calculator },
  ];

  const displayName = user.fullName || "Student";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-indigo-800 to-indigo-900 text-white flex flex-col">
        {/* Logo / Header */}
        <div className="p-6 text-center">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <GraduationCap size={24} />
          </div>
          <h2 className="text-lg font-bold">Credit Hours System</h2>
          <p className="text-indigo-200 text-sm">Student Portal</p>
        </div>

        {/* User Profile */}
        <div className="px-4 py-3 mx-4 bg-indigo-700/50 rounded-lg mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-semibold text-sm">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{displayName}</p>
              <p className="text-xs text-indigo-200 truncate">{user.major || "Student"}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "text-indigo-100 hover:bg-white/10"
                }`
              }
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-indigo-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-200 transition-colors"
          >
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
};

export default StudentLayout;
