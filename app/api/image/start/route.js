import { NextResponse } from "next/server";
import { pickImageEndpoint } from "@/lib/falImage";

export const runtime = "nodejs";
// 60s is Vercel Hobby's max. fal returns a request_id near-instantly, so this
// is plenty for the POST that kicks off the queued job.
export const maxDuration = 60;

const FAL = process.env.FAL_KEY;

// Flux 2 family on fal accepts ONLY this preset enum for image_size — not
// arbitrary {width,height}, not an aspect_ratio string. So we snap the user's
// chosen ratio to the closest preset (log-distance in ratio space).
const FLUX_PRESETS = [
  { id: "portrait_16_9", ratio: 9 / 16 },   // 0.5625
  { id: "portrait_4_3",  ratio: 3 / 4 },    // 0.75
  { id: "square_hd",     ratio: 1 },
  { id: "landscape_4_3", ratio: 4 / 3 },    // 1.333
  { id: "landscape_16_9", ratio: 16 / 9 },  // 1.778
];

function ratioOf(aspect) {
  if (!aspect || aspect === "auto") return null;
  const m = /^(\d+):(\d+)$/.exec(aspect);
  if (!m) return null;
  const w = parseInt(m[1], 10);
  const h = parseInt(m[2], 10);
  if (!w || !h) return null;
  return w / h;
}

function closestFluxPreset(aspect) {
  const r = ratioOf(aspect);
  if (r == null) return null;
  return FLUX_PRESETS.reduce((best, p) =>
    Math.abs(Math.log(p.ratio) - Math.log(r)) < Math.abs(Math.log(best.ratio) - Math.log(r)) ? p : best
  ).id;
}

// Generic {width,height} for endpoints that accept arbitrary dims (Seedream,
// some Wan/Kling text-to-image). Snap to multiples of 64 — most diffusion
// pipelines require this; 8 was too aggressive and got silently rejected.
function dimsFor(aspect, quality) {
  const r = ratioOf(aspect);
  if (r == null) return null;
  const max = quality === "4K" ? 4096 : quality === "2K" ? 2048 : 1024;
  let width, height;
  if (r >= 1) {
    width = max;
    height = Math.round(max / r);
  } else {
    height = max;
    width = Math.round(max * r);
  }
  return { width: Math.round(width / 64) * 64, height: Math.round(height / 64) * 64 };
}

// Apply the right size param shape for the chosen model, in place on `input`.
function applySizeParams(input, model, aspect, quality) {
  if (!aspect || aspect === "auto") return;

  // Flux 2 family — preset enum only.
  if (model === "Flux 2 Pro" || model === "Flux 2 Max") {
    const preset = closestFluxPreset(aspect);
    if (preset) input.image_size = preset;
    return;
  }

  // Nano Banana — accepts aspect_ratio string directly.
  if (model === "Nano Banana Pro") {
    input.aspect_ratio = aspect;
    return;
  }

  // Everything else (Seedream, GPT Image via fal, fallthrough) — send dims.
  const dims = dimsFor(aspect, quality);
  if (dims) {
    input.image_size = dims;
    input.aspect_ratio = aspect; // ignored by endpoints that don't read it
  }
}

// All image models — Flux 2, Seedream, Nano Banana, GPT Image 2, GPT Image 1
// — flow through fal's async queue. One FAL_KEY covers everything; the OpenAI
// key is no longer needed for image generation (vision endpoints like
// /api/prompt/from-image still use it).
export async function POST(req) {
  const { prompt, model, images, aspect, quality } = await req.json();
  const hasImages = Array.isArray(images) && images.length > 0;

  if (!FAL) {
    return NextResponse.json({
      output: `https://picsum.photos/seed/${Math.floor(Math.random() * 9999)}/768/768`,
    });
  }

  const endpoint = pickImageEndpoint(model, hasImages);
  const input = { prompt: prompt || "abstract gradient" };
  if (hasImages) input.image_urls = images;
  applySizeParams(input, model, aspect, quality);

  try {
    const res = await fetch(`https://queue.fal.run/${endpoint}`, {
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
