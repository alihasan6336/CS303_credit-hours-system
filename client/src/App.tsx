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

import ManageCourses from "./pages/admin/ManageCourses";
import TableManagement from "./pages/admin/TableManagement";
import StudentSchedules from "./pages/admin/StudentSchedules";
import {
  canAccessPath,
  getDashboardPathForAdmin,
  getStoredAdminUser,
  hasResolvedAdminType,
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

function AdminTypeMissingPage() {
  const user = getStoredAdminUser();
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white border border-amber-200 rounded-xl shadow-sm p-6 text-center">
        <h1 className="text-2xl font-bold text-amber-700 mb-2">
          Admin Type Not Configured
        </h1>
        <p className="text-gray-700">
          Your account is logged in as admin, but no admin type is assigned yet.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Ask backend to map this account in admin identifiers:{" "}
          <span className="font-medium">{user.email || "unknown email"}</span>
        </p>
      </div>
    </div>
  );
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
      </Route>

      {/* Protected admin routes */}
      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<AdminDashboard />} />
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
