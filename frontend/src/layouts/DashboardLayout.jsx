import React, { useContext } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { getUser } from "../auth";
import Sidebar from "../components/Sidebar";
import { FooterContext } from "./AppLayout";
import "../styles/dashboard.css";

export default function DashboardLayout() {

  const navigate = useNavigate();
  const user = getUser();

  const footerCtx = useContext(FooterContext);
  const footerButtons = footerCtx?.footerButtons;

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  return (
    <div className="dashboard">

      <Sidebar />

      <div className="main-area">

        <div className="top-header">
          <h2 className="page-title">Dashboard</h2>

          <div className="profile-box" onClick={() => navigate("/profile")}>
            <div className="avatar">{initial}</div>
            <div className="profile-info">
              <span className="profile-name">{user?.name || "User"}</span>
              <span className="profile-email">{user?.email}</span>
            </div>
          </div>
        </div>

        <div className="content-area">
          <Outlet />
        </div>

        {/* REAL FOOTER */}
        <div className="global-footer">
          <div className="footer-actions">
            {footerButtons}
          </div>
        </div>

      </div>
    </div>
  );
}