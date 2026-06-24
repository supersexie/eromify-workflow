// Shared card sizing so a node's shape follows its selected aspect ratio.
// Used by WorkflowNode (to size the rendered card) and Canvas (to keep React
// Flow's stored node width/height in sync so handles and edges stay aligned).

export const CARD_HEADER = 32; // header row height above the card body

// Parse the "W:H" prefix from an aspect label like "16:9 · 1080p".
export function aspectRatio(aspect) {
  const m = /(\d+)\s*:\s*(\d+)/.exec(aspect || "");
  return m ? [Number(m[1]), Number(m[2])] : null;
}

// Body (preview) dimensions for image/video nodes; null for other kinds
// (text/audio keep their fixed sizes).
export function bodyDims(kind, aspect) {
  if (kind !== "image" && kind !== "video") return null;
  const r = aspectRatio(aspect) || (kind === "video" ? [16, 9] : [1, 1]);
  const [w, h] = r;
  if (w === h) return { w: 320, h: 320 };
  const LONG = 460;
  if (w > h) return { w: LONG, h: Math.round((LONG * h) / w) };
  return { w: Math.round((LONG * w) / h), h: LONG };
}

// Full React Flow node dimensions (body + header).
export function nodeDims(kind, aspect) {
  const b = bodyDims(kind, aspect);
  return b ? { width: b.w, height: b.h + CARD_HEADER } : null;
}
