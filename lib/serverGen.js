// Fire-and-forget: record a finished generation in the server-side index
// (Vercel Blob generations.json) so it shows in the Library across origins,
// devices, and browsers — not just on whoever's localStorage. Best-effort:
// never throws, never blocks the UI.
export function recordServerGen({ url, kind, prompt }) {
  if (!url || typeof url !== "string") return;
  try {
    fetch("/api/generations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, kind: kind || "image", prompt: prompt || "" }),
      keepalive: true,
    }).catch(() => {});
  } catch {}
}
