import { createMcpHandler } from "mcp-handler";
import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import { z } from "zod";
import { WIDGET_HTML } from "./widget-html.js";
import { addGeneration } from "@/lib/genstore";

export const maxDuration = 60;

const UI_URI = "ui://eromify/media-v1.html";

const BASE = (
  process.env.EROMIFY_BASE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "https://eromify.pro")
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

// NOTE: no auth gate here on purpose. Claude.ai treats a 401 from an MCP
// connector as "needs OAuth" and tries dynamic client registration, which we
// don't implement — that produced the "couldn't register with sign-in service"
// error. Keeping the endpoint open lets Claude connect with no auth flow.
// Real auth (OAuth or per-user keys) will be added before public launch.
export { handler as GET, handler as POST, handler as DELETE };
