// src/pages/LoginPage.jsx
import { useState } from "react";

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAdminLogin, setIsAdminLogin] = useState(false);

  // const handleSubmit = (e) => {
  //   e.preventDefault();

  //   const fakeUser = {
  //     email,
  //     name: "Temporary User",
  //     id: "temp",
  //   };

  //   onLogin(fakeUser);
  // };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
  
    try {
      const res = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
  
      const data = await res.json();
  
      if (data.status === "SUCCESS" && data.user) {
        // Add a temporary role to the user object
const userWithRole = {
  ...data.user,
  role: isAdminLogin ? "admin" : "student",
};

onLogin(userWithRole);

  
        // Temporary redirect based on toggle
        if (userWithRole.role === "admin") {
          window.location.href = "/admin";
        } else {
          window.location.href = "/dashboard";
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
            <label htmlFor="email" className="auth-label">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@scu.edu"
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password" className="auth-label">
              Password
            </label>
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

          {error && <p className="auth-error">{error}</p>}

          <button
            type="submit"
            className="primary-button auth-submit"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          <p className="auth-hint">
            Tip: use <code>testuser@example.com</code> /{" "}
            <code>Password1!</code> for the demo account.
          </p>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
