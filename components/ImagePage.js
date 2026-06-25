"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import TopBar from "@/components/TopBar";
import UserMenu from "@/components/UserMenu";
import SectionHero from "@/components/SectionHero";
import { listInfluencers, syncInfluencers, resolveMentions } from "@/lib/influencers";
import MentionField from "@/components/MentionField";

// localStorage key for the persistent gallery on /image. Stores an array of
// {url, prompt, model, aspect, quality, ts}. Cap to MAX_HISTORY to keep the
// JSON small (fal-hosted URLs are short).
const HISTORY_KEY = "eromify:imageHistory:v1";
const MAX_HISTORY = 200;
function loadHistory() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}
function saveHistory(arr) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(arr.slice(0, MAX_HISTORY))); } catch {}
}

// Force-download an image as a file (works across origins via blob fetch).
async function downloadImage(url, filename) {
  try {
    const res = await fetch(url, { mode: "cors" });
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename || `eromify-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  } catch {
    // Fallback: open in a new tab so the user can save manually.
    window.open(url, "_blank", "noopener");
  }
}

// ---- Model catalog (Featured + All) — mirrors Higgsfield's grouped picker ----
const MODELS = {
  featured: [
    { id: "Flux 2 Pro",       desc: "Top-tier realism, our flagship",          badge: "PREMIUM", ic: "F" },
    { id: "Seedream 4.5",     desc: "ByteDance's next-gen 4K image model",     badge: "PREMIUM", ic: "S" },
    { id: "GPT Image 2",      desc: "4K images with near-perfect text",        badge: "NEW",     ic: "G" },
    { id: "Nano Banana Pro",  desc: "Google's flagship generation model",      ic: "N" },
    { id: "Flux 2 Max",       desc: "Maximum detail, slower",                  badge: "PREMIUM", ic: "F" },
  ],
  all: [
    { id: "GPT Image 1",      desc: "OpenAI's standard image model",           ic: "G" },
  ],
};
const ALL_MODELS = [...MODELS.featured, ...MODELS.all];

// ---- Aspect ratios with shape proxies for the dropdown thumbnail ----
const ASPECTS = [
  { id: "auto", label: "Auto", w: 18, h: 18 },
  { id: "1:1",  label: "1:1",  w: 18, h: 18 },
  { id: "3:4",  label: "3:4",  w: 14, h: 18 },
  { id: "4:3",  label: "4:3",  w: 18, h: 14 },
  { id: "2:3",  label: "2:3",  w: 12, h: 18 },
  { id: "3:2",  label: "3:2",  w: 18, h: 12 },
  { id: "9:16", label: "9:16", w: 10, h: 18 },
  { id: "16:9", label: "16:9", w: 18, h: 10 },
  { id: "5:4",  label: "5:4",  w: 18, h: 15 },
  { id: "4:5",  label: "4:5",  w: 15, h: 18 },
  { id: "21:9", label: "21:9", w: 22, h: 10 },
];

const QUALITIES = [
  { id: "1K", label: "1K" },
  { id: "2K", label: "2K" },
  { id: "4K", label: "4K", premium: true },
];

const SAMPLE_TILES = [
  { hue: "linear-gradient(135deg,#ec4899,#a855f7)", label: "Portrait" },
  { hue: "linear-gradient(135deg,#a855f7,#3b82f6)", label: "Concept" },
  { hue: "linear-gradient(135deg,#f59e0b,#ec4899)", label: "Editorial" },
  { hue: "linear-gradient(135deg,#10b981,#a855f7)", label: "Surreal" },
];

function Chip({ children, onClick, icon, tooltip }) {
  return (
    <button className="ip-chip" onClick={onClick} data-tooltip={tooltip || undefined}>
      {icon}
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>{children}</span>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0.5"><path d="M6 9l6 6 6-6"/></svg>
    </button>
  );
}

// Generic popover with a backdrop that closes on outside-click.
function Popover({ open, onClose, children, align = "left" }) {
  if (!open) return null;
  return (
    <>
      <div className="dd-backdrop" onClick={onClose} />
      <div className={`ip-pop ip-pop-${align}`}>{children}</div>
    </>
  );
}

function ModelRow({ m, selected, onPick }) {
  return (
    <button className={`ip-model-row ${selected ? "is-active" : ""}`} onClick={() => onPick(m.id)}>
      <span className="ip-model-ic">{m.ic || m.id[0]}</span>
      <span className="ip-model-text">
        <span className="ip-model-name">
          {m.id}
          {m.badge && <span className={`ip-badge ip-badge-${m.badge.toLowerCase()}`}>{m.badge}</span>}
        </span>
        <span className="ip-model-desc">{m.desc}</span>
      </span>
      {selected && (
        <svg className="ip-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
      )}
    </button>
  );
}

function AspectIcon({ w, h }) {
  // Render a small rounded rectangle proportional to the aspect.
  const max = 22;
  const scale = max / Math.max(w, h);
  const W = w * scale, H = h * scale;
  return (
    <span className="ip-asp-ic">
      <span style={{ width: W, height: H }} />
    </span>
  );
}

export default function ImagePage() {
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("Flux 2 Pro");
  const [aspect, setAspect] = useState("3:4");
  const [quality, setQuality] = useState("1K");
  const [batch, setBatch] = useState(1);
  const [openMenu, setOpenMenu] = useState(null);
  const [search, setSearch] = useState("");
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState([]);
  const [loaded, setLoaded] = useState(false);
  // Load saved history on mount so generations survive refresh/navigation.
  useEffect(() => {
    setResults(loadHistory());
    setLoaded(true);
  }, []);
  // Persist to localStorage only AFTER the initial load. Without this guard
  // the save effect fires once with the initial [] and wipes the saved data
  // before the load effect's state update lands.
  useEffect(() => { if (loaded) saveHistory(results); }, [results, loaded]);
  const [error, setError] = useState(null);

  // Characters currently referenced in the prompt (shown as chips). The
  // MentionField handles the @autocomplete + pink inline tag itself.
  const [influencers, setInfluencers] = useState([]);
  useEffect(() => { setInfluencers(listInfluencers()); syncInfluencers().then(setInfluencers); }, []);
  const mentioned = useMemo(() => resolveMentions(prompt).characters, [prompt, influencers]);

  // Generate | Edit mode. Edit takes an uploaded source image + prompt and
  // routes through fal's edit endpoints (image_urls), supporting @mention refs.
  const [mode, setMode] = useState("generate");
  const [editSource, setEditSource] = useState(null); // data URI
  const [enhancing, setEnhancing] = useState(false);

  const enhancePrompt = async () => {
    const cur = prompt.trim();
    if (!cur || enhancing) return;
    setEnhancing(true);
    try {
      // In edit mode the uploaded image locks the subject, so the API uses its
      // "describe only the change" prompt instead of the house style.
      const hasSourceImage = mode === "edit" && !!editSource;
      const res = await fetch("/api/prompt/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: cur, kind: "image", hasSourceImage }),
      });
      const j = await res.json();
      if (res.ok && j.prompt) setPrompt(j.prompt);
    } catch {} finally {
      setEnhancing(false);
    }
  };
  const editFileRef = useRef(null);
  const onPickEdit = async (file) => {
    if (!file) return;
    setError(null);
    const r = new FileReader();
    r.onload = () => setEditSource(r.result);
    r.readAsDataURL(file);
  };

  const toggle = (k) => setOpenMenu((m) => (m === k ? null : k));
  const canRun = !running && !!prompt.trim() && (mode === "generate" || !!editSource);
  const currentModel = ALL_MODELS.find((m) => m.id === model);

  const filteredFeatured = MODELS.featured.filter((m) =>
    !search || m.id.toLowerCase().includes(search.toLowerCase()) || m.desc.toLowerCase().includes(search.toLowerCase())
  );
  const filteredAll = MODELS.all.filter((m) =>
    !search || m.id.toLowerCase().includes(search.toLowerCase()) || m.desc.toLowerCase().includes(search.toLowerCase())
  );

  const generate = async () => {
    if (!canRun) return;
    setRunning(true);
    setError(null);
    try {
      const jobs = Array.from({ length: batch }, () => runOne());
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
    // Resolve @handles → swap to the character's name and attach her photo as a
    // likeness reference (image-to-image keeps her consistent).
    const original = prompt.trim();
    const { prompt: resolved, characters } = resolveMentions(original);
    // In edit mode the uploaded source goes first; @mentioned characters add
    // extra references. Both paths use fal's edit endpoints when images exist.
    const images = [
      ...(mode === "edit" && editSource ? [editSource] : []),
      ...characters.map((c) => c.image),
    ].filter(Boolean);
    const caption = original; // keep the @handle text for the library caption

    const startRes = await fetch("/api/image/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: resolved.trim(), model, aspect, quality, images: images.length ? images : undefined }),
    });
    const start = await startRes.json().catch(() => ({ error: `HTTP ${startRes.status}` }));
    if (!startRes.ok) throw new Error(start.error || `HTTP ${startRes.status}`);
    if (start.output) {
      setResults((r) => [{ url: start.output, prompt: caption, model, aspect, quality, ts: Date.now() }, ...r]);
      return;
    }
    const handle = { statusUrl: start.statusUrl, responseUrl: start.responseUrl };
    const deadline = Date.now() + 5 * 60 * 1000;
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
        setResults((r) => [{ url: s.output, prompt: caption, model, aspect, quality, ts: Date.now() }, ...r]);
        return;
      }
    }
    throw new Error("Image generation timed out");
  };

  const aspectMeta = ASPECTS.find((a) => a.id === aspect) || ASPECTS[0];

  return (
    <div className="ip-page">
      <TopBar right={<UserMenu />} />

      <div className="ip-body">
        <div className="ip-mode-seg">
          <button className={mode === "generate" ? "is-active" : ""} onClick={() => setMode("generate")}>Generate</button>
          <button className={mode === "edit" ? "is-active" : ""} onClick={() => setMode("edit")}>Edit</button>
        </div>
        {results.length === 0 ? (
          <SectionHero
            title={mode === "edit" ? "Edit with" : "Start creating with"}
            brand={model}
            sub={mode === "edit" ? "Upload an image and describe your change — type @ to summon an influencer." : "Describe a scene, character, mood, or style — and watch it come to life."}
          />
        ) : (
          <div className="ip-grid">
            {running && Array.from({ length: batch }).map((_, i) => (
              <div key={"ld-" + i} className="ip-card ip-card-loading">
                <div className="ip-loading-shimmer" />
                <div className="ip-card-meta">Generating…</div>
              </div>
            ))}
            {results.map((r, i) => (
              <div key={(r.ts || 0) + "-" + i} className="ip-card">
                <img src={r.url} alt={r.prompt} />
                <button
                  className="ip-card-dl"
                  onClick={() => downloadImage(r.url, `eromify-${(r.prompt || "image").slice(0, 32).replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.png`)}
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
                <div className="ip-card-meta" title={r.prompt}>{r.prompt}</div>
              </div>
            ))}
          </div>
        )}

        {error && <div className="mc-error ip-error">{error}</div>}
      </div>

      <div className="ip-bar">
        <div className="ip-bar-inner">
          {/* Attached character chips (resolved from the prompt) */}
          {mentioned.length > 0 && (
            <div className="mention-chips">
              {mentioned.map((inf) => (
                <span key={inf.id} className="mention-chip" title={`Using @${inf.handle}'s likeness`}>
                  <img src={inf.image} alt={inf.name} />
                  {inf.name}
                </span>
              ))}
            </div>
          )}
          {/* Edit mode: the source image being edited */}
          {mode === "edit" && (
            <div className="ip-edit-src-row">
              <input ref={editFileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { onPickEdit(e.target.files?.[0]); e.target.value = ""; }} />
              <button className="ip-edit-src" onClick={() => editFileRef.current?.click()} title="Upload image to edit">
                {editSource ? <img src={editSource} alt="source" /> : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg>
                )}
              </button>
              <span className="ip-edit-src-label">
                {editSource ? "Image to edit — describe your change below" : "Upload an image to edit"}
                {editSource && <button className="up-source-clear" onClick={() => setEditSource(null)} title="Remove">✕</button>}
              </span>
            </div>
          )}
          <div className="ip-bar-input-row">
            <button className="ip-bar-plus" title="Add reference image">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
            </button>
            <MentionField
              multiline
              rows={1}
              maxHeight={200}
              value={prompt}
              onChange={setPrompt}
              placeholder={mode === "edit" ? "Describe the change — type @ to summon an influencer" : "Describe the scene — type @ to summon an influencer"}
              onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) generate(); }}
            />
            <button className="pb-enhance" onClick={enhancePrompt} disabled={enhancing || !prompt.trim()} title="Enhance prompt with Eromify style">
              {enhancing ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="pb-enhance-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.9 4.6L18.5 8.5l-4.6 1.9L12 15l-1.9-4.6L5.5 8.5l4.6-1.9L12 2zM19 14l.95 2.05L22 17l-2.05.95L19 20l-.95-2.05L16 17l2.05-.95L19 14z" /></svg>
              )}
              <span>{enhancing ? "Enhancing…" : "Enhance"}</span>
            </button>
            <button className="ip-bar-generate" onClick={generate} disabled={!canRun}>
              {running ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="pb-enhance-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                  Generating
                </>
              ) : (
                <>
                  Generate
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.9 4.6L18.5 8.5l-4.6 1.9L12 15l-1.9-4.6L5.5 8.5l4.6-1.9L12 2z"/></svg>
                  <span className="ip-bar-count">{batch}</span>
                </>
              )}
            </button>
          </div>

          <div className="ip-bar-chips">
            {/* Model picker */}
            <div className="chip-wrap">
              <Chip
                icon={<span className="ip-chip-ic">{currentModel?.ic || "M"}</span>}
                onClick={() => toggle("model")}
                tooltip="Model"
              >
                {model}
              </Chip>
              <Popover open={openMenu === "model"} onClose={() => { setOpenMenu(null); setSearch(""); }}>
                <div className="ip-pop-search">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
                  <input
                    autoFocus
                    placeholder="Search…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                {filteredFeatured.length > 0 && (
                  <>
                    <div className="ip-pop-header">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.9 4.6L18.5 8.5l-4.6 1.9L12 15l-1.9-4.6L5.5 8.5l4.6-1.9L12 2z"/></svg>
                      Featured models
                    </div>
                    {filteredFeatured.map((m) => (
                      <ModelRow key={m.id} m={m} selected={m.id === model} onPick={(id) => { setModel(id); setOpenMenu(null); setSearch(""); }} />
                    ))}
                  </>
                )}
                {filteredAll.length > 0 && (
                  <>
                    <div className="ip-pop-header">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                      All models
                    </div>
                    {filteredAll.map((m) => (
                      <ModelRow key={m.id} m={m} selected={m.id === model} onPick={(id) => { setModel(id); setOpenMenu(null); setSearch(""); }} />
                    ))}
                  </>
                )}
              </Popover>
            </div>

            {/* Aspect ratio */}
            <div className="chip-wrap">
              <Chip
                icon={<AspectIcon w={aspectMeta.w} h={aspectMeta.h} />}
                onClick={() => toggle("aspect")}
                tooltip="Aspect ratio"
              >
                {aspectMeta.label}
              </Chip>
              <Popover open={openMenu === "aspect"} onClose={() => setOpenMenu(null)}>
                <div className="ip-pop-title">Aspect ratio</div>
                {ASPECTS.map((a) => (
                  <button
                    key={a.id}
                    className={`ip-aspect-row ${a.id === aspect ? "is-active" : ""}`}
                    onClick={() => { setAspect(a.id); setOpenMenu(null); }}
                  >
                    <AspectIcon w={a.w} h={a.h} />
                    <span>{a.label}</span>
                    {a.id === aspect && (
                      <svg className="ip-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                    )}
                  </button>
                ))}
              </Popover>
            </div>

            {/* Quality */}
            <div className="chip-wrap">
              <Chip
                icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 3L3 21M18 3l3 18M3 9h18M3 15h18"/></svg>}
                onClick={() => toggle("quality")}
                tooltip="Quality"
              >
                {quality}
              </Chip>
              <Popover open={openMenu === "quality"} onClose={() => setOpenMenu(null)}>
                <div className="ip-pop-title">Select quality</div>
                {QUALITIES.map((q) => (
                  <button
                    key={q.id}
                    className={`ip-aspect-row ${q.id === quality ? "is-active" : ""}`}
                    onClick={() => { setQuality(q.id); setOpenMenu(null); }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 600, flex: 1, textAlign: "left" }}>{q.label}</span>
                    {q.premium && <span className="ip-badge ip-badge-premium">Premium</span>}
                    {q.id === quality && (
                      <svg className="ip-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                    )}
                  </button>
                ))}
              </Popover>
            </div>

            {/* Batch size stepper */}
            <div className="chip-wrap">
              <button className="ip-chip ip-stepper" onClick={() => toggle("batch")} data-tooltip="Batch Size">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                <button
                  className="ip-step-btn"
                  disabled={batch <= 1}
                  onClick={(e) => { e.stopPropagation(); setBatch((b) => Math.max(1, b - 1)); }}
                >−</button>
                <span className="ip-step-num">{batch}/4</span>
                <button
                  className="ip-step-btn"
                  disabled={batch >= 4}
                  onClick={(e) => { e.stopPropagation(); setBatch((b) => Math.min(4, b + 1)); }}
                >+</button>
              </button>
              <Popover open={openMenu === "batch"} onClose={() => setOpenMenu(null)}>
                <div className="ip-pop-title">Batch Size</div>
                <div className="ip-batch-hint">Generate up to 4 images at once. Each costs the same as a single generation.</div>
              </Popover>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
