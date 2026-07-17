#!/usr/bin/env node
/**
 * One-shot Blob cleanup: deletes ephemeral media blobs that burn storage.
 * Keeps influencers/*.json, users/*.json, generations.json, moderation-queue.json.
 *
 * Usage (with BLOB_READ_WRITE_TOKEN in env):
 *   node scripts/cleanup-blob.mjs
 *   node scripts/cleanup-blob.mjs --dry-run
 */
import { list, del } from "@vercel/blob";

const token =
  process.env.BLOB_READ_WRITE_TOKEN ||
  process.env.GEOFLIX_READ_WRITE_TOKEN;

const dry = process.argv.includes("--dry-run");

const KEEP = /^(influencers\/|users\/|generations\.json$|moderation-queue\.json$)/;
const EPHEMERAL = /^(upload-|canvas-|img-ref-|vid-start-|edit-src-|motion-|upscale-|inf-)/;
// Note: also delete old inf-* orphan images? Keep influencer JSON; inf-* images
// are referenced from JSON — only delete clearly ephemeral prefixes, not inf-.

const DELETE = /^(upload-|canvas-|img-ref-|vid-start-|edit-src-|motion-|upscale-)/;

if (!token) {
  console.error("Set BLOB_READ_WRITE_TOKEN first.");
  process.exit(1);
}

let cursor;
let scanned = 0;
let deleted = 0;

do {
  const page = await list({ token, cursor, limit: 1000 });
  for (const b of page.blobs) {
    scanned++;
    if (KEEP.test(b.pathname)) continue;
    if (!DELETE.test(b.pathname)) continue;
    console.log(`${dry ? "DRY " : ""}DEL ${b.pathname} (${Math.round((b.size || 0) / 1024)} KB)`);
    if (!dry) {
      try {
        await del(b.url, { token });
        deleted++;
      } catch (e) {
        console.warn("  failed:", e.message);
      }
    } else {
      deleted++;
    }
  }
  cursor = page.cursor;
} while (cursor);

console.log(`Done. scanned=${scanned} ${dry ? "wouldDelete" : "deleted"}=${deleted}`);
