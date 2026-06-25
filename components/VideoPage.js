"use client";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import TopBar from "@/components/TopBar";
import UserMenu from "@/components/UserMenu";
import SectionHero from "@/components/SectionHero";
import { generateVideo, generateMotion, generateVideoEdit } from "@/lib/run";
import { listInfluencers, syncInfluencers, resolveMentions, IDENTITY_CLAUSE } from "@/lib/influencers";
import MentionField from "@/components/MentionField";

// Edit-mode model catalog — top showcase + grouped picker on the sidebar.
const EDIT_MODELS = [
  {
    id: "Kling O1 Video Edit",
    desc: "Modify, restyle, change angles, transform",
    long: "Generate with elements and references",
    ic: "K",
  },
  {
    id: "Kling O3 Omni Edit",
    desc: "Edit videos with text prompts",
    long: "Edit videos with text prompts",
    badge: "EXCLUSIVE",
    ic: "K",
  },
  {
    id: "Kling Motion Control",
    desc: "Control motion with video references",
    long: "Control motion with video references",
    ic: "K",
  },
];

const EDIT_QUALITIES = ["720p", "1080p"];

const VIDEO_MODELS = [
  "Kling 3.0",
  "Kling 2.6",
  "Kling 2.5 Turbo",
  "Kling v2",
  "Seedance 2.0",
  "Seedance 2.0 Fast",
  "Wan 2.7",
  "Wan 2.2",
  "MiniMax Hailuo 2.3",
  "MiniMax Hailuo",
  "PixVerse v6",
  "Sora 2",
  "LTX Video",
  "Veo 3.1",
  "Veo 3.1 Fast",
];

// Rich catalog for the Motion Control model picker (mirrors the Edit picker).
const MOTION_MODEL_CATALOG = [
  { id: "Kling 3.0 Motion Control", long: "Transfer motion from video to image", badge: "NEW", ic: "K" },
  { id: "Kling 3.0 Motion Control Std", long: "Kling 3.0 motion transfer — faster & cheaper", badge: null, ic: "K" },
  { id: "Kling Motion Control Pro", long: "Higher-quality motion-following (v2.6)", badge: null, ic: "K" },
  { id: "Kling Motion Control Std", long: "Faster, cheaper (v2.6 Std)", badge: null, ic: "K" },
  { id: "Wan Motion", long: "Pose-retargeted character motion (720p)", badge: null, ic: "W" },
  { id: "Wan 2.2 Animate Move", long: "Replicate expressions & movement from a reference", badge: null, ic: "W" },
  { id: "Wan 2.2 Animate Replace", long: "Swap your character into a reference video", badge: null, ic: "W" },
];
const MOTION_MODELS = MOTION_MODEL_CATALOG.map((m) => m.id);
const MOTION_QUALITIES = ["720p", "1080p"];
const ASPECTS = ["16:9", "9:16", "1:1"];
const DURATIONS = ["4s", "6s", "8s", "10s"];

const SUB_TABS = [
  { id: "create", label: "Create Video" },
  { id: "edit", label: "Edit Video" },
  { id: "motion", label: "Motion Control" },
];

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error || new Error("File read failed"));
    r.readAsDataURL(file);
  });
}

