import { NextResponse } from "next/server";
import { pickImageEndpoint } from "@/lib/falImage";

export const runtime = "nodejs";
// 60s is Vercel Hobby's max. fal returns a request_id near-instantly, so this
// is plenty for the POST that kicks off the queued job.
export const maxDuration = 60;

const FAL = process.env.FAL_KEY;

// Compute pixel dimensions for a given aspect ratio + quality tier. Different
// fal models accept different param shapes — we send BOTH `image_size: {w,h}`
// (Flux 2 / Seedream / GPT Image) AND `aspect_ratio: "W:H"` (Nano Banana,
// some Kling endpoints). Models ignore the param they don't use.
function dimsFor(aspect, quality) {
  if (!aspect || aspect === "auto") return null;
  const m = /^(\d+):(\d+)$/.exec(aspect);
  if (!m) return null;
  const aw = parseInt(m[1], 10);
  const ah = parseInt(m[2], 10);
  if (!aw || !ah) return null;
  const max = quality === "4K" ? 4096 : quality === "2K" ? 2048 : 1024;
  let width, height;
  if (aw >= ah) {
    width = max;
    height = Math.round((max * ah) / aw);
  } else {
    height = max;
    width = Math.round((max * aw) / ah);
  }
  // Snap to multiples of 8 (most diffusion pipelines reject odd sizes).
  return { width: Math.round(width / 8) * 8, height: Math.round(height / 8) * 8 };
}

// All image models — Flux 2, Seedream, Nano Banana, GPT Image 2, GPT Image 1
// — flow through fal's async queue. One FAL_KEY covers everything; the OpenAI
// key is no longer needed for image generation (vision endpoints like
// /api/prompt/from-image still use it).
export async function POST(req) {
  const { prompt, model, images, aspect, quality } = await req.json();
  const hasImages = Array.isArray(images) && images.length > 0;

  if (!FAL) {
    // Without a fal key, return a mock picsum URL so the UI can still demo.
    return NextResponse.json({
      output: `https://picsum.photos/seed/${Math.floor(Math.random() * 9999)}/768/768`,
    });
  }

  const endpoint = pickImageEndpoint(model, hasImages);
  const input = { prompt: prompt || "abstract gradient" };
  if (hasImages) input.image_urls = images;

  // Aspect + quality → fal params. We pass both shapes so different model
  // endpoints can pick up whichever they understand and ignore the rest.
  const dims = dimsFor(aspect, quality);
  if (dims) {
    input.image_size = dims;             // {width, height} — Flux 2, Seedream, GPT Image
    input.aspect_ratio = aspect;         // "21:9" string — Nano Banana, some others
    input.width = dims.width;            // some older endpoints
    input.height = dims.height;
  }

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
