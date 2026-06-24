"use client";
import { useRef } from "react";
import { Handle, Position, useReactFlow } from "@xyflow/react";
import { bodyDims } from "@/lib/cardSize";

const ACCEPT = {
  image: "image/*",
  video: "video/*",
  audio: "audio/*",
  motion: "video/*,image/*",
};

const HEADER_ICONS = {
  image: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  ),
  video: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m22 8-6 4 6 4V8Z" />
      <rect x="2" y="6" width="14" height="12" rx="2" />
    </svg>
  ),
  text: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 7V5h16v2M9 19h6M12 5v14" />
    </svg>
  ),
  audio: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 5 6 9H2v6h4l5 4V5zM19 12a4 4 0 0 0-2-3.5M23 12a8 8 0 0 0-4-7" />
    </svg>
  ),
  motion: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="6 3 20 12 6 21 6 3" fill="currentColor" />
    </svg>
  ),
};

const KIND_TITLE = {
  image: "Image",
  video: "Video",
  text: "Text",
  audio: "Audio",
  motion: "Motion",
};

const PLACEHOLDER = {
  image: (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.4">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  ),
  video: (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.4">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <polygon points="10 9 16 12 10 15 10 9" fill="currentColor" />
    </svg>
  ),
  text: (
    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.4">
      <path d="M4 6h16M4 10h16M4 14h10M4 18h12" />
    </svg>
  ),
  audio: (
    <svg width="80" height="60" viewBox="0 0 80 60" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.5" strokeLinecap="round">
      <path d="M8 30v0M16 22v16M24 16v28M32 26v8M40 12v36M48 22v16M56 18v24M64 26v8M72 30v0" />
    </svg>
  ),
  motion: (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.4">
      <polygon points="6 3 20 12 6 21 6 3" />
    </svg>
  ),
};

const SIZE_CLASS = {
  image: "card-square",
  video: "card-wide",
  text: "card-tall",
  audio: "card-square",
  motion: "card-square",
};

export default function WorkflowNode({ id, data, selected }) {
  const kind = data.kind || "image";
  const fileRef = useRef(null);
  const { setNodes, deleteElements } = useReactFlow();
  const dims = bodyDims(kind, data.aspect); // null for text/audio (fixed sizes)

  const onDelete = (e) => {
    e.stopPropagation();
    deleteElements({ nodes: [{ id }] });
  };

  const onPickFile = (e) => {
    e.stopPropagation();
    fileRef.current?.click();
  };

  const onFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result;
      setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, data: { ...n.data, output: url, status: "done", uploadedName: file.name } } : n)));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className={`wf-card ${SIZE_CLASS[kind]} ${selected ? "is-selected" : ""}`} style={dims ? { width: dims.w } : undefined}>
      {ACCEPT[kind] && (
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPT[kind]}
          multiple
          style={{ display: "none" }}
          onChange={onFile}
          onClick={(e) => e.stopPropagation()}
        />
      )}
      <Handle type="target" position={Position.Left} />
      <div className="wf-card-header">
        <span className="wf-card-header-ic">{HEADER_ICONS[kind]}</span>
        <span>{KIND_TITLE[kind]}</span>
        <button
          type="button"
          className="wf-card-delete"
          onClick={onDelete}
          onPointerDown={(e) => e.stopPropagation()}
          title="Delete node"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          </svg>
        </button>
      </div>
      <div className="wf-card-body" style={dims ? { width: dims.w, height: dims.h } : undefined}>
        {data.output && (kind === "image" || kind === "video") && (data.output.startsWith("http") || data.output.startsWith("data:") || data.output.startsWith("/api/")) ? (
          <>
            {kind === "video" ? (
              <video src={data.output} className="wf-card-output" muted loop playsInline autoPlay controls />
            ) : (
              <img src={data.output} alt="output" className="wf-card-output" />
            )}
            <button
              type="button"
              className="wf-card-source-corner"
              title="Upload a different file"
              onClick={onPickFile}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
            </button>
          </>
        ) : data.output && kind === "audio" && data.output.startsWith("data:") ? (
          <>
            <div className="wf-card-placeholder">{PLACEHOLDER[kind]}</div>
            <audio src={data.output} controls style={{ width: "85%", marginTop: 8 }} onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} />
            <button type="button" className="wf-card-source-corner" title="Upload different audio" onClick={onPickFile} onPointerDown={(e) => e.stopPropagation()}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
            </button>
          </>
        ) : data.output && kind === "text" ? (
          <div
            className="wf-card-text"
            onPointerDown={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            {data.output}
          </div>
        ) : data.sourceThumb ? (
          <>
            <div className="wf-card-source-tile">
              <img src={data.sourceThumb} alt="source" />
              <div className="wf-card-source-tile-badge">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
              </div>
            </div>
            <div className="wf-card-cta">
              {kind === "video" ? "Click to describe your scene" : kind === "audio" ? "Click to describe the sound" : "Click to describe"}
            </div>
          </>
        ) : (
          <>
            <div className="wf-card-placeholder">{PLACEHOLDER[kind]}</div>
            <div className="wf-card-cta">
              {kind === "text" ? "Click to describe or type" : "Click to describe"}
            </div>
            {kind === "text" ? (
              <div className="wf-card-upload">Type manually</div>
            ) : (
              <button
                type="button"
                className="wf-card-upload wf-card-upload-btn"
                onClick={onPickFile}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                </svg>
                Upload one or more
              </button>
            )}
          </>
        )}
        {data.status === "running" && <div className="wf-card-running">{kind === "video" ? "Generating video… (1-3 min)" : "Generating…"}</div>}
        {data.status === "error" && <div className="wf-card-running" style={{ background: "rgba(248,113,113,.15)", color: "#fca5a5", borderColor: "#7f1d1d" }}>{data.error || "Failed"}</div>}
        {kind === "text" && <div className="wf-card-resize" />}
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
