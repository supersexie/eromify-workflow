"use client";
import { useRef, useState } from "react";
import Tabs from "@/components/Tabs";
import UserMenu from "@/components/UserMenu";
import { generateVideo, generateMotion } from "@/lib/run";

const VIDEO_MODELS = [
  "Kling v2",
  "LTX Video",
  "Wan 2.2",
  "MiniMax Hailuo",
  "Veo 3.1 Fast",
  "Veo 3.1",
];

const MOTION_MODELS = ["Kling Motion Control Pro", "Kling Motion Control Std"];
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
  const [motionModel, setMotionModel] = useState(MOTION_MODELS[0]);
  const [aspect, setAspect] = useState("16:9");
  const [duration, setDuration] = useState("8s");
  const [openMenu, setOpenMenu] = useState(null);
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState(null);
  const [error, setError] = useState(null);

  const toggle = (k) => setOpenMenu((m) => (m === k ? null : k));

  const canRun = (() => {
    if (running) return false;
    if (sub === "create") return !!prompt.trim();
    if (sub === "motion") return !!image && !!refVideo;
    if (sub === "edit") return false; // disabled until backed
    return false;
  })();

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
            <MediaPick
              value={refVideo}
              kind="video"
              accept="video/*"
              label="Upload a video to edit"
              onPick={(u) => setRefVideo(u)}
              onClear={() => setRefVideo(null)}
              disabled={running}
            />
          )}
          {sub === "motion" && (
            <div className="vp-motion-pair">
              <MediaPick
                value={image}
                kind="image"
                accept="image/*"
                label="Character image"
                onPick={(u) => setImage(u)}
                onClear={() => setImage(null)}
                disabled={running}
              />
              <MediaPick
                value={refVideo}
                kind="video"
                accept="video/*"
                label="Reference video"
                onPick={(u) => setRefVideo(u)}
                onClear={() => setRefVideo(null)}
                disabled={running}
              />
            </div>
          )}

          <div className="vp-prompt-block">
            <div className="vp-prompt-label">Prompt</div>
            <textarea
              className="vp-prompt"
              placeholder={
                sub === "edit"
                  ? "Describe the edit (coming soon)…"
                  : sub === "motion"
                    ? "(Optional) refine the motion — e.g. 'exaggerated arm swing'"
                    : "Describe your scene in detail."
              }
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={running || sub === "edit"}
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
              <div className="vp-control-row">
                <div className="vp-control-label">Model</div>
                <div className="chip-wrap">
                  <Chip label={motionModel} onClick={() => toggle("motionModel")} />
                  <Dropdown open={openMenu === "motionModel"} options={MOTION_MODELS} onPick={setMotionModel} onClose={() => setOpenMenu(null)} />
                </div>
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
          {sub === "edit" && (
            <div className="vp-soon">Edit Video — coming soon</div>
          )}
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
                  <div className="vp-step-title">{sub === "motion" ? "Add image + ref video" : "Add image"}</div>
                  <div className="vp-step-sub">{sub === "motion" ? "A character image and a motion reference clip." : "Optional — start from an image or generate from text."}</div>
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
