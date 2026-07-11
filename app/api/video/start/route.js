import { NextResponse } from "next/server";
import { uploadDataUrl } from "@/lib/genstore";
import { moderatePrompt, isExplicitPrompt, checkReferenceImage, queueForReview } from "@/lib/moderation";

export const runtime = "nodejs";
export const maxDuration = 30;

const GEMINI = process.env.GEMINI_API_KEY;
const FAL = process.env.FAL_KEY || process.env.FAL_API_KEY;

const VEO_MODELS = {
  "Veo 3.1 Fast": "veo-3.1-fast-generate-preview",
  "Veo 3.1": "veo-3.1-generate-preview",
};

// Models that accept an explicit `enable_audio` parameter. Sora 2 and Veo
// produce audio natively (always on), so they don't need a flag and aren't
// listed here. Other fal video endpoints don't support audio at all.
const AUDIO_PARAM_MODELS = new Set(["MiniMax Hailuo 2.3", "Wan 2.7"]);

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
  "Kling 3.0": {
    t2v: "fal-ai/kling-video/v3/pro/text-to-video",
    i2v: "fal-ai/kling-video/v3/pro/image-to-video",
  },
  "Kling 2.6": {
    t2v: "fal-ai/kling-video/v2.6/pro/text-to-video",
    i2v: "fal-ai/kling-video/v2.6/pro/image-to-video",
  },
  "Kling 2.5 Turbo": {
    t2v: "fal-ai/kling-video/v2.5-turbo/pro/text-to-video",
    i2v: "fal-ai/kling-video/v2.5-turbo/pro/image-to-video",
  },
  "Seedance 2.0": {
    t2v: "bytedance/seedance-2.0/text-to-video",
    i2v: "bytedance/seedance-2.0/image-to-video",
  },
  "Seedance 2.0 Fast": {
    t2v: "bytedance/seedance-2.0/fast/text-to-video",
    i2v: "bytedance/seedance-2.0/fast/image-to-video",
  },
  "Wan 2.7": {
    t2v: "fal-ai/wan/v2.7/text-to-video",
    i2v: "fal-ai/wan/v2.7/image-to-video",
  },
  "MiniMax Hailuo 2.3": {
    t2v: "fal-ai/minimax/hailuo-2.3/pro/text-to-video",
    i2v: "fal-ai/minimax/hailuo-2.3/pro/image-to-video",
  },
  "PixVerse v6": {
    t2v: "fal-ai/pixverse/v6/text-to-video",
    i2v: "fal-ai/pixverse/v6/image-to-video",
  },
  "Sora 2": {
    t2v: "fal-ai/sora-2/text-to-video",
    i2v: "fal-ai/sora-2/image-to-video",
  },
};

