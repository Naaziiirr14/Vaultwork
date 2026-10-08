import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext.jsx";
import Logo from "./Logo.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const links = user
    ? [
        { to: "/dashboard", label: "Dashboard" },
        { to: "/jobs", label: "Browse jobs", end: true },
        ...(user.role === "client" ? [{ to: "/jobs/new", label: "Post a job" }] : []),
        { to: "/disputes", label: "Disputes" },
      ]
    : [];

  return (
    <header className="nav">
      <div className="nav-inner">
        <Logo />
        <nav className="nav-links" aria-label="Main">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className="nav-link">
              {({ isActive }) => (
                <>
                  {l.label}
                  {isActive && <motion.span layoutId="nav-underline" className="nav-underline" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="nav-user">
          {user ? (
            <>
              <span className="nav-who">
                <b>{user.name}</b>
                <small>{user.role}</small>
              </span>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  logout();
                  navigate("/");
                }}
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="nav-link plain">
                Sign in
              </NavLink>
              <NavLink to="/register" className="btn btn-primary btn-sm">
                Create account
              </NavLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
