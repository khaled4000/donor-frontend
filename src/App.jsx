import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/home/HomPage";
import RegisterPage from "./pages/register/RegisterPage";
import LoginPage from "./pages/login/LoginPage";
import FamilyDashboard from "./pages/family/FamilyDashboard";
import DonorDashboard from "./pages/donor/DonorDashboard";

import AdminDashboard from "./pages/admin/AdminDashboard";
import CheckerDashboard from "./pages/dashboardChecker/CheckerDashboard";
import AdminRedirect from "./components/AdminRedirect/AdminRedirect";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import AdminProtectedRoute from "./components/AdminProtectedRoute/AdminProtectedRoute";
import CheckerProtectedRoute from "./components/CheckerProtectedRoute/CheckerProtectedRoute";
import EmailVerification from "./pages/emailVerification/EmailVerification";
import ForgotPassword from "./components/ForgotPassword/ForgotPassword";
import { AuthProvider } from "./pages/authContext/AuthContext";
import About from "./pages/about/about";

import "./utils/devTools"; // Load developer tools in development
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <div className="App">
          <Routes>
            <Route path="/" element={<AdminRedirect><HomePage /></AdminRedirect>} />
            <Route path="/register" element={<AdminRedirect><RegisterPage /></AdminRedirect>} />
            
            {/* Unified Login - Primary entry point for all users */}
            <Route path="/login" element={<AdminRedirect><LoginPage /></AdminRedirect>} />
            
            <Route path="/family-dashboard" element={
              <AdminRedirect>
                <ProtectedRoute requiredUserType="family" requireEmailVerification={true}>
                  <FamilyDashboard />
                </ProtectedRoute>
              </AdminRedirect>
            } />
            <Route path="/donor-dashboard" element={
              <AdminRedirect>
                <ProtectedRoute requiredUserType="donor" requireEmailVerification={true}>
                  <DonorDashboard />
                </ProtectedRoute>
              </AdminRedirect>
            } />

            <Route path="/about" element={<AdminRedirect><About /></AdminRedirect>} />

            {/* Admin Routes - Direct access to dashboards */}
            <Route path="/admin/dashboard" element={
              <AdminProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </AdminProtectedRoute>
            } />

            {/* Checker Routes - Direct access to dashboard */}
            <Route path="/checker-dashboard" element={
              <CheckerProtectedRoute>
                <CheckerDashboard />
              </CheckerProtectedRoute>
            } />

            {/* Email Verification Route */}
            <Route path="/verify-email" element={<EmailVerification />} />

            {/* Forgot Password Route */}
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
