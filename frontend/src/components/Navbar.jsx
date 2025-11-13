import { Link } from "react-router-dom";
import "../styles/theme.css";

function Navbar({ onLogout }) {
  return (
    <nav className="navbar">
      <div className="navbar-left">
        <strong>SchedulAI</strong>
      </div>

      <div className="navbar-right">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/planner">Schedule Planner</Link>
      </div>
    </nav>
  );
}

export default Navbar;
