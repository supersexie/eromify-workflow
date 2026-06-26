"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import TopBar from "@/components/TopBar";
import UserMenu from "@/components/UserMenu";
import SectionHero from "@/components/SectionHero";
import { listInfluencers, syncInfluencers, resolveMentions, IDENTITY_CLAUSE } from "@/lib/influencers";
import { imageCredits } from "@/lib/credits";
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

// In-flight jobs persisted so you can navigate away from /image (or refresh)
// and the placeholder card + polling pick back up when you return.
const PENDING_KEY = "eromify:imagePending:v1";
function loadPending() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(arr)) return [];
    // Drop entries older than 10 min — fal cleans up handles around then.
    const cutoff = Date.now() - 10 * 60 * 1000;
    return arr.filter((p) => p && p.statusUrl && (p.ts || 0) > cutoff);
  } catch { return []; }
}
function savePending(arr) {
  try { localStorage.setItem(PENDING_KEY, JSON.stringify(arr)); } catch {}
}

// Fire-and-forget: record a finished generation in the server-side index so
// it shows up across origins/devices, not just on whoever's localStorage.
function recordGeneration(url, prompt) {
  if (!url) return;
  try {
    fetch("/api/generations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, kind: "image", prompt: prompt || "" }),
      keepalive: true,
    }).catch(() => {});
  } catch {}
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

// Given a pixel width/height, pick the closest selectable aspect ratio (by
// comparing w/h). Skips "auto" since it has no real ratio.
function closestAspect(width, height) {
  if (!width || !height) return null;
  const target = width / height;
  let best = null, bestDiff = Infinity;
  for (const a of ASPECTS) {
    if (a.id === "auto") continue;
    const [aw, ah] = a.id.split(":").map(Number);
    if (!aw || !ah) continue;
    const diff = Math.abs(aw / ah - target);
    if (diff < bestDiff) { bestDiff = diff; best = a.id; }
  }
  return best;
}

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

