import { put, get } from "@vercel/blob";
import { PLANS } from "./pricing";

const TIER_INDEX = { builder: 0, launch: 1, growth: 2, creator: 3 };

function token() {
  return (
    process.env.BLOB_READ_WRITE_TOKEN ||
    process.env.GEOFLIX_READ_WRITE_TOKEN ||
    (Object.keys(process.env).find((k) => k.endsWith("_READ_WRITE_TOKEN")) &&
      process.env[Object.keys(process.env).find((k) => k.endsWith("_READ_WRITE_TOKEN"))])
  );
}

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function pathFor(userId, month) {
  return `credits/${userId}/${month}.json`;
}

export function getLimit(tier) {
  const idx = TIER_INDEX[tier];
  if (idx == null) return 0;
  return parseInt(PLANS[idx].credits.replace(/,/g, ""), 10);
}

export async function getUsage(userId) {
  const t = token();
  if (!t) return { used: 0, month: currentMonth() };

  const month = currentMonth();
  const path = pathFor(userId, month);

  try {
    const blob = await get(path, { token: t });
    if (!blob) return { used: 0, month };
    const res = await fetch(blob.url);
    if (!res.ok) return { used: 0, month };
    const data = await res.json();
    return { used: data.used || 0, month };
  } catch {
    return { used: 0, month };
  }
}

export async function incrementUsage(userId, amount = 1) {
  const t = token();
  if (!t) return;

  const month = currentMonth();
  const { used } = await getUsage(userId);
  const newUsed = used + amount;

  await put(pathFor(userId, month), JSON.stringify({ used: newUsed, updatedAt: Date.now() }), {
    access: "public",
    token: t,
    addRandomSuffix: false,
  });

  return newUsed;
}

export async function checkCredits(userId, tier) {
  const limit = getLimit(tier);
  if (!limit) return { allowed: false, used: 0, limit: 0, remaining: 0 };

  const { used } = await getUsage(userId);
  const remaining = Math.max(0, limit - used);

  return { allowed: remaining > 0, used, limit, remaining };
}
