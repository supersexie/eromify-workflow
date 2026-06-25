import { NextResponse } from "next/server";
import { uploadDataUrl } from "@/lib/genstore";

export const runtime = "nodejs";
export const maxDuration = 60;

const FAL = process.env.FAL_KEY;

// Image upscalers — all take image_url; factorKey is the param name each uses
// for the scale multiplier (omit for fixed-scale models like AuraSR).
const IMAGE_UPSCALERS = {
  "Clarity Upscaler": { ep: "fal-ai/clarity-upscaler", factorKey: "upscale_factor" },
  "Topaz Image":      { ep: "fal-ai/topaz/upscale/image", factorKey: "upscale_factor" },
  "ESRGAN":           { ep: "fal-ai/esrgan", factorKey: "scale" },
  "AuraSR (4x)":      { ep: "fal-ai/aura-sr" }, // fixed 4x
};

// Video upscalers — all take video_url + an upscale_factor.
const VIDEO_UPSCALERS = {
  "Topaz Video": { ep: "fal-ai/topaz/upscale/video", factorKey: "upscale_factor" },
  "SeedVR2":     { ep: "fal-ai/seedvr/upscale/video", factorKey: "upscale_factor" },
};

export async function POST(req) {
  const { kind, model, media, scale } = await req.json();

  if (!FAL) return NextResponse.json({ mock: true, output: "Upscale output (mock — set FAL_KEY)" });
  if (!media) return NextResponse.json({ error: "Upscale needs a source file." }, { status: 400 });

  const isVideo = kind === "video";
  const catalog = isVideo ? VIDEO_UPSCALERS : IMAGE_UPSCALERS;
  const fallback = isVideo ? "Topaz Video" : "Clarity Upscaler";
  const spec = catalog[model] || catalog[fallback];

  // fal rejects base64 data URIs — host the bytes first and pass a real URL.
  let mediaUrl;
  try {
    mediaUrl = await uploadDataUrl(media, isVideo ? "upscale-vid" : "upscale-img");
  } catch (e) {
    return NextResponse.json({ error: `Could not host source file: ${e.message}` }, { status: 500 });
  }

  const input = isVideo ? { video_url: mediaUrl } : { image_url: mediaUrl };
  const factor = Number(scale) || 2;
  if (spec.factorKey) input[spec.factorKey] = factor;

  try {
    const res = await fetch(`https://queue.fal.run/${spec.ep}`, {
      method: "POST",
      headers: { Authorization: `Key ${FAL}`, "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error(`fal ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const data = await res.json();
    if (!data.request_id) throw new Error("fal did not return a request_id");
    return NextResponse.json({ statusUrl: data.status_url, responseUrl: data.response_url });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
