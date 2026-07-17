// Server-side influencer store, backed by Vercel Blob, scoped per user.
// Uses get(pathname) instead of list+fetch to avoid Advanced ops on every read.
// In-memory TTL cache cuts repeat loads within the same server instance.

import { put, get } from "@vercel/blob";

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

const mem = new Map(); // userId -> { items, ts }
const MEM_TTL_MS = 120_000;

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

export async function getInfluencers(userId) {
  if (!configured()) return [];
  const key = userId || "public";
  const cached = mem.get(key);
  if (cached && Date.now() - cached.ts < MEM_TTL_MS) return cached.items;

  try {
    const data = await readJson(pathFor(key));
    const items = Array.isArray(data) ? data : [];
    mem.set(key, { items, ts: Date.now() });
    return items;
  } catch {
    return [];
  }
}

export async function putInfluencers(userId, listArr) {
  if (!configured()) return;
  const key = userId || "public";
  const items = Array.isArray(listArr) ? listArr : [];
  try {
    await put(pathFor(key), JSON.stringify(items), {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
      token: token(),
    });
    mem.set(key, { items, ts: Date.now() });
  } catch {}
}
