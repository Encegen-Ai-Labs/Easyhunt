// src/components/Navbar.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { isLoggedIn, clearToken, getRole, getUser } from "../auth";
import "../styles/navbar.css";

// ✅ import logo
import logo from "../assets/logo.png";

export default function Navbar() {
  const navigate = useNavigate();
  const logged = isLoggedIn();
  const role = getRole();
  const user = getUser();
  const [menuOpen, setMenuOpen] = useState(false);

  function logout() {
    clearToken();
    sessionStorage.removeItem("searchState");
    navigate("/login");
    window.location.reload();
    setMenuOpen(false);
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header className="topbar">
      {/* BRAND */}
      <div className="brand">
        <Link to="/" onClick={closeMenu} className="brand-link">
          {/* ✅ Logo added */}
          {/* <img src={logo} alt="EasyHunt Logo" className="brand-logo" /> */}
          <span>EasyHunt</span>
        </Link>
      </div>

      {/* DESKTOP NAV */}
      <nav className="nav-links">
        {!logged && (
          <>
            <Link to="/">Home</Link>
            <Link to="/login">Login</Link>
          </>
        )}

        {logged && role === "admin" && (
          <>
            <Link to="/">Home</Link>
            <Link to="/admin">Admin Panel</Link>
            <Link to="/register">Add User</Link>
            <Link to="/profile">Account</Link>
            <button onClick={logout}>Logout</button>
          </>
        )}

        {logged && role === "user" && (
          <>
            <Link to="/">Home</Link>
            <Link to="/upload">Upload</Link>
            <Link to="/search">Search</Link>
            <Link to="/selected">Selected Entries</Link>
            <Link to="/profile">Account</Link>
            <button onClick={logout}>Logout</button>
          </>
        )}
      </nav>

      {/* HAMBURGER ICON */}
      <div
        className={`hamburger ${menuOpen ? "open" : ""}`}
        onClick={() => setMenuOpen(!menuOpen)}
      >
        <span />
        <span />
        <span />
      </div>

      {/* MOBILE MENU */}
      {menuOpen && (
        <div className="mobile-menu">
          {!logged && (
            <>
              <Link to="/" onClick={closeMenu}>Home</Link>
              <Link to="/login" onClick={closeMenu}>Login</Link>
            </>
          )}

          {logged && role === "admin" && (
            <>
              <Link to="/" onClick={closeMenu}>Home</Link>
              <Link to="/admin" onClick={closeMenu}>Admin Panel</Link>
              <Link to="/register" onClick={closeMenu}>Add User</Link>
              <Link to="/profile" onClick={closeMenu}>Account</Link>
              <button onClick={logout}>Logout</button>
            </>
          )}

          {logged && role === "user" && (
            <>
              <Link to="/" onClick={closeMenu}>Home</Link>
              <Link to="/upload" onClick={closeMenu}>Upload</Link>
              <Link to="/search" onClick={closeMenu}>Search</Link>
              <Link to="/selected" onClick={closeMenu}>Selected Entries</Link>
              <Link to="/profile" onClick={closeMenu}>Account</Link>
              <button onClick={logout}>Logout</button>
            </>
          )}

          <div className="mobile-user">
            {logged ? `Welcome, ${user?.name || "User"}` : "Welcome"}
          </div>
        </div>
      )}

      {/* DESKTOP WELCOME */}
      <div className="welcome-text desktop-only">
        {logged ? `Welcome, ${user?.name || "User"}` : ""}
      </div>
    </header>
  );
}
