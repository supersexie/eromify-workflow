import { NextResponse } from "next/server";
import { uploadDataUrl } from "@/lib/genstore";

export const runtime = "nodejs";
export const maxDuration = 60;

// Host a base64 data: URI on Vercel Blob (fal fallback) and return the public
// URL. Used by canvas nodes so manually-uploaded images/videos persist — inline
// data: blobs get stripped from localStorage to save quota, URLs don't.
export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { data, prefix } = body || {};
  if (!data || typeof data !== "string" || !data.startsWith("data:")) {
    return NextResponse.json({ error: "Provide a data: URI in 'data'." }, { status: 400 });
  }
  try {
    const url = await uploadDataUrl(data, prefix || "canvas-upload");
    return NextResponse.json({ url });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
