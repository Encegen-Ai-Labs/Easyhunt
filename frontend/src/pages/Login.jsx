import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { endpoints } from "../api";
import { saveToken } from "../auth";
import { toast } from "react-toastify";

import { FaEye, FaEyeSlash } from "react-icons/fa";
import "../styles/login.css";

export default function Login() {

  /* ---------------- STATES ---------------- */
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // validation errors
  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  const navigate = useNavigate();

  /* ---------------- AUTO REDIRECT IF LOGGED IN ---------------- */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  /* ---------------- VALIDATION FUNCTION ---------------- */
  function validate() {
    let valid = true;
    const newErrors = { email: "", password: "" };

    // Email required
    if (!email.trim()) {
      newErrors.email = "Email is required";
      valid = false;
    }
    // Email format
    else if (!/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email = "Enter a valid email address";
      valid = false;
    }

    // Password required
    if (!password.trim()) {
      newErrors.password = "Password is required";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  }

  /* ---------------- LOGIN HANDLER ---------------- */
  async function handleSubmit(e) {
    e.preventDefault();

    // frontend validation
    if (!validate()) return;

    // prevent multi click
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch(endpoints.login, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      let data = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      /* SUCCESS LOGIN */
      if (res.ok && data.token) {
        saveToken(data.token);

        toast.success("Login successful!", {
          toastId: "login-success",
        });

        navigate("/", { replace: true });
      }

      /* WRONG CREDENTIALS (SECURE MESSAGE) */
      else {
        toast.error("Invalid email or password", {
          toastId: "login-error",
        });
      }

    } catch (err) {
      toast.error("Server not responding", {
        toastId: "server-error",
      });
    }

    setLoading(false);
  }

  /* ---------------- UI ---------------- */
  return (
    <div className="login-page">
      <div className="login-card">

        <h2 className="login-title">Login</h2>
        <p className="login-subtitle">Access your account securely</p>

        <form onSubmit={handleSubmit} className="login-form">

          {/* EMAIL */}
          <label>Email</label>
          <input
            className={`login-input ${errors.email ? "input-error" : ""}`}
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrors({ ...errors, email: "" });
            }}
          />
          {errors.email && <span className="error-text">{errors.email}</span>}


         {/* PASSWORD */}
{/* PASSWORD */}
<label>Password</label>

<div className="password-wrapper">
  <input
    className={`login-input ${errors.password ? "input-error" : ""}`}
    placeholder="Enter your password"
    type={showPassword ? "text" : "password"}
    value={password}
    onChange={(e) => {
      setPassword(e.target.value);
      setErrors({ ...errors, password: "" });
    }}
  />

  <button
    type="button"
    className="toggle-password"
    onClick={() => setShowPassword(!showPassword)}
    aria-label="Toggle password visibility"
  >
    {showPassword ? <FaEye /> : <FaEyeSlash />}
  </button>
</div>

{errors.password && (
  <span className="error-text">{errors.password}</span>
)}

<div className="forgot-row">
  <span
    className="forgot-link"
    onClick={() => navigate("/forgot-password")}
  >
    Forgot password?
  </span>
</div>


          {/* BUTTON */}
          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>

        </form>

      </div>
    </div>
  );
}
