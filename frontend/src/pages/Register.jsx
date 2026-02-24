// src/pages/Register.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { endpoints } from "../api";
import { authFetch, getRole } from "../auth";
import { toast } from "react-toastify";
import "../styles/register.css";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    is_admin: false,
    phone1: "",
    phone2: "",
    address: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const role = getRole();

  if (role !== "admin") {
    navigate("/");
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const res = await authFetch(endpoints.adminCreateUser, {
        method: "POST",
        body: form,
      });

      const data = await res.json();
      if (!res.ok) return toast.error(data.error || "Error creating user");

      toast.success("User created");
      navigate("/admin");
    } catch (err) {
      toast.error("Network error");
    }
  }

  return (
    <div className="register-container">
      <div className="register-card">
        <h1>Create User</h1>

        <form onSubmit={handleSubmit} className="register-form">

          <input
            className="register-input"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <input
            className="register-input"
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

<div className="password-wrapper">
  <input
    className="register-input"
    placeholder="Password"
    type={showPassword ? "text" : "password"}
    value={form.password}
    onChange={(e) =>
      setForm({ ...form, password: e.target.value })
    }
  />

  <span
    className="password-toggle"
    onClick={() => setShowPassword(!showPassword)}
  >
    {showPassword ? <FaEyeSlash /> : <FaEye />}
  </span>
</div>



          <input
            className="register-input"
            placeholder="Phone 1"
            value={form.phone1}
            onChange={(e) => setForm({ ...form, phone1: e.target.value })}
          />

          <input
            className="register-input"
            placeholder="Phone 2 (Optional)"
            value={form.phone2}
            onChange={(e) => setForm({ ...form, phone2: e.target.value })}
          />

          <textarea
            className="register-textarea"
            placeholder="Address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />

          <label className="register-checkbox">
            <input
              type="checkbox"
              checked={form.is_admin}
              onChange={(e) => setForm({ ...form, is_admin: e.target.checked })}
            />
            Create as admin
          </label>

          <button type="submit" className="register-btn">
            Create User
          </button>
        </form>
      </div>
    </div>
  );
}
