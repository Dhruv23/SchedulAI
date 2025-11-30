// src/pages/LoginPage.jsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function LoginPage({ onLogin, user }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Check for error parameters (like invalid reset link)
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const errorParam = urlParams.get('error');
    
    if (errorParam === 'invalid_reset_link') {
      setError("The password reset link is invalid or has expired. Please request a new one.");
    }
  }, [location]);

  // Check for remembered login on component mount
  useEffect(() => {
    const rememberedUser = localStorage.getItem('rememberedUser');
    if (rememberedUser && !user) {
      // Try to restore session
      fetch('/session', {
        method: 'GET',
        credentials: 'include',
      })
      .then(response => response.json())
      .then(data => {
        if (data.status === 'SUCCESS' && data.user) {
          onLogin(data.user);
          navigate('/');
        } else {
          // Remove invalid remembered user
          localStorage.removeItem('rememberedUser');
        }
      })
      .catch(err => {
        console.error('Session check error:', err);
        localStorage.removeItem('rememberedUser');
      });
    }
  }, [navigate, onLogin, user]);

  const handleLogout = async () => {
    try {
      await fetch("/logout", {
        method: "POST",
        credentials: "include",
      });
      // Clear remembered user
      localStorage.removeItem('rememberedUser');
      sessionStorage.removeItem('sessionActive');
      onLogin(null); // Clear user state
      window.location.reload(); // Refresh to show login form
    } catch (err) {
      console.error("Logout error:", err);
      localStorage.removeItem('rememberedUser');
      sessionStorage.removeItem('sessionActive');
      onLogin(null); // Clear user state anyway
      window.location.reload();
    }
  };

  const handleForgotPassword = async () => {
    const userEmail = prompt("Please enter your email address:");
    if (!userEmail) return;

    try {
      const res = await fetch("/user/password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail.trim().toLowerCase() }),
      });

      const data = await res.json();
      
      if (data.status === "SUCCESS") {
        alert("If the email is registered, a password reset link has been sent to your email.");
      } else {
        alert(data.message || "An error occurred. Please try again.");
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      alert("An error occurred. Please try again.");
    }
  };

  // If user is already logged in, show welcome back message
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
        // Save to localStorage if remember me is checked
        if (rememberMe) {
          localStorage.setItem('rememberedUser', 'true');
        } else {
          localStorage.removeItem('rememberedUser');
          // Set session active flag for non-remembered sessions
          sessionStorage.setItem('sessionActive', 'true');
        }
        
        onLogin(data.user);
        navigate("/");
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
          <h1 className="auth-title">User Login</h1>
          <p className="auth-subtitle">
            Sign in to view your account details and access its features.
          </p>
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
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center", 
              marginTop: "0.5rem" 
            }}>
              <label style={{
                display: "flex",
                alignItems: "center",
                fontSize: "0.9rem",
                color: "#666",
                cursor: "pointer"
              }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{
                    marginRight: "0.5rem",
                    cursor: "pointer"
                  }}
                />
                Remember me
              </label>
              
              <button
                type="button"
                onClick={handleForgotPassword}
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
                Forgot Password?
              </button>
            </div>
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button
            type="submit"
            className="primary-button auth-submit"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/register")}
            style={{
              width: "100%",
              padding: "0.65rem 1.5rem",
              marginTop: "-0.5rem",
              backgroundColor: "#f5f5f5",
              color: "#666",
              border: "1px solid #ddd",
              borderRadius: "999px",
              fontSize: "0.95rem",
              cursor: "pointer",
              fontWeight: "500",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#e8e8e8";
              e.target.style.borderColor = "#ccc";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "#f5f5f5";
              e.target.style.borderColor = "#ddd";
            }}
          >
            Register
          </button>

          <p className="auth-hint">
            Demo account (student): <code>testuser@example.com</code> /{" "}
            <code>Password1!</code>
          </p>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
