import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="mq-navbar">
      <div className="mq-navbar__inner">
        <Link to="/dashboard" className="mq-brand" onClick={closeMenu}>
          <span className="mq-brand__mark" aria-hidden="true">MQ</span>
          <span>MediQuery</span>
        </Link>

        <button
          type="button"
          className="mq-navbar__toggle"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          aria-controls="authenticated-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span aria-hidden="true">{menuOpen ? "×" : "☰"}</span>
        </button>

        <div
          id="authenticated-navigation"
          className={`mq-navbar__menu${menuOpen ? " mq-navbar__menu--open" : ""}`}
        >
          <nav className="mq-navbar__links" aria-label="Main navigation">
            <NavLink to="/dashboard" end className="mq-navbar__link" onClick={closeMenu}>
              Dashboard
            </NavLink>
            <NavLink to="/upload" className="mq-navbar__link" onClick={closeMenu}>
              Upload report
            </NavLink>
            <NavLink to="/trends" className="mq-navbar__link" onClick={closeMenu}>
              Trends
            </NavLink>
            <NavLink to="/profile" className="mq-navbar__link" onClick={closeMenu}>
              Profile
            </NavLink>
          </nav>

          <div className="mq-navbar__account">
            <span className="mq-navbar__name" title={user?.name}>
              {user?.name}
            </span>
            <Button variant="danger" size="sm" onClick={handleLogout}>
              Log out
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
