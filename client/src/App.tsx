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
import ITAdminDashboard from "./pages/admin/ITAdminDashboard";
import ScheduleAdminDashboard from "./pages/admin/ScheduleAdminDashboard";
import CoursesAdminDashboard from "./pages/admin/CoursesAdminDashboard";
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

function AdminFeatureRoute({ path, element }: { path: string; element: JSX.Element }) {
  const user = getStoredAdminUser();
  if (!canAccessPath(user, path)) {
    return <Navigate to={getDashboardPathForAdmin(user)} replace />;
  }
  return element;
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
        <Route
          path="/admin"
          element={
            (() => {
              const user = getStoredAdminUser();
              const adminHome = getDashboardPathForAdmin(user);
              return adminHome === "/admin" ? (
                <AdminDashboard />
              ) : (
                <Navigate to={adminHome} replace />
              );
            })()
          }
        />
        <Route
          path="/admin/it"
          element={
            <AdminFeatureRoute
              path="/admin/accounts"
              element={<ITAdminDashboard />}
            />
          }
        />
        <Route
          path="/admin/schedule"
          element={
            <AdminFeatureRoute
              path="/admin/tables"
              element={<ScheduleAdminDashboard />}
            />
          }
        />
        <Route
          path="/admin/courses-admin"
          element={
            <AdminFeatureRoute
              path="/admin/manage-courses"
              element={<CoursesAdminDashboard />}
            />
          }
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
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
