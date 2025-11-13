// App.js
import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import SchedulePlanner from "./pages/SchedulePlanner";
import "./styles/theme.css";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check session when app loads
  useEffect(() => {
    fetch("/session", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (data.status === "SUCCESS") {
          setUser(data.user);
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  // Logout
  const handleLogout = () => {
    fetch("/logout", { method: "POST", credentials: "include" })
      .then(() => setUser(null))
      .catch(() => setUser(null));
  };

  if (loading) return <div style={{ textAlign: "center", marginTop: "4rem" }}>Loading...</div>;

  return (
    <Router>
      {user && <Navbar onLogout={handleLogout} />}

      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" replace /> : <LoginPage onLogin={setUser} />}
        />
        <Route
          path="/dashboard"
          element={user ? <Dashboard user={user} onLogout={handleLogout} /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/"
          element={
            user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/planner"
          element={user ? <SchedulePlanner user={user} /> : <Navigate to="/login" replace />}
        />
      </Routes>
    </Router>
  );
}

export default App;