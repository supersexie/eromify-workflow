"use client";

const KEY = "wfc:workflows:v1";

function read() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

// Strip inline base64 (data: URIs) from node data so a heavy workflow still
// fits in localStorage. URL-based outputs (fal/blob/http) are kept — only
// huge inline blobs (uploads, base64 generations) are dropped. This guarantees
// the workflow STRUCTURE (nodes, positions, prompts, edges) always persists.
function stripHeavy(all) {
  const lite = {};
  for (const [id, wf] of Object.entries(all || {})) {
    lite[id] = {
      ...wf,
      nodes: (wf.nodes || []).map((n) => {
        const d = { ...(n.data || {}) };
        for (const k of ["output", "sourceThumb", "image", "media"]) {
          if (typeof d[k] === "string" && d[k].startsWith("data:")) d[k] = null;
        }
        return { ...n, data: d };
      }),
    };
  }
  return lite;
}

function write(all) {
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // Quota exceeded (large base64 in node data). Persist a lite version so the
    // workflow's nodes are never lost — only inline data: blobs are dropped.
    try { localStorage.setItem(KEY, JSON.stringify(stripHeavy(all))); } catch {}
  }
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function listWorkflows() {
  const all = read();
  return Object.values(all).sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getWorkflow(id) {
  return read()[id] || null;
}

export function createWorkflow(name = "Untitled Canvas") {
  const all = read();
  const id = uid();
  const now = Date.now();
  all[id] = {
    id,
    name,
    nodes: [],
    edges: [],
    createdAt: now,
    updatedAt: now,
  };
  write(all);
  return all[id];
}

export function saveWorkflow(wf) {
  const all = read();
  all[wf.id] = { ...wf, updatedAt: Date.now() };
  write(all);
}

export function renameWorkflow(id, name) {
  const all = read();
  if (!all[id]) return;
  all[id].name = name;
  all[id].updatedAt = Date.now();
  write(all);
}

export function deleteWorkflow(id) {
  const all = read();
  delete all[id];
  write(all);
}

// Persistent generation history — every output a node produces is appended
// here so it survives regeneration (which overwrites the node's current
// output). Separate key from the workflows so it's never lost on node edits.
const GEN_KEY = "eromify:genHistory:v1";
const MAX_GENS = 500;

function readGens() {
  if (typeof window === "undefined") return [];
  try {
    const arr = JSON.parse(localStorage.getItem(GEN_KEY) || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

// Record a freshly-produced output. Deduped by url; newest first; capped.
export function recordGeneration({ url, kind, prompt, workflowId, workflowName, nodeId, ts }) {
  if (typeof window === "undefined") return;
  if (!url || typeof url !== "string") return;
  try {
    const existing = readGens().filter((g) => g.url !== url);
    const next = [
      { url, kind: kind || "image", prompt: prompt || "", workflowId, workflowName, nodeId, ts: ts || Date.now() },
      ...existing,
    ].slice(0, MAX_GENS);
    localStorage.setItem(GEN_KEY, JSON.stringify(next));
  } catch {}
}

// Collect every generated/uploaded media output: the persistent history PLUS
// each node's current output (so brand-new outputs show even before recording,
// and uploads that were never "generated" still appear). Deduped by url.
export function listGenerations() {
  const all = read();
  const byUrl = new Map();
  // History first (carries older, since-overwritten generations).
  for (const g of readGens()) {
    if (g.url && !byUrl.has(g.url)) byUrl.set(g.url, g);
  }
  // Then current node outputs (fills in anything not yet recorded).
  for (const wf of Object.values(all)) {
    for (const n of wf.nodes || []) {
      const o = n.data?.output;
      const kind = n.data?.kind;
      if (
        o &&
        typeof o === "string" &&
        (o.startsWith("http") || o.startsWith("data:") || o.startsWith("/api/")) &&
        !byUrl.has(o)
      ) {
        byUrl.set(o, {
          url: o,
          kind,
          prompt: n.data?.prompt || "",
          workflowId: wf.id,
          workflowName: wf.name,
          nodeId: n.id,
          ts: wf.updatedAt || 0,
        });
      }
    }
  }
  return [...byUrl.values()].sort((a, b) => (b.ts || 0) - (a.ts || 0));
}
