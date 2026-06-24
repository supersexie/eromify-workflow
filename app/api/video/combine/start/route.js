import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const FAL = process.env.FAL_KEY;

// Stitch multiple clips into one via fal's ffmpeg compose API (async queue).
// Each clip is placed sequentially on a single video track.
export async function POST(req) {
  const { urls, durations } = await req.json();
  if (!Array.isArray(urls) || urls.length < 2) {
    return NextResponse.json({ error: "Need at least 2 video URLs" }, { status: 400 });
  }
  if (!FAL) return NextResponse.json({ error: "FAL_KEY not set" }, { status: 500 });

  // Sequential keyframes: each clip starts where the previous ended.
  let t = 0;
  const keyframes = urls.map((url, i) => {
    const d = (Array.isArray(durations) && durations[i]) || 5;
    const kf = { url, timestamp: t, duration: d };
    t += d;
    return kf;
  });
  const input = { tracks: [{ id: "1", type: "video", keyframes }] };

  try {
    const res = await fetch("https://queue.fal.run/fal-ai/ffmpeg-api/compose", {
      method: "POST",
      headers: { Authorization: `Key ${FAL}`, "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error(`fal ${res.status}: ${(await res.text()).slice(0, 400)}`);
    const data = await res.json();
    if (!data.request_id) throw new Error("fal did not return a request_id");
    return NextResponse.json({ statusUrl: data.status_url, responseUrl: data.response_url });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
