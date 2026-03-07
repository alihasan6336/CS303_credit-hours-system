import "./App.css";

import {
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Home from "./pages/home/Home";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AccountManagement from "./pages/admin/AccountManagement";
import CourseAssignmentPage from "./pages/admin/CourseAssignmentPage";

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
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/home" element={<Home />} />
        </Route>
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/accounts" element={<AccountManagement />} />
          <Route path="/admin/courses" element={<CourseAssignmentPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>

  );
}

export default App;
