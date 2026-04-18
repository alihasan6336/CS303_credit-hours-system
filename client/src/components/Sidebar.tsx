import { NavLink } from "react-router-dom";
import { Home as HomeIcon, BookOpen, PlusCircle, BarChart2, Settings, LogOut, Calculator } from "lucide-react";

const Sidebar = () => {
const navItems = [
    { label: "Home", path: "/home", icon: <HomeIcon size={20} /> },
    { label: "Courses", path: "/courses", icon: <BookOpen size={20} /> },
    { label: "GPA Calculator", path: "/gpa-calculator", icon: <Calculator size={20} /> },
    { label: "Admin Dashboard", path: "/admin", icon: <BarChart2 size={20} /> },
    { label: "Manage Accounts", path: "/admin/accounts", icon: <Settings size={20} /> },
    { label: "Manage Courses", path: "/admin/manage-courses", icon: <BookOpen size={20} /> },
    { label: "Assign Courses", path: "/admin/courses", icon: <PlusCircle size={20} /> },
];

return (
    <aside className="w-64 h-screen bg-gray-900 text-white flex flex-col p-4">
      {/* Logo / Header */}
    <div className="mb-6 text-center">
        <div className="text-3xl mb-2">🎓</div>
        <h2 className="text-xl font-bold">Credit Hours System</h2>
    </div>

      {/* Navigation */}
    <nav className="flex flex-col gap-2 flex-1">
        {navItems.map((item) => (
        <NavLink
            key={item.label}
            to={item.path}
            className={({ isActive }) =>
            `flex items-center gap-3 p-2 rounded transition-colors duration-200 ${
                isActive ? "bg-gray-700" : "hover:bg-gray-800"
            }`
            }
        >
            <span>{item.icon}</span>
            <span>{item.label}</span>
        </NavLink>
        ))}
    </nav>

      {/* Logout Button */}
    <button
        className="mt-auto p-2 rounded hover:bg-gray-800 flex items-center gap-2"
        onClick={() => {
        localStorage.removeItem("authToken");
        localStorage.removeItem("student");
        window.location.href = "/login";
        }}
    >
        <LogOut size={20} /> <span>Sign Out</span>
    </button>
    </aside>
);
};

export default Sidebar;