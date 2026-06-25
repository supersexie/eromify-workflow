// Client-side influencer (character) store, backed by localStorage. An
// influencer is { id, handle, name, description, image, ts } where `image` is a
// (downscaled) data URL used as the likeness reference for generation. Shared
// by the Influencers page and the @mention resolver used in Image/Video/Canvas.

const KEY = "eromify:influencers:v1";

// Normalize a handle: strip a leading @, lowercase, keep [a-z0-9_].
export function normHandle(h) {
  return String(h || "").replace(/^@/, "").toLowerCase().replace(/[^a-z0-9_]/g, "");
}

export function listInfluencers() {
  if (typeof window === "undefined") return [];
  try {
    const arr = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

export function saveInfluencers(arr) {
  try { localStorage.setItem(KEY, JSON.stringify(arr)); } catch {}
}

// Insert or update by id; returns the new list (newest first).
export function upsertInfluencer(inf) {
  const list = listInfluencers();
  const i = list.findIndex((x) => x.id === inf.id);
  if (i >= 0) list[i] = { ...list[i], ...inf };
  else list.unshift(inf);
  saveInfluencers(list);
  return list;
}

export function deleteInfluencer(id) {
  const list = listInfluencers().filter((x) => x.id !== id);
  saveInfluencers(list);
  return list;
}

export function getByHandle(handle) {
  const h = normHandle(handle);
  return listInfluencers().find((x) => x.handle === h) || null;
}

// ---- Server sync (Vercel Blob, per-user) ----
// localStorage stays the fast SYNC cache (used by resolveMentions during
// generation); the server is the durable source of truth that survives domain
// changes, devices, and cache clears. syncInfluencers reconciles the two.

// Hydrate the local cache from the server. If the server is empty but we have
// local influencers, migrate them up (recovers characters created before the
// server store existed). Returns the resulting list.
export async function syncInfluencers() {
  if (typeof window === "undefined") return [];
  try {
    const res = await fetch("/api/influencers");
    if (res.ok) {
      const { items } = await res.json();
      if (Array.isArray(items) && items.length) {
        saveInfluencers(items); // server wins → refresh local cache
        return items;
      }
      // server empty — push any local ones up so they persist from now on
      const local = listInfluencers();
      if (local.length) {
        const r2 = await fetch("/api/influencers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ seed: local }),
        });
        if (r2.ok) {
          const j = await r2.json();
          if (Array.isArray(j.items) && j.items.length) { saveInfluencers(j.items); return j.items; }
        }
      }
    }
  } catch {}
  return listInfluencers();
}

// Create/update an influencer: write the local cache immediately (optimistic),
// then persist to the server and swap in the server's version (hosted image URL).
export async function saveInfluencerRemote(inf) {
  upsertInfluencer(inf);
  try {
    const res = await fetch("/api/influencers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ influencer: inf }),
    });
    if (res.ok) {
      const { influencer } = await res.json();
      if (influencer) { upsertInfluencer(influencer); return influencer; }
    }
  } catch {}
  return inf;
}

export async function deleteInfluencerRemote(id) {
  deleteInfluencer(id);
  try {
    await fetch(`/api/influencers?id=${encodeURIComponent(id)}`, { method: "DELETE" });
  } catch {}
}

// Scan free text for @handle tokens that match saved influencers. Returns the
// prompt with each @handle replaced by the character's name (so the model reads
// natural language) plus the unique matched characters (with their images).
export function resolveMentions(text) {
  const characters = [];
  const seen = new Set();
  const prompt = String(text || "").replace(/@([a-z0-9_]+)/gi, (full, raw) => {
    const inf = getByHandle(raw);
    if (!inf) return full; // leave unknown @handles untouched
    if (!seen.has(inf.id)) { seen.add(inf.id); characters.push(inf); }
    return inf.name || full;
  });
  return { prompt, characters };
}
