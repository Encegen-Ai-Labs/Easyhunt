import React, { useEffect, useState, useContext } from "react";
import { authFetch } from "../auth";
import { endpoints } from "../api";
import { FiTrash2 } from "react-icons/fi";
import "../styles/Selected.css";

import { MdFolder,MdFolderSpecial, MdEmail } from "react-icons/md";
import { FaRegCopy, FaFileExcel, FaFileWord } from "react-icons/fa";
import { IoArrowBackOutline } from "react-icons/io5";
import { MdOutlineArchive } from 'react-icons/md'; 
import { useNavigate } from "react-router-dom";
import { FooterContext } from "../layouts/AppLayout";

export default function Selected() {
  const [groups, setGroups] = useState([]);
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(true);

  const [toast, setToast] = useState(null);
  const navigate = useNavigate();
  const { setFooterButtons } = useContext(FooterContext);
const activeGroup = groups.find((g) => g.table_name === active) || null;

  useEffect(() => {
    loadSelected();
  }, []);

  useEffect(() => {
  setFooterButtons(
    <div className="footer-actions">

      {/* LEFT SIDE */}
      <button className="back-btn" onClick={() => navigate("/search")}>
        <IoArrowBackOutline /> Back to search
      </button>

      {/* RIGHT SIDE */}
      <div className="footer-right">

        <button
          className="footer-copy"
          disabled={!activeGroup}
          onClick={() => activeGroup && copyAll(activeGroup.rows)}
        >
          <FaRegCopy size={16}/> Copy All
        </button>

        <button
          className="footer-word"
          disabled={!activeGroup}
         onClick={() =>
  activeGroup &&
  exportTo(
    activeGroup.rows,
    endpoints.exportWord,
    activeGroup.table_name   // ⭐ pass table name
  )
}
        >
          <FaFileWord size={16}/> Export to Word
        </button>

      </div>
    </div>
  );

  return () => setFooterButtons(null);
}, [activeGroup]);
 
 function showToast(text, type = "success", ms = 3000) {
  setToast({ text, type });
  setTimeout(() => setToast(null), ms);
}

  async function loadSelected() {
    setLoading(true);
    try {
      const res = await authFetch(endpoints.selectedRows, { method: "POST", body: {} });
      const j = await res.json();
      setGroups(j.groups || []);
    } catch {
      showToast("Failed to load selected entries", "error");
      setGroups([]);
    }
    setLoading(false);
  }

  // ========== CHIP TOGGLE ==========
  function handleChipClick(table_name) {
    if (active === table_name) {
      // re-click closes table
      setActive(null);
    } else {
      setActive(table_name);
    }
  }

  async function handleRemoveGroup(table_name) {
    if (!window.confirm(`Remove all entries for ${table_name}?`)) return;
    try {
      await authFetch(endpoints.removeSelectedGroup, {
        method: "POST",
        body: { table_name },
      });

      setGroups((g) => g.filter((x) => x.table_name !== table_name));

      if (active === table_name) setActive(null);

      showToast("Group removed", "success");
    } catch {
      showToast("Failed to remove group", "error");
    }
  }

  async function handleRemoveRow(sel_id, table_name) {
    if (!window.confirm("Remove this entry?")) return;
    try {
      const res = await authFetch(endpoints.removeSelected, {
        method: "POST",
        body: { id: sel_id },
      });
      const j = await res.json();
      if (!j.deleted) return;

      setGroups((prev) =>
        prev
          .map((g) =>
            g.table_name === table_name
              ? { ...g, rows: g.rows.filter((r) => r.sel_id !== sel_id) }
              : g
          )
          .filter((g) => g.rows.length > 0)
      );

      showToast("Entry removed", "success");
    } catch {}
  }

  function copyAll(rows) {
    if (!rows?.length) return showToast("No entries to copy");
    const text = rows.map((r) => `${r.docno || ""} | ${r.docname || ""}`).join("\n");
    navigator.clipboard.writeText(text);
    showToast("Copied", "success");
  }

  async function exportTo(rows, endpoint, tableName) {

  if (!rows?.length) return showToast("No entries to export");

  // send ids + table_name
  const payload = {
    entries: rows.map((r) => ({ id: r.document_id })),
    table_name: tableName
  };

  const res = await authFetch(endpoint, { method: "POST", body: payload });

  if (!res.ok) {
    showToast("Export failed", "error");
    return;
  }

  const blob = await res.blob();

  // -------- GET REAL FILENAME FROM FLASK --------
  let filename = "download.docx";

  const disposition = res.headers.get("Content-Disposition");
  if (disposition) {
    const match = disposition.match(/filename="?([^"]+)"?/);
    if (match?.[1]) filename = match[1];
  }

  // download
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;   // ⭐ now comes from backend
  document.body.appendChild(a);
  a.click();
  a.remove();

  window.URL.revokeObjectURL(url);

  showToast("Download complete", "success");
}
  async function emailEntries(rows) {
    if (!rows?.length) return showToast("No entries to email");

    const email = window.prompt("Enter target email:");
    if (!email) return;

    const payload = { email, attach_excel: true, entries: rows.map((r) => ({ id: r.sel_id })) };
    await authFetch(endpoints.emailSelected, { method: "POST", body: payload });

    showToast("Email sent", "success");
  }

  

  return (
    <div className="selected-page">
       <div className="heading"><h1>Data Explorer</h1></div>
      {/* TITLE */}
      <div className="chip-header">
        <span className="chip-title"> <MdFolderSpecial size={16} /> {groups.length} Tables Available</span>
      </div>

      {/* CHIPS */}
      <div className="chip-container">
        {groups.map((g) => (
          <div
            key={g.table_name}
            className={`chip-item ${active === g.table_name ? "active-chip" : ""}`}
            onClick={() => handleChipClick(g.table_name)}
          >
            <MdFolderSpecial size={16} />
            {g.chip_label}
            <span className="chip-count">{g.rows.length}</span>

            <span
              className="chip-remove"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveGroup(g.table_name);
              }}
            >
              ×
            </span>
          </div>
        ))}
      </div>

     

      {/* TABLE WRAPPER (ALWAYS PRESENT) */}
      <div className="table-wrap">

        {/* TABLE HEADER ALWAYS VISIBLE */}
        <table className="selected-table">
         <thead>
  <tr>
    <th className="col-small">Doc No</th>
    <th className="col-medium">Doc Name</th>
    <th className="col-small">Registration Date</th>
    <th className="col-medium">SRO Name</th>
    <th className="col-name">Seller Party</th>
    <th className="col-name">Purchaser Party</th>
    <th className="col-prop">Property Description</th>
    <th className="col-small">Area Name</th>
    <th className="col-amount">Consideration Amount</th>
    <th className="col-action sticky-action">Actions</th>
  </tr>
