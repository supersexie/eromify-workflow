"use client";
import { useState } from "react";
import Tabs from "@/components/Tabs";
import UserMenu from "@/components/UserMenu";

const MODELS = [
  "Flux 2 Pro",
  "Flux 2 Max",
  "Nano Banana Pro",
  "Seedream 4.5",
  "GPT Image 2",
  "GPT Image 1",
];

const ASPECTS = ["1:1", "3:4", "4:3", "16:9", "9:16"];

// Sample tiles shown in the empty-state hero. Replaced with real generations
// once the user clicks Generate.
const SAMPLE_TILES = [
  { hue: "linear-gradient(135deg,#ec4899,#a855f7)", label: "Portrait" },
  { hue: "linear-gradient(135deg,#a855f7,#3b82f6)", label: "Concept" },
  { hue: "linear-gradient(135deg,#f59e0b,#ec4899)", label: "Editorial" },
  { hue: "linear-gradient(135deg,#10b981,#a855f7)", label: "Surreal" },
];

function Chip({ label, icon, onClick, accent }) {
  return (
    <button className="ip-chip" onClick={onClick} style={accent ? { color: accent } : null}>
      {icon}
      <span>{label}</span>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0.5"><path d="M6 9l6 6 6-6"/></svg>
    </button>
  );
}

function Dropdown({ open, options, onPick, onClose }) {
  if (!open) return null;
  return (
    <>
      <div className="dd-backdrop" onClick={onClose} />
      <div className="dd-menu">
        {options.map((o) => (
          <button key={o} onClick={() => { onPick(o); onClose(); }}>{o}</button>
        ))}
      </div>
    </>
  );
}

export default function ImagePage() {
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("Flux 2 Pro");
  const [aspect, setAspect] = useState("3:4");
  const [count, setCount] = useState(1);
  const [openMenu, setOpenMenu] = useState(null);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState([]); // [{ url, prompt, model }]
  const [error, setError] = useState(null);

  const toggle = (k) => setOpenMenu((m) => (m === k ? null : k));
  const canRun = !!prompt.trim() && !running;

  const generate = async () => {
    if (!canRun) return;
    setRunning(true);
    setError(null);
    try {
      // Kick off N parallel generations. We track each so partial results show
      // immediately as they land instead of waiting for the slowest.
      const jobs = Array.from({ length: count }, () => runOne());
      const settled = await Promise.allSettled(jobs);
      const fails = settled.filter((s) => s.status === "rejected");
      if (fails.length && fails.length === settled.length) {
        setError(fails[0].reason?.message || "Generation failed");
      }
    } finally {
      setRunning(false);
    }
  };

  const runOne = async () => {
    const startRes = await fetch("/api/image/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: prompt.trim(), model }),
    });
    const start = await startRes.json().catch(() => ({ error: `HTTP ${startRes.status}` }));
    if (!startRes.ok) throw new Error(start.error || `HTTP ${startRes.status}`);
    if (start.output) {
      setResults((r) => [{ url: start.output, prompt: prompt.trim(), model }, ...r]);
      return;
    }
    // Poll for fal queue completion.
    const handle = { statusUrl: start.statusUrl, responseUrl: start.responseUrl };
    const deadline = Date.now() + 3 * 60 * 1000;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 3000));
      const sRes = await fetch("/api/image/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(handle),
      });
      const s = await sRes.json().catch(() => ({ error: `HTTP ${sRes.status}` }));
      if (!sRes.ok) throw new Error(s.error || `HTTP ${sRes.status}`);
      if (s.done) {
        setResults((r) => [{ url: s.output, prompt: prompt.trim(), model }, ...r]);
        return;
      }
    }
    throw new Error("Image generation timed out");
  };

  return (
    <div className="ip-page">
      <div className="dash-topbar">
        <Tabs />
        <UserMenu />
      </div>

      <div className="ip-body">
        {results.length === 0 ? (
          <div className="ip-hero">
            <div className="ip-hero-tiles">
              {SAMPLE_TILES.map((t, i) => (
                <div
                  key={i}
                  className="ip-hero-tile"
                  style={{ background: t.hue, transform: `rotate(${(i - 1.5) * 4}deg) translateY(${i % 2 ? 10 : -10}px)` }}
                >
                  <span>{t.label}</span>
                </div>
              ))}
            </div>
            <h1 className="ip-hero-title">
              Start creating with
              <span className="ip-hero-brand"> {model}</span>
            </h1>
            <p className="ip-hero-sub">Describe a scene, character, mood, or style — and watch it come to life.</p>
          </div>
        ) : (
          <div className="ip-grid">
            {running && (
              <div className="ip-card ip-card-loading">
                <div className="ip-loading-shimmer" />
                <div className="ip-card-meta">Generating…</div>
              </div>
            )}
            {results.map((r, i) => (
              <div key={i} className="ip-card">
                <img src={r.url} alt={r.prompt} />
                <div className="ip-card-meta" title={r.prompt}>{r.prompt}</div>
              </div>
            ))}
          </div>
        )}

        {error && <div className="mc-error ip-error">{error}</div>}
      </div>

      <div className="ip-bar">
        <div className="ip-bar-inner">
          <div className="ip-bar-input-row">
            <button className="ip-bar-plus" title="Add reference image">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
            </button>
            <input
              className="ip-bar-input"
              placeholder="Describe the scene you imagine"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) generate(); }}
            />
            <button className="ip-bar-generate" onClick={generate} disabled={!canRun}>
              {running ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="pb-enhance-spin">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Generating
                </>
              ) : (
                <>
                  Generate
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l1.9 4.6L18.5 8.5l-4.6 1.9L12 15l-1.9-4.6L5.5 8.5l4.6-1.9L12 2z" />
                  </svg>
                  <span className="ip-bar-count">{count}</span>
                </>
              )}
            </button>
          </div>

          <div className="ip-bar-chips">
            <div className="chip-wrap">
              <Chip
                label={model}
                icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b"><polygon points="12 2 2 22 22 22 12 2"/></svg>}
                onClick={() => toggle("model")}
              />
              <Dropdown open={openMenu === "model"} options={MODELS} onPick={setModel} onClose={() => setOpenMenu(null)} />
            </div>
            <div className="chip-wrap">
              <Chip
                label={aspect}
                icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="4" width="14" height="16" rx="2"/></svg>}
                onClick={() => toggle("aspect")}
              />
              <Dropdown open={openMenu === "aspect"} options={ASPECTS} onPick={setAspect} onClose={() => setOpenMenu(null)} />
            </div>
            <div className="chip-wrap">
              <Chip
                label={`${count}/4`}
                icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>}
                onClick={() => toggle("count")}
              />
              <Dropdown open={openMenu === "count"} options={["1", "2", "3", "4"]} onPick={(v) => setCount(parseInt(v))} onClose={() => setOpenMenu(null)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
