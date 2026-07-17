// Email/password user store on Vercel Blob (private). Paths: users/<email>.json
// Best effort: if Blob isn't configured, reads return null and writes throw.

import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";
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

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function pathFor(email) {
  const key = createHash("sha256").update(normalizeEmail(email)).digest("hex").slice(0, 32);
  return `users/${key}.json`;
}

export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(String(password), salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  if (!stored || !stored.includes(":")) return false;
  const [salt, hash] = stored.split(":");
  try {
    const expected = Buffer.from(hash, "hex");
    const actual = scryptSync(String(password), salt, 64);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

export async function getUserByEmail(email) {
  if (!configured()) return null;
  const path = pathFor(email);
  try {
    const result = await get(path, { access: "private", token: token(), useCache: false });
    if (!result || !result.stream) return null;
    const chunks = [];
    for await (const chunk of result.stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const data = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    return data && data.email ? data : null;
  } catch {
    return null;
  }
}

export async function createUser({ email, password, name }) {
  if (!configured()) {
    throw new Error("User storage is not configured (missing BLOB_READ_WRITE_TOKEN).");
  }
  const normalized = normalizeEmail(email);
  if (!normalized || !normalized.includes("@")) throw new Error("Enter a valid email.");
  if (!password || String(password).length < 8) throw new Error("Password must be at least 8 characters.");

  const existing = await getUserByEmail(normalized);
  if (existing) throw new Error("An account with this email already exists.");

  const user = {
    id: randomBytes(16).toString("hex"),
    email: normalized,
    name: String(name || "").trim() || normalized.split("@")[0],
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
  };

  await put(pathFor(normalized), JSON.stringify(user), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: false,
    token: token(),
  });

  return { id: user.id, email: user.email, name: user.name };
}
