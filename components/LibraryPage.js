"use client";
import { useEffect, useMemo, useState } from "react";
import TopBar from "@/components/TopBar";
import UserMenu from "@/components/UserMenu";
import { listGenerations } from "@/lib/store";

// Normalize the many kinds we record (create/edit/motion = video, etc.) down to
// the two the Library cares about, plus a passthrough for anything else.
function normKind(k) {
  if (k === "video" || k === "create" || k === "edit" || k === "motion") return "video";
  if (k === "image" || k === "upscale") return "image";
  return k || "image";
}

// Read a localStorage JSON array safely.
function readArr(key) {
  if (typeof window === "undefined") return [];
  try {
    const a = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(a) ? a : [];
  } catch { return []; }
}

const EXT = { image: "jpg", video: "mp4" };
function extFor(it) {
  const m = /\.(jpe?g|png|webp|gif|mp4|webm|mov)(?:[?#]|$)/i.exec(it.url || "");
  return m ? m[1].toLowerCase() : (EXT[normKind(it.kind)] || "bin");
}

async function download(e, it) {
  e.preventDefault();
  e.stopPropagation();
  const name = `eromify-${normKind(it.kind)}-${Date.now()}.${extFor(it)}`;
  try {
    const res = await fetch(it.url);
    if (!res.ok) throw new Error("fetch failed");
    const blob = await res.blob();
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(href), 4000);
  } catch {
    window.open(it.url, "_blank", "noopener");
  }
}

export default function LibraryPage() {
  const [items, setItems] = useState(null); // null = loading
  const [filter, setFilter] = useState("all"); // all | image | video
  const [lightbox, setLightbox] = useState(null);

  // Aggregate EVERY source so the library has all generations no matter where
  // they were made: the server index (MCP + image/video/upscale recordings),
  // plus each section's local history (covers same-device items not yet synced).
  useEffect(() => {
    const local = [
      ...listGenerations(),                       // canvas
      ...readArr("eromify:imageHistory:v1"),      // /image
      ...readArr("eromify:videoHistory:v1"),      // /video
      ...readArr("eromify:upscaleHistory:v1"),    // /upscale
    ];
    const merge = (arr) => {
      const byUrl = new Map();
      for (const g of arr) {
        if (!g || !g.url) continue;
        const prev = byUrl.get(g.url);
        // Keep the entry with the richer prompt / newer ts.
        if (!prev || (g.ts || 0) > (prev.ts || 0)) byUrl.set(g.url, { ...prev, ...g });
      }
      return [...byUrl.values()].sort((a, b) => (b.ts || 0) - (a.ts || 0));
    };
    setItems(merge(local));

    fetch("/api/generations")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        const server = Array.isArray(j?.items) ? j.items : [];
        if (!server.length) return;
        setItems((cur) => merge([...(cur || []), ...server]));
      })
      .catch(() => {});
  }, []);

  const list = items || [];
  const counts = useMemo(() => {
    let img = 0, vid = 0;
    for (const it of list) (normKind(it.kind) === "video" ? vid++ : img++);
    return { all: list.length, image: img, video: vid };
  }, [list]);

  const shown = list.filter((it) => filter === "all" || normKind(it.kind) === filter);

  return (
    <div className="ip-page">
      <TopBar right={<UserMenu />} />

      <div className="lib-scroll">
        <div className="lib-page-head">
          <div>
            <h1 className="lib-page-h1">Your Library</h1>
            <p className="lib-page-sub">Every image and video you've generated — from Image, Video, Canvas, Upscale, and the Claude MCP — in one place.</p>
          </div>
          <div className="lib-filter-seg">
            <button className={filter === "all" ? "is-active" : ""} onClick={() => setFilter("all")}>All <span>{counts.all}</span></button>
            <button className={filter === "image" ? "is-active" : ""} onClick={() => setFilter("image")}>Images <span>{counts.image}</span></button>
            <button className={filter === "video" ? "is-active" : ""} onClick={() => setFilter("video")}>Videos <span>{counts.video}</span></button>
          </div>
        </div>

        {items === null ? (
          <div className="inf-loading"><span className="inf-spinner" /> Loading your library…</div>
        ) : shown.length === 0 ? (
          <div className="lib-empty">
            <div className="lib-empty-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M4 4h6l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/></svg>
            </div>
            <h3>Nothing here yet</h3>
            <p>Generate an image or video and it'll show up here automatically.</p>
          </div>
        ) : (
          <div className="ip-grid ip-grid-uniform lib-page-grid">
            {shown.map((it, i) => (
              <button key={(it.url || "") + i} className="ip-card lib-page-card" onClick={() => setLightbox(it)} title={it.prompt || ""}>
                {normKind(it.kind) === "video" ? (
                  <video
                    src={it.url}
                    muted loop playsInline preload="metadata"
                    onMouseOver={(e) => { e.currentTarget.play().catch(() => {}); }}
                    onMouseOut={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                  />
                ) : (
                  <img src={it.url} alt={it.prompt || ""} loading="lazy" />
                )}
                <span className="lib-page-badge">{normKind(it.kind) === "video" ? "Video" : "Image"}</span>
                <button className="lib-page-dl" title="Download" onClick={(e) => download(e, it)}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                </button>
              </button>
            ))}
          </div>
        )}
      </div>

      {lightbox && (
        <div className="ip-lightbox" onClick={() => setLightbox(null)}>
          <button className="ip-lightbox-close" onClick={() => setLightbox(null)}>✕</button>
          <div className="ip-lightbox-inner" onClick={(e) => e.stopPropagation()}>
            {normKind(lightbox.kind) === "video"
              ? <video className="ip-lightbox-img" src={lightbox.url} controls autoPlay loop playsInline />
              : <img className="ip-lightbox-img" src={lightbox.url} alt={lightbox.prompt || ""} />}
            <div className="ip-lightbox-bar">
              <div className="ip-lightbox-caption">{lightbox.prompt || "(no prompt)"}</div>
              <div className="ip-lightbox-actions">
                <button className="ip-lightbox-btn" onClick={(e) => download(e, lightbox)}>Download</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
