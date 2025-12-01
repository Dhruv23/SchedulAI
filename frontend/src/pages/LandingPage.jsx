import { useNavigate } from "react-router-dom";
import "../styles/theme.css";

function LandingPage({ user, onLogout }) {
  const navigate = useNavigate();

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
      onLogout(); // Clear user state
      navigate("/login"); // Redirect to login
    } catch (err) {
      console.error("Logout error:", err);
      localStorage.removeItem('userSession');
      sessionStorage.removeItem('userSession');
      localStorage.removeItem('rememberMe');
      onLogout(); // Clear user state anyway
      navigate("/login");
    }
  };

  if (!user) {
    // If no user, redirect to login
    navigate("/login");
    return null;
  }

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
          <div className="landing-navigation">
            <button 
              className="landing-nav-button"
              onClick={() => navigate("/dashboard")}
            >
              <div className="landing-nav-content">
                <h3>Dashboard</h3>
                <p>View your academic progress and overview</p>
              </div>
            </button>

            <button 
              className="landing-nav-button"
              onClick={() => navigate("/planner")}
            >
              <div className="landing-nav-content">
                <h3>Schedule Planner</h3>
                <p>Plan your courses for upcoming quarters</p>
              </div>
            </button>

            <button 
              className="landing-nav-button"
              onClick={() => navigate("/profile")}
            >
              <div className="landing-nav-content">
                <h3>My Profile</h3>
                <p>Manage your account and preferences</p>
              </div>
            </button>
          </div>

          <div className="auth-footer" style={{ marginTop: "2rem" }}>
            <button 
              type="button" 
              className="auth-link-button"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;