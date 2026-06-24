"use client";
import { useEffect, useState } from "react";
import { listGenerations } from "@/lib/store";

const KIND_LABEL = { image: "Image", video: "Video", audio: "Audio", text: "Text", motion: "Motion" };
const KIND_EXT = { image: "jpg", video: "mp4", audio: "mp3" };

function extFor(it) {
  const m = /\.(jpe?g|png|webp|gif|mp4|webm|mov|mp3|wav|m4a)(?:[?#]|$)/i.exec(it.url || "");
  if (m) return m[1].toLowerCase();
  return KIND_EXT[it.kind] || "bin";
}

async function downloadItem(e, it) {
  e.preventDefault();
  e.stopPropagation();
  const name = `genmax-${it.kind || "file"}-${Date.now()}.${extFor(it)}`;
  try {
    const res = await fetch(it.url);
    if (!res.ok) throw new Error("fetch failed");
    const blob = await res.blob();
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(href), 4000);
  } catch {
    // Cross-origin without CORS, etc. — fall back to opening the file.
    window.open(it.url, "_blank", "noopener");
  }
}

export default function Library({ open, onClose }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!open) return;
    const local = listGenerations();
    setItems(local);
    // Merge in server-side (Claude MCP) generations, deduped by url.
    let cancelled = false;
    fetch("/api/generations")
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then(({ items: server }) => {
        if (cancelled || !Array.isArray(server) || server.length === 0) return;
        const seen = new Set(local.map((g) => g.url));
        const extra = server
          .filter((g) => g && g.url && !seen.has(g.url))
          .map((g) => ({ ...g, workflowName: g.workflowName || "Claude MCP" }));
        if (extra.length) {
          const merged = [...local, ...extra].sort((a, b) => (b.ts || 0) - (a.ts || 0));
          setItems(merged);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="lib-backdrop" onMouseDown={onClose}>
      <div className="lib-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="lib-head">
          <div className="lib-head-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h6l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/></svg>
            Library <span className="lib-count">{items.length}</span>
          </div>
          <button className="lib-close" onClick={onClose} title="Close">✕</button>
        </div>

        <div className="lib-body">
          {items.length === 0 ? (
            <div className="lib-empty">
              <div className="lib-empty-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M4 4h6l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/></svg>
              </div>
              <h3>No generations yet</h3>
              <p>Images, videos, and audio you generate or upload will collect here.</p>
            </div>
          ) : (
            <div className="lib-grid">
              {items.map((it, i) => (
                <a key={i} className="lib-block" href={it.url} target="_blank" rel="noreferrer">
                  {it.kind === "image" && <img src={it.url} alt="" loading="lazy" decoding="async" />}
                  {it.kind === "video" && (
                    <video
                      src={it.url}
                      muted
                      loop
                      playsInline
                      preload="none"
                      onMouseOver={(e) => { e.target.play().catch(() => {}); }}
                      onMouseOut={(e) => { e.target.pause(); e.target.currentTime = 0; }}
                    />
                  )}
                  {it.kind === "audio" && (
                    <div className="lib-audio">
                      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M19 12a4 4 0 0 0-2-3.5"/></svg>
                    </div>
                  )}
                  {(it.kind === "text" || it.kind === "motion") && <div className="lib-textthumb">{KIND_LABEL[it.kind] || it.kind}</div>}
                  <span className="lib-badge">{KIND_LABEL[it.kind] || it.kind}</span>
                  {(it.kind === "image" || it.kind === "video" || it.kind === "audio") && (
                    <button className="lib-download" title="Download" onClick={(e) => downloadItem(e, it)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                    </button>
                  )}
                  <div className="lib-overlay">
                    <div className="lib-overlay-prompt">{it.prompt || "(no prompt)"}</div>
                    <div className="lib-overlay-wf">{it.workflowName}</div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
