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

// Motion Control endpoints — character image + reference video → animated video.
const FAL_MOTION_MODELS = {
  "Kling 3.0 Motion Control": "fal-ai/kling-video/v3/pro/motion-control",
  "Kling Motion Control Pro": "fal-ai/kling-video/v2.6/pro/motion-control",
  "Kling Motion Control Std": "fal-ai/kling-video/v2.6/standard/motion-control",
};

// Video Edit endpoints — source video + prompt → edited video.
const FAL_EDIT_MODELS = {
  "Kling O1 Video Edit": "fal-ai/kling-video/o1/video-to-video/edit",
  "Kling O3 Omni Edit": "fal-ai/kling-video/o1/video-to-video/edit",
  "Kling Motion Control": "fal-ai/kling-video/v2.6/pro/motion-control",
};

function parseDataUrl(d) {
  const m = /^data:([^;]+);base64,(.+)$/.exec(d || "");
  return m ? { mimeType: m[1], data: m[2] } : null;
}

export async function POST(req) {
  const { prompt, model, image, aspect, resolution, duration, motionVideo, kind, editVideo, editRefs } = await req.json();

  // ---- Video Edit (Kling) — source video + prompt → edited video ----
  if (kind === "edit") {
    const endpoint = FAL_EDIT_MODELS[model] || FAL_EDIT_MODELS["Kling O1 Video Edit"];
    if (!FAL) return NextResponse.json({ mock: true, output: "Video edit output (mock — set FAL_KEY)" });
    if (!editVideo) {
      return NextResponse.json({ error: "Video edit needs a source video." }, { status: 400 });
    }
    if (!prompt || !prompt.trim()) {
      return NextResponse.json({ error: "Video edit needs a prompt describing the change." }, { status: 400 });
    }
    const input = { video_url: editVideo, prompt: prompt.trim() };
    if (Array.isArray(editRefs) && editRefs.length) input.image_urls = editRefs.slice(0, 4);
    try {
      const res = await fetch(`https://queue.fal.run/${endpoint}`, {
        method: "POST",
        headers: { Authorization: `Key ${FAL}`, "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error(`fal ${res.status}: ${(await res.text()).slice(0, 300)}`);
      const data = await res.json();
      if (!data.request_id) throw new Error("fal did not return a request_id");
      return NextResponse.json({
        provider: "fal",
        statusUrl: data.status_url,
        responseUrl: data.response_url,
      });
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  // ---- Motion Control (Kling) — image + reference video → animated video ----
  if (kind === "motion" || motionVideo) {
    const endpoint = FAL_MOTION_MODELS[model] || FAL_MOTION_MODELS["Kling Motion Control Pro"];
    if (!FAL) return NextResponse.json({ mock: true, output: "Motion control output (mock — set FAL_KEY)" });
    if (!image || !motionVideo) {
      return NextResponse.json(
        { error: "Motion control needs both a character image and a reference video." },
        { status: 400 }
      );
    }
    const input = {
      image_url: image,
      video_url: motionVideo,
    };
    if (prompt && prompt.trim()) input.prompt = prompt.trim();
    try {
      const res = await fetch(`https://queue.fal.run/${endpoint}`, {
        method: "POST",
        headers: { Authorization: `Key ${FAL}`, "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error(`fal ${res.status}: ${(await res.text()).slice(0, 300)}`);
      const data = await res.json();
      if (!data.request_id) throw new Error("fal did not return a request_id");
      return NextResponse.json({
        provider: "fal",
        statusUrl: data.status_url,
        responseUrl: data.response_url,
      });
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

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
