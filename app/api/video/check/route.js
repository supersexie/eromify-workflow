import { NextResponse } from "next/server";

export const runtime = "nodejs";

const KEY = process.env.GEMINI_API_KEY;
const MODEL = "veo-3.1-fast-generate-preview";

// Free health-check: verifies the key is loaded and Veo is accessible
// (model metadata call — does NOT generate a video, costs nothing).
export async function GET() {
  if (!KEY) {
    return NextResponse.json({
      ok: false,
      keyLoaded: false,
      reason: "GEMINI_API_KEY is not set in this deployment. Add it in Vercel env vars and redeploy.",
    });
  }
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}`, {
      headers: { "x-goog-api-key": KEY },
    });
    const text = await res.text();
    if (res.ok) {
      return NextResponse.json({ ok: true, keyLoaded: true, veoAccessible: true, model: MODEL });
    }
    return NextResponse.json({
      ok: false,
      keyLoaded: true,
      veoAccessible: false,
      status: res.status,
      detail: text.slice(0, 400),
    });
  } catch (e) {
    return NextResponse.json({ ok: false, keyLoaded: true, error: e.message });
  }
}
