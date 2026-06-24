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

function write(all) {
  localStorage.setItem(KEY, JSON.stringify(all));
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

// Collect every generated/uploaded media output across all workflows.
export function listGenerations() {
  const all = read();
  const out = [];
  for (const wf of Object.values(all)) {
    for (const n of wf.nodes || []) {
      const o = n.data?.output;
      const kind = n.data?.kind;
      if (
        o &&
        typeof o === "string" &&
        (o.startsWith("http") || o.startsWith("data:") || o.startsWith("/api/"))
      ) {
        out.push({
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
  return out.sort((a, b) => b.ts - a.ts);
}
