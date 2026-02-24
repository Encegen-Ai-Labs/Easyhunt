import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { clearToken, getRole, getUser } from "../auth";
import "../styles/sidebar.css";
import { FiHelpCircle } from "react-icons/fi";

import {
  IoGridOutline,
  IoCloudUploadOutline,
  IoSearchOutline,
  IoListOutline,
  IoSettingsOutline,
  IoLogOutOutline,
  IoMenuOutline
} from "react-icons/io5";

export default function Sidebar() {

  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const role = getRole();
  const user = getUser();

  function logout() {
    clearToken();
    sessionStorage.removeItem("searchState");
    navigate("/login");
    window.location.reload();
  }

  const isActive = (path) =>
    location.pathname.startsWith(path) ? "active" : "";

  return (
    <div className={`sidebar ${collapsed ? "collapsed" : ""}`}>

      {/* TOP */}
      <div className="sidebar-top">
        <div className="logo">{!collapsed && "EasyHunt"}</div>

        <button
          className="collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
        >
          <IoMenuOutline />
        </button>
      </div>

      {/* NAVIGATION */}
      <nav className="sidebar-links">

        {/* Dashboard (both roles) */}
        <Link className={isActive("/dashboard")} to="/dashboard">
          <IoGridOutline />
          <span>Dashboard</span>
        </Link>

        {/* USER MENU */}
        {role === "user" && (
          <>
            <Link className={isActive("/upload")} to="/upload">
              <IoCloudUploadOutline />
              <span>Upload</span>
            </Link>

            <Link className={isActive("/search")} to="/search">
              <IoSearchOutline />
              <span>Search</span>
            </Link>

            <Link className={isActive("/selected")} to="/selected">
              <IoListOutline />
              <span>Selected Entries</span>
            </Link>
          </>
        )}

        {/* ADMIN MENU */}
        {role === "admin" && (
          <>
            <Link className={isActive("/admin")} to="/admin">
              <IoSettingsOutline />
              <span>Admin Panel</span>
            </Link>

            <Link className={isActive("/register")} to="/register">
              <IoListOutline />
              <span>Add User</span>
            </Link>
          </>
        )}
      </nav>
<button className="help-btn">
  <FiHelpCircle />
  {!collapsed && <span>Help and Support</span>}
</button>



      {/* BOTTOM USER INFO */}
      <div className="sidebar-bottom">

        

        <button className="logout-btn" onClick={logout}>
          <IoLogOutOutline />
          {!collapsed && <span>Log out</span>}
        </button>

      </div>
    </div>
  );
}