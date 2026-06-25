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
