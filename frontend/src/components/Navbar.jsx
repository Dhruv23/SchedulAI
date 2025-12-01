// components/Navbar.jsx
import { Link } from "react-router-dom";

function Navbar({ user }) {
  return (
    <nav className="navbar">
      {/* Logo / App Name */}
      <Link 
        to={user?.role === 'admin' ? "/admin/landing" : "/landing"} 
        style={{ 
          fontWeight: "bold", 
          fontSize: "1.25rem", 
          textDecoration: "none", 
          color: "inherit",
          cursor: "pointer"
        }}
      >
        SchedulAI
      </Link>

      {/* Navigation Links - Only show when user is logged in */}
      {user && (
        <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
          {user.role === 'admin' ? (
            // Admin Navigation
            <>
              <Link to="/admin/dashboard">Admin Dashboard</Link>
              <Link to="/admin/users">User Management</Link>
              <Link to="/admin/profile">My Profile</Link>
            </>
          ) : (
            // Student Navigation
            <>
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/planner">Schedule Planner</Link>
              <Link to="/profile">My Profile</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}

export default Navbar;