// Motion Control endpoints — character image + reference video → animated video.
// Every endpoint below takes the same { image_url, video_url, prompt? } shape,
// so they all flow through the single motion handler unchanged.
const FAL_MOTION_MODELS = {
  // Kling — transfer motion from a driving video onto a character image.
  "Kling 3.0 Motion Control": "fal-ai/kling-video/v3/pro/motion-control",
  "Kling 3.0 Motion Control Std": "fal-ai/kling-video/v3/standard/motion-control",
  "Kling Motion Control Pro": "fal-ai/kling-video/v2.6/pro/motion-control",
  "Kling Motion Control Std": "fal-ai/kling-video/v2.6/standard/motion-control",
  // Wan — pose-retargeted / expression-replicating character animation.
  "Wan Motion": "fal-ai/wan-motion",
  "Wan 2.2 Animate Move": "fal-ai/wan/v2.2-14b/animate/move",
  "Wan 2.2 Animate Replace": "fal-ai/wan/v2.2-14b/animate/replace",
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
  const { prompt, model, image, aspect, resolution, duration, motionVideo, kind, editVideo, editRefs, audio, userId } = await req.json();

  // --- Moderation gate 1: prompt screening (minors, deepfakes, prohibited categories) ---
  // Applies to every branch below (t2v/i2v, edit, motion) — the prompt is the
  // one signal common to all of them.
  const promptVerdict = await moderatePrompt(prompt);
  if (promptVerdict.verdict === "block") {
    await queueForReview({ userId, prompt, verdict: "block", reason: promptVerdict.reason, stage: "video/start" });
    return NextResponse.json({ error: "This request violates content policy." }, { status: 403 });
  }
  if (promptVerdict.verdict === "review") {
    await queueForReview({ userId, prompt, verdict: "review", reason: promptVerdict.reason, stage: "video/start" });
    return NextResponse.json({ error: "This request has been flagged for review." }, { status: 202 });
  }

  // --- Moderation gate 2: reference-image guard (real face + explicit request) ---
  // Covers every user-supplied visual reference this route accepts: the i2v
  // start image, the motion-control character image, and the edit source
  // video's first-frame stand-in (editRefs). editVideo itself (an existing
  // video being edited) isn't frame-checked here — see MODERATION.md gap.
  const explicit = isExplicitPrompt(prompt);
  if (explicit) {
    const candidates = [image, ...(Array.isArray(editRefs) ? editRefs : [])].filter(Boolean);
    for (const candidate of candidates) {
      const refVerdict = await checkReferenceImage(candidate, explicit);
      if (refVerdict.verdict === "block") {
        await queueForReview({ userId, prompt, verdict: "block", reason: refVerdict.reason, stage: "video/start" });
        return NextResponse.json(
          { error: "Explicit generation from a real-face reference image is not permitted." },
          { status: 403 }
        );
      }
    }
  }

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
    // fal rejects base64 data URIs for video_url — host it on Blob first.
    let editVideoUrl;
    try {
      editVideoUrl = await uploadDataUrl(editVideo, "edit-src");
    } catch (e) {
      return NextResponse.json({ error: `Could not host source video: ${e.message}` }, { status: 500 });
    }
    const input = { video_url: editVideoUrl, prompt: prompt.trim() };
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
    // fal rejects base64 data URIs for video_url (and validates image_url
    // strictly), so host both on Blob and pass real https URLs.
    let imageUrl, motionUrl;
    try {
      [imageUrl, motionUrl] = await Promise.all([
        uploadDataUrl(image, "motion-char"),
        uploadDataUrl(motionVideo, "motion-clip"),
      ]);
    } catch (e) {
      return NextResponse.json({ error: `Could not host motion inputs: ${e.message}` }, { status: 500 });
    }
    const input = {
      image_url: imageUrl,
      video_url: motionUrl,
    };
    if (prompt && prompt.trim()) input.prompt = prompt.trim();
    // Kling motion-control endpoints require character_orientation; "video"
    // matches the reference video's orientation (best for complex motion).
    // Wan endpoints don't accept this field, so only set it for Kling.
    if (endpoint.includes("kling-video")) input.character_orientation = "video";
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
    if (image) {
      // Host data-URI start images (e.g. an influencer photo) so i2v endpoints
      // that require real URLs accept them.
      try {
        input.image_url = await uploadDataUrl(image, "vid-start");
      } catch (e) {
        return NextResponse.json({ error: `Could not host start image: ${e.message}` }, { status: 500 });
      }
    }
    // Some fal endpoints default aspect_ratio to "auto", deriving the output
    // size from the input image and 422-ing on unsupported sizes. Pass an
    // explicit ratio (one of 16:9 / 9:16 / 1:1) for models that need it.
    if (fal.ar) {
      input.aspect_ratio = aspect === "9:16" || aspect === "1:1" ? aspect : "16:9";
    }
    // Audio: only set the param for models that accept it. Sora 2 + Veo produce
    // audio natively (no flag needed); the rest don't support it and will 422
    // on unknown fields, so leave the input untouched.
    if (typeof audio === "boolean" && AUDIO_PARAM_MODELS.has(model)) {
      input.enable_audio = audio;
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
