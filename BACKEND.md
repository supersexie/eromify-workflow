# Geoflix — Backend

All server-side code: Next.js API route handlers, the MCP server + inline-media widget, server libs, and the standalone stdio MCP package.

> Generated bundle of the actual Geoflix source. No API keys are included —
> all secrets are read from environment variables (see IMPLEMENTATION.md).
> Recreate each file at the path shown in its heading.

---

### `app/api/generate/route.js`

````js
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const KEY = process.env.OPENAI_API_KEY;
const FAL = process.env.FAL_KEY;
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
  const { kind, prompt, model, images, voice } = await req.json();

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
    return NextResponse.json({ output });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

````

### `app/api/image/start/route.js`

````js
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

````

### `app/api/image/status/route.js`

````js
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const FAL = process.env.FAL_KEY;

export async function POST(req) {
  const { statusUrl, responseUrl } = await req.json();
  if (!FAL || !statusUrl) return NextResponse.json({ error: "Missing fal handle" }, { status: 400 });
  try {
    const st = await fetch(statusUrl, { headers: { Authorization: `Key ${FAL}` } });
    if (!st.ok) throw new Error(`fal status ${st.status}: ${(await st.text()).slice(0, 200)}`);
    const s = await st.json();
    if (s.status !== "COMPLETED") return NextResponse.json({ done: false });
    const r = await fetch(responseUrl, { headers: { Authorization: `Key ${FAL}` } });
    if (!r.ok) throw new Error(`fal result ${r.status}: ${(await r.text()).slice(0, 300)}`);
    const result = await r.json();
    const url = result.images?.[0]?.url || result.image?.url;
    if (!url) throw new Error("No image URL in fal result");
    return NextResponse.json({ done: true, output: url });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

````

### `app/api/video/start/route.js`

````js
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const GEMINI = process.env.GEMINI_API_KEY;
const FAL = process.env.FAL_KEY;

const VEO_MODELS = {
  "Veo 3.1 Fast": "veo-3.1-fast-generate-preview",
  "Veo 3.1": "veo-3.1-generate-preview",
};

const FAL_MODELS = {
  // `ar: true` => endpoint requires an explicit aspect_ratio (it 422s on the
  // default "auto" when the input image resolves to an unsupported size).
  "LTX Video": {
    t2v: "fal-ai/ltx-video",
    i2v: "fal-ai/ltx-video/image-to-video",
    ar: true,
  },
  "Wan 2.2": {
    t2v: "fal-ai/wan/v2.2-a14b/text-to-video",
    i2v: "fal-ai/wan/v2.2-a14b/image-to-video",
    ar: true,
  },
  "MiniMax Hailuo": {
    t2v: "fal-ai/minimax/hailuo-02/standard/text-to-video",
    i2v: "fal-ai/minimax/hailuo-02/standard/image-to-video",
  },
  "Kling v2": {
    t2v: "fal-ai/kling-video/v2/master/text-to-video",
    i2v: "fal-ai/kling-video/v2/master/image-to-video",
  },
};

function parseDataUrl(d) {
  const m = /^data:([^;]+);base64,(.+)$/.exec(d || "");
  return m ? { mimeType: m[1], data: m[2] } : null;
}

export async function POST(req) {
  const { prompt, model, image, aspect, resolution, duration } = await req.json();

  // ---- fal.ai ----
  // Only route to Veo for an explicit Veo model; otherwise default to fal LTX
  // (an unknown/missing model used to fall through to Veo by accident).
  const fal = FAL_MODELS[model] || (VEO_MODELS[model] ? null : FAL_MODELS["LTX Video"]);
  if (fal) {
    if (!FAL) return NextResponse.json({ mock: true, output: "Generated video (mock — set FAL_KEY for real fal.ai)" });
    const endpoint = image ? fal.i2v : fal.t2v;
    const input = { prompt: prompt || "a cinematic scene, smooth camera motion" };
    if (image) input.image_url = image; // fal accepts data URIs
    // Some fal endpoints default aspect_ratio to "auto", deriving the output
    // size from the input image and 422-ing on unsupported sizes. Pass an
    // explicit ratio (one of 16:9 / 9:16 / 1:1) for models that need it.
    if (fal.ar) {
      input.aspect_ratio = aspect === "9:16" || aspect === "1:1" ? aspect : "16:9";
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
      // Use fal's own returned URLs (correct base path for multi-segment models)
      return NextResponse.json({
        provider: "fal",
        statusUrl: data.status_url,
        responseUrl: data.response_url,
      });
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  // ---- Google Veo (default) ----
  if (!GEMINI) return NextResponse.json({ mock: true, output: "Generated video (mock — set GEMINI_API_KEY for real Veo)" });
  const modelId = VEO_MODELS[model] || "veo-3.1-fast-generate-preview";
  const instance = { prompt: prompt || "a cinematic establishing shot, smooth camera motion" };
  // Veo's predictLongRunning expects { bytesBase64Encoded, mimeType } — NOT the
  // chat-API "inlineData" shape. Accept data URLs and http(s) URLs (fetch+encode).
  let img = parseDataUrl(image);
  if (!img && typeof image === "string" && /^https?:/.test(image)) {
    try {
      const r = await fetch(image);
      if (r.ok) {
        const mimeType = r.headers.get("content-type") || "image/png";
        const data = Buffer.from(await r.arrayBuffer()).toString("base64");
        img = { mimeType, data };
      }
    } catch {}
  }
  if (img) instance.image = { bytesBase64Encoded: img.data, mimeType: img.mimeType };
  const parameters = {};
  if (aspect) parameters.aspectRatio = aspect;
  if (resolution) parameters.resolution = resolution;
  if (duration) parameters.durationSeconds = Number(duration);
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:predictLongRunning`,
      {
        method: "POST",
        headers: { "x-goog-api-key": GEMINI, "Content-Type": "application/json" },
        body: JSON.stringify({ instances: [instance], parameters }),
      }
    );
    if (!res.ok) throw new Error(`Veo ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const data = await res.json();
    if (!data.name) throw new Error("Veo did not return an operation name");
    return NextResponse.json({ provider: "veo", operation: data.name });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

````

### `app/api/video/status/route.js`

````js
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const GEMINI = process.env.GEMINI_API_KEY;
const FAL = process.env.FAL_KEY;

export async function POST(req) {
  const body = await req.json();
  const { provider } = body;

  // ---- fal.ai ----
  if (provider === "fal") {
    if (!FAL) return NextResponse.json({ done: true, output: "Generated video (mock — no FAL_KEY)" });
    const { statusUrl, responseUrl } = body;
    try {
      const st = await fetch(statusUrl, { headers: { Authorization: `Key ${FAL}` } });
      if (!st.ok) throw new Error(`fal status ${st.status}: ${(await st.text()).slice(0, 200)}`);
      const s = await st.json();
      if (s.status !== "COMPLETED") return NextResponse.json({ done: false });
      const r = await fetch(responseUrl, { headers: { Authorization: `Key ${FAL}` } });
      if (!r.ok) throw new Error(`fal result ${r.status}: ${(await r.text()).slice(0, 400)}`);
      const result = await r.json();
      const url = result.video?.url || result.videos?.[0]?.url;
      if (!url) throw new Error("No video URL in fal result");
      return NextResponse.json({ done: true, output: url });
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  // ---- Google Veo ----
  if (!GEMINI) return NextResponse.json({ done: true, output: "Generated video (mock — no GEMINI_API_KEY)" });
  const { operation } = body;
  if (!operation) return NextResponse.json({ error: "Missing operation name" }, { status: 400 });
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/${operation}`, {
      headers: { "x-goog-api-key": GEMINI },
    });
    if (!res.ok) throw new Error(`Veo poll ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const data = await res.json();
    if (!data.done) return NextResponse.json({ done: false });
    if (data.error) throw new Error(data.error.message || "Veo generation failed");
    const uri =
      data.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri ||
      data.response?.generatedVideos?.[0]?.video?.uri;
    if (!uri) throw new Error("No video URI in completed operation");
    return NextResponse.json({ done: true, output: `/api/video/file?uri=${encodeURIComponent(uri)}` });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

````

### `app/api/video/check/route.js`

````js
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const KEY = process.env.GEMINI_API_KEY;
const MODEL = "veo-3.1-fast-generate-preview";

// Free health-check: verifies the key is loaded and Veo is accessible
// (model metadata call — does NOT generate a video, costs nothing).
export async function GET() {
  if (!KEY) {
    return NextResponse.json({
      ok: false,
      keyLoaded: false,
      reason: "GEMINI_API_KEY is not set in this deployment. Add it in Vercel env vars and redeploy.",
    });
  }
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}`, {
      headers: { "x-goog-api-key": KEY },
    });
    const text = await res.text();
    if (res.ok) {
      return NextResponse.json({ ok: true, keyLoaded: true, veoAccessible: true, model: MODEL });
    }
    return NextResponse.json({
      ok: false,
      keyLoaded: true,
      veoAccessible: false,
      status: res.status,
      detail: text.slice(0, 400),
    });
  } catch (e) {
    return NextResponse.json({ ok: false, keyLoaded: true, error: e.message });
  }
}

````

### `app/api/video/file/route.js`

````js
export const runtime = "nodejs";
export const maxDuration = 60;

const KEY = process.env.GEMINI_API_KEY;
const ALLOWED = "https://generativelanguage.googleapis.com/";

export async function GET(req) {
  const uri = new URL(req.url).searchParams.get("uri");
  if (!uri || !KEY) return new Response("Not found", { status: 404 });
  // Prevent SSRF: only proxy Google Generative Language file URIs
  if (!uri.startsWith(ALLOWED)) return new Response("Forbidden", { status: 403 });

  try {
    const r = await fetch(uri, { headers: { "x-goog-api-key": KEY }, redirect: "follow" });
    if (!r.ok) return new Response(`Upstream ${r.status}`, { status: 502 });
    return new Response(r.body, {
      headers: {
        "Content-Type": r.headers.get("content-type") || "video/mp4",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (e) {
    return new Response(`Proxy error: ${e.message}`, { status: 502 });
  }
}

````

### `app/api/video/combine/start/route.js`

````js
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const FAL = process.env.FAL_KEY;

// Stitch multiple clips into one via fal's ffmpeg compose API (async queue).
// Each clip is placed sequentially on a single video track.
export async function POST(req) {
  const { urls, durations } = await req.json();
  if (!Array.isArray(urls) || urls.length < 2) {
    return NextResponse.json({ error: "Need at least 2 video URLs" }, { status: 400 });
  }
  if (!FAL) return NextResponse.json({ error: "FAL_KEY not set" }, { status: 500 });

  // Sequential keyframes: each clip starts where the previous ended.
  let t = 0;
  const keyframes = urls.map((url, i) => {
    const d = (Array.isArray(durations) && durations[i]) || 5;
    const kf = { url, timestamp: t, duration: d };
    t += d;
    return kf;
  });
  const input = { tracks: [{ id: "1", type: "video", keyframes }] };

  try {
    const res = await fetch("https://queue.fal.run/fal-ai/ffmpeg-api/compose", {
      method: "POST",
      headers: { Authorization: `Key ${FAL}`, "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error(`fal ${res.status}: ${(await res.text()).slice(0, 400)}`);
    const data = await res.json();
    if (!data.request_id) throw new Error("fal did not return a request_id");
    return NextResponse.json({ statusUrl: data.status_url, responseUrl: data.response_url });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

````

### `app/api/video/combine/status/route.js`

````js
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const FAL = process.env.FAL_KEY;

export async function POST(req) {
  const { statusUrl, responseUrl } = await req.json();
  if (!FAL || !statusUrl) return NextResponse.json({ error: "Missing fal handle" }, { status: 400 });
  try {
    const st = await fetch(statusUrl, { headers: { Authorization: `Key ${FAL}` } });
    if (!st.ok) throw new Error(`fal status ${st.status}: ${(await st.text()).slice(0, 200)}`);
    const s = await st.json();
    if (s.status !== "COMPLETED") return NextResponse.json({ done: false });
    const r = await fetch(responseUrl, { headers: { Authorization: `Key ${FAL}` } });
    if (!r.ok) throw new Error(`fal result ${r.status}: ${(await r.text()).slice(0, 300)}`);
    const result = await r.json();
    const url = result.video_url || result.video?.url || result.output?.url;
    if (!url) throw new Error("No video URL in fal result: " + JSON.stringify(result).slice(0, 200));
    return NextResponse.json({ done: true, output: url });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

````

### `app/api/audio/voices/route.js`

````js
// Lists ElevenLabs voices (stock library + user's cloned voices).
// Returns: { voices: [{ value, label, category }] }
//   - value: ElevenLabs voice_id (what we send when generating)
//   - label: display name (what the dropdown shows)
//   - category: "premade" | "cloned" | "professional" | ...
//
// Falls back to a small static OpenAI-TTS voice list if no ElevenLabs key.

export const runtime = "nodejs";

const ELEVEN = process.env.ELEVENLABS_API_KEY;

const OPENAI_VOICES = [
  { value: "alloy",   label: "Alloy (OpenAI)",   category: "openai" },
  { value: "echo",    label: "Echo (OpenAI)",    category: "openai" },
  { value: "fable",   label: "Fable (OpenAI)",   category: "openai" },
  { value: "onyx",    label: "Onyx (OpenAI)",    category: "openai" },
  { value: "nova",    label: "Nova (OpenAI)",    category: "openai" },
  { value: "shimmer", label: "Shimmer (OpenAI)", category: "openai" },
];

export async function GET() {
  if (!ELEVEN) return Response.json({ voices: OPENAI_VOICES, provider: "openai" });
  try {
    const r = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: { "xi-api-key": ELEVEN },
      cache: "no-store",
    });
    if (!r.ok) throw new Error(`ElevenLabs ${r.status}: ${(await r.text()).slice(0, 200)}`);
    const data = await r.json();
    const voices = (data.voices || []).map((v) => ({
      value: v.voice_id,
      label: v.name,
      category: v.category || "premade",
    }));
    // Cloned/professional first (the user's own voices), then premade.
    voices.sort((a, b) => {
      const rank = (c) => (c === "cloned" || c === "professional") ? 0 : 1;
      return rank(a.category) - rank(b.category);
    });
    return Response.json({ voices, provider: "elevenlabs" });
  } catch (e) {
    return Response.json({ voices: OPENAI_VOICES, provider: "openai", warning: e.message });
  }
}

````

### `app/api/media/route.js`

````js
export const runtime = "nodejs";
export const maxDuration = 60;

// Same-origin media proxy so Claude's widget iframe trusts/loads generated media
// (claude.ai does not reliably load raw fal.media/googleapis URLs in the sandbox).
const ALLOW = [
  /^https:\/\/[a-z0-9.-]*\.fal\.media\//i,
  /^https:\/\/[a-z0-9.-]*\.fal\.run\//i,
  /^https:\/\/[a-z0-9.-]*\.googleapis\.com\//i,
  /^https:\/\/storage\.googleapis\.com\//i,
  /^https:\/\/[a-z0-9.-]*\.eromify\.com\//i,
  /^https:\/\/generativelanguage\.googleapis\.com\//i,
];

export async function GET(req) {
  const u = new URL(req.url).searchParams.get("u");
  if (!u || !ALLOW.some((r) => r.test(u))) return new Response("Forbidden", { status: 403 });
  try {
    // Forward Range so <video> can stream/seek (browsers need 206 responses).
    const range = req.headers.get("range");
    const r = await fetch(u, { redirect: "follow", headers: range ? { Range: range } : {} });
    if (!r.ok && r.status !== 206) return new Response(`Upstream ${r.status}`, { status: 502 });
    const headers = {
      "Content-Type": r.headers.get("content-type") || "application/octet-stream",
      "Cache-Control": "public, max-age=86400",
      "Access-Control-Allow-Origin": "*",
      "Accept-Ranges": r.headers.get("accept-ranges") || "bytes",
    };
    for (const h of ["content-length", "content-range"]) {
      const v = r.headers.get(h);
      if (v) headers[h === "content-length" ? "Content-Length" : "Content-Range"] = v;
    }
    return new Response(r.body, { status: r.status, headers });
  } catch (e) {
    return new Response(`Proxy error: ${e.message}`, { status: 502 });
  }
}

````

### `app/api/generations/route.js`

````js
import { getGenerations, configured } from "@/lib/genstore";

export const dynamic = "force-dynamic";

export async function GET() {
  const items = await getGenerations();
  return Response.json({ items, configured: configured() });
}

````

### `app/api/assistant/route.js`

````js
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const KEY = process.env.OPENAI_API_KEY;

const SYS = `You are an assistant inside a node-based workflow canvas (like Picsart Workflows).
The user describes a creative task. You decide:
  - what kind of node to create: "image", "video", "text", "audio", or "motion"
  - what concrete prompt to use for that node
  - a brief message back to the user

Defaults: "image" if ambiguous. If the user mentions "video", "clip", "animation" → video. If "voiceover", "narrate", "speech", "music" → audio. If "write", "story", "summary", "describe in text" → text. If "motion graphics", "animated logo" → motion.

STYLE: Do NOT default to any single house style. Choose the visual style that best fits the request:
- If the user names a style (realistic, cinematic, anime, claymation, watercolor, 3D, cyberpunk, retro, etc.), use EXACTLY that.
- If they don't, pick what fits the subject: default to "photorealistic, cinematic lighting, shallow depth of field" for real-world people/products/places; use a stylized look (e.g. "Pixar-style 3D animation", "2D anime cel-shaded", "claymation", "flat vector") only when the subject is cartoonish or the user implies it.
Whatever style you pick, state it concretely once and reuse it.

SELECTED ITEM (interactive): The user may have an item selected on the canvas — see "Canvas selection" in context. If an image is selected and the user refers to "this", "that image", "it", "the current image", or asks to turn/convert the selected image into a video, set "useSelectedImage": true. Then the selected image is the starting frame/seed — do NOT invent a new character or return a "character" field; write the prompt/scenes to ANIMATE or CONTINUE from that exact image (describe motion, camera, what happens next), keeping its subject and style.

DIRECTOR MODE (multi-scene video): If the user wants a video longer than ~8 seconds, OR mentions multiple scenes / a story / a sequence (e.g. "30 second video", "1 minute rhyme", "a story about..."), break it into a SEQUENCE of short clips (~6-8s each) returned in "scenes". Estimate scene count as seconds ÷ 7, clamped between 2 and 6.

The clips are generated INDEPENDENTLY (each model call has no memory of the others) and then stitched together, so visual consistency depends ENTIRELY on you repeating identical descriptors. Therefore:
- Lock ONE fixed STYLE spec (the chosen style, concretely) and a precise, FIXED description for every recurring CHARACTER (species/role, exact colors, outfit, size, distinguishing features).
- Write each scene as: <the SAME style spec> + <the SAME character description(s), word-for-word> + <this scene's specific action, setting, and camera move>. Repeat the style and character text VERBATIM in every scene so every clip looks like the same world and characters.
- Keep setting, time of day, and color palette continuous across consecutive scenes unless the story calls for a change. End/begin scenes on matching framing where possible for smooth cuts.
- 2-4 sentences per scene. No "Shot N" labels or timestamps.
- Return a "character" field: ONE text-to-image prompt for a single reference image of the main character — full body, simple neutral background, in the locked style. (OMIT "character" when useSelectedImage is true — the selected image is the reference.)

If the user asks something off-topic or unclear, respond with kind=null and a clarifying message.

Always respond as JSON. For a single asset:
{ "kind": "image"|"video"|"text"|"audio"|"motion"|null, "prompt": "...", "useSelectedImage": false, "message": "short reply (1-2 sentences)" }
For a multi-scene video, instead use:
{ "kind": "video", "character": "reference image prompt (omit if useSelectedImage)", "scenes": ["scene 1", "scene 2", ...], "useSelectedImage": false, "message": "short reply mentioning how many scenes" }`;

export async function POST(req) {
  const { input, history = [], context = {} } = await req.json();
  if (!KEY) {
    // No key — fall back to a dumb regex classifier
    const text = (input || "").toLowerCase();
    let kind = "image";
    if (/\b(video|clip|animation|animate)\b/.test(text)) kind = "video";
    else if (/\b(audio|voice|narrate|speech|music|sound)\b/.test(text)) kind = "audio";
    else if (/\b(write|text|story|summary|paragraph)\b/.test(text)) kind = "text";
    else if (/\bmotion graphic/.test(text)) kind = "motion";
    return NextResponse.json({
      kind,
      prompt: input,
      message: `Creating a ${kind} node. (Set OPENAI_API_KEY for smarter intent detection.)`,
    });
  }
  try {
    const sel = context.hasSelectedImage
      ? "Canvas selection: the user currently has an IMAGE selected on the canvas."
      : "Canvas selection: nothing relevant is selected.";
    const messages = [
      { role: "system", content: SYS },
      { role: "system", content: sel },
      ...history.slice(-6).map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: input },
    ];
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages,
        response_format: { type: "json_object" },
        max_tokens: 2000,
      }),
    });
    if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(raw);
    const scenes = Array.isArray(parsed.scenes)
      ? parsed.scenes.filter((s) => typeof s === "string" && s.trim()).slice(0, 6)
      : null;
    const useSelectedImage = parsed.useSelectedImage === true && context.hasSelectedImage === true;
    return NextResponse.json({
      kind: parsed.kind ?? null,
      prompt: parsed.prompt || input,
      scenes: scenes && scenes.length >= 2 ? scenes : null,
      character: useSelectedImage ? null : (typeof parsed.character === "string" ? parsed.character : null),
      useSelectedImage,
      message: parsed.message || "Done.",
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

````

### `app/api/[transport]/route.js`

````js
import { createMcpHandler } from "mcp-handler";
import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import { z } from "zod";
import { WIDGET_HTML } from "./widget-html.js";
import { addGeneration } from "@/lib/genstore";

export const maxDuration = 60;

const UI_URI = "ui://geoflix/media-v3.html";

const BASE = (
  process.env.GEOFLIX_BASE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "https://geoflix.online")
).replace(/\/$/, "");

// Wrap a generated media URL in our same-origin proxy so the widget iframe can load it
// (claude.ai won't load raw fal.media in the sandbox — Magic Mint does the same thing).
function proxied(url) {
  if (!url || typeof url !== "string" || !url.startsWith("http")) return url;
  return `${BASE}/api/media?u=${encodeURIComponent(url)}`;
}

async function postJson(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

function parseDataUrl(s) {
  const m = /^data:(.+?);base64,(.+)$/.exec(s || "");
  return m ? { mimeType: m[1], data: m[2] } : null;
}

// Poll a video job; when done return structuredContent the widget renders, else null.
async function pollVideo(handle, budgetMs, prompt) {
  const deadline = Date.now() + budgetMs;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 5000));
    const s = await postJson("/api/video/status", handle);
    if (s.done) {
      const raw = s.output.startsWith("http") ? s.output : `${BASE}${s.output}`;
      await addGeneration({ url: raw, kind: "video", prompt: prompt || handle?.prompt });
      // Use the raw fal.media URL (CSP whitelists *.fal.media) — its CDN supports
      // HTTP range requests so <video> plays; our /api/media proxy doesn't.
      const url = /fal\.(media|run)/.test(raw) ? raw : proxied(raw);
      return {
        structuredContent: { url, kind: "video" },
        content: [{ type: "text", text: `Video is displayed in the panel above. Do not describe it — end your turn. (Direct link if needed: ${raw})` }],
      };
    }
  }
  return null;
}

const VIDEO_INPUT = {
  prompt: z.string(),
  model: z.enum(["LTX Video", "Wan 2.2", "MiniMax Hailuo", "Kling v2", "Veo 3.1 Fast", "Veo 3.1"]).optional(),
  image_url: z.string().optional(),
  aspect: z.enum(["16:9", "9:16"]).optional(),
  resolution: z.enum(["720p", "1080p"]).optional(),
  duration: z.number().optional(),
};

const handler = createMcpHandler(
  (server) => {
    // UI widget that renders generated media inline (same-origin source).
    registerAppResource(
      server,
      "geoflix-media",
      UI_URI,
      { _meta: { ui: { csp: { resourceDomains: [BASE, "https://*.fal.media", "https://*.googleapis.com"] } } } },
      async () => ({ contents: [{ uri: UI_URI, mimeType: RESOURCE_MIME_TYPE, text: WIDGET_HTML }] })
    );

    // ---- Image (app tool → renders inline via the UI widget) ----
    registerAppTool(
      server,
      "generate_image",
      {
        title: "Generate image",
        description: "Generate an image from a text prompt (FLUX / Seedream / Nano Banana). Renders inline.",
        inputSchema: { prompt: z.string(), model: z.enum(["Flux 2 Pro", "Flux 2 Max", "Nano Banana Pro", "Seedream 4.5"]).optional() },
        _meta: { ui: { resourceUri: UI_URI } },
      },
      async ({ prompt, model }) => {
        const { output } = await postJson("/api/generate", { kind: "image", prompt, model });
        if (typeof output === "string" && output.startsWith("http")) {
          await addGeneration({ url: output, kind: "image", prompt });
          // Embed a base64 data URI so the widget renders without any cross-origin fetch.
          let imageData = null;
          try {
            const r = await fetch(output);
            if (r.ok) {
              const mt = r.headers.get("content-type") || "image/jpeg";
              imageData = `data:${mt};base64,${Buffer.from(await r.arrayBuffer()).toString("base64")}`;
            }
          } catch {}
          return {
            structuredContent: { kind: "image", url: proxied(output), image: imageData },
            content: [{ type: "text", text: `Image is displayed in the panel above. Do not describe it — end your turn. (Direct link if needed: ${output})` }],
          };
        }
        const img = parseDataUrl(output); // OpenAI base64 fallback
        if (img) return { content: [{ type: "image", data: img.data, mimeType: img.mimeType }, { type: "text", text: `Generated image for: "${prompt}"` }] };
        return { content: [{ type: "text", text: output }] };
      }
    );

    server.tool(
      "generate_text",
      "Generate text (copy, captions, ideas) from a prompt.",
      { prompt: z.string() },
      async ({ prompt }) => {
        const { output } = await postJson("/api/generate", { kind: "text", prompt });
        return { content: [{ type: "text", text: output }] };
      }
    );

    server.tool(
      "generate_audio",
      "Generate speech audio (text-to-speech). Returns an MP3 inline.",
      { prompt: z.string() },
      async ({ prompt }) => {
        const { output } = await postJson("/api/generate", { kind: "audio", prompt });
        const aud = parseDataUrl(output);
        if (aud) return { content: [{ type: "audio", data: aud.data, mimeType: aud.mimeType }, { type: "text", text: "Generated audio." }] };
        return { content: [{ type: "text", text: output }] };
      }
    );

    // ---- Video (app tools → render inline in widget) ----
    registerAppTool(
      server,
      "generate_video",
      {
        title: "Generate video",
        description: "Generate a video from text (and optionally a source image for image-to-video). LTX is fastest/cheapest. If it takes too long, call check_video with the handle. Renders inline.",
        inputSchema: VIDEO_INPUT,
        _meta: { ui: { resourceUri: UI_URI } },
      },
      async ({ prompt, model, image_url, aspect, resolution, duration }) => {
        const start = await postJson("/api/video/start", { prompt, model: model || "LTX Video", image: image_url, aspect, resolution, duration });
        if (start.mock) return { content: [{ type: "text", text: start.output }] };
        const done = await pollVideo(start, 45 * 1000, prompt);
        if (done) return done;
        return {
          content: [{
            type: "text",
            text: "Video is rendering (~1-2 min). Call `check_video` with this exact handle to retrieve it:\n\n```json\n" + JSON.stringify(start) + "\n```",
          }],
        };
      }
    );

    registerAppTool(
      server,
      "check_video",
      {
        title: "Check video",
        description: "Retrieve a video started by generate_video. Pass the exact `handle` JSON from generate_video. Renders inline once ready.",
        inputSchema: { handle: z.string().describe("The JSON handle string from generate_video") },
        _meta: { ui: { resourceUri: UI_URI } },
      },
      async ({ handle }) => {
        let start;
        try { start = JSON.parse(handle); } catch { return { content: [{ type: "text", text: "Invalid handle." }], isError: true }; }
        const done = await pollVideo(start, 50 * 1000);
        if (done) return done;
        return { content: [{ type: "text", text: "Still rendering — call `check_video` again with the same handle in a few seconds." }] };
      }
    );
  },
  {},
  { basePath: "/api" }
);

// Shared-secret gate: if MCP_KEY is set, require ?key=<token>.
async function gated(req) {
  const token = process.env.MCP_KEY;
  if (token) {
    const key = new URL(req.url).searchParams.get("key");
    if (key !== token) return new Response("Unauthorized", { status: 401 });
  }
  return handler(req);
}

export { gated as GET, gated as POST, gated as DELETE };

````

### `app/api/[transport]/widget-html.js`

````js
// AUTO-GENERATED by geoflix-widget/build.js — do not edit.
export const WIDGET_HTML = "<!doctype html>\n<html><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">\n<style>\nhtml,body{margin:0;padding:0;background:transparent}\n#root{min-height:40px;display:flex;align-items:center;justify-content:center}\n#root img,#root video{max-width:100%;max-height:100vh;width:auto;height:auto;display:block;border-radius:12px}\n.ldg{display:flex;align-items:center;gap:7px;color:#8a93a3;font:13px -apple-system,BlinkMacSystemFont,\"Segoe UI\",system-ui,sans-serif;padding:22px}\n.ldg b{width:6px;height:6px;border-radius:50%;background:#aab2bf;display:inline-block;animation:blink 1.2s infinite both}\n.ldg b:nth-child(2){animation-delay:.2s}.ldg b:nth-child(3){animation-delay:.4s}\n@keyframes blink{0%,80%,100%{opacity:.25}40%{opacity:1}}\n</style></head>\n<body><div id=\"root\"><div class=\"ldg\"><b></b><b></b><b></b><span>Generating…</span></div></div>\n<script>\n(function(){\n  var root=document.getElementById('root');\n  var done=false, lastH=0, pend=false;\n  function reportSize(){\n    if(pend) return; pend=true;\n    requestAnimationFrame(function(){\n      pend=false;\n      var el=root.querySelector('img,video');\n      var w=Math.ceil(window.innerWidth), h=0;\n      var nw=el&&(el.naturalWidth||el.videoWidth), nh=el&&(el.naturalHeight||el.videoHeight);\n      if(nw&&nh){ h=Math.ceil(w*nh/nw); }\n      else { var J=document.documentElement, p=J.style.height; J.style.height=\"max-content\"; h=Math.ceil(J.getBoundingClientRect().height); J.style.height=p; }\n      if(h>0 && h!==lastH){ lastH=h; send({jsonrpc:'2.0',method:'ui/notifications/size-changed',params:{width:w,height:h}}); }\n    });\n  }\n  function render(url,kind){\n    if(done) return; done=true;\n    var el=document.createElement(kind==='video'?'video':'img');\n    el.src=url;\n    if(kind==='video'){ el.controls=el.autoplay=el.loop=el.muted=el.playsInline=true; el.addEventListener('loadedmetadata',reportSize); }\n    else { el.alt='generated'; el.addEventListener('load',reportSize); }\n    root.innerHTML=''; root.appendChild(el);\n    if(window.ResizeObserver){ try{ var ro=new ResizeObserver(reportSize); ro.observe(document.documentElement); ro.observe(document.body); }catch(e){} }\n    [60,200,500,1000,2000].forEach(function(t){ setTimeout(reportSize,t); });\n  }\n  function findMedia(o,d){\n    if(o==null||d>10) return null;\n    if(typeof o==='string') return /^data:(image|video)\\//.test(o) ? {url:o,kind:/^data:video/.test(o)?'video':'image'} : null;\n    if(typeof o==='object'){\n      if(typeof o.image==='string' && /^data:/.test(o.image)) return {url:o.image, kind:'image'};\n      if(typeof o.url==='string' && /^(https?:|data:)/.test(o.url)) return {url:o.url, kind:o.kind||'image'};\n      for(var k in o){ var r=findMedia(o[k],d+1); if(r) return r; }\n    }\n    return null;\n  }\n  var idc=0;\n  function send(m){ try{ parent.postMessage(m,'*'); }catch(e){} }\n  function initialize(){\n    send({jsonrpc:'2.0',id:++idc,method:'ui/initialize',params:{\n      protocolVersion:'2026-01-26',\n      appInfo:{name:'geoflix',version:'1.0.0'},\n      appCapabilities:{availableDisplayModes:['inline']}\n    }});\n  }\n  window.addEventListener('message',function(ev){\n    var d=ev.data; if(!d||typeof d!=='object') return;\n    if(d.method==='ui/notifications/sandbox-proxy-ready') initialize();\n    if(d.id && d.result && d.result.protocolVersion){ send({jsonrpc:'2.0',method:'ui/notifications/initialized'}); }\n    var f=findMedia(d,0); if(f) render(f.url,f.kind);\n  });\n  initialize();\n})();\n</script>\n</body></html>\n";

````

### `lib/falImage.js`

````js
// fal image endpoint maps + picker, shared by the image start route.

export const FAL_IMAGE_MAP = {
  "Flux 2 Pro": "fal-ai/flux-2-pro",
  "Flux 2 Max": "fal-ai/flux-2-max",
  "Nano Banana Pro": "fal-ai/nano-banana-pro",
  "Seedream 4.5": "fal-ai/bytedance/seedream/v4.5/text-to-image",
};

// Image-to-image / edit endpoints (take prompt + image_urls).
export const FAL_EDIT_MAP = {
  "Flux 2 Pro": "fal-ai/flux-2-pro",
  "Flux 2 Max": "fal-ai/flux-2-max",
  "Nano Banana Pro": "fal-ai/nano-banana-pro/edit",
  "Seedream 4.5": "fal-ai/bytedance/seedream/v4.5/edit",
};

export function pickImageEndpoint(model, hasImages) {
  return hasImages
    ? FAL_EDIT_MAP[model] || "fal-ai/nano-banana-pro/edit"
    : FAL_IMAGE_MAP[model] || "fal-ai/flux-2-pro";
}

````

### `lib/genstore.js`

````js
// Server-side generations index, backed by Vercel Blob.
//
// Stores a single JSON file (generations.json) listing media produced through
// the MCP connector (and anywhere else server-side), so the web app Library can
// show them. Everything here is BEST-EFFORT: if Blob isn't configured or any
// call fails, functions no-op / return [] and never throw — generation must
// never break because persistence hiccupped.

import { put, list } from "@vercel/blob";

const INDEX_PATH = "generations.json";
const MAX_ITEMS = 500;

// The Blob SDK auto-reads BLOB_READ_WRITE_TOKEN, but a custom env-var prefix
// (e.g. "GEOFLIX") names it GEOFLIX_READ_WRITE_TOKEN. Resolve whichever exists
// and pass it explicitly so either dashboard setup works.
function token() {
  return (
    process.env.BLOB_READ_WRITE_TOKEN ||
    process.env.GEOFLIX_READ_WRITE_TOKEN ||
    Object.keys(process.env).find((k) => k.endsWith("_READ_WRITE_TOKEN")) &&
      process.env[Object.keys(process.env).find((k) => k.endsWith("_READ_WRITE_TOKEN"))]
  );
}

export function configured() {
  return !!token();
}

// Resolve the public URL of the index file (Blob URLs aren't deterministic).
async function indexUrl() {
  try {
    const { blobs } = await list({ prefix: INDEX_PATH, limit: 1, token: token() });
    return blobs.find((b) => b.pathname === INDEX_PATH)?.url || null;
  } catch {
    return null;
  }
}

export async function getGenerations() {
  if (!configured()) return [];
  try {
    const url = await indexUrl();
    if (!url) return [];
    const res = await fetch(`${url}?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function addGeneration({ url, kind, prompt }) {
  if (!configured() || !url || typeof url !== "string") return;
  try {
    const existing = await getGenerations();
    // Dedupe by url; newest first; cap the list.
    const next = [
      { url, kind: kind || "image", prompt: prompt || "", source: "mcp", ts: Date.now() },
      ...existing.filter((g) => g.url !== url),
    ].slice(0, MAX_ITEMS);
    await put(INDEX_PATH, JSON.stringify(next), {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
      token: token(),
    });
  } catch {
    // swallow — never let persistence break a generation
  }
}

````

### `geoflix-widget/widget.html`

````html
<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
html,body{margin:0;padding:0;background:transparent}
#root{min-height:40px;display:flex;align-items:center;justify-content:center}
#root img,#root video{max-width:100%;max-height:100vh;width:auto;height:auto;display:block;border-radius:12px}
.ldg{display:flex;align-items:center;gap:7px;color:#8a93a3;font:13px -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;padding:22px}
.ldg b{width:6px;height:6px;border-radius:50%;background:#aab2bf;display:inline-block;animation:blink 1.2s infinite both}
.ldg b:nth-child(2){animation-delay:.2s}.ldg b:nth-child(3){animation-delay:.4s}
@keyframes blink{0%,80%,100%{opacity:.25}40%{opacity:1}}
</style></head>
<body><div id="root"><div class="ldg"><b></b><b></b><b></b><span>Generating…</span></div></div>
<script>
(function(){
  var root=document.getElementById('root');
  var done=false, lastH=0, pend=false;
  function reportSize(){
    if(pend) return; pend=true;
    requestAnimationFrame(function(){
      pend=false;
      var el=root.querySelector('img,video');
      var w=Math.ceil(window.innerWidth), h=0;
      var nw=el&&(el.naturalWidth||el.videoWidth), nh=el&&(el.naturalHeight||el.videoHeight);
      if(nw&&nh){ h=Math.ceil(w*nh/nw); }
      else { var J=document.documentElement, p=J.style.height; J.style.height="max-content"; h=Math.ceil(J.getBoundingClientRect().height); J.style.height=p; }
      if(h>0 && h!==lastH){ lastH=h; send({jsonrpc:'2.0',method:'ui/notifications/size-changed',params:{width:w,height:h}}); }
    });
  }
  function render(url,kind){
    if(done) return; done=true;
    var el=document.createElement(kind==='video'?'video':'img');
    el.src=url;
    if(kind==='video'){ el.controls=el.autoplay=el.loop=el.muted=el.playsInline=true; el.addEventListener('loadedmetadata',reportSize); }
    else { el.alt='generated'; el.addEventListener('load',reportSize); }
    root.innerHTML=''; root.appendChild(el);
    if(window.ResizeObserver){ try{ var ro=new ResizeObserver(reportSize); ro.observe(document.documentElement); ro.observe(document.body); }catch(e){} }
    [60,200,500,1000,2000].forEach(function(t){ setTimeout(reportSize,t); });
  }
  function findMedia(o,d){
    if(o==null||d>10) return null;
    if(typeof o==='string') return /^data:(image|video)\//.test(o) ? {url:o,kind:/^data:video/.test(o)?'video':'image'} : null;
    if(typeof o==='object'){
      if(typeof o.image==='string' && /^data:/.test(o.image)) return {url:o.image, kind:'image'};
      if(typeof o.url==='string' && /^(https?:|data:)/.test(o.url)) return {url:o.url, kind:o.kind||'image'};
      for(var k in o){ var r=findMedia(o[k],d+1); if(r) return r; }
    }
    return null;
  }
  var idc=0;
  function send(m){ try{ parent.postMessage(m,'*'); }catch(e){} }
  function initialize(){
    send({jsonrpc:'2.0',id:++idc,method:'ui/initialize',params:{
      protocolVersion:'2026-01-26',
      appInfo:{name:'geoflix',version:'1.0.0'},
      appCapabilities:{availableDisplayModes:['inline']}
    }});
  }
  window.addEventListener('message',function(ev){
    var d=ev.data; if(!d||typeof d!=='object') return;
    if(d.method==='ui/notifications/sandbox-proxy-ready') initialize();
    if(d.id && d.result && d.result.protocolVersion){ send({jsonrpc:'2.0',method:'ui/notifications/initialized'}); }
    var f=findMedia(d,0); if(f) render(f.url,f.kind);
  });
  initialize();
})();
</script>
</body></html>

````

### `geoflix-widget/build.js`

````js
import { readFileSync, writeFileSync } from "fs";

// Tiny hand-written widget (no SDK bundle) — read the literal HTML and emit it as a JS string.
const html = readFileSync(new URL("./widget.html", import.meta.url), "utf-8");
const out = `// AUTO-GENERATED by geoflix-widget/build.js — do not edit.\nexport const WIDGET_HTML = ${JSON.stringify(html)};\n`;
writeFileSync(new URL("../app/api/[transport]/widget-html.js", import.meta.url), out);
console.log("Wrote widget HTML (" + html.length + " bytes) to app/api/[transport]/widget-html.js");

````

### `geoflix-widget/src/widget.js`

````js
import { App } from "@modelcontextprotocol/ext-apps";

const root = document.getElementById("root");

function render(url, kind) {
  if (!url) {
    root.innerHTML = `<div class="msg">Rendering… check again in a moment.</div>`;
    return;
  }
  const isVideo = kind === "video" || /\.(mp4|webm|mov)(\?|$)/i.test(url);
  root.innerHTML = isVideo
    ? `<video src="${url}" controls autoplay loop playsinline></video>`
    : `<img src="${url}" alt="" />`;
}

function extract(params) {
  if (!params) return { url: null };
  // The notification params may nest the tool result under `result`.
  const r = params.result || params;
  const sc = r.structuredContent;
  if (sc && sc.url) return { url: sc.url, kind: sc.kind };
  const text = (r.content || []).map((c) => (c && c.text) || "").join(" ");
  const m = text.match(/https?:\/\/\S+\.(mp4|webm|mov|png|jpe?g|webp|gif)(\?\S*)?/i);
  if (m) return { url: m[0], kind: /\.(mp4|webm|mov)/i.test(m[0]) ? "video" : "image" };
  return { url: null };
}

const app = new App({ name: "Geoflix Media", version: "1.0.0" });

app.ontoolresult = (params) => {
  const { url, kind } = extract(params);
  render(url, kind);
};

app
  .connect()
  .catch((e) => {
    root.innerHTML = `<div class="msg">Widget init error: ${e && e.message ? e.message : e}</div>`;
  });

````

### `geoflix-widget/package.json`

````json
{
  "name": "geoflix-widget",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "node build.js"
  },
  "dependencies": {
    "@modelcontextprotocol/ext-apps": "^1.7.4"
  },
  "devDependencies": {
    "esbuild": "^0.24.0"
  }
}

````

### `geoflix-mcp/index.js`

````js
#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const BASE = (process.env.GEOFLIX_BASE_URL || "https://geoflix.online").replace(/\/$/, "");

async function postJson(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

// data:<mime>;base64,<data>  ->  { mimeType, data }  (else null)
function parseDataUrl(s) {
  const m = /^data:(.+?);base64,(.+)$/.exec(s || "");
  return m ? { mimeType: m[1], data: m[2] } : null;
}

const server = new McpServer({ name: "geoflix", version: "1.0.0" });

// ---- Image ----
server.tool(
  "generate_image",
  "Generate an image from a text prompt using Geoflix (GPT Image). Returns the image inline.",
  { prompt: z.string().describe("What to generate"), model: z.enum(["GPT Image 1", "GPT Image 2"]).optional() },
  async ({ prompt, model }) => {
    const { output } = await postJson("/api/generate", { kind: "image", prompt, model });
    const img = parseDataUrl(output);
    if (img) return { content: [{ type: "image", data: img.data, mimeType: img.mimeType }, { type: "text", text: `Generated image for: "${prompt}"` }] };
    return { content: [{ type: "text", text: output }] };
  }
);

// ---- Text ----
server.tool(
  "generate_text",
  "Generate text (copy, captions, ideas) from a prompt using Geoflix.",
  { prompt: z.string() },
  async ({ prompt }) => {
    const { output } = await postJson("/api/generate", { kind: "text", prompt });
    return { content: [{ type: "text", text: output }] };
  }
);

// ---- Audio (TTS) ----
server.tool(
  "generate_audio",
  "Generate speech audio (text-to-speech) from text using Geoflix. Returns an MP3 inline.",
  { prompt: z.string().describe("Text to speak") },
  async ({ prompt }) => {
    const { output } = await postJson("/api/generate", { kind: "audio", prompt });
    const aud = parseDataUrl(output);
    if (aud) return { content: [{ type: "audio", data: aud.data, mimeType: aud.mimeType }, { type: "text", text: "Generated audio." }] };
    return { content: [{ type: "text", text: output }] };
  }
);

// ---- Video (async: start + poll) ----
server.tool(
  "generate_video",
  "Generate a video from a text prompt (and optionally a source image for image-to-video) using Geoflix. Takes 1-3 minutes. Returns a URL to the video.",
  {
    prompt: z.string(),
    model: z.enum(["LTX Video", "Wan 2.2", "MiniMax Hailuo", "Kling v2", "Veo 3.1 Fast", "Veo 3.1"]).optional(),
    image_url: z.string().optional().describe("Optional image URL or data URI for image-to-video"),
    aspect: z.enum(["16:9", "9:16"]).optional(),
    resolution: z.enum(["720p", "1080p"]).optional(),
    duration: z.number().optional().describe("Seconds (4, 6, or 8)"),
  },
  async ({ prompt, model, image_url, aspect, resolution, duration }) => {
    const start = await postJson("/api/video/start", { prompt, model: model || "LTX Video", image: image_url, aspect, resolution, duration });
    if (start.mock) return { content: [{ type: "text", text: start.output }] };

    const deadline = Date.now() + 5 * 60 * 1000;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 6000));
      const s = await postJson("/api/video/status", start);
      if (s.done) {
        const url = s.output.startsWith("http") ? s.output : `${BASE}${s.output}`;
        const html = `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#000"><video src="${url}" controls autoplay loop playsinline style="width:100%;height:auto;display:block"></video></body></html>`;
        return { content: [
          { type: "resource", resource: { uri: `ui://geoflix/video/${Date.now()}`, mimeType: "text/html", text: html } },
          { type: "text", text: `✅ Video ready: ${url}` },
        ] };
      }
    }
    return { content: [{ type: "text", text: "Video generation timed out (over 5 min)." }], isError: true };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("geoflix-mcp running (base:", BASE + ")");

````

### `geoflix-mcp/package.json`

````json
{
  "name": "geoflix-mcp",
  "version": "1.0.0",
  "description": "MCP server exposing Geoflix AI generation (image, video, audio, text) as Claude tools",
  "type": "module",
  "bin": { "geoflix-mcp": "index.js" },
  "scripts": { "start": "node index.js" },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.4",
    "zod": "^3.23.8"
  }
}

````

### `geoflix-mcp/README.md`

````markdown
# Geoflix MCP

An [MCP](https://modelcontextprotocol.io) server that lets Claude generate **images, video, audio, and text** through Geoflix (which runs OpenAI GPT-Image / TTS / GPT-4o-mini and fal.ai / Veo for video).

It's a thin client over the Geoflix HTTP API — the API keys live on the Geoflix server, not here.

## Tools

| Tool | What it does |
|------|--------------|
| `generate_image` | Text → image (GPT Image 1/2), returned inline |
| `generate_video` | Text → video, or image → video (LTX / Wan 2.2 / MiniMax / Kling / Veo). Returns a URL. Takes 1–3 min. |
| `generate_audio` | Text → speech (MP3), returned inline |
| `generate_text` | Prompt → text (captions, copy, ideas) |

## Setup

```bash
cd geoflix-mcp
npm install
```

### Claude Desktop

Edit your config file:
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "geoflix": {
      "command": "node",
      "args": ["C:\\Users\\91821\\workflow-canvas\\geoflix-mcp\\index.js"]
    }
  }
}
```

Restart Claude Desktop. You'll see the geoflix tools appear (the slider/hammer icon).

### Claude Code

```bash
claude mcp add geoflix -- node "C:\\Users\\91821\\workflow-canvas\\geoflix-mcp\\index.js"
```

## Configuration

- `GEOFLIX_BASE_URL` — defaults to `https://geoflix.online`. Set it to `http://localhost:3000` to use a local dev server instead.

## Usage examples

> "Generate an image of a corgi astronaut on the moon"
> "Make a 4-second video of waves crashing, cheapest model"
> "Read this paragraph aloud as audio: …"

## Notes

- **Cost:** these tools call real paid models via Geoflix. Images ~$0.04, video from ~$0.02 (LTX) up to ~$1.60+ (Veo). Use cheap models for testing.
- Video is asynchronous; the tool polls up to 5 minutes and returns a URL when ready.

````
