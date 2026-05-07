import "./App.css";
import type { ReactNode } from "react";

import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import StudentDashboard from "./pages/home/StudentDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AccountManagement from "./pages/admin/AccountManagement";
import CourseAssignmentPage from "./pages/admin/CourseAssignmentPage";
import AvailableCourses from "./pages/student/AvailableCourses";
import GpaCalculatorPage from "./pages/student/GpaCalculatorPage";
import AIScheduleGenerator from "./pages/student/AIScheduleGenerator";
import AcademicHistoryPage from "./pages/student/AcademicHistoryPage";
import ProfilePhotoPage from "./pages/student/ProfilePhotoPage";

import ManageCourses from "./pages/admin/ManageCourses";
import TableManagement from "./pages/admin/TableManagement";
import StudentSchedules from "./pages/admin/StudentSchedules";
import AdminProfilePhotoPage from "./pages/admin/AdminProfilePhotoPage";
import {
  canAccessPath,
  getDashboardPathForAdmin,
  getStoredAdminUser,
  isAdminUser,
} from "./utils/adminAccess";

function ProtectedRoute() {
  const token = localStorage.getItem("authToken");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

function AdminRoute() {
  const token = localStorage.getItem("authToken");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const user = getStoredAdminUser();
  if (!isAdminUser(user)) {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
}

function AdminFeatureRoute({
  path,
  element,
}: {
  path: string;
  element: ReactNode;
}) {
  const user = getStoredAdminUser();
  if (!canAccessPath(user, path)) {
    return <Navigate to={getDashboardPathForAdmin(user)} replace />;
  }
  return <>{element}</>;
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
        <Route path="/ai-schedule" element={<AIScheduleGenerator />} />
        <Route path="/profile-photo" element={<ProfilePhotoPage />} />
      </Route>

      {/* Protected admin routes */}
      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/profile-photo" element={<AdminProfilePhotoPage />} />
        <Route path="/admin/it" element={<Navigate to="/admin" replace />} />
        <Route
          path="/admin/enrollment"
          element={<Navigate to="/admin" replace />}
        />
        <Route
          path="/admin/schedule"
          element={<Navigate to="/admin" replace />}
        />
        <Route
          path="/admin/courses-admin"
          element={<Navigate to="/admin" replace />}
        />
        <Route
          path="/admin/accounts"
          element={
            <AdminFeatureRoute
              path="/admin/accounts"
              element={<AccountManagement />}
            />
          }
        />
        <Route
          path="/admin/courses"
          element={
            <AdminFeatureRoute
              path="/admin/courses"
              element={<CourseAssignmentPage />}
            />
          }
        />
        <Route
          path="/admin/manage-courses"
          element={
            <AdminFeatureRoute
              path="/admin/manage-courses"
              element={<ManageCourses />}
            />
          }
        />
        <Route
          path="/admin/tables"
          element={
            <AdminFeatureRoute
              path="/admin/tables"
              element={<TableManagement />}
            />
          }
        />
        <Route
          path="/admin/student-timetables"
          element={
            <AdminFeatureRoute
              path="/admin/student-timetables"
              element={<StudentSchedules />}
            />
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
