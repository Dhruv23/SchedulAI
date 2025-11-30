// src/pages/PasswordResetPage.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

function PasswordResetPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [validatingToken, setValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);

  // Validate token when component mounts
  useEffect(() => {
    if (token) {
      // Assume token is valid since user got to this page from email
      // We'll validate it when they actually submit the form
      setTokenValid(true);
      setValidatingToken(false);
    } else {
      setError("No reset token provided.");
      setValidatingToken(false);
    }
  }, [token]);

  const validatePassword = (password) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!validatePassword(newPassword)) {
      setError("Password must be at least 8 characters long and include one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&).");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/user/password/reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: token,
          new_password: newPassword
        }),
      });

      const data = await res.json();

      if (data.status === "SUCCESS") {
        setSuccess("Password reset successfully! Redirecting to login...");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        setError(data.message || "Failed to reset password.");
      }
    } catch (err) {
      console.error("Password reset error:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (validatingToken) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-title">Validating Reset Link...</h1>
          </div>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-title">Invalid Reset Link</h1>
            <p className="auth-subtitle">
              {error || "This password reset link is invalid or has expired."}
            </p>
          </div>
          <div className="auth-form">
            <button 
              onClick={() => navigate("/login")} 
              className="primary-button auth-submit"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Reset Password</h1>
          <p className="auth-subtitle">
            Enter your new password below.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="newPassword" className="auth-label">
              New Password
            </label>
            <input
              id="newPassword"
              type="password"
              className="auth-input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="confirmPassword" className="auth-label">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              className="auth-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
            />
          </div>

          <div className="password-requirements">
            <p style={{ fontSize: "0.9rem", color: "#666", marginBottom: "1rem" }}>
              Password requirements:
            </p>
            <ul style={{ fontSize: "0.8rem", color: "#666", marginLeft: "1rem", marginBottom: "1rem" }}>
              <li>At least 8 characters long</li>
              <li>One uppercase letter</li>
              <li>One lowercase letter</li>
              <li>One number</li>
              <li>One special character (@$!%*?&)</li>
            </ul>
          </div>

          {error && <p className="auth-error">{error}</p>}
          {success && <p className="auth-success" style={{ color: "#28a745" }}>{success}</p>}

          <button
            type="submit"
            className="primary-button auth-submit"
            disabled={loading}
          >
            {loading ? "Resetting Password..." : "Reset Password"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/login")}
            className="secondary-button auth-submit"
            style={{ marginTop: "0.5rem" }}
          >
            Back to Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default PasswordResetPage;