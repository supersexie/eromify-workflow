import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const KEY = process.env.OPENAI_API_KEY;

const SYS_IMAGE = `You are a vision-to-prompt rewriter for Magic Mint, an AI-influencer image platform.

The user uploads an image. You return ONE detailed text prompt that, fed into a top image model (Flux 2, Seedream, Nano Banana), would reproduce a very similar image.

How to describe:
- Subject (gender, approximate age range, ethnicity if visually evident, hair color/length/style, eye color if visible, build/body type, expression, pose)
- Clothing (garment type, fabric, color, fit, neckline, length)
- Setting (room/location, key props, time of day, mood)
- Lighting (warm/cool, soft/hard, direction, any practical lights like fairy lights, window light, golden-hour)
- Camera (framing — full body / mid-shot / portrait, lens feel, depth of field, angle)
- Style & quality (photoreal / cinematic / film / digital art / anime / etc., level of realism, any film grain or smoothness)

Output rules:
- One single line of plain text. No quotes. No labels. No "Prompt:" prefix. No bullet points. No explanation.
- 60-140 words.
- Be specific and concrete — name fabrics, colors, and props you actually see.
- Stay tasteful — describe loungewear/swimwear as a fashion shoot would.
- Do NOT describe identifiable real people by name. Describe their visual attributes only.`;

const SYS_VIDEO = `You are a vision-to-prompt rewriter for Magic Mint video generation.

The user uploads an image. You return ONE detailed video prompt that uses this image as the starting frame and animates it convincingly.

Describe:
- The subject and scene exactly as the image shows (so the model recognizes continuity)
- Motion: subject's micro-movements (head turn, blink, soft smile, hair sway), camera move (static, slow push-in, gentle pan, handheld)
- Mood/pacing (slow, dreamy, cinematic, candid)
- Lighting and atmosphere matching the still

Output rules:
- One single line of plain text. No quotes. No labels. No prefix. No explanation.
- 80-140 words.
- Stay tasteful.`;

export async function POST(req) {
  if (!KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not set on the server." },
      { status: 503 }
    );
  }
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { image, kind = "image", model } = body;
  if (!image || typeof image !== "string" || !image.startsWith("data:image/")) {
    return NextResponse.json({ error: "Provide a base64 data URI in 'image'." }, { status: 400 });
  }

  // Only allow vision-capable models from our enhance allowlist.
  const ALLOWED = new Set([
    "gpt-4.1-mini",
    "gpt-4.1",
    "gpt-4o",
    "gpt-4o-mini",
    "gpt-5.5",
    "gpt-5.5-pro",
  ]);
  const chosenModel = ALLOWED.has(model) ? model : "gpt-4o-mini";
  const sys = kind === "video" ? SYS_VIDEO : SYS_IMAGE;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: chosenModel,
        messages: [
          { role: "system", content: sys },
          {
            role: "user",
            content: [
              { type: "text", text: "Describe this image as a generation-ready prompt." },
              { type: "image_url", image_url: { url: image, detail: "low" } },
            ],
          },
        ],
        max_tokens: 500,
        temperature: 0.5,
      }),
    });
    if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
    const data = await res.json();
    const out = (data.choices?.[0]?.message?.content || "").trim().replace(/^["']|["']$/g, "");
    if (!out) throw new Error("Empty response");
    return NextResponse.json({ prompt: out, model: chosenModel });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
