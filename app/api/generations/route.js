import { getGenerations, configured } from "@/lib/genstore";

export const dynamic = "force-dynamic";

export async function GET() {
  const items = await getGenerations();
  return Response.json({ items, configured: configured() });
}

// Web UI no longer writes here (localStorage is enough and Blob Advanced ops
// were burning the free tier). MCP still calls addGeneration() directly.
export async function POST() {
  return Response.json({ ok: true, skipped: true });
}
