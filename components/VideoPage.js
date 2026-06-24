"use client";
import { useRef, useState } from "react";
import Tabs from "@/components/Tabs";
import UserMenu from "@/components/UserMenu";
import { generateVideo, generateMotion, generateVideoEdit } from "@/lib/run";

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
  "Kling v2",
  "LTX Video",
  "Wan 2.2",
  "MiniMax Hailuo",
  "Veo 3.1 Fast",
  "Veo 3.1",
];

// Rich catalog for the Motion Control model picker (mirrors the Edit picker).
const MOTION_MODEL_CATALOG = [
  { id: "Kling 3.0 Motion Control", long: "Transfer motion from video to image", badge: null, ic: "K" },
  { id: "Kling Motion Control Pro", long: "Higher-quality motion-following (v2.6)", badge: null, ic: "K" },
  { id: "Kling Motion Control Std", long: "Faster, cheaper (v2.6 Std)", badge: null, ic: "K" },
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

export default function VideoPage() {
  const [sub, setSub] = useState("create");
  const [prompt, setPrompt] = useState("");
  const [image, setImage] = useState(null); // data URI
  const [refVideo, setRefVideo] = useState(null); // motion-control reference
  const [model, setModel] = useState(VIDEO_MODELS[0]);
  const [motionModel, setMotionModel] = useState(MOTION_MODELS[0]); // defaults to Kling 3.0 Motion Control
  const [aspect, setAspect] = useState("16:9");
  const [duration, setDuration] = useState("8s");
  const [openMenu, setOpenMenu] = useState(null);
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState(null);
  const [error, setError] = useState(null);
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
    setOutput(null);
    try {
      let url;
      if (sub === "create") {
        url = await generateVideo({
          prompt: prompt.trim(),
          model,
          image: image || null,
          aspect,
          resolution: "720p",
          duration: parseInt(duration) || 8,
        });
      } else if (sub === "motion") {
        url = await generateMotion({
          prompt: prompt.trim(),
          model: motionModel,
          image,
          video: refVideo,
        });
      } else if (sub === "edit") {
        url = await generateVideoEdit({
          prompt: prompt.trim(),
          model: editModel,
          video: editVideo,
          refs: editRefs,
          quality: editQuality,
        });
      }
      setOutput(url);
    } catch (e) {
      setError(e.message || "Generation failed");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="vp-page">
      <div className="dash-topbar">
        <Tabs />
        <UserMenu />
      </div>

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
            <div className="vp-prompt-label">Prompt</div>
            <textarea
              className="vp-prompt"
              placeholder={
                sub === "edit"
                  ? 'Describe the change you want, like "Make it snow". Add elements using @'
                  : sub === "motion"
                    ? "(Optional) refine the motion — e.g. 'exaggerated arm swing'"
                    : "Describe your scene in detail."
              }
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={running}
            />
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
          {output ? (
            <div className="vp-output">
              <video src={output} controls autoPlay loop playsInline className="vp-output-video" />
            </div>
          ) : running ? (
            <div className="vp-loading">
              <div className="vp-loading-bar"><div className="vp-loading-bar-inner" /></div>
              <p>Generating video on fal's queue. This usually takes 60–120 seconds.</p>
            </div>
          ) : (
            <div className="vp-hero">
              <h1 className="vp-hero-title">Make videos in one click</h1>
              <p className="vp-hero-sub">250+ presets for camera control, framing, and high-quality VFX — or use the general preset for manual control.</p>
              <div className="vp-steps">
                <div className="vp-step">
                  <div className="vp-step-num">1</div>
                  <div className="vp-step-title">{sub === "motion" ? "Add image + ref video" : sub === "edit" ? "Upload a 3–10s video" : "Add image"}</div>
                  <div className="vp-step-sub">{sub === "motion" ? "A character image and a motion reference clip." : sub === "edit" ? "Optional: add up to 4 reference images for elements." : "Optional — start from an image or generate from text."}</div>
                </div>
                <div className="vp-step">
                  <div className="vp-step-num">2</div>
                  <div className="vp-step-title">Describe & choose</div>
                  <div className="vp-step-sub">Write a prompt and pick model / aspect / duration.</div>
                </div>
                <div className="vp-step">
                  <div className="vp-step-num">3</div>
                  <div className="vp-step-title">Generate</div>
                  <div className="vp-step-sub">Click generate. The clip lands here when fal finishes the render.</div>
                </div>
              </div>
            </div>
          )}
          {error && <div className="mc-error vp-error">{error}</div>}
        </main>
      </div>
    </div>
  );
}
