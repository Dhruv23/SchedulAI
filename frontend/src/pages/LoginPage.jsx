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

  // If user is already logged in, redirect to landing page
  if (user) {
    navigate("/landing");
    return null;
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

        // Redirect logic based on role
        if (userWithRole.role === "admin") {
          navigate("/admin");
        } else {
          navigate("/landing"); // Always go to landing page for regular users
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
