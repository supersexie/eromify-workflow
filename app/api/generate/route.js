import { NextResponse } from "next/server";
import { requireFeature, getUserTier } from "@/lib/apiGate";
import { auth } from "@/auth";
import { checkCredits, incrementUsage } from "@/lib/creditStore";

export const runtime = "nodejs";
export const maxDuration = 60;

const KEY = process.env.OPENAI_API_KEY;
const FAL = process.env.FAL_KEY || process.env.FAL_API_KEY;
const ELEVEN = process.env.ELEVENLABS_API_KEY;
const OAI = "https://api.openai.com/v1";

const OPENAI_TTS_VOICES = new Set(["alloy","echo","fable","onyx","nova","shimmer"]);

// fal image endpoints — return a public fal.media URL (small payload, renders in Claude + no localStorage bloat).
// These all return a public fal.media URL (gpt-image returns base64, so it's not used here).
const FAL_IMAGE_MAP = {
  "Flux 2 Pro": "fal-ai/flux-2-pro",
  "Flux 2 Max": "fal-ai/flux-2-max",
  "Nano Banana Pro": "fal-ai/nano-banana-pro",
  "Seedream 4.5": "fal-ai/bytedance/seedream/v4.5/text-to-image",
};

// Image-to-image / edit endpoints (take prompt + image_urls).
const FAL_EDIT_MAP = {
  "Flux 2 Pro": "fal-ai/flux-2-pro",
  "Flux 2 Max": "fal-ai/flux-2-max",
  "Nano Banana Pro": "fal-ai/nano-banana-pro/edit",
  "Seedream 4.5": "fal-ai/bytedance/seedream/v4.5/edit",
};

async function genImageFal(prompt, modelLabel, images) {
  const hasImages = Array.isArray(images) && images.length > 0;
  // Image-to-image when source image(s) are connected; else text-to-image.
  const endpoint = hasImages
    ? FAL_EDIT_MAP[modelLabel] || "fal-ai/nano-banana-pro/edit"
    : FAL_IMAGE_MAP[modelLabel] || "fal-ai/flux-2-pro";
  const input = { prompt: prompt || "abstract gradient" };
  if (hasImages) input.image_urls = images;
  const res = await fetch(`https://fal.run/${endpoint}`, {
    method: "POST",
    headers: { Authorization: `Key ${FAL}`, "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`fal image ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const url = data.images?.[0]?.url || data.image?.url;
  if (!url) throw new Error("No image URL from fal: " + JSON.stringify(data).slice(0, 200));
  return url;
}

async function oai(path, init = {}, json = true) {
  const res = await fetch(`${OAI}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${KEY}`,
      ...(json ? { "Content-Type": "application/json" } : {}),
      ...(init.headers || {}),
    },
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`OpenAI ${res.status}: ${t.slice(0, 300)}`);
  }
  return res;
}

const IMAGE_MODEL_MAP = {
  "GPT Image 1": "gpt-image-1",
  "GPT Image 2": "gpt-image-2",
};

async function genImage(prompt, modelLabel) {
  const model = IMAGE_MODEL_MAP[modelLabel] || "gpt-image-1";
  const res = await oai("/images/generations", {
    method: "POST",
    body: JSON.stringify({
      model,
      prompt: prompt || "abstract gradient",
      size: "1024x1024",
      n: 1,
    }),
  });
  const data = await res.json();
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) throw new Error("No image data returned");
  return `data:image/png;base64,${b64}`;
}

async function genText(prompt) {
  const res = await oai("/chat/completions", {
    method: "POST",
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt || "Write a short creative description." }],
      max_tokens: 400,
    }),
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

async function genAudioOpenAI(prompt, voice) {
  const v = OPENAI_TTS_VOICES.has(voice) ? voice : "alloy";
  const res = await oai(
    "/audio/speech",
    {
      method: "POST",
      body: JSON.stringify({
        model: "tts-1",
        voice: v,
        input: prompt || "Hello, this is a test.",
        response_format: "mp3",
      }),
    },
    true
  );
  const buf = Buffer.from(await res.arrayBuffer());
  return `data:audio/mpeg;base64,${buf.toString("base64")}`;
}

async function genAudioElevenLabs(prompt, voiceId) {
  // Default to "Rachel" (a stable, publicly known stock voice_id) if none specified.
  const id = voiceId || "21m00Tcm4TlvDq8ikWAM";
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${id}`, {
    method: "POST",
    headers: {
      "xi-api-key": ELEVEN,
      "Content-Type": "application/json",
      "Accept": "audio/mpeg",
    },
    body: JSON.stringify({
      text: prompt || "Hello, this is a test.",
      model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  });
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return `data:audio/mpeg;base64,${buf.toString("base64")}`;
}

async function genAudio(prompt, voice) {
  // Use ElevenLabs when configured AND the chosen voice isn't an OpenAI stock voice.
  // (The dropdown stores either an ElevenLabs voice_id or one of OpenAI's six names.)
  const isOpenAIVoice = voice && OPENAI_TTS_VOICES.has(voice);
  if (ELEVEN && !isOpenAIVoice) return genAudioElevenLabs(prompt, voice);
  if (KEY) return genAudioOpenAI(prompt, voice);
  throw new Error("No audio provider configured (set ELEVENLABS_API_KEY or OPENAI_API_KEY).");
}

function mockFallback(kind, prompt) {
  if (kind === "image") return `https://picsum.photos/seed/${Math.floor(Math.random() * 9999)}/512/512`;
  if (kind === "video") return "Generated 6s video (mock — no provider wired)";
  if (kind === "audio") return "Generated audio (mock — no provider wired)";
  if (kind === "motion") return "Generated motion scene (mock — no provider wired)";
  return `Mock text for: ${prompt || "(empty)"} — Lorem ipsum dolor sit amet.`;
}

export async function POST(req) {
  const gate = await requireFeature("Image generation");
  if (gate) return gate;

  const session = await auth();
  const uid = session?.user?.id;
  const tier = await getUserTier();
  if (uid && tier) {
    const credits = await checkCredits(uid, tier);
    if (!credits.allowed) {
      return NextResponse.json({ error: `Monthly credit limit reached (${credits.limit}). Please upgrade your plan.` }, { status: 429 });
    }
  }

  const { kind, prompt, model, images, voice, userId } = await req.json();

  try {
    let output;
    if (kind === "image") {
      // Prefer fal (public URL); fall back to OpenAI base64; else mock.
      if (FAL) output = await genImageFal(prompt, model, images);
      else if (KEY) output = await genImage(prompt, model);
      else output = mockFallback(kind, prompt);

    } else if (kind === "text") {
      output = KEY ? await genText(prompt) : mockFallback(kind, prompt);
    } else if (kind === "audio") {
      output = (ELEVEN || KEY) ? await genAudio(prompt, voice) : mockFallback(kind, prompt);
    } else {
      output = mockFallback(kind, prompt);
    }
    if (uid) incrementUsage(uid).catch(() => {});
    return NextResponse.json({ output });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
