import React, { useState, useEffect,useRef  } from "react";
import { authFetch } from "../auth";
import { endpoints } from "../api";
import { useNavigate } from "react-router-dom";
import "../styles/Search.css";
import { MdMic } from "react-icons/md";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useContext} from "react";
import { FooterContext } from "../layouts/AppLayout";


export default function Search() {
  const [q, setQ] = useState("");
  const [purchaser, setPurchaser] = useState("");
  const [seller, setSeller] = useState("");
  const [docname, setDocname] = useState("");
  const [docno, setDocno] = useState("");
  const [registrationdate, setRegistrationdate] = useState("");
  const [propertyDesc, setPropertyDesc] = useState("");
  const [savedIds, setSavedIds] = useState(new Set());
 const [loading, setLoading] = useState(false);
const [summaryExpanded, setSummaryExpanded] = useState(false);
const { setFooterButtons } = useContext(FooterContext);
const mainRef = useRef(null);
  const [tableName, setTableName] = useState("");
  const [recentTable, setRecentTable] = useState(
    localStorage.getItem("recentTable") || ""
  );

  const [rows, setRows] = useState([]);
  const [groups, setGroups] = useState([]);
  // const [selectedMap, setSelectedMap] = useState(new Map());
  const [status, setStatus] = useState("");

  const [page, setPage] = useState(1);
  const [perPage] = useState(100);
  const [total, setTotal] = useState(0);
  const [shouldSearch, setShouldSearch] = useState(false);
  const [activeDocFilter, setActiveDocFilter] = useState(null);

  const [tableList, setTableList] = useState([]);
  const orderedTables = recentTable
    ? [recentTable, ...tableList.filter((t) => t !== recentTable)]
    : tableList;

  const [showTopBtn, setShowTopBtn] = useState(false);
  const navigate = useNavigate();

  /* LOAD TABLE LIST */
  useEffect(() => {
    async function loadTables() {
      const res = await authFetch(endpoints.tables);
      const j = await res.json();
      setTableList(j.tables || []);
    }
    loadTables();
  }, []);

  useEffect(() => {
  async function loadSavedEntries() {
    try {
      const res = await authFetch(endpoints.selectedRows, {
        method: "POST",
        body: { ids: [] }, // empty = get all saved
      });

      const data = await res.json();

      const ids = new Set();

      (data.groups || []).forEach(group => {
        group.rows.forEach(row => {
          ids.add(row.document_id);
        });
      });

      setSavedIds(ids);
    } catch (e) {
      console.error("Failed to load saved entries");
    }
  }

  loadSavedEntries();
}, []);

  /* AUTO SELECT RECENT TABLE */
  useEffect(() => {
    if (recentTable) setTableName(recentTable);
  }, [recentTable]);

  /* RESTORE SESSION */
  useEffect(() => {
    const saved = sessionStorage.getItem("searchState");
    if (saved) {
      const s = JSON.parse(saved);

      setQ(s.q || "");
      setPurchaser(s.purchaser || "");
      setSeller(s.seller || "");
      setDocname(s.docname || "");
      setDocno(s.docno || "");
      setRegistrationdate(s.registrationdate || "");
      setPropertyDesc(s.propertyDesc || "");
      setTableName(s.tableName || "");

      setPage(1);
      setRows(s.results || []);
      setTotal(s.total || 0);
      setGroups(s.groups || []);

      setStatus(`Showing ${s.results?.length || 0} of ${s.total || 0} results`);
      setShouldSearch(true);
    }
  }, []);
/* SHOW TOP BUTTON */
 useEffect(() => {
  const container = mainRef.current;

  function onScroll() {
    if (!container) return;
    setShowTopBtn(container.scrollTop > 400);
  }

  container?.addEventListener("scroll", onScroll);

  return () => {
    container?.removeEventListener("scroll", onScroll);
  };
}, []);
  useEffect(() => {
  setFooterButtons(
    <div className="footer-bar">

      {/* LEFT BUTTON */}
      <div className="footer-left">
        <button
          className="footer-entries"
          onClick={() => navigate("/selected")}
        >
          📄 Go to Entries
        </button>
      </div>
      

      {/* CENTER PAGINATION */}
      <div className="footer-pagination">
        <button
          className="page-btn"
          disabled={page === 1 || loading}
          onClick={() => setPage(p => p - 1)}
        >
          ⬅ Prev
        </button>

        <span className="page-indicator">
          Page {page}
        </span>

        <button
          className="page-btn"
          disabled={page * perPage >= total || loading}
          onClick={() => setPage(p => p + 1)}
        >
          Next ➡
        </button>
      </div>

      {/* RIGHT */}
      <div className="footer-right">
        <button
          className="footer-top"
         onClick={() =>
  mainRef.current?.scrollTo({ top: 0, behavior: "smooth" })
}
        >
          ⬆
        </button>
      </div>

    </div>
  );
}, [page, loading, total]);
  
  

  function voiceSearch() {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Voice Search not supported");
      return;
    }
    const rec = new window.webkitSpeechRecognition();
    rec.lang = "en-IN";
    rec.start();
    rec.onresult = (e) => setQ(e.results[0][0].transcript);
  }

  function highlight(text) {
    if (!text) return text;
    const searchWords = [
      q,
      purchaser,
      seller,
      docname,
      docno,
      propertyDesc,
      registrationdate,
    ].filter(Boolean);

    let result = text;
    searchWords.forEach((word) => {
      const regex = new RegExp(`(${word})`, "gi");
      result = result.replace(regex, "<mark>$1</mark>");
    });
    return result;
  }
