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
