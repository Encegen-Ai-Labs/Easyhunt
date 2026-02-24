import React, { useEffect, useState } from "react";
import { authFetch } from "../auth";
import { endpoints } from "../api";
import "../styles/dashboardPage.css";
import { FiDatabase, FiFileText, FiDownload } from "react-icons/fi";

export default function Dashboard() {

  const [stats, setStats] = useState({
    total_data_fetched: 0,
    total_entries: 0,
    total_export: 0
  });

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const res = await authFetch(endpoints.stats);
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.log("Failed to load stats");
    }
  }

  return (
    <div className="dashboard-page">

      {/* WELCOME */}
      <h1 className="welcome-title">
        Welcome to EasyHunt!
      </h1>

      {/* STAT CARDS */}
     {/* STAT CARDS */}
<div className="stats-grid">

  <div className="stat-card pink">
    <div className="stat-icon blue">
      <FiDatabase />
    </div>
    <div className="stat-number">{stats.total_data_fetched}</div>
    <div className="stat-label">Total data fetched</div>
  </div>

  <div className="stat-card purple">
    <div className="stat-icon violet">
      <FiFileText />
    </div>
    <div className="stat-number">{stats.total_entries}</div>
    <div className="stat-label">Total Entries</div>
  </div>

  <div className="stat-card green">
    <div className="stat-icon green-icon">
      <FiDownload />
    </div>
    <div className="stat-number">{stats.total_export}</div>
    <div className="stat-label">Total Export</div>
  </div>

</div>
      {/* ABOUT */}
      <div className="about-box">
        <h3>About the product</h3>
        <p>
          EasyHunt is a simple, powerful web platform built for fast property
          document searches. It pulls government land records from scattered
          Excel files into one easy system — no slow portals or manual digging.
        </p>
       <a 
  href="https://easy-hunt-landing-rho.vercel.app/" 
  target="_blank" 
  rel="noopener noreferrer"
>
  <button className="plan-btn">Get details</button>
</a>
      </div>

      {/* HOW IT WORKS */}
      <div className="how-section">
        <h2 className="how-title">How it works</h2>

        <div className="how-grid">

          <div className="how-card">
            <div className="how-img">⬆️</div>
            <h4>Upload</h4>
            <p>
              Upload your registry Excel files. System securely processes and
              organizes the data automatically.
            </p>
          </div>

          <div className="how-card">
            <div className="how-img">🔎</div>
            <h4>Search</h4>
            <p>
              Search records instantly using name, survey number or document
              number across all uploaded data.
            </p>
          </div>

          <div className="how-card">
            <div className="how-img">📄</div>
            <h4>Select Entries</h4>
            <p>
              Choose required records and prepare your selected list for
              further processing.
            </p>
          </div>

          <div className="how-card">
            <div className="how-img">📝</div>
            <h4>Export to Word</h4>
            <p>
              Export selected data into a formatted Word document ready for
              office use or legal documentation.
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}