function getSearchKeywords() {
  const keywords = [];

  if (q) keywords.push(q);
  if (purchaser) keywords.push(purchaser);
  if (seller) keywords.push(seller);
  if (docname) keywords.push(docname);
  if (docno) keywords.push(docno);
  if (propertyDesc) keywords.push(propertyDesc);
  if (registrationdate) keywords.push(registrationdate);
  if (activeDocFilter) keywords.push(activeDocFilter);

  return keywords.length ? keywords.join(", ") : "No Keywords Provided";
}

function handleClearAll() {
  // clear all inputs
  setQ("");
  setPurchaser("");
  setSeller("");
  setDocname("");
  setDocno("");
  setRegistrationdate("");
  setPropertyDesc("");

  // filters
  setActiveDocFilter(null);

  // results
  setRows([]);
  setGroups([]);
  setTotal(0);
  setStatus("");

  // pagination
  setPage(1);
  setShouldSearch(false);

  // remove saved search session
  sessionStorage.removeItem("searchState");
}

  function handleTableChange(e) {
    const value = e.target.value;
    setTableName(value);
    if (value) {
      setRecentTable(value);
      localStorage.setItem("recentTable", value);
    }
  }

  
async function saveEntryDirectly(row) {
  // 🚫 Already saved → no API call, no toast
  if (savedIds.has(row.id)) {
    return;
  }

  try {
    const res = await authFetch(endpoints.saveSelected, {
      method: "POST",
      body: {
        entries: [{ id: row.id }],
      },
    });

    const data = await res.json();

    // ✅ Backend confirms actual insert
    if (data.added > 0) {
      setSavedIds(prev => new Set(prev).add(row.id));

      toast.success("Entry saved to Selected Entries", {
        position: "bottom-right",
        autoClose: 2000,
      });
    }
  } catch {
    toast.error("Failed to save entry", {
      position: "bottom-right",
    });
  }
}

 async function handleSearch(e) {
  if (e) {
    e.preventDefault();
    setPage(1);
    setTimeout(() => {
      setShouldSearch(true);
      handleSearch();
      window.scrollTo({ top: 0, behavior: "smooth" });

    }, 50);
    return;
  }

  if (!shouldSearch) return;

  setLoading(true);   // 🔴 START LOADER

  try {
    const params = new URLSearchParams();

    if (q) params.append("q", q);
    if (purchaser) params.append("purchaser", purchaser);
    if (seller) params.append("seller", seller);
    if (docname) params.append("docname", docname);
    if (docno) params.append("docno", docno);
    if (registrationdate) params.append("registrationdate", registrationdate);
    if (tableName) params.append("table_name", tableName);
    if (propertyDesc) params.append("propertydescription", propertyDesc);

    if (activeDocFilter) {
      params.append("docname_filter", activeDocFilter);
    }

    params.append("page", page);
    params.append("per_page", perPage);

    const res = await authFetch(`${endpoints.search}?${params}`);
    const j = await res.json();

    setRows(j.results || []);
    setTotal(j.total || 0);
    setGroups(j.groups || []);
    setStatus(`Showing ${j.results?.length || 0} of ${j.total || 0} results`);

    sessionStorage.setItem(
      "searchState",
      JSON.stringify({
        q,
        purchaser,
        seller,
        docname,
        docno,
        registrationdate,
        propertyDesc,
        tableName,
        page,
        results: j.results,
        total: j.total,
        groups: j.groups,
      })
    );
  } catch (err) {
    console.error(err);
    toast.error("Search failed");
  } finally {
    setLoading(false);  // 🟢 STOP LOADER
  }
}

 useEffect(() => {
  if (shouldSearch) {
    handleSearch();
  }
}, [page, activeDocFilter]);


  // function toggleSelect(id, row) {
  //   const m = new Map(selectedMap);
  //   m.has(String(id)) ? m.delete(String(id)) : m.set(String(id), row);
  //   setSelectedMap(m);
  // }

  // async function saveSelectedAndGotoSelected() {
  //   if (!selectedMap.size) return alert("No entries selected.");

  //   const ids = Array.from(selectedMap.keys()).map(Number);

  //   await authFetch(endpoints.saveSelected, {
  //     method: "POST",
  //     body: { entries: ids.map((id) => ({ id })) },
  //   });

  //   navigate("/selected");
  // }

  return (
    <div className="search-page-wrapper">
      
  <div className="search-container">
      {loading && (
  <div className="loader-overlay">
    <div className="loader-box">
      <div className="spinner"></div>
      <p>Searching Records...</p>
    </div>
  </div>
)}

      <div className="search-header">
        <h2>Advanced Document Search</h2>
        <p>Search SRO Document Records Instantly</p>

        {/* SEARCH FORM */}
 <form className="search-box" onSubmit={handleSearch}>

  <div className="form-group f1">
  <label>Select Table</label>

  <div className="select-wrapper">
    <select value={tableName} onChange={handleTableChange}>
      <option value="">-- All Tables --</option>
      {orderedTables.map((t) => (
        <option key={t} value={t}>{t}</option>
      ))}
    </select>

    <span className="dropdown-icon">▼</span>
  </div>
</div>

  <div className="form-group f2">
    <label>Table Name</label>
    <input value={tableName} onChange={(e) => setTableName(e.target.value)} />
  </div>

  <div className="form-group f3">
    <label>Free Text Search</label>
    <div className="input-with-btn">
      <input value={q} onChange={(e) => setQ(e.target.value)} />
      <button type="button" className="mic-btn" onClick={voiceSearch}>
        <MdMic size={18} />
      </button>
    </div>
  </div>

  <div className="form-group f4">
    <label>Property Description</label>
    <input value={propertyDesc} onChange={(e) => setPropertyDesc(e.target.value)} />
  </div>

  <div className="form-group f5">
    <label>Purchaser Name</label>
    <input value={purchaser} onChange={(e) => setPurchaser(e.target.value)} />
  </div>

  <div className="form-group f6">
    <label>Seller Name</label>
    <input value={seller} onChange={(e) => setSeller(e.target.value)} />
  </div>

  <div className="form-group f7">
    <label>Document Name</label>
    <input value={docname} onChange={(e) => setDocname(e.target.value)} />
  </div>

  <div className="form-group f8">
    <label>Document Number</label>
    <input value={docno} onChange={(e) => setDocno(e.target.value)} />
  </div>

  <div className="form-group f9">
    <label>Registration Date</label>
    <input
      placeholder="Enter year (e.g., 2021)"
      value={registrationdate}
      onChange={(e) => setRegistrationdate(e.target.value)}
    />
  </div>

  <div className="search-actions">
    <button type="submit" className="search-btn" disabled={loading}>
      {loading ? "Searching..." : "Search"}
    </button>

    <button type="button" className="clear-btn" onClick={handleClearAll} disabled={loading}>
      Clear All
    </button>
  </div>

</form>
        

        {/* GROUP SUMMARY */}
       {groups.length > 0 && (
  <div className="group-summary">

    <h3 className="summary-title">Document Type Summary</h3>

    <div className={`group-grid ${summaryExpanded ? "expanded" : ""}`}>
      {groups.map((g, idx) => (
        <div
          key={idx}
          className={`group-item ${activeDocFilter === g.docname ? "active" : ""}`}
          onClick={() => {
            const nextFilter =
              g.docname === activeDocFilter ? null : g.docname;

            setActiveDocFilter(nextFilter);
            setPage(1);
            setShouldSearch(true);
          }}
        >
          Number of "{g.docname}": {g.count} Entries
        </div>
      ))}
    </div>

    {/* EXPAND BUTTON */}
    {groups.length > 4 && (
      <div className="summary-toggle">
        <button onClick={() => setSummaryExpanded(!summaryExpanded)}>
          {summaryExpanded ? "▲ Show Less" : "▼ Show More"}
        </button>
      </div>
    )}

  </div>
)}
</div>
      {/* SEARCHED KEYWORDS PANEL */}
      <div className="searched-keywords-wrapper">
        <div className="searched-keywords-box">
          <h3>Searched For Keywords</h3>
          <p>
            {getSearchKeywords() || "No keywords provided"}
          </p>


      {/* SELECTED FOOTER
      {selectedMap.size > 0 && (
        <div className="selected-footer">
          <button onClick={saveSelectedAndGotoSelected}>
            View Selected Entries ({selectedMap.size})
          </button>
        </div>
      )} */}
  </div>
  
</div>


      {/* RESULTS TABLE */}
      <div className="results-area">
        
        <div className="status">{status}</div>

        {rows.length === 0 ? (
          <p>No results.</p>
        ) : (
          <table className="results-table no-context">
            <thead>
              <tr>
                <th>Doc No</th>
                <th>Doc Name</th>
                <th>Reg Date</th>
                <th>SRO</th>
                <th>Seller</th>
                <th>Purchaser</th>
                <th>Property Description</th>
                <th>Area</th>
                <th>Amount</th>
              </tr>
            </thead>
          <tbody>
  {rows.map((r) => {
    const isSaved = savedIds.has(r.id);

    return (
      <tr
        key={r.id}
        className={isSaved ? "row-selected" : ""}
        onDoubleClick={() => saveEntryDirectly(r)}
        onContextMenu={(e) => {
          e.preventDefault();
          saveEntryDirectly(r);
        }}
      >
        <td dangerouslySetInnerHTML={{ __html: highlight(r.docno) }} />
        <td dangerouslySetInnerHTML={{ __html: highlight(r.docname) }} />
        <td dangerouslySetInnerHTML={{ __html: highlight(r.registrationdate) }} />
        <td dangerouslySetInnerHTML={{ __html: highlight(r.sroname) }} />
        <td dangerouslySetInnerHTML={{ __html: highlight(r.sellerparty) }} />
        <td dangerouslySetInnerHTML={{ __html: highlight(r.purchaserparty) }} />
        <td dangerouslySetInnerHTML={{ __html: highlight(r.propertydescription) }} />
        <td dangerouslySetInnerHTML={{ __html: highlight(r.areaname) }} />
        <td dangerouslySetInnerHTML={{ __html: highlight(String(r.consideration_amt)) }} />
      </tr>
    );
  })}
</tbody>


          </table>
        )}
      </div>

     

    </div>
    </div>
  );
}
