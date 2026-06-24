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
