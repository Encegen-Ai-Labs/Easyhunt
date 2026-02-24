// pages/Profile.jsx
import React, { useEffect, useState } from "react";
import { authFetch } from "../auth";
import { endpoints } from "../api";
import "../styles/Profile.css";
import { toast } from "react-toastify";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { getUser } from "../auth";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
const user = getUser();
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    name: "",
    password: ""
  });

  const [errors, setErrors] = useState({
    name: "",
    password: ""
  });

  /* ---------------- LOAD PROFILE ---------------- */
  async function loadProfile() {
    setLoading(true);
    try {
      const res = await authFetch(endpoints.profile);
      const data = await res.json();
      setProfile(data);
      setForm({ name: data.name, password: "" });
    } catch {
      toast.error("Failed to load profile");
    }
    setLoading(false);
  }

  useEffect(() => {
    loadProfile();
  }, []);

  /* ---------------- VALIDATION ---------------- */
  function validate() {
    const newErrors = { name: "", password: "" };
    let valid = true;

    if (!form.name.trim()) {
      newErrors.name = "Name cannot be empty";
      valid = false;
    }

    if (form.password && form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  }

  /* ---------------- UPDATE PROFILE ---------------- */
  async function updateProfile(e) {
    e.preventDefault();

    if (!validate()) return;

    const body = {};
    if (form.name !== profile.name) body.name = form.name;
    if (form.password.trim() !== "") body.password = form.password;

    if (Object.keys(body).length === 0) {
      toast.info("No changes detected");
      return;
    }

    setSaving(true);

    try {
      const res = await authFetch(endpoints.updateProfile, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Update failed");
        setSaving(false);
        return;
      }

      // messages
      if (body.name) toast.success("Name updated successfully");
      if (body.password) toast.success("Password changed successfully");

      setEditing(false);
      loadProfile();

    } catch {
      toast.error("Server error");
    }

    setSaving(false);
  }

  if (loading) return <div className="loading">Loading profile...</div>;

  return (
    <div className="profile-container">

  {/* VIEW MODE */}
{!editing && (
  <div className="profile-card">
<div className="profile-left">
  <svg className="profile-avatar" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="50" fill="#4f46e5" />
    <text
      x="50"
      y="55"
      textAnchor="middle"
      fill="#ffffff"
      fontSize="40"
      fontWeight="600"
      fontFamily="Arial, sans-serif"
    >
      {(user?.name || "U").charAt(0).toUpperCase()}
    </text>
  </svg>
</div>
    <div className="profile-right">
      {/* <h2 className="profile-heading">
        Hello, {profile.name} 👋
      </h2> */}

      <p>
        <span className="blue-label">Name</span> - {profile.name}
      </p>

      <p>
        <span className="blue-label">Email</span> - {profile.email}
      </p>

      <p>
        <span className="blue-label">Joined</span> -{" "}
        {new Date(profile.created_at).toLocaleString()}
      </p>

      <p>
        <span className="red-label">Subscription Validity</span> -{" "}
        {profile.expiry_date
          ? new Date(profile.expiry_date).toLocaleString()
          : "none"}
      </p>

      <button
        onClick={() => setEditing(true)}
        className="edit-btn"
      >
        Edit Account
      </button>
    </div>

  </div>
)}

      {/* EDIT MODE */}
      {editing && (
        <form onSubmit={updateProfile} className="card form-card">

          {/* NAME */}
          <label className="label">Name:</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => {
              setForm({ ...form, name: e.target.value });
              setErrors({ ...errors, name: "" });
            }}
            className={`input ${errors.name ? "input-error" : ""}`}
          />
          {errors.name && <span className="error-text">{errors.name}</span>}

          {/* PASSWORD */}
          <label className="label">New Password (optional):</label>

          <div className="password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Leave blank to keep current"
              value={form.password}
              onChange={(e) => {
                setForm({ ...form, password: e.target.value });
                setErrors({ ...errors, password: "" });
              }}
              className={`input ${errors.password ? "input-error" : ""}`}
            />

            <span
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEye /> : <FaEyeSlash />}
            </span>
          </div>
          {errors.password && <span className="error-text">{errors.password}</span>}

          {/* BUTTONS */}
          <div className="btn-group">
            <button className="btn success" type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>

            <button
              className="btn secondary"
              type="button"
              disabled={saving}
              onClick={() => setEditing(false)}
            >
              Cancel
            </button>
          </div>

        </form>
      )}
    </div>
  );
}
