export async function generateOutput(kind, prompt, model, images, opts = {}) {
  // Images go through the async fal queue (start + poll) so slow edit models
  // aren't bound by the 60s serverless cap. Text/audio stay synchronous.
  if (kind === "image") return generateImage({ prompt, model, images, aspect: opts.aspect, quality: opts.quality });

  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, prompt, model, images, voice: opts.voice }),
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { msg = (await res.json()).error || msg; } catch {}
    throw new Error(msg);
  }
  const { output } = await res.json();
  return output;
}

// Stitch multiple clip URLs into one video via the combine endpoint (start + poll).
export async function combineVideos(urls, durations, onProgress) {
  const startRes = await fetch("/api/video/combine/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ urls, durations }),
  });
  const start = await startRes.json();
  if (!startRes.ok) throw new Error(start.error || `HTTP ${startRes.status}`);

  const handle = { statusUrl: start.statusUrl, responseUrl: start.responseUrl };
  const deadline = Date.now() + 4 * 60 * 1000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 4000));
    onProgress?.();
    const sRes = await fetch("/api/video/combine/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(handle),
    });
    const s = await sRes.json();
    if (!sRes.ok) throw new Error(s.error || `HTTP ${sRes.status}`);
    if (s.done) return s.output;
  }
  throw new Error("Combine timed out (over 4 min)");
}

// Parse a Response defensively — if the body isn't JSON (e.g. Vercel returns its
// own HTML/text error page when a function times out), surface a clean message
// instead of crashing the run with "Unexpected token in JSON".
async function safeJson(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    // Vercel timeouts return text like "An error occurred during this request".
    const snippet = text.replace(/\s+/g, " ").slice(0, 160).trim();
    const hint = /error occurred|timed out|timeout|FUNCTION_INVOCATION_TIMEOUT/i.test(text)
      ? "Server timed out (Vercel function exceeded its time limit). Try a cheaper/faster model."
      : null;
    throw new Error(hint || `HTTP ${res.status}: ${snippet || "no body"}`);
  }
}

async function generateImage({ prompt, model, images, aspect, quality }) {
  const startRes = await fetch("/api/image/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, model, images, aspect, quality }),
  });
  const start = await safeJson(startRes);
  if (!startRes.ok) throw new Error(start.error || `HTTP ${startRes.status}`);
  if (start.output) return start.output; // synchronous fallback (OpenAI/mock)

  const handle = { statusUrl: start.statusUrl, responseUrl: start.responseUrl };
  const deadline = Date.now() + 5 * 60 * 1000; // 5 min cap (edits run longer)
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 3000));
    const sRes = await fetch("/api/image/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(handle),
    });
    const s = await safeJson(sRes);
    if (!sRes.ok) throw new Error(s.error || `HTTP ${sRes.status}`);
    if (s.done) return s.output;
  }
  throw new Error("Image generation timed out (over 5 min)");
}

// Video Edit (video-to-video): source video + prompt + optional reference images.
// Same start+poll pattern; routes to fal's Kling video-edit endpoint(s) based on
// the picked model.
export async function generateVideoEdit({ prompt, model, video, refs, quality }, onProgress) {
  const startRes = await fetch("/api/video/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      kind: "edit",
      prompt,
      model,
      editVideo: video,
      editRefs: refs || [],
      quality,
    }),
  });
  const start = await safeJson(startRes);
  if (!startRes.ok) throw new Error(start.error || `HTTP ${startRes.status}`);
  if (start.mock) return start.output;

  const handle = start;
  // Kling video edits can run well past 5 min — give it 15.
  const deadline = Date.now() + 15 * 60 * 1000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 6000));
    onProgress?.();
    const sRes = await fetch("/api/video/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(handle),
    });
    const s = await safeJson(sRes);
    if (!sRes.ok) throw new Error(s.error || `HTTP ${sRes.status}`);
    if (s.done) return s.output;
  }
  throw new Error("Video edit timed out (over 15 min)");
}

// Motion Control: image + reference video → animated video. Reuses the same
// async start+poll flow as regular video, but the start endpoint receives an
// extra `motionVideo` URL and routes to fal's Kling Motion Control endpoint.
export async function generateMotion({ prompt, model, image, video }, onProgress) {
  const startRes = await fetch("/api/video/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, model, image, motionVideo: video, kind: "motion" }),
  });
  const start = await safeJson(startRes);
  if (!startRes.ok) throw new Error(start.error || `HTTP ${startRes.status}`);
  if (start.mock) return start.output;

  const handle = start;
  // Kling motion control can take well over 5 min on longer clips — give it 15.
  const deadline = Date.now() + 15 * 60 * 1000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 6000));
    onProgress?.();
    const sRes = await fetch("/api/video/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(handle),
    });
    const s = await safeJson(sRes);
    if (!sRes.ok) throw new Error(s.error || `HTTP ${sRes.status}`);
    if (s.done) return s.output;
  }
  throw new Error("Motion control timed out (over 15 min)");
}

// Video uses an async long-running operation (Veo). Start, then poll until done.
export async function generateVideo({ prompt, model, image, aspect, resolution, duration }, onProgress) {
  const startRes = await fetch("/api/video/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, model, image, aspect, resolution, duration }),
  });
  const start = await startRes.json();
  if (!startRes.ok) throw new Error(start.error || `HTTP ${startRes.status}`);
  if (start.mock) return start.output;

  // Forward the provider-specific handle (veo: {operation}, fal: {endpoint,requestId}) to status.
  const handle = start;
  const deadline = Date.now() + 5 * 60 * 1000; // 5 min cap
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 6000));
    onProgress?.();
    const sRes = await fetch("/api/video/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(handle),
    });
    const s = await sRes.json();
    if (!sRes.ok) throw new Error(s.error || `HTTP ${sRes.status}`);
    if (s.done) return s.output;
  }
  throw new Error("Video generation timed out (over 5 min)");
}

// Upscale: image or video → higher-resolution version via fal. Start + poll,
// same async queue pattern. `kind` is "image" | "video"; `media` is a data URI.
export async function upscaleMedia({ kind, model, media, scale }, onProgress) {
  const startRes = await fetch("/api/upscale/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, model, media, scale }),
  });
  const start = await safeJson(startRes);
  if (!startRes.ok) throw new Error(start.error || `HTTP ${startRes.status}`);
  if (start.mock || start.output) return start.output;

  const handle = { statusUrl: start.statusUrl, responseUrl: start.responseUrl };
  // Video upscales (esp. Topaz) can run several minutes; give it 15.
  const deadline = Date.now() + 15 * 60 * 1000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, kind === "video" ? 6000 : 3000));
    onProgress?.();
    const sRes = await fetch("/api/upscale/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(handle),
    });
    const s = await safeJson(sRes);
    if (!sRes.ok) throw new Error(s.error || `HTTP ${sRes.status}`);
    if (s.done) return s.output;
  }
  throw new Error("Upscale timed out (over 15 min)");
}