// Models offered for the ✨ Enhance prompt rewriter (mirrors the canvas bar).
const ENHANCE_MODELS = [
  { id: "gpt-4.1-mini", label: "GPT-4.1 mini", note: "Fast & cheap · recommended" },
  { id: "gpt-4.1", label: "GPT-4.1", note: "Smarter, better paragraphs" },
];
const ENHANCE_PREF_KEY = "eromify:enhanceModel:v1";

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
  const [pending, setPending] = useState([]); // in-flight jobs (placeholder cards)
  const [results, setResults] = useState([]);
  const [loaded, setLoaded] = useState(false);

  // Single-source-of-truth setter that also persists, so pending cards survive
  // navigation away from /image and a refresh.
  const updatePending = (updater) => {
    setPending((cur) => {
      const next = typeof updater === "function" ? updater(cur) : updater;
      savePending(next);
      return next;
    });
  };
  // Load saved history on mount so generations survive refresh/navigation.
  // Also merge in the server-side index so images show up across origins
  // (apex vs www), devices, and browsers — not just whoever's localStorage.
  useEffect(() => {
    const local = loadHistory();
    setResults(local);
    setLoaded(true);
    fetch("/api/generations").then(r => r.ok ? r.json() : null).then((j) => {
      const server = (j?.items || []).filter((g) => (g.kind || "image") === "image" && g.url);
      if (!server.length) return;
      setResults((cur) => {
        const seen = new Set(cur.map((r) => r.url));
        const extra = server.filter((g) => !seen.has(g.url)).map((g) => ({
          url: g.url, prompt: g.prompt || "", model: g.model || "", aspect: g.aspect || "", quality: g.quality || "", ts: g.ts || 0,
        }));
        return [...cur, ...extra].sort((a, b) => (b.ts || 0) - (a.ts || 0));
      });
    }).catch(() => {});
  }, []);
  // Persist to localStorage only AFTER the initial load. Without this guard
  // the save effect fires once with the initial [] and wipes the saved data
  // before the load effect's state update lands.
  useEffect(() => { if (loaded) saveHistory(results); }, [results, loaded]);
  const [error, setError] = useState(null);
  // Auto-dismiss the error toast after 5s.
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(t);
  }, [error]);

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
  const [lightbox, setLightbox] = useState(null); // { url, prompt, i, ... } | null
  // Close the lightbox on Escape.
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e) => { if (e.key === "Escape") setLightbox(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox]);
  const [enhanceModel, setEnhanceModel] = useState(ENHANCE_MODELS[0].id);
  useEffect(() => {
    try { const v = localStorage.getItem(ENHANCE_PREF_KEY); if (v && ENHANCE_MODELS.some((m) => m.id === v)) setEnhanceModel(v); } catch {}
  }, []);
  const enhanceLabel = ENHANCE_MODELS.find((m) => m.id === enhanceModel)?.label || "GPT-4.1 mini";

  const enhancePrompt = async () => {
    const cur = prompt.trim();
    if (!cur || enhancing) return;
    setEnhancing(true);
    try {
      // In edit mode the uploaded image locks the subject, so the API uses its
      // "describe only the change" prompt instead of the house style.
      const hasSourceImage = (mode === "edit" || mode === "swap") && !!editSource;
      const res = await fetch("/api/prompt/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: cur, kind: "image", model: enhanceModel, hasSourceImage }),
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
    r.onload = () => {
      const dataUrl = r.result;
      setEditSource(dataUrl);
      // Snap the output aspect ratio to match the uploaded reference, so an
      // edit/face-swap of a 9:16 photo produces a 9:16 result by default.
      const img = new Image();
      img.onload = () => {
        const a = closestAspect(img.naturalWidth, img.naturalHeight);
        if (a) setAspect(a);
      };
      img.src = dataUrl;
    };
    r.readAsDataURL(file);
  };

  const toggle = (k) => setOpenMenu((m) => (m === k ? null : k));
  // Face Swap requires a source image + exactly one @influencer; the prompt is
  // optional (a baked-in template does the heavy lifting).
  const canRun = pending.length === 0 && (
    mode === "generate" ? !!prompt.trim() :
    mode === "edit"     ? (!!prompt.trim() && !!editSource) :
    /* swap */            (!!editSource && mentioned.length === 1)
  );
  const currentModel = ALL_MODELS.find((m) => m.id === model);

  const filteredFeatured = MODELS.featured.filter((m) =>
    !search || m.id.toLowerCase().includes(search.toLowerCase()) || m.desc.toLowerCase().includes(search.toLowerCase())
  );
  const filteredAll = MODELS.all.filter((m) =>
    !search || m.id.toLowerCase().includes(search.toLowerCase()) || m.desc.toLowerCase().includes(search.toLowerCase())
  );

  // Poll a single in-flight job to completion (or failure). Removes itself
  // from `pending` either way; on success pushes the finished image into
  // `results` + records it server-side.
  const pollJob = async (job) => {
    const deadline = Date.now() + 5 * 60 * 1000;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 3000));
      try {
        const sRes = await fetch("/api/image/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ statusUrl: job.statusUrl, responseUrl: job.responseUrl }),
        });
        const s = await sRes.json().catch(() => ({ error: `HTTP ${sRes.status}` }));
        if (!sRes.ok) throw new Error(s.error || `HTTP ${sRes.status}`);
        if (s.done) {
          setResults((r) => [{ url: s.output, prompt: job.prompt, model: job.model, aspect: job.aspect, quality: job.quality, ts: Date.now() }, ...r]);
          recordGeneration(s.output, job.prompt);
          updatePending((cur) => cur.filter((p) => p.id !== job.id));
          return;
        }
      } catch (e) {
        updatePending((cur) => cur.filter((p) => p.id !== job.id));
        setError(e.message || "Generation failed");
        return;
      }
    }
    updatePending((cur) => cur.filter((p) => p.id !== job.id));
    setError("Image generation timed out");
  };

  // Resume any in-flight jobs persisted from a previous page visit so the
  // placeholder cards reappear and polling picks back up.
  useEffect(() => {
    const persisted = loadPending();
    if (!persisted.length) return;
    setPending(persisted);
    persisted.forEach((p) => { if (p.statusUrl) pollJob(p); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generate = async () => {
    if (!canRun) return;
    setError(null);
    const original = prompt.trim();
    const { prompt: resolved, characters } = resolveMentions(original);
    // Source image goes FIRST in image_urls so prompt templates can refer to
    // "the first image" as the scene/composition to preserve. Influencer
    // photos follow as the identity references.
    const includeSource = (mode === "edit" || mode === "swap") && editSource;
    const images = [
      ...(includeSource ? [editSource] : []),
      ...characters.map((c) => c.image),
    ].filter(Boolean);
    const caption = original || (mode === "swap" ? `Face swap with @${characters[0]?.handle}` : "");

    // Build the model prompt per mode. Edit+@mention and Swap get explicit
    // ordering instructions because the generic IDENTITY_CLAUSE doesn't tell
    // the model which of the multiple references is the person vs the scene.
    let finalPrompt;
    if (mode === "swap") {
      const extra = resolved.trim();
      if (model === "Nano Banana Pro") {
        // Nano Banana Pro handles face swaps best with this simpler prompt.
        finalPrompt = `Take the scene, pose, body, clothing, lighting, and composition from the first image. Replace ONLY the person's face and hair with the person shown in the second image — keep their exact face, facial features, and hair identical to the second image, including the second person's exact hair color, shade, and tone (do not lighten, darken, or recolor the hair to match the first image). Everything else (background, clothing, pose, framing) must stay identical to the first image.${extra ? ` Additional guidance: ${extra}.` : ""}`;
      } else {
        // Other models need explicit instructions to adapt the new face to the
        // scene's angle, gaze, and lighting instead of pasting the reference.
        finalPrompt = `Photorealistic face swap. The FIRST image is the final photo — keep its exact composition, framing, background, body, pose, clothing, camera angle, and lighting unchanged. Transfer the identity of the person in the SECOND image: their face shape, bone structure, eyes, nose, lips, eyebrows, jawline, distinctive features, AND their hair color, hair style, and length, so the result is clearly recognizable as that person.\n\nCritically, do NOT copy the second image's head pose, gaze, expression, or lighting. Conform the new face and hair to the FIRST image: match its exact head orientation and tilt, the gaze/eye direction, the facial expression, and the camera perspective. Keep the SECOND person's hair color exactly, but relight the face and hair to the first image's light direction, intensity, soft/hard shadows, and color temperature; seamlessly blend skin tone, contrast, and color grade with the neck and body already in the first image. Match the first image's photographic qualities — lens, depth of field, sharpness, grain, and white balance — so it reads as one real, uncomposited photograph with no seams around the hairline or jaw.${extra ? ` Additional guidance: ${extra}.` : ""}`;
      }
    } else if (mode === "edit" && characters.length) {
      finalPrompt = `${resolved.trim()} The first image is the scene to edit (preserve its composition, lighting, and framing). The additional reference image(s) show the person to use — keep their exact face, facial features, and hair identical to the reference; do not invent a different person.`;
    } else if (characters.length) {
      finalPrompt = `${resolved.trim()} ${IDENTITY_CLAUSE}`;
    } else {
      finalPrompt = resolved.trim();
    }

    // Show placeholder cards immediately, before /api/image/start resolves.
    const placeholders = Array.from({ length: batch }, (_, i) => ({
      id: `job_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 7)}`,
      prompt: caption, model, aspect, quality, ts: Date.now(),
    }));
    updatePending((cur) => [...placeholders, ...cur]);

    placeholders.forEach((ph) => startAndPoll(ph, finalPrompt, images));
  };

  const startAndPoll = async (ph, finalPrompt, images) => {
    try {
      const startRes = await fetch("/api/image/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: finalPrompt, model: ph.model, aspect: ph.aspect, quality: ph.quality, images: images.length ? images : undefined }),
      });
      const start = await startRes.json().catch(() => ({ error: `HTTP ${startRes.status}` }));
      if (!startRes.ok) throw new Error(start.error || `HTTP ${startRes.status}`);
      if (start.output) {
        setResults((r) => [{ url: start.output, prompt: ph.prompt, model: ph.model, aspect: ph.aspect, quality: ph.quality, ts: Date.now() }, ...r]);
        recordGeneration(start.output, ph.prompt);
        updatePending((cur) => cur.filter((p) => p.id !== ph.id));
        return;
      }
      // Attach handle + persist so polling can resume after navigation.
      const enriched = { ...ph, statusUrl: start.statusUrl, responseUrl: start.responseUrl };
      updatePending((cur) => cur.map((p) => (p.id === ph.id ? enriched : p)));
      await pollJob(enriched);
    } catch (e) {
      updatePending((cur) => cur.filter((p) => p.id !== ph.id));
      setError(e.message || "Generation failed");
    }
  };

  const aspectMeta = ASPECTS.find((a) => a.id === aspect) || ASPECTS[0];

  // The enhance-model (GPT) picker, rendered in two spots: next to Enhance on
  // desktop, and in line with the model (Flux) on mobile. CSS shows whichever
  // fits the viewport; shared state keeps them in sync.
  const renderGptPicker = () => (
    <div className="chip-wrap pb-enhance-model-wrap">
      <button className="pb-enhance-model" onClick={() => toggle("enhanceModel")} title="Pick the model used by Enhance">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/></svg>
        <span>{enhanceLabel}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0.6"><path d="M6 9l6 6 6-6" /></svg>
      </button>
      {openMenu === "enhanceModel" && (
        <>
          <div className="dd-backdrop" onClick={() => setOpenMenu(null)} />
          <div className="dd-menu pb-enhance-menu">
            <div className="pb-enhance-menu-header">Enhance with</div>
            {ENHANCE_MODELS.map((m) => (
              <button
                key={m.id}
                className={m.id === enhanceModel ? "is-active" : ""}
                onClick={() => { setEnhanceModel(m.id); try { localStorage.setItem(ENHANCE_PREF_KEY, m.id); } catch {} setOpenMenu(null); }}
              >
                <span className="pb-enhance-menu-label">{m.label}</span>
                <span className="pb-enhance-menu-note">{m.note}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="ip-page">
      <TopBar right={<UserMenu />} />

      {error && (
        <div className="ip-toast" role="alert" onClick={() => setError(null)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
          <span>{error}</span>
        </div>
      )}

      <div className="ip-body">
        <div className="ip-mode-seg">
          <button className={mode === "generate" ? "is-active" : ""} onClick={() => setMode("generate")}>Generate</button>
          <button className={mode === "edit" ? "is-active" : ""} onClick={() => setMode("edit")}>Edit</button>
          <button className={mode === "swap" ? "is-active" : ""} onClick={() => { setMode("swap"); setModel("Nano Banana Pro"); }}>Face Swap</button>
        </div>
        {results.length === 0 && pending.length === 0 ? (
          <SectionHero
            title={mode === "swap" ? "Face swap with" : mode === "edit" ? "Edit with" : "Start creating with"}
            brand={mode === "swap" ? "Influencers" : model}
            sub={
              mode === "swap"
                ? "Upload a photo, then @-mention an influencer to put her face in the scene — pose, clothing, and composition stay identical."
                : mode === "edit"
                  ? "Upload an image and describe your change — type @ to summon an influencer."
                  : "Describe a scene, character, mood, or style — and watch it come to life."
            }
            tiles={[
              { img: "/hero/img1.png" },
              { img: "/hero/img2.png" },
              { img: "/hero/img3.png" },
              { img: "/hero/img4.png" },
            ]}
          />
        ) : (
          <div className="ip-grid ip-grid-uniform">
            {pending.map((p) => (
              <div key={p.id} className="ip-card ip-card-loading" title={p.prompt}>
                <div className="ip-loading-shimmer" />
                <div className="ip-card-meta">Generating…</div>
              </div>
            ))}
            {results.map((r, i) => (
              <button key={(r.ts || 0) + "-" + i} className="ip-card" onClick={() => setLightbox({ ...r, i })} title="Open">
                <img src={r.url} alt={r.prompt} />
              </button>
            ))}
          </div>
        )}
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
          {(mode === "edit" || mode === "swap") && (
            <div className="ip-edit-src-row">
              <input ref={editFileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { onPickEdit(e.target.files?.[0]); e.target.value = ""; }} />
              <button className="ip-edit-src" onClick={() => editFileRef.current?.click()} title={mode === "swap" ? "Upload the scene image (the body, pose, and composition we'll keep)" : "Upload image to edit"}>
                {editSource ? <img src={editSource} alt="source" /> : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg>
                )}
              </button>
              <span className="ip-edit-src-label">
                {mode === "swap"
                  ? (editSource
                      ? (mentioned.length === 1
                          ? `Swapping the face in this image with @${mentioned[0].handle}`
                          : "Now @-mention an influencer below — her face goes in.")
                      : "Upload a photo — we'll keep its pose, body, and composition.")
                  : (editSource ? "Image to edit — describe your change below" : "Upload an image to edit")}
                {editSource && <button className="up-source-clear" onClick={() => setEditSource(null)} title="Remove">✕</button>}
              </span>
            </div>
          )}
          <div className="ip-bar-input-row">
            <MentionField
              multiline
              dropUp
              rows={1}
              maxHeight={120}
              value={prompt}
              onChange={setPrompt}
              placeholder={
                mode === "swap"
                  ? "Optional extra guidance — e.g. 'studio lighting' (or leave blank)"
                  : mode === "edit"
                    ? "Describe the change — type @ to summon an influencer"
                    : "Describe the scene — type @ to summon an influencer"
              }
              onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) generate(); }}
            />
            <span className="ip-gpt-desktop">{renderGptPicker()}</span>
            <button className="pb-enhance" onClick={enhancePrompt} disabled={enhancing || !prompt.trim()} title="Enhance prompt with Eromify style">
              {enhancing ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="pb-enhance-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.9 4.6L18.5 8.5l-4.6 1.9L12 15l-1.9-4.6L5.5 8.5l4.6-1.9L12 2zM19 14l.95 2.05L22 17l-2.05.95L19 20l-.95-2.05L16 17l2.05-.95L19 14z" /></svg>
              )}
              <span>{enhancing ? "Enhancing…" : "Enhance prompt"}</span>
            </button>
          </div>

          <div className="ip-bar-chips">
            {/* Flux model + GPT enhance-model picker — one row on mobile. */}
            <div className="ip-chips-models">
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

            {/* Enhance-model picker — shown here (in line with the model) only
                on mobile; on desktop it renders next to the Enhance button. */}
            <span className="ip-gpt-mobile">{renderGptPicker()}</span>
            </div>{/* /ip-chips-models */}

            {/* Aspect, Resolution, Batch — one row on mobile. */}
            <div className="ip-chips-settings">
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
              <div className="ip-chip ip-stepper" role="button" tabIndex={0} onClick={() => toggle("batch")} data-tooltip="Batch Size">
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
              </div>
              <Popover open={openMenu === "batch"} onClose={() => setOpenMenu(null)}>
                <div className="ip-pop-title">Batch Size</div>
                <div className="ip-batch-hint">Generate up to 4 images at once. Each costs the same as a single generation.</div>
              </Popover>
            </div>
            </div>{/* /ip-chips-settings */}

            {/* Generate — pinned to the bottom-right corner of the chatbox */}
            <button className="ip-bar-generate ip-bar-generate-corner" onClick={generate} disabled={!canRun}>
              {pending.length > 0 ? (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="pb-enhance-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                  Generating
                </>
              ) : (
                <>
                  Generate
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.9 4.6L18.5 8.5l-4.6 1.9L12 15l-1.9-4.6L5.5 8.5l4.6-1.9L12 2z"/></svg>
                  <span className="ip-bar-count" title="Estimated credits">{imageCredits({ model, quality, batch, edit: mode === "edit" || mode === "swap" })}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {lightbox && (
        <div className="ip-lightbox" onClick={() => setLightbox(null)}>
          <button className="ip-lightbox-close" onClick={() => setLightbox(null)} title="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
          <div className="ip-lightbox-inner" onClick={(e) => e.stopPropagation()}>
            <img className="ip-lightbox-img" src={lightbox.url} alt={lightbox.prompt} />
            <div className="ip-lightbox-bar">
              <div className="ip-lightbox-caption" title={lightbox.prompt}>{lightbox.prompt || "(no prompt)"}</div>
              <div className="ip-lightbox-actions">
                <button
                  className="ip-lightbox-btn"
                  onClick={() => downloadImage(lightbox.url, `eromify-${(lightbox.prompt || "image").slice(0, 32).replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.png`)}
                  title="Download"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                  Download
                </button>
                <button
                  className="ip-lightbox-btn ip-lightbox-btn-del"
                  onClick={() => { setResults((rs) => rs.filter((_, j) => j !== lightbox.i)); setLightbox(null); }}
                  title="Delete"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