// Persistent video library (mirrors the /image gallery). Stores an array of
// {url, prompt, model, aspect, quality, kind, ts}; fal/Veo URLs are short so we
// cap to keep the JSON small. Shared across all three sub-tabs.
const VIDEO_HISTORY_KEY = "eromify:videoHistory:v1";
const MAX_VIDEO_HISTORY = 100;
function loadVideoHistory() {
  if (typeof window === "undefined") return [];
  try {
    const arr = JSON.parse(localStorage.getItem(VIDEO_HISTORY_KEY) || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}
function saveVideoHistory(arr) {
  try { localStorage.setItem(VIDEO_HISTORY_KEY, JSON.stringify(arr.slice(0, MAX_VIDEO_HISTORY))); } catch {}
}

// Force-download a video as a file (blob fetch works across origins).
async function downloadVideo(url, filename) {
  try {
    const res = await fetch(url, { mode: "cors" });
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename || `eromify-${Date.now()}.mp4`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  } catch {
    window.open(url, "_blank", "noopener");
  }
}

function MediaPick({ value, kind, accept, label, onPick, onClear, disabled }) {
  const ref = useRef(null);
  const handle = async (f) => {
    if (!f) return;
    const url = await fileToDataUrl(f);
    onPick(url, { name: f.name, size: f.size });
  };
  return (
    <div className={`vp-media ${value ? "is-filled" : ""}`} onClick={() => !value && !disabled && ref.current?.click()}>
      <input ref={ref} type="file" accept={accept} style={{ display: "none" }} onChange={(e) => { handle(e.target.files?.[0]); e.target.value = ""; }} />
      {value ? (
        <>
          {kind === "image" ? <img src={value} alt={label} /> : <video src={value} muted playsInline />}
          <button className="vp-media-x" onClick={(e) => { e.stopPropagation(); onClear(); }} disabled={disabled}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </>
      ) : (
        <div className="vp-media-empty">
          <div className="vp-media-icons">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2"/><polygon points="10 9 16 12 10 15 10 9" fill="currentColor" stroke="none"/></svg>
          </div>
          <div className="vp-media-label">{label}</div>
        </div>
      )}
    </div>
  );
}

function Chip({ label, onClick }) {
  return (
    <button className="vp-chip" onClick={onClick}>
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

// Wrap inner content in a Suspense boundary so useSearchParams() (used for
// ?sub deep-linking) doesn't blow up the Next.js production prerender.
export default function VideoPage() {
  return (
    <Suspense fallback={<div className="vp-page" />}>
      <VideoPageInner />
    </Suspense>
  );
}

function VideoPageInner() {
  // Allow deep-linking to a sub-tab via ?sub=motion|edit|create. The top-nav
  // 'Motion Control' tab uses this to land users directly on the motion mode.
  const searchParams = useSearchParams();
  const initialSub = (() => {
    const v = searchParams.get("sub");
    return v === "motion" || v === "edit" || v === "create" ? v : "create";
  })();
  const [sub, setSub] = useState(initialSub);

  // If the user navigates between tabs (e.g. Video → Motion Control via the
  // top nav) the sub query changes but the page doesn't remount — sync it.
  useEffect(() => {
    const v = searchParams.get("sub");
    if (v === "motion" || v === "edit" || v === "create") setSub(v);
  }, [searchParams]);
  const [prompt, setPrompt] = useState("");
  const [image, setImage] = useState(null); // data URI
  const [refVideo, setRefVideo] = useState(null); // motion-control reference
  const [model, setModel] = useState(VIDEO_MODELS[0]);
  const [motionModel, setMotionModel] = useState(MOTION_MODELS[0]); // defaults to Kling 3.0 Motion Control
  const [aspect, setAspect] = useState("16:9");
  const [duration, setDuration] = useState("8s");
  const [openMenu, setOpenMenu] = useState(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);
  const [enhancing, setEnhancing] = useState(false);
  // Persistent video library (shared across create/edit/motion). The `loaded`
  // gate prevents the save effect from clobbering storage with [] before the
  // initial load lands (same pattern as the /image gallery).
  const [results, setResults] = useState([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { setResults(loadVideoHistory()); setLoaded(true); }, []);
  useEffect(() => { if (loaded) saveVideoHistory(results); }, [results, loaded]);
  // Motion-mode extras
  const [motionQuality, setMotionQuality] = useState("720p");
  const [sceneCtrl, setSceneCtrl] = useState(true);
  const [sceneSource, setSceneSource] = useState("image"); // 'image' | 'video'
  const [motionSearch, setMotionSearch] = useState("");
  // Edit-mode state
  const [editVideo, setEditVideo] = useState(null);
  const [editRefs, setEditRefs] = useState([]); // up to 4 image data URIs
  const [editModel, setEditModel] = useState(EDIT_MODELS[0].id);
  const [editQuality, setEditQuality] = useState("720p");
  const [editAuto, setEditAuto] = useState(true);
  const [editSearch, setEditSearch] = useState("");
  const editVideoRef = useRef(null);
  const editRefsRef = useRef(null);

  const enhancePrompt = async () => {
    const cur = prompt.trim();
    if (!cur || enhancing) return;
    setEnhancing(true);
    try {
      // Edit/motion lock the subject via uploaded media → "describe the change".
      const hasSourceImage = (sub === "edit" && !!editVideo) || (sub === "motion" && (!!image || !!refVideo));
      const res = await fetch("/api/prompt/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: cur, kind: "video", hasSourceImage }),
      });
      const j = await res.json();
      if (res.ok && j.prompt) setPrompt(j.prompt);
    } catch {} finally {
      setEnhancing(false);
    }
  };

  // Influencers for the attached-character chips (MentionField does autocomplete).
  const [influencers, setInfluencers] = useState([]);
  useEffect(() => { setInfluencers(listInfluencers()); syncInfluencers().then(setInfluencers); }, []);
  const mentioned = useMemo(() => resolveMentions(prompt).characters, [prompt, influencers]);

  const toggle = (k) => setOpenMenu((m) => (m === k ? null : k));

  const canRun = (() => {
    if (running) return false;
    if (sub === "create") return !!prompt.trim();
    if (sub === "motion") return !!image && !!refVideo;
    if (sub === "edit") return !!editVideo && !!prompt.trim();
    return false;
  })();

  const currentEditModel = EDIT_MODELS.find((m) => m.id === editModel) || EDIT_MODELS[0];

  const onEditVideoPick = async (file) => {
    if (!file) return;
    const url = await fileToDataUrl(file);
    setEditVideo(url);
  };
  const onEditRefsPick = async (files) => {
    if (!files?.length) return;
    const arr = [...editRefs];
    for (const f of files) {
      if (arr.length >= 4) break;
      arr.push(await fileToDataUrl(f));
    }
    setEditRefs(arr);
  };

  const run = async () => {
    if (!canRun) return;
    setRunning(true);
    setError(null);
    try {
      let url;
      let meta;
      if (sub === "create") {
        // Resolve @handles → use the character's name in the prompt and her
        // photo as the start image (image-to-video) for likeness consistency.
        const { prompt: resolved, characters } = resolveMentions(prompt.trim());
        const startImage = image || characters[0]?.image || null;
        const finalPrompt = characters.length ? `${resolved.trim()} ${IDENTITY_CLAUSE}` : resolved.trim();
        url = await generateVideo({
          prompt: finalPrompt,
          model,
          image: startImage,
          aspect,
          resolution: "720p",
          duration: parseInt(duration) || 8,
        });
        meta = { model, aspect, quality: "720p" };
      } else if (sub === "motion") {
        url = await generateMotion({
          prompt: prompt.trim(),
          model: motionModel,
          image,
          video: refVideo,
        });
        meta = { model: motionModel, aspect: "—", quality: motionQuality };
      } else if (sub === "edit") {
        url = await generateVideoEdit({
          prompt: prompt.trim(),
          model: editModel,
          video: editVideo,
          refs: editRefs,
          quality: editQuality,
        });
        meta = { model: editModel, aspect: "—", quality: editQuality };
      }
      if (url) {
        setResults((rs) => [
          { url, prompt: prompt.trim() || meta.model, kind: sub, ts: Date.now(), ...meta },
          ...rs,
        ]);
      }
    } catch (e) {
      setError(e.message || "Generation failed");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="vp-page">
      <TopBar right={<UserMenu />} />

      <div className="vp-shell">
        <aside className="vp-sidebar">
          <div className="vp-subtabs">
            {SUB_TABS.map((t) => (
              <button
                key={t.id}
                className={`vp-subtab ${sub === t.id ? "is-active" : ""}`}
                onClick={() => setSub(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Mode-specific media picker(s) */}
          {sub === "create" && (
            <MediaPick
              value={image}
              kind="image"
              accept="image/*"
              label="Start image (optional)"
              onPick={(u) => setImage(u)}
              onClear={() => setImage(null)}
              disabled={running}
            />
          )}
          {sub === "edit" && (
            <>
              {/* Model showcase card at the top — gradient background, big brand label */}
              <div className="vp-edit-hero">
                <div className="vp-edit-hero-bg" />
                <button className="vp-edit-hero-howto" type="button">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16v16H4z"/><path d="M8 9h8M8 13h6"/></svg>
                  How it works
                </button>
                <div className="vp-edit-hero-name">{editModel.toUpperCase()}</div>
                <div className="vp-edit-hero-sub">{currentEditModel.desc}</div>
              </div>

              {/* Source video */}
              <div
                className={`vp-media vp-edit-vid ${editVideo ? "is-filled" : ""}`}
                onClick={() => !editVideo && !running && editVideoRef.current?.click()}
              >
                <input
                  ref={editVideoRef}
                  type="file"
                  accept="video/*"
                  style={{ display: "none" }}
                  onChange={(e) => { onEditVideoPick(e.target.files?.[0]); e.target.value = ""; }}
                />
                {editVideo ? (
                  <>
                    <video src={editVideo} muted playsInline controls />
                    <button className="vp-media-x" onClick={(e) => { e.stopPropagation(); setEditVideo(null); }} disabled={running}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                  </>
                ) : (
                  <div className="vp-media-empty">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2"/><polygon points="10 9 16 12 10 15 10 9" fill="currentColor" stroke="none"/></svg>
                    <div className="vp-media-label">Upload a video to edit</div>
                    <div className="vp-media-sub">Duration required: 3–10 secs</div>
                  </div>
                )}
              </div>

              {/* Optional references */}
              <div className="vp-edit-refs-block">
                <div className="vp-edit-refs-badge">Optional</div>
                <input
                  ref={editRefsRef}
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: "none" }}
                  onChange={(e) => { onEditRefsPick(e.target.files); e.target.value = ""; }}
                />
                {editRefs.length === 0 ? (
                  <div className="vp-media vp-edit-refs-empty" onClick={() => !running && editRefsRef.current?.click()}>
                    <div className="vp-media-empty">
                      <div className="vp-edit-plus">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
                      </div>
                      <div className="vp-media-label">Upload images &amp; elements</div>
                      <div className="vp-media-sub">Up to 4 images or elements</div>
                    </div>
                  </div>
                ) : (
                  <div className="vp-edit-refs-grid">
                    {editRefs.map((r, i) => (
                      <div key={i} className="vp-edit-ref">
                        <img src={r} alt={`ref ${i + 1}`} />
                        <button
                          className="vp-edit-ref-x"
                          onClick={() => setEditRefs(editRefs.filter((_, j) => j !== i))}
                          disabled={running}
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                        </button>
                      </div>
                    ))}
                    {editRefs.length < 4 && (
                      <button
                        className="vp-edit-ref vp-edit-ref-add"
                        onClick={() => editRefsRef.current?.click()}
                        disabled={running}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
          {sub === "motion" && (
            <>
              {/* Showcase card */}
              <div className="vp-edit-hero">
                <div className="vp-edit-hero-bg" />
                <button className="vp-edit-hero-howto" type="button">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16v16H4z"/><path d="M8 9h8M8 13h6"/></svg>
                  How it works
                </button>
                <div className="vp-edit-hero-name">MOTION CONTROL</div>
                <div className="vp-edit-hero-sub">Control motion with video references</div>
              </div>

              {/* Add motion to copy + Add your character */}
              <div className="vp-motion-pair">
                <MediaPick
                  value={refVideo}
                  kind="video"
                  accept="video/*"
                  label="Add motion to copy"
                  onPick={(u) => setRefVideo(u)}
                  onClear={() => setRefVideo(null)}
                  disabled={running}
                />
                <MediaPick
                  value={image}
                  kind="image"
                  accept="image/*"
                  label="Add your character"
                  onPick={(u) => setImage(u)}
                  onClear={() => setImage(null)}
                  disabled={running}
                />
              </div>
              <div className="vp-motion-helper">
                <div className="vp-motion-helper-row">
                  <span className="vp-motion-helper-label">Motion clip:</span>
                  <span>3–30 seconds</span>
                </div>
                <div className="vp-motion-helper-row">
                  <span className="vp-motion-helper-label">Character:</span>
                  <span>Image with visible face and body</span>
                </div>
              </div>
            </>
          )}

          <div className="vp-prompt-block">
            <div className="vp-prompt-labelrow">
              <div className="vp-prompt-label">Prompt</div>
              <button className="pb-enhance pb-enhance-sm" onClick={enhancePrompt} disabled={enhancing || !prompt.trim()} title="Enhance prompt with Eromify style">
                {enhancing ? (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="pb-enhance-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                ) : (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.9 4.6L18.5 8.5l-4.6 1.9L12 15l-1.9-4.6L5.5 8.5l4.6-1.9L12 2zM19 14l.95 2.05L22 17l-2.05.95L19 20l-.95-2.05L16 17l2.05-.95L19 14z" /></svg>
                )}
                <span>{enhancing ? "Enhancing…" : "Enhance"}</span>
              </button>
            </div>
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
            <div className="vp-prompt-wrap">
              <MentionField
                multiline
                rows={4}
                placeholder={
                  sub === "edit"
                    ? 'Describe the change you want, like "Make it snow". Add elements using @'
                    : sub === "motion"
                      ? "(Optional) refine the motion — e.g. 'exaggerated arm swing'"
                      : "Describe your scene — type @ to summon an influencer."
                }
                value={prompt}
                onChange={setPrompt}
                disabled={running}
              />
            </div>
          </div>

          {/* Per-mode controls */}
          {sub === "create" && (
            <div className="vp-controls">
              <div className="vp-control-row">
                <div className="vp-control-label">Model</div>
                <div className="chip-wrap">
                  <Chip label={model} onClick={() => toggle("model")} />
                  <Dropdown open={openMenu === "model"} options={VIDEO_MODELS} onPick={setModel} onClose={() => setOpenMenu(null)} />
                </div>
              </div>
              <div className="vp-control-row">
                <div className="vp-control-label">Aspect</div>
                <div className="chip-wrap">
                  <Chip label={aspect} onClick={() => toggle("aspect")} />
                  <Dropdown open={openMenu === "aspect"} options={ASPECTS} onPick={setAspect} onClose={() => setOpenMenu(null)} />
                </div>
              </div>
              <div className="vp-control-row">
                <div className="vp-control-label">Duration</div>
                <div className="chip-wrap">
                  <Chip label={duration} onClick={() => toggle("duration")} />
                  <Dropdown open={openMenu === "duration"} options={DURATIONS} onPick={setDuration} onClose={() => setOpenMenu(null)} />
                </div>
              </div>
            </div>
          )}
          {sub === "motion" && (
            <div className="vp-controls">
              {/* Rich model picker (same shape as Edit's) */}
              <div className="chip-wrap vp-control-row vp-edit-model-row" style={{ position: "relative" }}>
                <div className="vp-edit-model-info">
                  <div className="vp-control-label">Model</div>
                  <div className="vp-edit-model-name">
                    {motionModel}
                    <span className="vp-edit-model-mark"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></svg></span>
                  </div>
                </div>
                <button className="vp-edit-model-open" onClick={() => toggle("motionModel")}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 6l6 6-6 6"/></svg>
                </button>
                {openMenu === "motionModel" && (
                  <>
                    <div className="dd-backdrop" onClick={() => { setOpenMenu(null); setMotionSearch(""); }} />
                    <div className="ip-pop vp-edit-pop">
                      <div className="ip-pop-search">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
                        <input autoFocus placeholder="Search…" value={motionSearch} onChange={(e) => setMotionSearch(e.target.value)} />
                      </div>
                      <div className="ip-pop-header">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                        All models
                      </div>
                      {MOTION_MODEL_CATALOG
                        .filter((m) => !motionSearch || m.id.toLowerCase().includes(motionSearch.toLowerCase()) || m.long.toLowerCase().includes(motionSearch.toLowerCase()))
                        .map((m) => (
                          <button
                            key={m.id}
                            className={`ip-model-row ${m.id === motionModel ? "is-active" : ""}`}
                            onClick={() => { setMotionModel(m.id); setOpenMenu(null); setMotionSearch(""); }}
                          >
                            <span className="ip-model-ic">{m.ic}</span>
                            <span className="ip-model-text">
                              <span className="ip-model-name">
                                {m.id}
                                {m.badge && <span className={`ip-badge ip-badge-${m.badge.toLowerCase()}`}>{m.badge}</span>}
                              </span>
                              <span className="ip-model-desc">{m.long}</span>
                            </span>
                            {m.id === motionModel && (
                              <svg className="ip-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                            )}
                          </button>
                        ))}
                    </div>
                  </>
                )}
              </div>

              {/* Quality row */}
              <div className="chip-wrap vp-control-row" style={{ position: "relative" }}>
                <div className="vp-control-label">Quality</div>
                <button className="vp-edit-model-open" onClick={() => toggle("motionQuality")}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", marginRight: 6 }}>{motionQuality}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 6l6 6-6 6"/></svg>
                </button>
                <Dropdown open={openMenu === "motionQuality"} options={MOTION_QUALITIES} onPick={setMotionQuality} onClose={() => setOpenMenu(null)} />
              </div>

              {/* Scene control mode */}
              <div className="vp-scene-block">
                <div className="vp-control-row vp-toggle-row" style={{ background: "transparent", border: "none", padding: "0 2px" }}>
                  <div className="vp-control-label" style={{ color: "var(--ink)", fontSize: 13, fontWeight: 600 }}>Scene control mode</div>
                  <button
                    className={`vp-toggle ${sceneCtrl ? "is-on" : ""}`}
                    onClick={() => setSceneCtrl((v) => !v)}
                    type="button"
                  >
                    <span className="vp-toggle-knob" />
                  </button>
                </div>
                {sceneCtrl && (
                  <>
                    <div className="vp-seg">
                      <button
                        className={`vp-seg-btn ${sceneSource === "video" ? "is-active" : ""}`}
                        onClick={() => setSceneSource("video")}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2"/><polygon points="10 9 16 12 10 15 10 9" fill="currentColor" stroke="none"/></svg>
                        Video
                      </button>
                      <button
                        className={`vp-seg-btn ${sceneSource === "image" ? "is-active" : ""}`}
                        onClick={() => setSceneSource("image")}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg>
                        Image
                      </button>
                    </div>
                    <div className="vp-scene-help">
                      Choose where the background should come from: the character image or the motion video.
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
          {sub === "edit" && (
            <div className="vp-controls">
              {/* Auto settings toggle */}
              <div className="vp-control-row vp-toggle-row">
                <div className="vp-control-label">Auto settings</div>
                <button
                  className={`vp-toggle ${editAuto ? "is-on" : ""}`}
                  onClick={() => setEditAuto((v) => !v)}
                  type="button"
                >
                  <span className="vp-toggle-knob" />
                </button>
              </div>

              {/* Rich model picker */}
              <div className="chip-wrap vp-control-row vp-edit-model-row" style={{ position: "relative" }}>
                <div className="vp-edit-model-info">
                  <div className="vp-control-label">Model</div>
                  <div className="vp-edit-model-name">
                    {editModel}
                    <span className="vp-edit-model-mark"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></svg></span>
                  </div>
                </div>
                <button className="vp-edit-model-open" onClick={() => toggle("editModel")}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 6l6 6-6 6"/></svg>
                </button>
                {openMenu === "editModel" && (
                  <>
                    <div className="dd-backdrop" onClick={() => { setOpenMenu(null); setEditSearch(""); }} />
                    <div className="ip-pop vp-edit-pop">
                      <div className="ip-pop-search">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
                        <input autoFocus placeholder="Search…" value={editSearch} onChange={(e) => setEditSearch(e.target.value)} />
                      </div>
                      <div className="ip-pop-header">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                        All models
                      </div>
                      {EDIT_MODELS
                        .filter((m) => !editSearch || m.id.toLowerCase().includes(editSearch.toLowerCase()) || m.long.toLowerCase().includes(editSearch.toLowerCase()))
                        .map((m) => (
                          <button
                            key={m.id}
                            className={`ip-model-row ${m.id === editModel ? "is-active" : ""}`}
                            onClick={() => { setEditModel(m.id); setOpenMenu(null); setEditSearch(""); }}
                          >
                            <span className="ip-model-ic">{m.ic}</span>
                            <span className="ip-model-text">
                              <span className="ip-model-name">
                                {m.id}
                                {m.badge && <span className={`ip-badge ip-badge-${m.badge.toLowerCase()}`}>{m.badge}</span>}
                              </span>
                              <span className="ip-model-desc">{m.long}</span>
                            </span>
                            {m.id === editModel && (
                              <svg className="ip-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                            )}
                          </button>
                        ))}
                    </div>
                  </>
                )}
              </div>

              {/* Quality chip */}
              <div className="chip-wrap">
                <button className="ip-chip vp-quality-chip" onClick={() => toggle("editQuality")}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 2 22 22 22 12 2"/></svg>
                  <span>{editQuality}</span>
                </button>
                <Dropdown open={openMenu === "editQuality"} options={EDIT_QUALITIES} onPick={setEditQuality} onClose={() => setOpenMenu(null)} />
              </div>
            </div>
          )}

          <button className="vp-generate" onClick={run} disabled={!canRun}>
            {running ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="pb-enhance-spin">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Generating…
              </>
            ) : (
              <>Generate</>
            )}
          </button>
        </aside>

        <main className="vp-main">
          {(results.length > 0 || running) ? (
            <div className="ip-grid vp-grid">
              {running && (
                <div className="ip-card ip-card-loading">
                  <div className="ip-loading-shimmer" />
                  <div className="ip-card-meta">Generating…</div>
                </div>
              )}
              {results.map((r, i) => (
                <div key={(r.ts || 0) + "-" + i} className="ip-card">
                  <video
                    src={r.url}
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    onMouseEnter={(e) => { e.currentTarget.play().catch(() => {}); }}
                    onMouseLeave={(e) => { e.currentTarget.pause(); }}
                  />
                  <button
                    className="ip-card-dl"
                    onClick={() => downloadVideo(r.url, `eromify-${(r.prompt || "video").slice(0, 32).replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.mp4`)}
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
          ) : sub === "motion" ? (
            <div className="vp-motion-main">
              {/* Top tabs: History / Motion library — cosmetic for v1 */}
              <div className="vp-main-tabs">
                <button className="vp-main-tab">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18v12H3zM3 10h18"/></svg>
                  History
                </button>
                <button className="vp-main-tab is-active">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19V5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2zM8 3v18"/></svg>
                  Motion library
                </button>
              </div>

              <div className="vp-motion-hero">
                <div className="vp-motion-hero-text">
                  <h1 className="vp-motion-h1">
                    Recreate any <span className="vp-bracket">[<span className="vp-motion-h1-grad">MOTION</span>]</span>
                    <br />with your image
                  </h1>
                  <p className="vp-motion-hero-sub">Copy motion from any video and place your character into the same movement.</p>
                </div>
                <div className="vp-motion-hero-tiles">
                  {[
                    "linear-gradient(135deg,#ec4899,#a855f7)",
                    "linear-gradient(135deg,#3b82f6,#a855f7)",
                    "linear-gradient(135deg,#10b981,#ec4899)",
                  ].map((bg, i) => (
                    <div key={i} className="vp-motion-tile" style={{ background: bg, transform: `rotate(${(i - 1) * 6}deg) translateY(${i % 2 ? 8 : -8}px)` }} />
                  ))}
                </div>
              </div>

              <div className="vp-motion-library">
                <h2 className="vp-motion-library-title">Start by copying motion from library</h2>
                <div className="vp-motion-library-grid">
                  {[
                    "linear-gradient(135deg,#7c3aed,#ec4899)",
                    "linear-gradient(135deg,#06b6d4,#3b82f6)",
                    "linear-gradient(135deg,#f59e0b,#ef4444)",
                    "linear-gradient(135deg,#10b981,#84cc16)",
                    "linear-gradient(135deg,#a855f7,#ec4899)",
                  ].map((bg, i) => (
                    <button
                      key={i}
                      className="vp-motion-library-card"
                      style={{ background: bg }}
                      title="Use this motion (coming soon)"
                    >
                      <svg className="vp-play" width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"/></svg>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : sub === "edit" ? (
            <SectionHero
              title="Edit any"
              brand="Video"
              sub="Upload a 3–10s clip and describe the change — restyle, relight, swap elements, or add motion."
              tiles={[
                { hue: "linear-gradient(135deg,#6366f1,#a855f7)", label: "Restyle" },
                { hue: "linear-gradient(135deg,#0ea5e9,#22c55e)", label: "Relight" },
                { hue: "linear-gradient(135deg,#f59e0b,#ec4899)", label: "Swap" },
                { hue: "linear-gradient(135deg,#ec4899,#a855f7)", label: "Motion" },
              ]}
            />
          ) : (
            <SectionHero
              title="Create video with"
              brand={model}
              sub="Describe a scene or start from an image — type @ to summon an influencer."
              tiles={[
                { hue: "linear-gradient(135deg,#ec4899,#a855f7)", label: "Cinematic" },
                { hue: "linear-gradient(135deg,#a855f7,#3b82f6)", label: "B-roll" },
                { hue: "linear-gradient(135deg,#f59e0b,#ec4899)", label: "Portrait" },
                { hue: "linear-gradient(135deg,#10b981,#0ea5e9)", label: "VFX" },
              ]}
            />
          )}
          {error && <div className="mc-error vp-error">{error}</div>}
        </main>
      </div>
    </div>
  );
}
