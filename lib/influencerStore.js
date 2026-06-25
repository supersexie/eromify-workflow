// Server-side influencer store, backed by Vercel Blob, scoped per user. Each
// user's characters live in influencers/<userId>.json so they persist across
// domains, devices, and cache clears (unlike the localStorage cache). Best
// effort: if Blob isn't configured, reads return [] and writes no-op.

import { put, list } from "@vercel/blob";

function token() {
  return (
    process.env.BLOB_READ_WRITE_TOKEN ||
    process.env.GEOFLIX_READ_WRITE_TOKEN ||
    (Object.keys(process.env).find((k) => k.endsWith("_READ_WRITE_TOKEN")) &&
      process.env[Object.keys(process.env).find((k) => k.endsWith("_READ_WRITE_TOKEN"))])
  );
}

export function configured() {
  return !!token();
}

function pathFor(userId) {
  return `influencers/${userId || "public"}.json`;
}

export async function getInfluencers(userId) {
  if (!configured()) return [];
  try {
    const path = pathFor(userId);
    const { blobs } = await list({ prefix: path, limit: 1, token: token() });
    const blob = blobs.find((b) => b.pathname === path);
    if (!blob) return [];
    const res = await fetch(`${blob.url}?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

// Diagnostic: attempt a real Blob write+read and surface any error verbatim.
export async function debugWrite() {
  if (!configured()) return { configured: false };
  const path = "influencers/__debug.json";
  try {
    const r = await put(path, JSON.stringify({ ts: Date.now() }), {
      access: "public", contentType: "application/json", addRandomSuffix: false, allowOverwrite: true, token: token(),
    });
    const { blobs } = await list({ prefix: path, limit: 1, token: token() });
    return { configured: true, wrote: true, putUrl: r?.url || null, found: blobs.map((b) => b.pathname) };
  } catch (e) {
    return { configured: true, wrote: false, error: String(e?.message || e) };
  }
}

export async function putInfluencers(userId, listArr) {
  if (!configured()) return;
  try {
    await put(pathFor(userId), JSON.stringify(Array.isArray(listArr) ? listArr : []), {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
      token: token(),
    });
  } catch {}
}
