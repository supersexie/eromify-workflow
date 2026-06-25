// Server-side generations index, backed by Vercel Blob.
//
// Stores a single JSON file (generations.json) listing media produced through
// the MCP connector (and anywhere else server-side), so the web app Library can
// show them. Everything here is BEST-EFFORT: if Blob isn't configured or any
// call fails, functions no-op / return [] and never throw — generation must
// never break because persistence hiccupped.

import { put, list } from "@vercel/blob";

const INDEX_PATH = "generations.json";
const MAX_ITEMS = 500;

// The Blob SDK auto-reads BLOB_READ_WRITE_TOKEN, but a custom env-var prefix
// (e.g. "GEOFLIX") names it GEOFLIX_READ_WRITE_TOKEN. Resolve whichever exists
// and pass it explicitly so either dashboard setup works.
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

// Upload a base64 data: URI to Vercel Blob and return its public https URL.
// fal's Kling endpoints reject data URIs for video_url (and validate image_url
// strictly), so we host the bytes first and pass a real URL. Pass-through for
// strings that are already http(s); returns the input unchanged if it isn't a
// data URI or Blob isn't configured (caller then gets fal's own error).
export async function uploadDataUrl(dataUrl, prefix = "upload") {
  if (!dataUrl || typeof dataUrl !== "string") return dataUrl;
  if (/^https?:/i.test(dataUrl)) return dataUrl;
  const m = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!m || !configured()) return dataUrl;
  const mime = m[1];
  const ext = (mime.split("/")[1] || "bin").split("+")[0];
  const buf = Buffer.from(m[2], "base64");
  const path = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { url } = await put(path, buf, {
    access: "public",
    contentType: mime,
    addRandomSuffix: false,
    token: token(),
  });
  return url;
}

// Resolve the public URL of the index file (Blob URLs aren't deterministic).
async function indexUrl() {
  try {
    const { blobs } = await list({ prefix: INDEX_PATH, limit: 1, token: token() });
    return blobs.find((b) => b.pathname === INDEX_PATH)?.url || null;
  } catch {
    return null;
  }
}

export async function getGenerations() {
  if (!configured()) return [];
  try {
    const url = await indexUrl();
    if (!url) return [];
    const res = await fetch(`${url}?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function addGeneration({ url, kind, prompt }) {
  if (!configured() || !url || typeof url !== "string") return;
  try {
    const existing = await getGenerations();
    // Dedupe by url; newest first; cap the list.
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
  } catch {
    // swallow — never let persistence break a generation
  }
}
