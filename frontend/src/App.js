// App.js
import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Navbar from "./components/Navbar";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Dashboard from "./pages/Dashboard";
import ProfilePage from "./pages/ProfilePage";
import SchedulePlanner from "./pages/SchedulePlanner";
import PasswordResetPage from "./pages/PasswordResetPage";

import "./styles/theme.css";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check session on page load
  useEffect(() => {
    const rememberedUser = localStorage.getItem('rememberedUser');
    const sessionActive = sessionStorage.getItem('sessionActive');
    
    fetch("/session", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (data.status === "SUCCESS" && data.user) {
          // If user has session but no remember me and no active session flag, force logout
          if (!rememberedUser && !sessionActive) {
            fetch("/logout", {
              method: "POST",
              credentials: "include",
            }).then(() => setUser(null)).catch(() => setUser(null));
          } else {
            setUser(data.user);
            // Set session active flag if user is logged in
            if (!rememberedUser) {
              sessionStorage.setItem('sessionActive', 'true');
            }
          }
        } else {
          setUser(null);
          // Clear stored data if session is invalid
          if (rememberedUser) {
            localStorage.removeItem('rememberedUser');
          }
          sessionStorage.removeItem('sessionActive');
        }
      })
      .catch(() => {
        setUser(null);
        sessionStorage.removeItem('sessionActive');
      })
      .finally(() => setLoading(false));
  }, []);

  // Handle window closing/refreshing
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      const rememberedUser = localStorage.getItem('rememberedUser');
      
      // If remember me is not checked, clear session on page close
      if (!rememberedUser && user) {
        // Use sendBeacon for reliable logout on page close
        navigator.sendBeacon('/logout', new FormData());
        sessionStorage.removeItem('sessionActive');
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        const rememberedUser = localStorage.getItem('rememberedUser');
        
        if (!rememberedUser && user) {
          // Clear session when tab becomes hidden (user switches tab/closes browser)
          fetch('/logout', {
            method: 'POST',
            credentials: 'include',
            keepalive: true
          }).catch(() => {});
          sessionStorage.removeItem('sessionActive');
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  // Logout handler
  const handleLogout = () => {
    fetch("/logout", {
      method: "POST",
      credentials: "include",
    })
      .then(() => {
        localStorage.removeItem('rememberedUser');
        sessionStorage.removeItem('sessionActive');
        setUser(null);
      })
      .catch(() => {
        localStorage.removeItem('rememberedUser');
        sessionStorage.removeItem('sessionActive');
        setUser(null);
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
      <Navbar />

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

        {/* PASSWORD RESET */}
        <Route
          path="/password-reset/:token"
          element={<PasswordResetPage />}
        />

        {/* DASHBOARD */}
        <Route
          path="/dashboard"
          element={
            user ? (
              <Dashboard user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* SCHEDULE PLANNER */}
        <Route
          path="/planner"
          element={
            user ? (
              <SchedulePlanner user={user} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* PROFILE */}
        <Route
          path="/profile"
          element={
            user ? (
              <ProfilePage
                user={user}
                onUserUpdate={handleUserUpdate}
                onLogout={handleLogout}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* DEFAULT ROUTE - Always redirect to login page */}
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />
      </Routes>
    </Router>
  );
}

export default App;