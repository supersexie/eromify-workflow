// Server-side generations index, backed by Vercel Blob.
//
// Stores a single JSON file (generations.json) listing media produced through
// the MCP connector, so the web app Library can show them. Web UI generations
// stay in localStorage — writing every image/video here burned Blob Advanced
// ops (list+put per gen). Best effort: failures never throw.

import { put, get, del } from "@vercel/blob";
import { fal } from "@fal-ai/client";

const INDEX_PATH = "generations.json";
const MAX_ITEMS = 200;

// Ephemeral upload prefixes — prefer fal (TTL) over permanent Blob storage.
const EPHEMERAL_PREFIXES = new Set([
  "upload", "canvas-upload", "canvas-img", "canvas-vid",
  "img-ref", "vid-start", "edit-src", "motion-char", "motion-clip",
  "upscale-img", "upscale-vid",
]);

function token() {
  return (
    process.env.BLOB_READ_WRITE_TOKEN ||
    process.env.GEOFLIX_READ_WRITE_TOKEN ||
    Object.keys(process.env).find((k) => k.endsWith("_READ_WRITE_TOKEN")) &&
      process.env[Object.keys(process.env).find((k) => k.endsWith("_READ_WRITE_TOKEN"))]
  );
}

export function configured() {
  return !!token();
}

let memIndex = null; // { items, ts }
const MEM_TTL_MS = 60_000;

async function readJson(path) {
  try {
    const result = await get(path, { access: "public", token: token(), useCache: false });
    if (!result?.stream) return null;
    const chunks = [];
    for await (const chunk of result.stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return null;
  }
}

async function uploadToFal(buf, mime, prefix, ext) {
  if (!(process.env.FAL_KEY || process.env.FAL_API_KEY)) return null;
  fal.config({ credentials: (process.env.FAL_KEY || process.env.FAL_API_KEY) });
  const file = new File([buf], `${prefix}.${ext}`, { type: mime });
  return fal.storage.upload(file);
}

// Host a base64 data: URI. Permanent Blob only for influencer refs (`inf`);
// everything else prefers fal so we don't permanently store throwaway refs.
export async function uploadDataUrl(dataUrl, prefix = "upload") {
  if (!dataUrl || typeof dataUrl !== "string") return dataUrl;
  if (/^https?:/i.test(dataUrl)) return dataUrl;
  const m = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!m) return dataUrl;
  const mime = m[1];
  const ext = (mime.split("/")[1] || "bin").split("+")[0];
  const buf = Buffer.from(m[2], "base64");
  const ephemeral = EPHEMERAL_PREFIXES.has(prefix) || prefix.startsWith("canvas-");

  // Ephemeral → fal first (no permanent Blob growth / Advanced put).
  if (ephemeral) {
    try {
      const url = await uploadToFal(buf, mime, prefix, ext);
      if (url) return url;
    } catch {}
  }

  // Permanent (influencer photos) or fal unavailable → Blob.
  if (configured()) {
    try {
      const path = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { url } = await put(path, buf, {
        access: "public", contentType: mime, addRandomSuffix: false, token: token(),
      });
      if (url) return url;
    } catch (e) {
      if (!(process.env.FAL_KEY || process.env.FAL_API_KEY)) throw e;
    }
  }

  const falUrl = await uploadToFal(buf, mime, prefix, ext);
  if (falUrl) return falUrl;
  throw new Error("No file host configured (set BLOB_READ_WRITE_TOKEN or FAL_KEY)");
}

export async function getGenerations() {
  if (!configured()) return [];
  if (memIndex && Date.now() - memIndex.ts < MEM_TTL_MS) return memIndex.items;
  try {
    const data = await readJson(INDEX_PATH);
    const items = Array.isArray(data) ? data : [];
    memIndex = { items, ts: Date.now() };
    return items;
  } catch {
    return [];
  }
}

export async function addGeneration({ url, kind, prompt }) {
  if (!configured() || !url || typeof url !== "string") return;
  try {
    const existing = await getGenerations();
    const next = [
      { url, kind: kind || "image", prompt: prompt || "", source: "mcp", ts: Date.now() },
      ...existing.filter((g) => g.url !== url),
    ].slice(0, MAX_ITEMS);
    await put(INDEX_PATH, JSON.stringify(next), {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
      token: token(),
    });
    memIndex = { items: next, ts: Date.now() };
  } catch {
    // swallow — never let persistence break a generation
  }
}

/** Best-effort delete of a Blob URL (storage cleanup). Free on Advanced billing. */
export async function deleteBlobUrl(url) {
  if (!configured() || !url || typeof url !== "string") return;
  if (!/blob\.vercel-storage\.com/i.test(url)) return;
  try {
    await del(url, { token: token() });
  } catch {}
}
