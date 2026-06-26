"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { listWorkflows, createWorkflow, deleteWorkflow, renameWorkflow } from "@/lib/store";
import UserMenu from "@/components/UserMenu";
import TopBar from "@/components/TopBar";

function relTime(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function Dashboard() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState("");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    setItems(listWorkflows());
  }, []);

  const refresh = () => setItems(listWorkflows());

  const onCreate = () => {
    setNewName("");
    setCreating(true);
  };

  const onCreateConfirm = () => {
    const wf = createWorkflow(newName.trim() || "Untitled Canvas");
    router.push(`/w/${wf.id}`);
  };

  const onDelete = (id, e) => {
    e.stopPropagation();
    if (!confirm("Delete this canvas?")) return;
    deleteWorkflow(id);
    refresh();
  };

  const onRenameStart = (wf, e) => {
    e.stopPropagation();
    setEditingId(wf.id);
    setDraft(wf.name);
  };

  const onRenameCommit = (id) => {
    const name = draft.trim() || "Untitled Canvas";
    renameWorkflow(id, name);
    setEditingId(null);
    refresh();
  };

  return (
    <div className="dash">
      <TopBar right={<>
        <button className="primary-btn" onClick={onCreate}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
          New Canvas
        </button>
        <UserMenu />
      </>} />

      <div className="cv-hero">
        <div className="cv-hero-bg" />
        {/* connector lines chaining the tiles through the center, + junction dots */}
        <svg className="cv-hero-lines" viewBox="0 0 1200 300" preserveAspectRatio="none" aria-hidden="true">
          <path d="M70,150 C 180,150 200,205 295,205" />
          <path d="M295,205 C 370,205 390,150 455,150" />
          <path d="M745,150 C 820,150 845,205 915,205" />
          <path d="M915,205 C 1010,205 1045,150 1135,150" />
          <circle className="cv-dot" cx="70" cy="150" r="4" />
          <circle className="cv-dot" cx="295" cy="205" r="4" />
          <circle className="cv-dot" cx="915" cy="205" r="4" />
          <circle className="cv-dot" cx="1135" cy="150" r="4" />
        </svg>
        {/* Showcase tiles — left pair (1,2) + right pair (3,4). The gradient is
            a fallback shown only if the image file is missing. */}
        <div className="cv-tile cv-tile-1" style={{ background: "linear-gradient(135deg,#22c55e,#0ea5e9)" }}>
          <img src="/hero/cv1.png" alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} />
        </div>
        <div className="cv-tile cv-tile-2" style={{ background: "linear-gradient(135deg,#f59e0b,#ec4899)" }}>
          <img src="/hero/cv2.png" alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} />
        </div>
        <div className="cv-tile cv-tile-3" style={{ background: "linear-gradient(135deg,#6366f1,#a855f7)" }}>
          <img src="/hero/cv3.png" alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} />
        </div>
        <div className="cv-tile cv-tile-4" style={{ background: "linear-gradient(135deg,#0ea5e9,#22c55e)" }}>
          <img src="/hero/cv4.png" alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} />
        </div>
        <div className="cv-bubble cv-bubble-1">That's cool!</div>
        <div className="cv-bubble cv-bubble-2">🔥 Love it</div>
        <div className="cv-hero-inner">
          <div className="cv-hero-frame">
            {["tl", "tm", "tr", "ml", "mr", "bl", "bm", "br"].map((h) => (
              <span key={h} className={`cv-handle cv-handle-${h}`} />
            ))}
            <div className="cv-hero-eyebrow">EROMIFY CANVAS</div>
            <h1 className="cv-hero-title">Generate stunning<br />media with AI Canvas</h1>
          </div>
        </div>
      </div>

      <div className="dash-body">
        <div className="cv-tabs">
          <button className="cv-tab is-active">All Canvases</button>
          <button className="cv-tab cv-tab-soon" disabled>Templates <span className="cv-tab-badge">Soon</span></button>
        </div>

        {items.length === 0 ? (
          <div className="dash-empty">
            <div className="dash-empty-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </div>
            <h2>No canvases yet</h2>
            <p>Create your first canvas to get started.</p>
            <button className="primary-btn" onClick={onCreate}>Create canvas</button>
          </div>
        ) : (
          <div className="wf-grid">
            <div className="wf-tile wf-tile-new" onClick={onCreate}>
              <div className="wf-tile-new-plus">+</div>
              <div>New canvas</div>
            </div>
            {items.map((wf) => (
              <div key={wf.id} className="wf-tile" onClick={() => router.push(`/w/${wf.id}`)}>
                <div className="wf-tile-preview">
                  <span>{wf.nodes.length} node{wf.nodes.length === 1 ? "" : "s"}</span>
                </div>
                <div className="wf-tile-meta">
                  {editingId === wf.id ? (
                    <input
                      className="wf-rename"
                      autoFocus
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onBlur={() => onRenameCommit(wf.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") onRenameCommit(wf.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <div className="wf-tile-name" onDoubleClick={(e) => onRenameStart(wf, e)}>{wf.name}</div>
                  )}
                  <div className="wf-tile-time">Updated {relTime(wf.updatedAt)}</div>
                </div>
                <div className="wf-tile-actions">
                  <button onClick={(e) => onRenameStart(wf, e)} title="Rename">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                  </button>
                  <button onClick={(e) => onDelete(wf.id, e)} title="Delete">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {creating && (
        <div className="nw-backdrop" onClick={() => setCreating(false)}>
          <div className="nw-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="nw-title">Name your canvas</h3>
            <p className="nw-sub">Give it a name to get started. You can rename it later.</p>
            <input
              className="nw-input"
              autoFocus
              placeholder="Untitled Canvas"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onCreateConfirm();
                if (e.key === "Escape") setCreating(false);
              }}
            />
            <div className="nw-actions">
              <button className="nw-cancel" onClick={() => setCreating(false)}>Cancel</button>
              <button className="primary-btn" onClick={onCreateConfirm}>Create canvas</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
