import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const KEY = process.env.OPENAI_API_KEY;

const HOUSE_STYLE = `hyper-realistic portrait photo, shot on iPhone, soft warm bedroom lighting with fairy lights / string lights in the background, cozy intimate atmosphere, sitting on a bed with soft pillows, wearing a silk or satin loungewear set (camisole and shorts) in a neutral tone, natural skin texture with realistic pores and subtle imperfections, soft golden-hour glow, shallow depth of field, 4:5 portrait framing, looking softly at camera, relaxed pose, slight smile, photogenic but candid UGC selfie quality, no plastic skin, no over-smoothing, no airbrushing, no cartoon, no illustration, no 3D render`;

const SYS_IMAGE = `You are a prompt engineer for an AI image model on an AI-influencer platform called Eromify.
The user gives you a SHORT, often messy prompt (a few words). You return ONE rewritten, detailed prompt ready to send to the image model.

EROMIFY HOUSE STYLE (the default for any PERSON subject — woman, man, model, "blonde", etc.):
"${HOUSE_STYLE}"

Rules:
- If the subject is a PERSON and the user did NOT specify a different style, build the rewritten prompt around the house style above. Keep all of it (verbatim or close), then weave in the user's specific descriptors (hair color, ethnicity, glasses, pose, outfit swap, location swap, mood, etc.).
- If the user explicitly names a different style ("cinematic", "anime", "claymation", "watercolor", "3D render", "cyberpunk", "1990s film"), DROP the house style entirely and write a rich prompt in that named style.
- If the subject is NOT a person (product, landscape, food, logo, animal), ignore the house style and write a fitting prompt for that subject ("product photo on white seamless background, soft studio lighting, ...", etc.).
- Output ONE single line of plain text. No quotes. No labels. No "Prompt:" prefix. No bullet points. No explanation. Just the prompt itself.
- Aim for 60-120 words.
- Stay tasteful — describe loungewear/swimwear/casual outfits as a fashion shoot would, never explicit content.`;

const SYS_VIDEO = `You are a prompt engineer for an AI video model on an AI-influencer platform called Eromify.
The user gives you a SHORT, often messy prompt. You return ONE rewritten, detailed video prompt ready to send to the model.

EROMIFY HOUSE STYLE for PERSON subjects (default):
"${HOUSE_STYLE}"

Video prompts ALSO need motion direction. After the visual style block, append concrete motion: subject's micro-movements (slight head turn, hair shift, blink, soft smile), camera move (static, slow push-in, gentle pan, handheld), and timing feel (slow, dreamy, candid).

Rules:
- Person subject + no explicit style → use the house style block + motion.
- User names a style → drop the house style, write in that style + motion.
- Non-person subject → fitting style + motion, no house style.
- Output ONE single line of plain text. No quotes. No labels. No prefix. No explanation.
- Aim for 80-140 words.
- Stay tasteful.`;

// When a source image is already connected, the subject + setting are LOCKED
// by that image. The user's prompt describes what should CHANGE — they should
// not get our house-style template injected on top, since the source might be
// a man in a hoodie, a product shot, anything. The rewrite stays focused on
// the transformation only.
const SYS_IMAGE_FROM_SOURCE = `You are a prompt engineer for an AI image-edit model. A SOURCE IMAGE is already provided as the starting point — its subject, outfit, location, and overall style are LOCKED. The user's text describes an EDIT.

Rewrite the user's short prompt into ONE detailed edit instruction. Do NOT invent or describe the subject from scratch. Do NOT add lighting/outfit/setting/style descriptors that aren't part of the requested change — those come from the source image.

Focus only on:
- Exactly what to change (expression, pose, outfit swap if they ask, background swap if they ask, color/light change if they ask)
- Concrete visual specifics for that change ("a soft, genuine smile with slight eye crinkle" rather than "smile")
- Preserve everything else with a phrase like "keep everything else identical to the source image"

Output rules:
- One single line of plain text. No quotes. No labels. No prefix. No explanation.
- 40-100 words.
- Stay tasteful.`;

const SYS_VIDEO_FROM_SOURCE = `You are a prompt engineer for an AI image-to-video model. A SOURCE IMAGE is already provided as the FIRST FRAME — the subject's identity, outfit, location, lighting, and overall look are LOCKED. The user's text describes the MOTION they want.

Rewrite the user's short prompt into ONE detailed video direction. Do NOT redescribe the subject or setting. Do NOT inject a generic style template — the source image dictates style.

Focus only on:
- The primary motion/action the user asked for (the gesture, expression change, head turn, walk, etc.) described with concrete micro-movements
- Supporting motion that makes it natural (subtle breathing, blink, hair shift, garment ripple)
- Camera behavior (static, slow push-in, gentle pan, slight handheld) — choose what fits the mood
- Timing and pacing words (slow and candid, smooth, dreamy)
- A short tail noting subject identity and background remain consistent with the source image

Output rules:
- One single line of plain text. No quotes. No labels. No prefix. No explanation.
- 50-120 words.
- Stay tasteful.`;

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { prompt = "", kind = "image", model, hasSourceImage = false } = body;
  const input = String(prompt || "").trim();
  if (!input) return NextResponse.json({ error: "Empty prompt" }, { status: 400 });
  if (!KEY) {
    // No OpenAI key — without an LLM we can't intelligently enrich. With a
    // source image we just return the user prompt unchanged (don't pollute
    // the edit with our house-style template). Otherwise append the template.
    return NextResponse.json({
      prompt: hasSourceImage ? input : `${input}, ${HOUSE_STYLE}`,
      fallback: true,
    });
  }

  // Allowlist the models the UI can pick (security: don't let arbitrary model
  // strings flow into the OpenAI call). Default to the cheap one if missing.
  const ALLOWED = new Set([
    "gpt-4.1-mini",
    "gpt-4.1",
    "gpt-4o",
    "gpt-4o-mini",
    "gpt-5.5",
    "gpt-5.5-pro",
  ]);
  const chosenModel = ALLOWED.has(model) ? model : "gpt-4.1-mini";
  const sys = hasSourceImage
    ? (kind === "video" ? SYS_VIDEO_FROM_SOURCE : SYS_IMAGE_FROM_SOURCE)
    : (kind === "video" ? SYS_VIDEO : SYS_IMAGE);

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
          { role: "user", content: input },
        ],
        max_tokens: 400,
        temperature: 0.7,
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
