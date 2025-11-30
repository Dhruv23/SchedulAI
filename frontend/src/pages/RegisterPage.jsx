// src/pages/RegisterPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function splitFullName(fullName) {
  if (!fullName) return { first: "", last: "" };
  const parts = fullName.trim().split(" ");
  if (parts.length <= 1) return { first: parts[0] || "", last: "" };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

function RegisterPage({ onLogin }) {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    major: "",
    grad_year: "",
    grad_quarter: "Fall",
    pronouns: "",
    bio: ""
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const validatePassword = (password) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validation
    if (!formData.first_name.trim()) {
      setError("First name is required");
      setLoading(false);
      return;
    }

    if (!formData.last_name.trim()) {
      setError("Last name is required");
      setLoading(false);
      return;
    }

    if (!formData.email.trim()) {
      setError("Email is required");
      setLoading(false);
      return;
    }

    if (!validateEmail(formData.email)) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    if (!formData.password) {
      setError("Password is required");
      setLoading(false);
      return;
    }

    if (!validatePassword(formData.password)) {
      setError("Password must be at least 8 characters long and include one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)");
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (!formData.major.trim()) {
      setError("Major is required");
      setLoading(false);
      return;
    }

    if (!formData.grad_year) {
      setError("Graduation year is required");
      setLoading(false);
      return;
    }

    if (!formData.grad_quarter) {
      setError("Graduation quarter is required");
      setLoading(false);
      return;
    }

    try {
      // Combine first and last name for backend
      const fullName = `${formData.first_name} ${formData.last_name}`.trim();
      
      const payload = {
        full_name: fullName,
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        major: formData.major.trim(),
        grad_year: parseInt(formData.grad_year),
        grad_quarter: formData.grad_quarter,
        pronouns: formData.pronouns.trim(),
        bio: formData.bio.trim()
      };

      const res = await fetch("/student/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.status === "SUCCESS") {
        // Auto-login after successful registration
        if (data.student) {
          onLogin(data.student);
          navigate("/");
        } else {
          navigate("/login");
        }
      } else {
        setError(data.message || "Registration failed. Please try again.");
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError("Server error, please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: "500px" }}>
        <div className="auth-header">
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">
            Join SchedulAI to track your degree progress and plan your courses.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>First Name <span style={{color: "#dc2626"}}>*</span></label>
            <input
              type="text"
              value={formData.first_name}
              onChange={(e) => handleChange("first_name", e.target.value)}
              placeholder="Enter your first name"
              style={{
                width: "100%",
                padding: "0.6rem 0.85rem",
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                fontSize: "1rem",
                backgroundColor: "#f9fafb",
                fontFamily: "inherit",
                transition: "border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease"
              }}
              required
            />
          </div>

          <div className="form-group">
            <label>Last Name <span style={{color: "#dc2626"}}>*</span></label>
            <input
              type="text"
              value={formData.last_name}
              onChange={(e) => handleChange("last_name", e.target.value)}
              placeholder="Enter your last name"
              style={{
                width: "100%",
                padding: "0.6rem 0.85rem",
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                fontSize: "1rem",
                backgroundColor: "#f9fafb",
                fontFamily: "inherit",
                transition: "border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease"
              }}
              required
            />
          </div>

          <div className="form-group">
            <label>Email <span style={{color: "#dc2626"}}>*</span></label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="Enter your email address"
              style={{
                width: "100%",
                padding: "0.6rem 0.85rem",
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                fontSize: "1rem",
                backgroundColor: "#f9fafb",
                fontFamily: "inherit",
                transition: "border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease"
              }}
              required
            />
          </div>

          <div className="form-group">
            <label>Password <span style={{color: "#dc2626"}}>*</span></label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => handleChange("password", e.target.value)}
              placeholder="Create a password"
              style={{
                width: "100%",
                padding: "0.6rem 0.85rem",
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                fontSize: "1rem",
                backgroundColor: "#f9fafb",
                fontFamily: "inherit",
                transition: "border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease"
              }}
              required
            />
          </div>

          <div className="form-group">
            <label>Confirm Password <span style={{color: "#dc2626"}}>*</span></label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => handleChange("confirmPassword", e.target.value)}
              placeholder="Confirm your password"
              style={{
                width: "100%",
                padding: "0.6rem 0.85rem",
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                fontSize: "1rem",
                backgroundColor: "#f9fafb",
                fontFamily: "inherit",
                transition: "border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease"
              }}
              required
            />
          </div>

          <div className="form-group">
            <label>Major <span style={{color: "#dc2626"}}>*</span></label>
            <input
              type="text"
              value={formData.major}
              onChange={(e) => handleChange("major", e.target.value)}
              placeholder="Enter your major"
              style={{
                width: "100%",
                padding: "0.6rem 0.85rem",
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                fontSize: "1rem",
                backgroundColor: "#f9fafb",
                fontFamily: "inherit",
                transition: "border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease"
              }}
              required
            />
          </div>

          <div className="form-group">
            <label>Expected Graduation <span style={{color: "#dc2626"}}>*</span></label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <select
                value={formData.grad_quarter}
                onChange={(e) => handleChange("grad_quarter", e.target.value)}
                style={{
                  flex: 1,
                  padding: "0.6rem 0.85rem",
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                  fontSize: "1rem",
                  backgroundColor: "#f9fafb",
                  fontFamily: "inherit",
                  transition: "border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease"
                }}
                required
              >
                <option value="Fall">Fall</option>
                <option value="Spring">Spring</option>
              </select>
              <input
                type="number"
                value={formData.grad_year}
                onChange={(e) => handleChange("grad_year", e.target.value)}
                placeholder="Year (e.g., 2025)"
                min="2020"
                max="2035"
                style={{
                  flex: 1,
                  padding: "0.6rem 0.85rem",
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                  fontSize: "1rem",
                  backgroundColor: "#f9fafb",
                  fontFamily: "inherit",
                  transition: "border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease"
                }}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Pronouns (Optional)</label>
            <input
              type="text"
              value={formData.pronouns}
              onChange={(e) => handleChange("pronouns", e.target.value)}
              placeholder="e.g., they/them, she/her, he/him"
              style={{
                width: "100%",
                padding: "0.6rem 0.85rem",
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                fontSize: "1rem",
                backgroundColor: "#f9fafb",
                fontFamily: "inherit",
                transition: "border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease"
              }}
            />
          </div>

          <div className="form-group">
            <label>Bio (Optional)</label>
            <textarea
              value={formData.bio}
              onChange={(e) => handleChange("bio", e.target.value)}
              placeholder="Tell us about yourself (optional)"
              rows="3"
              style={{
                width: "100%",
                padding: "0.6rem 0.85rem",
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                fontSize: "1rem",
                backgroundColor: "#f9fafb",
                fontFamily: "inherit",
                resize: "vertical",
                transition: "border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease"
              }}
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button
            type="submit"
            className="primary-button auth-submit"
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>

          <p style={{ fontSize: "0.85rem", color: "#666", marginTop: "1rem", textAlign: "center" }}>
            <span style={{color: "#dc2626"}}>*</span> indicates required field
          </p>

          <div style={{ textAlign: "center", marginTop: "1rem" }}>
            <span style={{ color: "#666", fontSize: "0.9rem" }}>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => navigate("/login")}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--scu-red, #a3172e)",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  padding: "0",
                  textDecoration: "none",
                  transition: "text-decoration 0.2s ease"
                }}
                onMouseEnter={(e) => e.target.style.textDecoration = "underline"}
                onMouseLeave={(e) => e.target.style.textDecoration = "none"}
              >
                Sign In
              </button>
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RegisterPage;