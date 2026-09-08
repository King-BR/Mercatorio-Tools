import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

import "./TopNavbar.css";

function TopNavbar() {
  const { user } = useAuth();
  const isAccountPage = window.location.pathname === "/account";
  const isHomePage = window.location.pathname === "/";

  return (
    <nav className="top-navbar">
      <Link to="/" className="navbar-logo">
        MERCATORIO TOOLS
      </Link>

      <div className="navbar-actions">
        {!isHomePage && (
          <Link to="/" className="navbar-home-button">
            Home
          </Link>
        )}

        {!isAccountPage && (
          <Link
            to={user ? "/account" : "/login"}
            className="navbar-account-button"
          >
            {user ? "My Account" : "Login"}
          </Link>
        )}
      </div>
    </nav>
  );
}

export default TopNavbar;
