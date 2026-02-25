import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { endpoints } from "../api";
import { authFetch, getRole } from "../auth";
import { toast } from "react-toastify";
import "../styles/register.css";
import { FaEye, FaEyeSlash } from "react-icons/fa";

/* ---------------- VALIDATION FUNCTION ---------------- */
function validateForm(form) {
  const errors = {};

  // NAME
  if (!form.name.trim()) {
    errors.name = "Name is required";
  } else if (form.name.trim().length < 3) {
    errors.name = "Name must be at least 3 characters";
  }

  // EMAIL
  if (!form.email.trim()) {
    errors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = "Enter a valid email address";
  }

  // PASSWORD
  if (!form.password) {
    errors.password = "Password is required";
  } else if (form.password.length < 6) {
    errors.password = "Password must be at least 6 characters";
  }

  // PHONE 1 (required)
  if (!form.phone1.trim()) {
    errors.phone1 = "Primary phone number is required";
  } else if (!/^[6-9]\d{9}$/.test(form.phone1)) {
    errors.phone1 = "Enter a valid 10 digit mobile number";
  }

  // PHONE 2 (optional)
  if (form.phone2 && !/^[6-9]\d{9}$/.test(form.phone2)) {
    errors.phone2 = "Enter a valid secondary mobile number";
  }

  // ADDRESS
  if (!form.address.trim()) {
    errors.address = "Address is required";
  } else if (form.address.trim().length < 5) {
    errors.address = "Address too short";
  }

  return errors;
}

export default function Register() {
  const navigate = useNavigate();
  const role = getRole();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    is_admin: false,
    phone1: "",
    phone2: "",
    address: ""
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  /* -------- ADMIN PROTECTION -------- */
  if (role !== "admin") {
    navigate("/");
    return null;
  }

  /* -------- HANDLE SUBMIT -------- */
  async function handleSubmit(e) {
    e.preventDefault();

    const validationErrors = validateForm(form);
    setErrors(validationErrors);

    // stop submit if errors exist
    if (Object.keys(validationErrors).length > 0) {
      toast.error("Please fill in all required fields.");
      return;
    }

    try {
      const res = await authFetch(endpoints.adminCreateUser, {
        method: "POST",
        body: form,
      });

      const data = await res.json();

      if (!res.ok) {
        return toast.error(data.error || "Error creating user");
      }

      toast.success("User created successfully");

      // reset form
      setForm({
        name: "",
        email: "",
        password: "",
        is_admin: false,
        phone1: "",
        phone2: "",
        address: ""
      });

      setErrors({});
      navigate("/admin");

    } catch (err) {
      toast.error("Server not responding");
    }
  }

  /* -------- PHONE INPUT SANITIZER -------- */
  const onlyNumbers = (value) => value.replace(/\D/g, "");

  return (
    <div className="register-container">
      <div className="register-card">
        <h1>Create User</h1>

        <form onSubmit={handleSubmit} className="register-form">

          {/* NAME */}
          <input
            className={`register-input ${errors.name ? "error" : ""}`}
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          {errors.name && <p className="form-error">{errors.name}</p>}

          {/* EMAIL */}
          <input
            className={`register-input ${errors.email ? "error" : ""}`}
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          {errors.email && <p className="form-error">{errors.email}</p>}

          {/* PASSWORD */}
          <div className="password-wrapper">
            <input
              className={`register-input ${errors.password ? "error" : ""}`}
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
          {errors.password && <p className="form-error">{errors.password}</p>}

          {/* PHONE 1 */}
          <input
            className={`register-input ${errors.phone1 ? "error" : ""}`}
            placeholder="Phone 1"
            value={form.phone1}
            maxLength={10}
            onChange={(e) =>
              setForm({ ...form, phone1: onlyNumbers(e.target.value) })
            }
          />
          {errors.phone1 && <p className="form-error">{errors.phone1}</p>}

          {/* PHONE 2 (OPTIONAL) */}
          <input
            className={`register-input ${errors.phone2 ? "error" : ""}`}
            placeholder="Phone 2 (Optional)"
            value={form.phone2}
            maxLength={10}
            onChange={(e) =>
              setForm({ ...form, phone2: onlyNumbers(e.target.value) })
            }
          />
          {errors.phone2 && <p className="form-error">{errors.phone2}</p>}

          {/* ADDRESS */}
          <textarea
            className={`register-textarea ${errors.address ? "error" : ""}`}
            placeholder="Address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          {errors.address && <p className="form-error">{errors.address}</p>}

          {/* ADMIN CHECKBOX */}
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