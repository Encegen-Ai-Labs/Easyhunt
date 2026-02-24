import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { isLoggedIn } from "./auth";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Upload from "./pages/Upload";
import Search from "./pages/Search";
import Selected from "./pages/selected";
import History from "./pages/History";
import Forgot from "./pages/Forgot";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import AdminRoute from "./AdminRoute";
import AdminDashboard from "./pages/AdminDashboard";
import DashboardLayout from "./layouts/DashboardLayout";
import AppLayout from "./layouts/AppLayout";
import Dashboard from "./pages/Dashboard";


/* PROTECTED ROUTE */
function PrivateRoute({ children }) {
  return isLoggedIn() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <>
      <ToastContainer position="top-right" autoClose={2500} theme="colored" />

      <Routes>

        {/* PUBLIC ROUTES */}
        <Route path="/login" element={!isLoggedIn() ? <Login /> : <Navigate to="/upload" />} />
        <Route path="/forgot-password" element={<Forgot />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* DASHBOARD LAYOUT (ALL PRIVATE PAGES) */}
      {/* PRIVATE APP SHELL */}
<Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>

  {/* DASHBOARD FRAME */}
  <Route element={<DashboardLayout />}>

    <Route index element={<Navigate to="/dashboard" />} />
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/upload" element={<Upload />} />
    <Route path="/search" element={<Search />} />
    <Route path="/selected" element={<Selected />} />
    <Route path="/profile" element={<Profile />} />
    <Route path="/history" element={<History />} />
    <Route path="/register" element={<AdminRoute><Register /></AdminRoute>} />
  <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

  </Route>



  {/* Admin pages OUTSIDE footer */}
  

</Route>
        <Route path="*" element={<Navigate to="/login" />} />

      </Routes>
    </>
  );
}
