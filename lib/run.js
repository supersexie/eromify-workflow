export async function generateOutput(kind, prompt, model, images, opts = {}) {
  // Images go through the async fal queue (start + poll) so slow edit models
  // aren't bound by the 60s serverless cap. Text/audio stay synchronous.
  if (kind === "image") return generateImage({ prompt, model, images });

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

async function generateImage({ prompt, model, images }) {
  const startRes = await fetch("/api/image/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, model, images }),
  });
  const start = await startRes.json();
  if (!startRes.ok) throw new Error(start.error || `HTTP ${startRes.status}`);
  if (start.output) return start.output; // synchronous fallback (OpenAI/mock)

  const handle = { statusUrl: start.statusUrl, responseUrl: start.responseUrl };
  const deadline = Date.now() + 3 * 60 * 1000; // 3 min cap
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 3000));
    const sRes = await fetch("/api/image/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(handle),
    });
    const s = await sRes.json();
    if (!sRes.ok) throw new Error(s.error || `HTTP ${sRes.status}`);
    if (s.done) return s.output;
  }
  throw new Error("Image generation timed out (over 3 min)");
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
