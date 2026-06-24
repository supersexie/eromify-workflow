import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const GEMINI = process.env.GEMINI_API_KEY;
const FAL = process.env.FAL_KEY;

export async function POST(req) {
  const body = await req.json();
  const { provider } = body;

  // ---- fal.ai ----
  if (provider === "fal") {
    if (!FAL) return NextResponse.json({ done: true, output: "Generated video (mock — no FAL_KEY)" });
    const { statusUrl, responseUrl } = body;
    try {
      const st = await fetch(statusUrl, { headers: { Authorization: `Key ${FAL}` } });
      if (!st.ok) throw new Error(`fal status ${st.status}: ${(await st.text()).slice(0, 200)}`);
      const s = await st.json();
      if (s.status !== "COMPLETED") return NextResponse.json({ done: false });
      const r = await fetch(responseUrl, { headers: { Authorization: `Key ${FAL}` } });
      if (!r.ok) throw new Error(`fal result ${r.status}: ${(await r.text()).slice(0, 400)}`);
      const result = await r.json();
      const url = result.video?.url || result.videos?.[0]?.url;
      if (!url) throw new Error("No video URL in fal result");
      return NextResponse.json({ done: true, output: url });
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  // ---- Google Veo ----
  if (!GEMINI) return NextResponse.json({ done: true, output: "Generated video (mock — no GEMINI_API_KEY)" });
  const { operation } = body;
  if (!operation) return NextResponse.json({ error: "Missing operation name" }, { status: 400 });
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/${operation}`, {
      headers: { "x-goog-api-key": GEMINI },
    });
    if (!res.ok) throw new Error(`Veo poll ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const data = await res.json();
    if (!data.done) return NextResponse.json({ done: false });
    if (data.error) throw new Error(data.error.message || "Veo generation failed");
    const uri =
      data.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri ||
      data.response?.generatedVideos?.[0]?.video?.uri;
    if (!uri) throw new Error("No video URI in completed operation");
    return NextResponse.json({ done: true, output: `/api/video/file?uri=${encodeURIComponent(uri)}` });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
