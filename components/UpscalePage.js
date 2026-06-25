"use client";
import { useEffect, useRef, useState } from "react";
import TopBar from "@/components/TopBar";
import UserMenu from "@/components/UserMenu";
import { upscaleMedia } from "@/lib/run";

// Persistent upscale library (mirrors the image/video galleries). Stores
// {url, kind, model, scale, ts, name}. fal URLs are short; cap to stay small.
const HISTORY_KEY = "eromify:upscaleHistory:v1";
const MAX_HISTORY = 100;
function loadHistory() {
  if (typeof window === "undefined") return [];
  try {
    const arr = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}
function saveHistory(arr) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(arr.slice(0, MAX_HISTORY))); } catch {}
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error || new Error("File read failed"));
    r.readAsDataURL(file);
  });
}

async function downloadMedia(url, filename) {
  try {
    const res = await fetch(url, { mode: "cors" });
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  } catch {
    window.open(url, "_blank", "noopener");
  }
}

// Model catalogs — labels here must match the keys in /api/upscale/start.
const IMAGE_MODELS = [
  { id: "Clarity Upscaler", desc: "High-fidelity creative detail (SD-based)", ic: "C" },
  { id: "Topaz Image",      desc: "Photographic accuracy, true-to-source",   ic: "T" },
  { id: "ESRGAN",           desc: "Fast Real-ESRGAN, great for art/anime",   ic: "E" },
  { id: "AuraSR (4x)",      desc: "GAN super-resolution, fixed 4×",          ic: "A" },
];
const VIDEO_MODELS = [
  { id: "Topaz Video", desc: "Proteus enhancement, up to 8× / 120fps", ic: "T" },
  { id: "SeedVR2",     desc: "Temporally-consistent video upscaling",  ic: "S" },
];
const SCALES = ["2x", "4x"];

function Dropdown({ open, children, onClose }) {
  if (!open) return null;
  return (
    <>
      <div className="dd-backdrop" onClick={onClose} />
      <div className="dd-menu" style={{ minWidth: 240 }}>{children}</div>
    </>
  );
}

