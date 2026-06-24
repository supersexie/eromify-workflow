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
