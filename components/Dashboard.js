"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { listWorkflows, createWorkflow, saveWorkflow, deleteWorkflow, renameWorkflow } from "@/lib/store";
import UserMenu from "@/components/UserMenu";
import Tabs from "@/components/Tabs";

function relTime(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

// Quick-action chips below the greeting — each opens a fresh canvas with a
// matching first-node kind preseeded. Keeps the user moving without thinking.
const QUICK_ACTIONS = [
  { id: "image", label: "Generate image", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg>, kind: "image" },
  { id: "video", label: "Generate video", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2"/><polygon points="10 9 16 12 10 15 10 9" fill="currentColor" stroke="none"/></svg>, kind: "video" },
  { id: "text",  label: "Write a script", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7V5h16v2M9 19h6M12 5v14"/></svg>, kind: "text" },
  { id: "audio", label: "Voice / TTS",    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 12a7 7 0 0 0 14 0M12 19v3"/></svg>, kind: "audio" },
];

export default function Dashboard() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState("");
  const [prompt, setPrompt] = useState("");

  useEffect(() => {
    setItems(listWorkflows());
  }, []);

  const refresh = () => setItems(listWorkflows());

  // Open a fresh canvas. If a kind/seed prompt is provided, drop a first node
  // already containing that prompt so the user can hit Run immediately.
  const openNew = ({ kind, seedPrompt } = {}) => {
    const name =
      (seedPrompt && seedPrompt.trim().slice(0, 60)) ||
      (kind ? `New ${kind}` : "Untitled Canvas");
    const wf = createWorkflow(name);
    if (kind || seedPrompt) {
      wf.nodes = [{
        id: `n_seed_${Math.random().toString(36).slice(2, 8)}`,
        type: "workflow",
        position: { x: 280, y: 140 },
        width: kind === "video" ? 525 : kind === "text" ? 213 : 304,
        height: kind === "video" ? 320 : 340,
        data: { kind: kind || "image", prompt: seedPrompt ? seedPrompt.trim() : "" },
      }];
      saveWorkflow(wf);
    }
    router.push(`/w/${wf.id}`);
  };

  const onSubmitPrompt = () => {
    const text = prompt.trim();
    if (!text) return;
    openNew({ kind: "image", seedPrompt: text });
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
      <div className="dash-topbar">
        <Tabs />
        <UserMenu />
      </div>

      <div className="dash-shell">
        <aside className="dash-sidebar">
          <button className="dash-newbtn" onClick={() => openNew()}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
            New canvas
          </button>

          <div className="dash-sidebar-section">Recents</div>

          <div className="dash-sidebar-list">
            {items.length === 0 && (
              <div className="dash-sidebar-empty">
                No canvases yet. Start one with the prompt on the right →
              </div>
            )}
            {items.map((wf) => (
              <div
                key={wf.id}
                className="dash-sidebar-item"
                onClick={() => router.push(`/w/${wf.id}`)}
              >
                {editingId === wf.id ? (
                  <input
                    className="dash-sidebar-rename"
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
                  <>
                    <div className="dash-sidebar-item-main">
                      <div className="dash-sidebar-item-name">{wf.name}</div>
                      <div className="dash-sidebar-item-meta">
                        {wf.nodes.length} node{wf.nodes.length === 1 ? "" : "s"} · {relTime(wf.updatedAt)}
                      </div>
                    </div>
                    <div className="dash-sidebar-item-actions">
                      <button onClick={(e) => onRenameStart(wf, e)} title="Rename">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                      </button>
                      <button onClick={(e) => onDelete(wf.id, e)} title="Delete">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </aside>

        <main className="dash-main">
          <div className="dash-greeting-wrap">
            <div className="dash-greeting">
              <span className="dash-greeting-mark">✦</span>
              Hello, ready to create?
            </div>
            <div className="dash-greeting-sub">
              Describe what you want — a portrait, a clip, a whole campaign — and a fresh canvas opens with it ready to run.
            </div>
          </div>

          <div className="dash-promptbar">
            <div className="dash-promptbar-inner">
              <button className="dash-promptbar-plus" title="Add reference (coming soon)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
              </button>
              <textarea
                className="dash-promptbar-input"
                placeholder="Describe what you want to create… (e.g. 'blonde woman in a satin set on a bed, fairy-light bokeh')"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onSubmitPrompt();
                  }
                }}
                rows={2}
              />
              <button
                className="dash-promptbar-send"
                onClick={onSubmitPrompt}
                disabled={!prompt.trim()}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l8 14H4z"/></svg>
              </button>
            </div>
            <div className="dash-quick-actions">
              {QUICK_ACTIONS.map((a) => (
                <button
                  key={a.id}
                  className="dash-quick-action"
                  onClick={() => openNew({ kind: a.kind })}
                >
                  {a.icon}
                  <span>{a.label}</span>
                </button>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
