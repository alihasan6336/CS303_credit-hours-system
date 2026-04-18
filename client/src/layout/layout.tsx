import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

const Layout = () => {
return (
    <div className="flex">
      <Sidebar />   {/* ثابت لكل الصفحات */}
    <div className="flex-1 p-4 bg-gray-100 min-h-screen">
        <Outlet />   {/* هنا تظهر كل صفحة */}
    </div>
    </div>
);
};

export default Layout;