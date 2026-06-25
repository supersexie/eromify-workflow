import { NextResponse } from "next/server";
import { getInfluencers, putInfluencers, configured } from "@/lib/influencerStore";
import { uploadDataUrl } from "@/lib/genstore";

export const runtime = "nodejs";
export const maxDuration = 30;

// Resolve the current user id (Clerk). Falls back to a shared "public" bucket
// when Clerk isn't configured, so the store still works without auth.
async function uid() {
  try {
    const { auth } = await import("@clerk/nextjs/server");
    const a = await auth();
    return a?.userId || "public";
  } catch {
    return "public";
  }
}

// Host a data-URI image and return the URL; pass-through for http(s) URLs.
async function hostImage(image) {
  if (!image) return image;
  try {
    return await uploadDataUrl(image, "inf");
  } catch {
    return image;
  }
}

export async function GET(req) {
  // ?debug=1 → report whether the Blob store sees a write token (names only,
  // never values) so we can diagnose persistence without exposing secrets.
  if (new URL(req.url).searchParams.get("debug")) {
    const tokenEnvNames = Object.keys(process.env).filter(
      (k) => k.includes("BLOB") || k.endsWith("_READ_WRITE_TOKEN")
    );
    return NextResponse.json({ configured: configured(), tokenEnvNames, userId: await uid() });
  }
  const items = await getInfluencers(await uid());
  return NextResponse.json({ items });
}

export async function POST(req) {
  const userId = await uid();
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad json" }, { status: 400 }); }

  // Migration: seed the server from a localStorage list, but only if the server
  // is currently empty (don't clobber existing server data).
  if (Array.isArray(body.seed)) {
    const existing = await getInfluencers(userId);
    if (existing.length > 0) return NextResponse.json({ items: existing });
    const seeded = [];
    for (const inf of body.seed) {
      seeded.push({ ...inf, image: await hostImage(inf.image) });
    }
    await putInfluencers(userId, seeded);
    return NextResponse.json({ items: seeded });
  }

  // Single upsert.
  const inf = body.influencer || body;
  if (!inf || !inf.id || !inf.handle) return NextResponse.json({ error: "missing fields" }, { status: 400 });
  const saved = { ...inf, image: await hostImage(inf.image) };
  const listArr = await getInfluencers(userId);
  const i = listArr.findIndex((x) => x.id === saved.id);
  if (i >= 0) listArr[i] = { ...listArr[i], ...saved };
  else listArr.unshift(saved);
  await putInfluencers(userId, listArr);
  return NextResponse.json({ influencer: saved, items: listArr });
}

export async function DELETE(req) {
  const userId = await uid();
  const id = new URL(req.url).searchParams.get("id");
  const listArr = (await getInfluencers(userId)).filter((x) => x.id !== id);
  await putInfluencers(userId, listArr);
  return NextResponse.json({ items: listArr });
}
