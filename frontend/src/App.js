// App.js
import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Navbar from "./components/Navbar";
import SimpleChatbot from "./components/SimpleChatbot";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import PasswordResetPage from "./pages/PasswordResetPage";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import ProfilePage from "./pages/ProfilePage";
import SchedulePlanner from "./pages/SchedulePlanner";
import AdminPage from "./pages/AdminPage";
import AdminLandingPage from "./pages/AdminLandingPage";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUserManagement from "./pages/AdminUserManagement";
import AdminProfile from "./pages/AdminProfile";

import "./styles/theme.css";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check session on page load
  useEffect(() => {
    /* DEVELOPMENT MODE - TEMPORARILY DISABLED
    // For development: Always start fresh (logged out)
    // Clear any existing sessions and storage
    localStorage.removeItem('userSession');
    localStorage.removeItem('rememberMe');
    sessionStorage.removeItem('userSession');
    
    // Clear backend session
    fetch("/logout", { method: "POST", credentials: "include" })
      .catch(() => {}) // Ignore errors if already logged out
      .finally(() => {
        setUser(null);
        setLoading(false);
      });
    */

    // PRODUCTION CODE - RESTORE WHEN READY FOR PRODUCTION
    // First, try to restore from Remember Me (localStorage)
    const rememberMe = localStorage.getItem('rememberMe');
    const storedUser = rememberMe === 'true' 
      ? localStorage.getItem('userSession')
      : null; // Don't restore from sessionStorage automatically

    if (storedUser && rememberMe === 'true') {
      try {
        // Verify with backend that session is still valid
        fetch("/session", { credentials: "include" })
          .then((res) => (res.ok ? res.json() : Promise.reject()))
          .then((data) => {
            if (data.status === "SUCCESS" && data.user) {
              setUser(data.user);
            } else {
              // Backend session expired, clear local storage
              localStorage.removeItem('userSession');
              localStorage.removeItem('rememberMe');
              setUser(null);
            }
          })
          .catch(() => {
            // Backend session invalid, clear local storage
            localStorage.removeItem('userSession');
            localStorage.removeItem('rememberMe');
            setUser(null);
          })
          .finally(() => setLoading(false));
        return;
      } catch (e) {
        console.error('Error parsing stored user data:', e);
        // Clear invalid data
        localStorage.removeItem('userSession');
        localStorage.removeItem('rememberMe');
      }
    }

    // If no remember me, check backend session but don't auto-restore
    fetch("/session", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (data.status === "SUCCESS" && data.user) {
          // Only restore if remember me was set
          const rememberMe = localStorage.getItem('rememberMe');
          if (rememberMe === 'true') {
            setUser(data.user);
          } else {
            // Clear backend session if remember me was not set
            fetch("/logout", { method: "POST", credentials: "include" });
            setUser(null);
          }
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  // Handle browser close - preserve Remember Me sessions, clear others
  useEffect(() => {
    const handleBeforeUnload = () => {
      const rememberMe = localStorage.getItem('rememberMe');
      if (rememberMe !== 'true') {
        // Clear session if not "Remember Me"
        sessionStorage.removeItem('userSession');
        localStorage.removeItem('userSession');
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        const rememberMe = localStorage.getItem('rememberMe');
        if (rememberMe !== 'true') {
          sessionStorage.removeItem('userSession');
          localStorage.removeItem('userSession');
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Logout handler
  const handleLogout = () => {
    fetch("/logout", {
      method: "POST",
      credentials: "include",
    })
      .then(() => {
        // Clear all session data
        setUser(null);
        localStorage.removeItem('userSession');
        sessionStorage.removeItem('userSession');
        localStorage.removeItem('rememberMe');
      })
      .catch(() => {
        // Even if server logout fails, clear local data
        setUser(null);
        localStorage.removeItem('userSession');
        sessionStorage.removeItem('userSession');
        localStorage.removeItem('rememberMe');
      });
  };

  // Allows ProfilePage to update user info
  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
  };

  if (loading) {
    return (
      <div className="page-container">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <Router>
      <Navbar user={user} />

      <Routes>
        {/* LOGIN */}
        <Route
          path="/login"
          element={<LoginPage onLogin={setUser} user={user} />}
        />

        {/* REGISTER */}
        <Route
          path="/register"
          element={<RegisterPage onLogin={setUser} />}
        />

        {/* FORGOT PASSWORD */}
        <Route
          path="/forgot-password"
          element={<ForgotPasswordPage />}
        />

        {/* PASSWORD RESET */}
        <Route
          path="/password-reset/:token?"
          element={<PasswordResetPage />}
        />

        {/* LANDING PAGE */}
        <Route
          path="/landing"
          element={
            user && user.role !== 'admin' ? (
              <LandingPage user={user} onLogout={handleLogout} />
            ) : (
              user?.role === 'admin' ? <Navigate to="/admin/landing" replace /> : <Navigate to="/login" replace />
            )
          }
        />

        {/* DASHBOARD */}
        <Route
          path="/dashboard"
          element={
            user && user.role !== 'admin' ? (
              <Dashboard user={user} onLogout={handleLogout} />
            ) : (
              user?.role === 'admin' ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/login" replace />
            )
          }
        />

        {/* SCHEDULE PLANNER */}
        <Route
          path="/planner"
          element={
            user && user.role !== 'admin' ? (
              <SchedulePlanner user={user} />
            ) : (
              user?.role === 'admin' ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/login" replace />
            )
          }
        />

        {/* PROFILE */}
        <Route
          path="/profile"
          element={
            user && user.role !== 'admin' ? (
              <ProfilePage
                user={user}
                onUserUpdate={handleUserUpdate}
                onLogout={handleLogout}
              />
            ) : (
              user?.role === 'admin' ? <Navigate to="/admin/profile" replace /> : <Navigate to="/login" replace />
            )
          }
        />

        {/* ADMIN ROUTES */}
        <Route
          path="/admin/landing"
          element={
            user?.role === 'admin' ? (
              <AdminLandingPage user={user} onLogout={handleLogout} />
            ) : (
              user ? <Navigate to="/landing" replace /> : <Navigate to="/login" replace />
            )
          }
        />
        
        <Route
          path="/admin/dashboard"
          element={
            user?.role === 'admin' ? (
              <AdminDashboard user={user} onLogout={handleLogout} />
            ) : (
              user ? <Navigate to="/landing" replace /> : <Navigate to="/login" replace />
            )
          }
        />
        
        <Route
          path="/admin/users"
          element={
            user?.role === 'admin' ? (
              <AdminUserManagement user={user} onLogout={handleLogout} />
            ) : (
              user ? <Navigate to="/landing" replace /> : <Navigate to="/login" replace />
            )
          }
        />
        
        <Route
          path="/admin/profile"
          element={
            user?.role === 'admin' ? (
              <AdminProfile user={user} onUserUpdate={handleUserUpdate} onLogout={handleLogout} />
            ) : (
              user ? <Navigate to="/profile" replace /> : <Navigate to="/login" replace />
            )
          }
        />

        {/* ADMIN PAGE (Protected) */}
        <Route
          path="/admin"
          element={
            user && user.role === "admin" ? (
              <AdminPage />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* DEFAULT ROUTE */}
        <Route
          path="/"
          element={
            user ? (
              user.role === 'admin' ? (
                <Navigate to="/admin/landing" replace />
              ) : (
                localStorage.getItem('rememberMe') === 'true' ? (
                  <Navigate to="/landing" replace />
                ) : (
                  <Navigate to="/dashboard" replace />
                )
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
      
      {/* Chatbot - only show when logged in */}
      {user && <SimpleChatbot />}
    </Router>
  );
}

export default App;
