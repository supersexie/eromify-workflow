import { createMcpHandler } from "mcp-handler";
import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import { z } from "zod";
import { WIDGET_HTML } from "./widget-html.js";
import { addGeneration } from "@/lib/genstore";
import { getInfluencers } from "@/lib/influencerStore";

export const maxDuration = 60;

const UI_URI = "ui://eromify/media-v1.html";

const BASE = (
  process.env.EROMIFY_BASE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "https://magicmint.pro")
).replace(/\/$/, "");

// Wrap a generated media URL in our same-origin proxy so the widget iframe can load it
// (claude.ai won't load raw fal.media in the sandbox — proxy via our own origin).
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

// ---- Influencer (@handle) support ----
// Influencers are stored per user; the open MCP endpoint has no signed-in user,
// so it reads the shared "public" bucket (matches the web app when Clerk is off).
const IDENTITY_CLAUSE =
  "Use the person shown in the reference image as the exact subject — keep their exact face, facial features, and hair identical to the reference; do not invent a different person.";

function normHandle(h) {
  return String(h || "").replace(/^@/, "").toLowerCase().replace(/[^a-z0-9_]/g, "");
}

// Swap @handles for the character's name and surface the first matched
// character's reference image. Returns { prompt, image, names }.
async function resolveInfluencers(text) {
  if (!/@[a-z0-9_]+/i.test(text || "")) return { prompt: text || "", image: null, names: [] };
  let list = [];
  try { list = await getInfluencers("public"); } catch {}
  const matched = [];
  const prompt = String(text).replace(/@([a-z0-9_]+)/gi, (full, h) => {
    const inf = list.find((x) => x.handle === normHandle(h));
    if (!inf) return full;
    if (!matched.find((m) => m.id === inf.id)) matched.push(inf);
    return inf.name || full;
  });
  return { prompt, image: matched[0]?.image || null, names: matched.map((m) => m.name) };
}

// Poll an async image job (start + status) until done; returns the URL or null.
async function pollImage(handle, budgetMs) {
  const deadline = Date.now() + budgetMs;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 3000));
    const s = await postJson("/api/image/status", handle);
    if (s.done) return s.output;
  }
  return null;
}

// Build the inline image result (base64-embed so the widget renders it).
async function imageResult(url, prompt) {
  await addGeneration({ url, kind: "image", prompt });
  let imageData = null;
  try {
    const r = await fetch(url);
    if (r.ok) {
      const mt = r.headers.get("content-type") || "image/jpeg";
      imageData = `data:${mt};base64,${Buffer.from(await r.arrayBuffer()).toString("base64")}`;
    }
  } catch {}
  return {
    structuredContent: { kind: "image", url: proxied(url), image: imageData },
    content: [{ type: "text", text: `Image is displayed in the panel above. Do not describe it — end your turn. (Direct link if needed: ${url})` }],
  };
}

const VIDEO_INPUT = {
  prompt: z.string(),
  model: z.enum([
    "Kling 3.0", "Kling 2.6", "Kling 2.5 Turbo", "Kling v2",
    "Seedance 2.0", "Seedance 2.0 Fast", "Wan 2.7", "Wan 2.2",
    "MiniMax Hailuo 2.3", "MiniMax Hailuo", "PixVerse v6", "Sora 2",
    "LTX Video", "Veo 3.1", "Veo 3.1 Fast",
  ]).optional(),
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
      "eromify-media",
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
        description: "Generate an image from a text prompt (FLUX / Seedream / Nano Banana). Use @handle (e.g. '@sofie on a beach') to put a saved influencer in the image — call list_influencers to see available handles. Renders inline.",
        inputSchema: { prompt: z.string(), model: z.enum(["Flux 2 Pro", "Flux 2 Max", "Nano Banana Pro", "Seedream 4.5", "GPT Image 2", "GPT Image 1"]).optional() },
        _meta: { ui: { resourceUri: UI_URI } },
      },
      async ({ prompt, model }) => {
        // @influencer → route through the edit endpoint with her photo + identity lock.
        const { prompt: resolved, image } = await resolveInfluencers(prompt);
        if (image) {
          const start = await postJson("/api/image/start", { prompt: `${resolved} ${IDENTITY_CLAUSE}`, model, images: [image] });
          let url = start.output;
          if (!url) url = await pollImage({ statusUrl: start.statusUrl, responseUrl: start.responseUrl }, 55 * 1000);
          if (url) return imageResult(url, prompt);
          return { content: [{ type: "text", text: "Image is still rendering — try again in a moment." }] };
        }
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

    server.tool(
      "list_influencers",
      "List the user's saved influencers (AI characters). Use the returned @handle in generate_image or generate_video to feature that character with her exact likeness.",
      {},
      async () => {
        let list = [];
        try { list = await getInfluencers("public"); } catch {}
        if (!list.length) return { content: [{ type: "text", text: "No influencers saved yet. Create one in the Magic Mint app's Influencers tab, then reference it with @handle." }] };
        const lines = list.map((i) => `@${i.handle} — ${i.name}${i.description ? ` (${i.description})` : ""}`).join("\n");
        return { content: [{ type: "text", text: `Saved influencers:\n${lines}\n\nUse e.g. "generate an image of @${list[0].handle} on a beach".` }] };
      }
    );

    // ---- Video (app tools → render inline in widget) ----
    registerAppTool(
      server,
      "generate_video",
      {
        title: "Generate video",
        description: "Generate a video from text (and optionally a source image for image-to-video). Use @handle to feature a saved influencer (her photo becomes the start frame). LTX is fastest/cheapest. If it takes too long, call check_video with the handle. Renders inline.",
        inputSchema: VIDEO_INPUT,
        _meta: { ui: { resourceUri: UI_URI } },
      },
      async ({ prompt, model, image_url, aspect, resolution, duration }) => {
        // @influencer → use her photo as the start frame + identity lock.
        const { prompt: resolved, image } = await resolveInfluencers(prompt);
        const startImage = image_url || image || undefined;
        const finalPrompt = image ? `${resolved} ${IDENTITY_CLAUSE}` : resolved;
        const start = await postJson("/api/video/start", { prompt: finalPrompt, model: model || "LTX Video", image: startImage, aspect, resolution, duration });
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

// NOTE: no auth gate here on purpose. Claude.ai treats a 401 from an MCP
// connector as "needs OAuth" and tries dynamic client registration, which we
// don't implement — that produced the "couldn't register with sign-in service"
// error. Keeping the endpoint open lets Claude connect with no auth flow.
// Real auth (OAuth or per-user keys) will be added before public launch.
export { handler as GET, handler as POST, handler as DELETE };
