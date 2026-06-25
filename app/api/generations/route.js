import { getGenerations, addGeneration, configured } from "@/lib/genstore";

export const dynamic = "force-dynamic";

export async function GET() {
  const items = await getGenerations();
  return Response.json({ items, configured: configured() });
}

// Record a finished generation in the server index so the Image/Video pages
// can show it on any origin/device. Best-effort — never blocks the client.
export async function POST(req) {
  try {
    const { url, kind, prompt } = await req.json();
    if (!url || typeof url !== "string") return Response.json({ ok: false }, { status: 400 });
    await addGeneration({ url, kind: kind || "image", prompt: prompt || "" });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
