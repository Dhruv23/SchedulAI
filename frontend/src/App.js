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
import Dashboard from "./pages/Dashboard";
import ProfilePage from "./pages/ProfilePage";
import SchedulePlanner from "./pages/SchedulePlanner";

import "./styles/theme.css";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check session on page load
  useEffect(() => {
    fetch("/session", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (data.status === "SUCCESS" && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  // Logout handler
  const handleLogout = () => {
    fetch("/logout", {
      method: "POST",
      credentials: "include",
    })
      .then(() => setUser(null))
      .catch(() => setUser(null));
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
          element={
            user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <LoginPage onLogin={setUser} />
            )
          }
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

        {/* DEFAULT ROUTE */}
        <Route
          path="/"
          element={
            user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;