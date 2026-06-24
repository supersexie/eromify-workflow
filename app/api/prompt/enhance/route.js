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

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { prompt = "", kind = "image" } = body;
  const input = String(prompt || "").trim();
  if (!input) return NextResponse.json({ error: "Empty prompt" }, { status: 400 });
  if (!KEY) {
    // No OpenAI key — return the prompt with a static house-style suffix so the
    // feature still does *something* visible in dev. Real enrichment needs the key.
    return NextResponse.json({
      prompt: `${input}, ${HOUSE_STYLE}`,
      fallback: true,
    });
  }

  const sys = kind === "video" ? SYS_VIDEO : SYS_IMAGE;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
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
    return NextResponse.json({ prompt: out });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
