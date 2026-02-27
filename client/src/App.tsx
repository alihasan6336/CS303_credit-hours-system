import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="*" element={<Navigate to="/login" replace />} />

        {/* <Route path="/home" element={<Home />} /> */}
        <Route path="/home" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
