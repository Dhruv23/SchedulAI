import { useNavigate } from "react-router-dom";
import "../styles/theme.css";

function AdminLandingPage({ user, onLogout }) {
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
  const firstName = user.full_name ? user.full_name.split(" ")[0] : "Admin";
  
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
              onClick={() => navigate("/admin/dashboard")}
            >
              <div className="landing-nav-content">
                <h3>Admin Dashboard</h3>
                <p>Manage users, view analytics and system overview</p>
              </div>
            </button>

            <button 
              className="landing-nav-button"
              onClick={() => navigate("/admin/users")}
            >
              <div className="landing-nav-content">
                <h3>User Management</h3>
                <p>Create, edit, and manage student accounts</p>
              </div>
            </button>

            <button 
              className="landing-nav-button"
              onClick={() => navigate("/admin/profile")}
            >
              <div className="landing-nav-content">
                <h3>My Profile</h3>
                <p>Manage your admin account settings</p>
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

export default AdminLandingPage;