// components/Navbar.jsx
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="navbar">
      {/* Logo / App Name */}
      <div style={{ fontWeight: "bold", fontSize: "1.25rem" }}>
        SchedulAI
      </div>

      {/* Navigation Links */}
      <div style={{ display: "flex", gap: "1.5rem" }}>
        <Link
          to="/dashboard"
        >
          Dashboard
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;