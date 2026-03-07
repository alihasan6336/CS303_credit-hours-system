import "./App.css";

import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Home from "./pages/home/Home";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AccountManagement from "./pages/admin/AccountManagement";
import CourseAssignmentPage from "./pages/admin/CourseAssignmentPage";
import AvailableCourses from "./pages/student/AvailableCourses";
import ManageCourses from "./pages/admin/ManageCourses";

function ProtectedRoute() {
  // TEMPORARY: Authentication bypassed for testing
  return <Outlet />;

  /* Original authentication code - uncomment when done testing
  const token = localStorage.getItem("authToken");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
  */
}

function AdminRoute() {
  // TEMPORARY: Authentication bypassed for testing
  return <Outlet />;

  /* Original authentication code - uncomment when done testing
  const token = localStorage.getItem("authToken");
  const userStr = localStorage.getItem("student");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userStr || "{}");
    if (user.role !== "admin" && user.role !== "superadmin") {
      return <Navigate to="/home" replace />;
    }
  } catch {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
  */
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/home" element={<Home />} />
      <Route path="/courses" element={<AvailableCourses />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/accounts" element={<AccountManagement />} />
      <Route path="/admin/courses" element={<CourseAssignmentPage />} />
      <Route path="/admin/manage-courses" element={<ManageCourses />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
