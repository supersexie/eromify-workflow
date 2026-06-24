import { NextResponse } from "next/server";
import { pickImageEndpoint } from "@/lib/falImage";

export const runtime = "nodejs";
// 60s is Vercel Hobby's max. fal returns a request_id near-instantly, so this
// is plenty for the POST that kicks off the queued job.
export const maxDuration = 60;

const FAL = process.env.FAL_KEY;

// All image models — Flux 2, Seedream, Nano Banana, GPT Image 2, GPT Image 1
// — flow through fal's async queue. One FAL_KEY covers everything; the OpenAI
// key is no longer needed for image generation (vision endpoints like
// /api/prompt/from-image still use it).
export async function POST(req) {
  const { prompt, model, images } = await req.json();
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
