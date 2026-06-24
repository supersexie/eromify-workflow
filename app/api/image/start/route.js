import { NextResponse } from "next/server";
import { pickImageEndpoint } from "@/lib/falImage";

export const runtime = "nodejs";
// 60s = Vercel Hobby max. GPT Image 2 / DALL·E 3 can take 30-50s synchronously.
// fal.ai calls remain fast (they just queue and return a request_id).
export const maxDuration = 60;

const FAL = process.env.FAL_KEY;
const KEY = process.env.OPENAI_API_KEY;

// Map the UI label → OpenAI image-API model name. If the user picked one of
// these, we always route to OpenAI directly, regardless of whether FAL_KEY is set.
const OPENAI_IMAGE_MODELS = {
  "GPT Image 2": "gpt-image-2",
  "GPT Image 1": "gpt-image-1",
  "DALL·E 3": "dall-e-3",
  "DALL-E 3": "dall-e-3",
};

async function generateWithOpenAI({ prompt, model, images, hasImages }) {
  if (!KEY) throw new Error("OPENAI_API_KEY is not set — needed for GPT/DALL·E image models.");
  // DALL·E 3 is text-to-image only. gpt-image-* supports edits via /images/edits.
  if (hasImages && model.startsWith("gpt-image")) {
    const form = new FormData();
    form.append("model", model);
    form.append("prompt", prompt || "edit this image");
    form.append("size", "1024x1024");
    // Fetch each ref image into a Blob and attach as the image field.
    for (let i = 0; i < images.length && i < 4; i++) {
      const r = await fetch(images[i]);
      const blob = await r.blob();
      form.append("image[]", blob, `ref-${i}.png`);
    }
    const res = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}` },
      body: form,
    });
    if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const data = await res.json();
    const b64 = data.data?.[0]?.b64_json;
    if (!b64) throw new Error("No image data returned");
    return `data:image/png;base64,${b64}`;
  }
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, prompt: prompt || "abstract gradient", size: "1024x1024", n: 1 }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const b64 = data.data?.[0]?.b64_json;
  // DALL·E 3 returns a URL by default, not b64 — handle both.
  if (b64) return `data:image/png;base64,${b64}`;
  const url = data.data?.[0]?.url;
  if (url) return url;
  throw new Error("No image data returned");
}

// Async image generation/editing via fal's queue, so slow models (Nano Banana
// Pro / Seedream edit) aren't bound by Vercel's 60s sync function cap.
export async function POST(req) {
  const { prompt, model, images } = await req.json();
  const hasImages = Array.isArray(images) && images.length > 0;

  // GPT/DALL·E models override fal routing — they're synchronous via the OpenAI
  // image API and return the result inline (no statusUrl polling needed).
  const openaiModel = OPENAI_IMAGE_MODELS[model];
  if (openaiModel) {
    try {
      const output = await generateWithOpenAI({ prompt, model: openaiModel, images, hasImages });
      return NextResponse.json({ output });
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  if (FAL) {
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

  // No fal key: OpenAI base64 fallback, else mock — returned inline (no polling).
  if (KEY) {
    try {
      const res = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "gpt-image-1", prompt: prompt || "abstract gradient", size: "1024x1024", n: 1 }),
      });
      if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 200)}`);
      const data = await res.json();
      const b64 = data.data?.[0]?.b64_json;
      if (!b64) throw new Error("No image data returned");
      return NextResponse.json({ output: `data:image/png;base64,${b64}` });
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }
  return NextResponse.json({ output: `https://picsum.photos/seed/${Math.floor(Math.random() * 9999)}/768/768` });
}
