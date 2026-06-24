import { NextResponse } from "next/server";
import { pickImageEndpoint } from "@/lib/falImage";

export const runtime = "nodejs";
export const maxDuration = 30;

const FAL = process.env.FAL_KEY;
const KEY = process.env.OPENAI_API_KEY;

// Async image generation/editing via fal's queue, so slow models (Nano Banana
// Pro / Seedream edit) aren't bound by Vercel's 60s sync function cap.
export async function POST(req) {
  const { prompt, model, images } = await req.json();
  const hasImages = Array.isArray(images) && images.length > 0;

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
