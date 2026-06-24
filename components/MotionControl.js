"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { generateMotion } from "@/lib/run";
import UserMenu from "@/components/UserMenu";
import Tabs from "@/components/Tabs";

const MODELS = [
  { id: "Kling Motion Control Pro", label: "Kling Pro", note: "Higher quality · ~$0.49/5s" },
  { id: "Kling Motion Control Std", label: "Kling Standard", note: "Cheaper · ~$0.20/5s" },
];

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error || new Error("File read failed"));
    r.readAsDataURL(file);
  });
}

function bytesLabel(n) {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function DropZone({ kind, value, fileMeta, onPick, onClear, disabled }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const accept = kind === "image" ? "image/*" : "video/*";
  const label = kind === "image" ? "Character image" : "Reference video";
  const sub = kind === "image"
    ? "The subject to animate. Clear face & body, fills most of the frame."
    : "The motion to copy. Single subject, similar framing to the image. mp4/mov/webm.";

  const onFiles = async (files) => {
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith(kind === "image" ? "image/" : "video/")) return;
    const url = await readFileAsDataUrl(file);
    onPick(url, { name: file.name, size: file.size, type: file.type });
  };

  return (
    <div
      className={`mc-drop ${value ? "is-filled" : ""} ${dragOver ? "is-drag" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (disabled) return;
        onFiles(e.dataTransfer.files);
      }}
      onClick={() => !disabled && !value && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        style={{ display: "none" }}
        onChange={(e) => { onFiles(e.target.files); e.target.value = ""; }}
      />
      {value ? (
        <>
          <div className="mc-drop-preview">
            {kind === "image" ? (
              <img src={value} alt={label} />
            ) : (
              <video src={value} muted playsInline controls />
            )}
          </div>
          <div className="mc-drop-meta">
            <div className="mc-drop-meta-name">{fileMeta?.name || label}</div>
            <div className="mc-drop-meta-sub">{bytesLabel(fileMeta?.size)}</div>
          </div>
          <button
            className="mc-drop-clear"
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            disabled={disabled}
            title="Remove"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </>
      ) : (
        <div className="mc-drop-empty">
          <div className="mc-drop-icon">
            {kind === "image" ? (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-5-5L5 21" />
              </svg>
            ) : (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <polygon points="10 9 16 12 10 15 10 9" fill="currentColor" stroke="none" />
              </svg>
            )}
          </div>
          <div className="mc-drop-label">{label}</div>
          <div className="mc-drop-sub">{sub}</div>
          <div className="mc-drop-cta">Click or drop a file</div>
        </div>
      )}
    </div>
  );
}

export default function MotionControl() {
  const router = useRouter();
  const [image, setImage] = useState(null);
  const [imageMeta, setImageMeta] = useState(null);
  const [video, setVideo] = useState(null);
  const [videoMeta, setVideoMeta] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState(MODELS[0].id);
  const [generating, setGenerating] = useState(false);
  const [output, setOutput] = useState(null);
  const [error, setError] = useState(null);

  const canGenerate = !!image && !!video && !generating;

  const generate = async () => {
    if (!canGenerate) return;
    setGenerating(true);
    setError(null);
    setOutput(null);
    try {
      const url = await generateMotion({ prompt: prompt.trim(), model, image, video });
      setOutput(url);
    } catch (e) {
      setError(e.message || "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="mc-page">
      <div className="dash-topbar">
        <Tabs />
        <UserMenu />
      </div>

      <div className="mc-body">
        <h1 className="dash-h1">Motion Control</h1>
        <p className="dash-sub">Animate a character with the motion from any reference clip. Powered by Kling Motion Control on fal.</p>

        <div className="mc-grid">
          <DropZone
            kind="image"
            value={image}
            fileMeta={imageMeta}
            onPick={(u, m) => { setImage(u); setImageMeta(m); }}
            onClear={() => { setImage(null); setImageMeta(null); }}
            disabled={generating}
          />
          <DropZone
            kind="video"
            value={video}
            fileMeta={videoMeta}
            onPick={(u, m) => { setVideo(u); setVideoMeta(m); }}
            onClear={() => { setVideo(null); setVideoMeta(null); }}
            disabled={generating}
          />
        </div>

        <div className="mc-controls">
          <textarea
            className="mc-prompt"
            placeholder="(Optional) refine the motion — e.g. 'smoother hips, exaggerated arms'"
            rows={2}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={generating}
          />

          <div className="mc-controls-row">
            <div className="mc-model-group">
              {MODELS.map((m) => (
                <button
                  key={m.id}
                  className={`mc-model ${model === m.id ? "is-active" : ""}`}
                  onClick={() => setModel(m.id)}
                  disabled={generating}
                >
                  <div className="mc-model-label">{m.label}</div>
                  <div className="mc-model-note">{m.note}</div>
                </button>
              ))}
            </div>
            <button
              className="mc-generate"
              onClick={generate}
              disabled={!canGenerate}
            >
              {generating ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="pb-enhance-spin">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Generating…
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  Generate animation
                </>
              )}
            </button>
          </div>
        </div>

        {error && <div className="mc-error">{error}</div>}

        {(generating || output) && (
          <div className="mc-output">
            <h2 className="mc-output-title">{output ? "Result" : "Generating…"}</h2>
            {output ? (
              <video
                className="mc-output-video"
                src={output}
                controls
                autoPlay
                loop
                playsInline
              />
            ) : (
              <div className="mc-output-loading">
                <div className="mc-output-loading-bar" />
                <p>This usually takes 60–120 seconds. fal's queue runs it in the background.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
