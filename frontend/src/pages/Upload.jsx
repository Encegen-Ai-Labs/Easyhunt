import React, { useState, useRef, useEffect, useContext } from "react";
import { authFetch } from "../auth";
import { endpoints } from "../api";
import "../styles/upload.css";
import { IoArrowForwardOutline, IoInformationCircleOutline } from "react-icons/io5";
import { Link } from "react-router-dom";
import { FooterContext } from "../layouts/AppLayout";

export default function Upload() {

  /* ---------------- STATES ---------------- */
  const [status, setStatus] = useState("");
  const [dragging, setDragging] = useState(false);
  const [tableName, setTableName] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  const [toast, setToast] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [fileStatuses, setFileStatuses] = useState([]);

  const fileInputRef = useRef(null);

  /* -------- FOOTER CTA CONTROL -------- */
  const { setFooterButtons } = useContext(FooterContext);

  /* Show CTA button ONLY after upload finished */
  useEffect(() => {

    const allDone =
      fileStatuses.length > 0 &&
      fileStatuses.every(f => f.status === "done");

    if (!uploading && allDone) {
      setFooterButtons(
        <Link to="/search" className="back-btn">
          <IoArrowForwardOutline /> Go to search
        </Link>
      );
    } else {
      setFooterButtons(null);
    }

    return () => setFooterButtons(null);

  }, [uploading, fileStatuses]);

  /* ---------------- TOAST ---------------- */
  function showToast(message) {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  }

  /* ---------------- FILE UPLOAD ---------------- */
  async function uploadFiles(fileList) {

    const files = Array.from(fileList);

    if (uploading) return;

    if (!tableName.trim()) {
      showToast("Please enter a table name before uploading");
      return;
    }

    if (files.length === 0) return;

    // show files instantly
    setFileStatuses(
      files.map(f => ({
        name: f.name,
        status: "waiting"
      }))
    );

    setUploading(true);
    setStatus("Starting upload...");

    try {
      const fd = new FormData();
      fd.append("table_name", tableName.trim());
      files.forEach(file => fd.append("files", file));

      const res = await authFetch(endpoints.upload, {
        method: "POST",
        body: fd,
      });

      const j = await res.json();

      if (!res.ok) {
        showToast(j.error || "Upload failed");
        setUploading(false);
        return;
      }

      startPolling(j.job_id);

    } catch (err) {
      showToast("Server not responding");
      setUploading(false);
    }
  }

  /* ---------------- POLLING ---------------- */
  function startPolling(jobId) {

    const interval = setInterval(async () => {

      try {
        const res = await authFetch(`${endpoints.upload}/status/${jobId}`);
        const data = await res.json();

        setStatus(`Processed ${data.processed} / ${data.total} files`);

        // update file statuses
        setFileStatuses(prev =>
          prev.map((file, index) => {
            if (index < data.processed) {
              return { ...file, status: "done" };
            }
            return file;
          })
        );

        if (data.status === "done") {
          clearInterval(interval);
          setUploading(false);
          setStatus("Upload completed. You can now search the data.");
          showToast("All files uploaded successfully!");
        }

      } catch (e) {
        clearInterval(interval);
        setUploading(false);
        showToast("Connection lost");
      }

    }, 2000);
  }

  /* ---------------- FILE SELECT ---------------- */
  function handleFileSelect(e) {
    uploadFiles(e.target.files);
  }

  /* ---------------- DRAG DROP ---------------- */
  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    uploadFiles(e.dataTransfer.files);
  }

  /* ---------------- UI ---------------- */
  return (
    <div className="upload-page">
      
        <h1 className="upload-title">
          <span className="upload-icon">    </span> Upload Your .XLS Files

          <IoInformationCircleOutline
            className="info-button"
            onClick={() => setShowHelp(true)}
            title="How this upload works"
          />
        </h1>
      <div className="upload-wrapper">


        {/* TOAST */}
        {toast && <div className="toast-success">{toast}</div>}

        {/* HELP MODAL */}
        {showHelp && (
          <div className="help-modal-overlay" onClick={() => setShowHelp(false)}>
            <div className="help-modal" onClick={(e) => e.stopPropagation()}>
              <h2 className="help-title">📘 How to Upload Files</h2>
              <ul className="help-list">
                <li>Upload Excel or CSV files only.</li>
                <li>Enter a Table Name before uploading.</li>
                <li>Multiple files allowed.</li>
                <li>Each file will show upload status.</li>
              </ul>
              <button className="close-help" onClick={() => setShowHelp(false)}>Got it</button>
            </div>
          </div>
        )}

        {/* TABLE NAME */}
        <div className="table-name-box">
          <label>Save As Table Name</label>
          <input
            type="text"
            placeholder="Enter table name before upload"
            value={tableName}
            onChange={(e) => setTableName(e.target.value)}
            className="table-input"
            disabled={uploading}
          />
        </div>

        {/* DROP AREA */}
        <div
          className={`drop-area ${dragging ? "drag-over" : ""} ${uploading ? "disabled" : ""}`}
          onClick={() => !uploading && fileInputRef.current.click()}
          onDragOver={(e) => { e.preventDefault(); if (!uploading) setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".xls,.xlsx,.csv"
            className="file-input"
            onChange={handleFileSelect}
            disabled={uploading}
          />

          <p className="drag-title">Drag & Drop your files here</p>
          <p className="browse-text">or <span className="browse-link">click to browse files</span></p>

          {uploading && (
            <div className="upload-loader">
              <div className="spinner"></div>
              <p>Processing Excel files...</p>
            </div>
          )}
        </div>

        {/* FILE LIST */}
        {fileStatuses.length > 0 && (
          <div className="upload-file-list">
            {fileStatuses.map((f, i) => (
              <div key={i} className={`upload-file-card ${f.status}`}>
                <span className="file-name">{f.name}</span>

                <span className="file-status">
                  {f.status === "waiting" && "⏳ Waiting"}
                  {f.status === "done" && "✅ Uploaded"}
                  {f.status === "failed" && "❌ Failed"}
                </span>

                {f.error && <div className="file-error">{f.error}</div>}
              </div>
            ))}
          </div>
        )}

        <p className="upload-status">{status}</p>

      </div>
    </div>
  );
}