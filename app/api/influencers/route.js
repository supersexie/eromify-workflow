import { NextResponse } from "next/server";
import { getInfluencers, putInfluencers } from "@/lib/influencerStore";
import { uploadDataUrl } from "@/lib/genstore";

export const runtime = "nodejs";
export const maxDuration = 30;

// Resolve the current user id (Google OAuth / Auth.js). Falls back to a shared
// "public" bucket when auth isn't configured, so the store still works without auth.
async function uid() {
  try {
    const { auth, authEnabled } = await import("@/auth");
    if (!authEnabled) return "public";
    const session = await auth();
    return session?.user?.id || "public";
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

export async function GET() {
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