</thead>

          <tbody>
            {/* EMPTY STATE */}
            {!activeGroup && (
              <tr>
                <td colSpan="11">
                  <div className="empty-state">
                    <div className="empty-icon"><MdOutlineArchive/></div>
                    <div className="empty-state-title">No Data Available</div>
                    <div className="empty-state-sub">
                      Select a table from above to view its entries
                    </div>
                  </div>
                </td>
              </tr>
            )}


            {/* SHOW ROWS */}
            {activeGroup &&
              activeGroup.rows.map((r) => (
               <tr key={r.sel_id}>
  <td>{r.docno}</td>
  <td>{r.docname}</td>
  <td>{r.registrationdate}</td>
  <td>{r.sroname}</td>
  <td title={r.sellerparty}>{r.sellerparty}</td>
  <td title={r.purchaserparty}>{r.purchaserparty}</td>
  <td className="prop-col">
    <div className="prop-text">{r.propertydescription}</div>
  </td>
  <td>{r.areaname}</td>
  <td className="amount-col">{r.consideration_amt}</td>

  {/* ACTION LAST */}
  <td className="sticky-action">
    <div className="row-actions">
      <button
        className="delete-icon"
        title="Remove entry"
        onClick={() => handleRemoveRow(r.sel_id, activeGroup.table_name)}
      >
        <FiTrash2 />
      </button>
    </div>
  </td>
</tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* BACK BUTTON */}
      {/* <button className="back-btn" onClick={() => navigate("/search")}>
        <IoArrowBackOutline /> Back to search
      </button> */}

      {/* TOASTS */}
      {toast && (
        <div className={`center-toast toast-${toast.type}`}>
          {toast.text}
        </div>
      )}
      
    </div>
  );
}
