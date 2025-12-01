import { useState } from "react";
import { useNavigate } from "react-router-dom";

function LoginPage({ onLogin, user }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch("/logout", {
        method: "POST",
        credentials: "include",
      });
      // Clear all session data
      localStorage.removeItem('userSession');
      sessionStorage.removeItem('userSession');
      localStorage.removeItem('rememberMe');
      onLogin(null); // Clear user state
      window.location.reload(); // Refresh to show login form
    } catch (err) {
      console.error("Logout error:", err);
      localStorage.removeItem('userSession');
      sessionStorage.removeItem('userSession');
      localStorage.removeItem('rememberMe');
      onLogin(null); // Clear user state anyway
      window.location.reload();
    }
  };

  // If user is already logged in, show landing page
  if (user) {
    // Extract first name from full name
    const firstName = user.full_name ? user.full_name.split(" ")[0] : "User";
    
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-title">Welcome Back, {firstName}!</h1>
            <p className="auth-subtitle">
              Where would you like to go?
            </p>
          </div>
          
          <div className="auth-form">
            <button 
              onClick={() => navigate("/dashboard")} 
              className="primary-button auth-submit"
              style={{ marginBottom: "10px" }}
            >
              Dashboard
            </button>
            <button 
              onClick={() => navigate("/planner")} 
              className="primary-button auth-submit"
              style={{ marginBottom: "10px" }}
            >
              Schedule Planner
            </button>
            <button 
              onClick={() => navigate("/profile")} 
              className="primary-button auth-submit"
              style={{ marginBottom: "10px" }}
            >
              Profile
            </button>
            <button 
              onClick={handleLogout} 
              className="primary-button auth-submit"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await res.json();

      if (data.status === "SUCCESS" && data.user) {
        // Add a temporary role to the user object
        const userWithRole = {
          ...data.user,
          role: isAdminLogin ? "admin" : "student",
        };

        // Handle Remember Me functionality
        if (rememberMe) {
          // Store in localStorage for persistent sessions
          localStorage.setItem('rememberMe', 'true');
          localStorage.setItem('userSession', JSON.stringify(userWithRole));
        } else {
          // Store only in sessionStorage for this session
          sessionStorage.setItem('userSession', JSON.stringify(userWithRole));
          localStorage.removeItem('rememberMe');
          localStorage.removeItem('userSession');
        }

        onLogin(userWithRole);

        // Redirect logic based on Remember Me and role
        if (userWithRole.role === "admin") {
          navigate("/admin");
        } else {
          if (rememberMe) {
            navigate("/"); // Go to landing page for Remember Me users
          } else {
            navigate("/dashboard"); // Go directly to dashboard for regular login
          }
        }

      } else {
        setError(data.message || "Invalid email or password.");
      }

    } catch (err) {
      console.error("Login error:", err);
      setError("Server error, please try again.");

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">
            {isAdminLogin ? "Admin Login" : "Student Login"}
          </h1>
          <p className="auth-subtitle">
            {isAdminLogin
              ? "Sign in to access the admin dashboard and manage students."
              : "Sign in to view your dashboard, profile, and degree progress."}
          </p>
        </div>

        {/* Admin/Student toggle */}
        <div style={{ marginBottom: "1.5rem", display: "flex", gap: "1.5rem" }}>
          <label style={{ cursor: "pointer" }}>
            <input
              type="radio"
              name="loginType"
              checked={!isAdminLogin}
              onChange={() => setIsAdminLogin(false)}
              style={{ marginRight: "0.4rem" }}
            />
            Student
          </label>

          <label style={{ cursor: "pointer" }}>
            <input
              type="radio"
              name="loginType"
              checked={isAdminLogin}
              onChange={() => setIsAdminLogin(true)}
              style={{ marginRight: "0.4rem" }}
            />
            Admin
          </label>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="email" className="auth-label">Email</label>
            <input
              id="email"
              type="email"
              className="auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password" className="auth-label">Password</label>
            <input
              id="password"
              type="password"
              className="auth-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: "-0.25rem", marginTop: "-0.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label style={{ display: "flex", alignItems: "center", cursor: "pointer", fontSize: "0.9rem" }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ marginRight: "0.5rem" }}
              />
              Remember Me
            </label>
            
            <button
              type="button"
              onClick={() => alert("Password reset functionality coming soon!")}
              style={{
                background: "none",
                border: "none",
                color: "var(--scu-red, #a3172e)",
                cursor: "pointer",
                fontSize: "0.9rem",
                textDecoration: "none",
                transition: "text-decoration 0.2s ease",
                padding: "0"
              }}
              onMouseEnter={(e) => e.target.style.textDecoration = "underline"}
              onMouseLeave={(e) => e.target.style.textDecoration = "none"}
            >
              Forgot password?
            </button>
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button
            type="submit"
            className="primary-button auth-submit"
            disabled={loading}
            style={{ marginBottom: "0.5rem" }}
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/register")}
            className="primary-button"
            style={{
              backgroundColor: "#f3f4f6",
              color: "#374151",
              border: "1px solid #d1d5db",
              marginTop: "-1rem"
            }}
          >
            Register
          </button>

          <p className="auth-hint">
            Demo: <code>testuser@example.com</code> / <code>Password1!</code>
          </p>

        </form>
      </div>
    </div>
  );
}

export default LoginPage;
