import "./App.css";

import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import StudentDashboard from "./pages/home/StudentDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AccountManagement from "./pages/admin/AccountManagement";
import CourseAssignmentPage from "./pages/admin/CourseAssignmentPage";
import AvailableCourses from "./pages/student/AvailableCourses";
import GpaCalculatorPage from "./pages/student/GpaCalculatorPage";
import AcademicHistoryPage from "./pages/student/AcademicHistoryPage";
import ManageCourses from "./pages/admin/ManageCourses";
import TableManagement from "./pages/admin/TableManagement";

function ProtectedRoute() {
  const token = localStorage.getItem("authToken");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

function AdminRoute() {
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
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Protected student routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/home" element={<StudentDashboard />} />
        <Route path="/courses" element={<AvailableCourses />} />
        <Route path="/gpa-calculator" element={<GpaCalculatorPage />} />
        <Route path="/academic-history" element={<AcademicHistoryPage />} />
      </Route>

      {/* Protected admin routes */}
      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/accounts" element={<AccountManagement />} />
        <Route path="/admin/courses" element={<CourseAssignmentPage />} />
        <Route path="/admin/manage-courses" element={<ManageCourses />} />
        <Route path="/admin/tables" element={<TableManagement />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