export default function UpscalePage() {
  const [kind, setKind] = useState("image"); // 'image' | 'video'
  const [model, setModel] = useState(IMAGE_MODELS[0].id);
  const [scale, setScale] = useState("2x");
  const [source, setSource] = useState(null); // data URI
  const [sourceName, setSourceName] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);
  const fileRef = useRef(null);

  const [results, setResults] = useState([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { setResults(loadHistory()); setLoaded(true); }, []);
  useEffect(() => { if (loaded) saveHistory(results); }, [results, loaded]);

  const models = kind === "video" ? VIDEO_MODELS : IMAGE_MODELS;
  const currentModel = models.find((m) => m.id === model) || models[0];
  const toggle = (k) => setOpenMenu((m) => (m === k ? null : k));

  // Switch mode → reset model to that mode's default and clear an incompatible source.
  const switchKind = (k) => {
    if (k === kind) return;
    setKind(k);
    setModel((k === "video" ? VIDEO_MODELS : IMAGE_MODELS)[0].id);
    setSource(null);
    setSourceName("");
  };

  const onPickFile = async (file) => {
    if (!file) return;
    setError(null);
    setSource(await fileToDataUrl(file));
    setSourceName(file.name || "");
  };

  const canRun = !running && !!source;

  const run = async () => {
    if (!canRun) return;
    setRunning(true);
    setError(null);
    try {
      const url = await upscaleMedia({ kind, model, media: source, scale: parseInt(scale) || 2 });
      if (url) {
        setResults((rs) => [
          { url, kind, model, scale, ts: Date.now(), name: sourceName || model },
          ...rs,
        ]);
      }
    } catch (e) {
      setError(e.message || "Upscale failed");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="ip-page">
      <TopBar right={<UserMenu />} />

      <div className="ip-body">
        {results.length === 0 && !running ? (
          <div className="ip-hero">
            <div className="ip-hero-tiles">
              {["linear-gradient(135deg,#ec4899,#a855f7)", "linear-gradient(135deg,#a855f7,#3b82f6)", "linear-gradient(135deg,#3b82f6,#06b6d4)", "linear-gradient(135deg,#06b6d4,#10b981)"].map((bg, i) => (
                <div key={i} className="ip-hero-tile" style={{ background: bg, transform: `rotate(${(i - 1.5) * 4}deg) translateY(${i % 2 ? 10 : -10}px)` }}>
                  <span>{i % 2 ? "4K" : "HD"}</span>
                </div>
              ))}
            </div>
            <h1 className="ip-hero-title">
              Upscale with <span className="ip-hero-brand">{model}</span>
            </h1>
            <p className="ip-hero-sub">Sharpen and enlarge your {kind === "video" ? "videos" : "images"} up to {kind === "video" ? "8×" : "4×"} — drop a file below to start.</p>
          </div>
        ) : (
          <div className="ip-grid">
            {running && (
              <div className="ip-card ip-card-loading">
                <div className="ip-loading-shimmer" />
                <div className="ip-card-meta">Upscaling…</div>
              </div>
            )}
            {results.map((r, i) => (
              <div key={(r.ts || 0) + "-" + i} className="ip-card">
                {r.kind === "video" ? (
                  <video src={r.url} muted loop playsInline preload="metadata"
                    onMouseEnter={(e) => { e.currentTarget.play().catch(() => {}); }}
                    onMouseLeave={(e) => { e.currentTarget.pause(); }} />
                ) : (
                  <img src={r.url} alt={r.name} />
                )}
                <button
                  className="ip-card-dl"
                  onClick={() => downloadMedia(r.url, `eromify-upscaled-${(r.name || "file").slice(0, 32).replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.${r.kind === "video" ? "mp4" : "png"}`)}
                  title="Download"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                </button>
                <button
                  className="ip-card-del"
                  onClick={() => setResults((rs) => rs.filter((_, j) => j !== i))}
                  title="Remove from library"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
                <div className="ip-card-meta" title={`${r.model} · ${r.scale}`}>{r.model} · {r.scale} · {r.name}</div>
              </div>
            ))}
          </div>
        )}

        {error && <div className="mc-error ip-error">{error}</div>}
      </div>

      <div className="ip-bar">
        <div className="ip-bar-inner">
          <div className="ip-bar-input-row">
            <input
              ref={fileRef}
              type="file"
              accept={kind === "video" ? "video/*" : "image/*"}
              style={{ display: "none" }}
              onChange={(e) => { onPickFile(e.target.files?.[0]); e.target.value = ""; }}
            />
            <button className="up-source" onClick={() => fileRef.current?.click()} disabled={running}>
              {source ? (
                kind === "video"
                  ? <video src={source} muted playsInline />
                  : <img src={source} alt="source" />
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
              )}
            </button>
            <div className="up-source-label">
              {source ? (sourceName || "Selected file") : `Upload a${kind === "video" ? " video" : "n image"} to upscale`}
              {source && <button className="up-source-clear" onClick={() => { setSource(null); setSourceName(""); }} title="Remove">✕</button>}
            </div>
            <button className="ip-bar-generate" onClick={run} disabled={!canRun}>
              {running ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="pb-enhance-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                  Upscaling
                </>
              ) : (
                <>
                  Upscale
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7V3h4M17 3h4v4M21 17v4h-4M7 21H3v-4M9 9l6 6M15 9l-6 6"/></svg>
                </>
              )}
            </button>
          </div>

          <div className="ip-bar-chips">
            {/* Mode toggle: Image / Video */}
            <div className="up-seg">
              <button className={kind === "image" ? "is-active" : ""} onClick={() => switchKind("image")}>Image</button>
              <button className={kind === "video" ? "is-active" : ""} onClick={() => switchKind("video")}>Video</button>
            </div>

            {/* Model picker */}
            <div className="chip-wrap">
              <button className="vp-chip" onClick={() => toggle("model")}>
                <span className="ip-chip-ic">{currentModel?.ic || "M"}</span>
                <span>{model}</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0.5"><path d="M6 9l6 6 6-6"/></svg>
              </button>
              <Dropdown open={openMenu === "model"} onClose={() => setOpenMenu(null)}>
                {models.map((m) => (
                  <button
                    key={m.id}
                    className={`ip-model-row ${m.id === model ? "is-active" : ""}`}
                    onClick={() => { setModel(m.id); setOpenMenu(null); }}
                  >
                    <span className="ip-model-ic">{m.ic}</span>
                    <span className="ip-model-text">
                      <span className="ip-model-name">{m.id}</span>
                      <span className="ip-model-desc">{m.desc}</span>
                    </span>
                    {m.id === model && <svg className="ip-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>}
                  </button>
                ))}
              </Dropdown>
            </div>

            {/* Scale picker */}
            <div className="chip-wrap">
              <button className="vp-chip" onClick={() => toggle("scale")}>
                <span>{scale}</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0.5"><path d="M6 9l6 6 6-6"/></svg>
              </button>
              <Dropdown open={openMenu === "scale"} onClose={() => setOpenMenu(null)}>
                {SCALES.map((s) => (
                  <button key={s} className={`ip-model-row ${s === scale ? "is-active" : ""}`} onClick={() => { setScale(s); setOpenMenu(null); }}>
                    <span className="ip-model-text"><span className="ip-model-name">{s}</span></span>
                    {s === scale && <svg className="ip-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>}
                  </button>
                ))}
              </Dropdown>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
