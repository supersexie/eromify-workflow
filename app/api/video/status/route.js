import { NextResponse } from "next/server";
import { classifyOutput, queueForReview } from "@/lib/moderation";

export const runtime = "nodejs";
export const maxDuration = 30;

const GEMINI = process.env.GEMINI_API_KEY;
const FAL = process.env.FAL_KEY || process.env.FAL_API_KEY;

// Video output classification gap: Hive's classifier here analyzes the URL
// as an image request, which — depending on Hive's own handling — may only
// look at a single frame/thumbnail rather than the full video. This is a
// known limitation, not a full video-moderation solution; see MODERATION.md.
// It's still applied because it's better than no post-generation check at
// all, particularly for i2v/motion-control jobs (see video/start's
// reference-image guard for the main pre-generation defense).
async function checkVideoOutput(url, userId) {
  const verdict = await classifyOutput(url);
  if (verdict.verdict === "block") {
    await queueForReview({ userId, verdict: "block", reason: "output_classifier_block", scores: verdict.scores, mediaRef: url, stage: "video/status" });
    return NextResponse.json({ error: "Generated content violates policy and was not returned." }, { status: 403 });
  }
  if (verdict.verdict === "review") {
    await queueForReview({ userId, verdict: "review", reason: "output_classifier_review", scores: verdict.scores, mediaRef: url, stage: "video/status" });
    return NextResponse.json({ error: "Generated content has been flagged for review." }, { status: 202 });
  }
  return null;
}

export async function POST(req) {
  const body = await req.json();
  const { provider, userId } = body;

  // ---- fal.ai ----
  if (provider === "fal") {
    if (!FAL) return NextResponse.json({ done: true, output: "Generated video (mock — no FAL_KEY)" });
    const { statusUrl, responseUrl } = body;
    try {
      const st = await fetch(statusUrl, { headers: { Authorization: `Key ${FAL}` } });
      if (!st.ok) throw new Error(`fal status ${st.status}: ${(await st.text()).slice(0, 200)}`);
      const s = await st.json();
      // IN_QUEUE / IN_PROGRESS → keep polling. Any other non-COMPLETED state is
      // a terminal failure (ERROR/FAILED) and must surface, not silently time out.
      if (s.status === "IN_QUEUE" || s.status === "IN_PROGRESS") {
        return NextResponse.json({ done: false });
      }
      if (s.status && s.status !== "COMPLETED") {
        throw new Error(`fal ${s.status}: ${(s.error || JSON.stringify(s).slice(0, 200))}`);
      }
      const r = await fetch(responseUrl, { headers: { Authorization: `Key ${FAL}` } });
      if (!r.ok) throw new Error(`fal result ${r.status}: ${(await r.text()).slice(0, 400)}`);
      const result = await r.json();
      const url = result.video?.url || result.videos?.[0]?.url;
      if (!url) throw new Error("No video URL in fal result");
      const blocked = await checkVideoOutput(url, userId);
      if (blocked) return blocked;
      return NextResponse.json({ done: true, output: url });
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  // ---- Google Veo ----
  if (!GEMINI) return NextResponse.json({ done: true, output: "Generated video (mock — no GEMINI_API_KEY)" });
  const { operation } = body;
  if (!operation) return NextResponse.json({ error: "Missing operation name" }, { status: 400 });
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/${operation}`, {
      headers: { "x-goog-api-key": GEMINI },
    });
    if (!res.ok) throw new Error(`Veo poll ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const data = await res.json();
    if (!data.done) return NextResponse.json({ done: false });
    if (data.error) throw new Error(data.error.message || "Veo generation failed");
    const uri =
      data.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri ||
      data.response?.generatedVideos?.[0]?.video?.uri;
    if (!uri) throw new Error("No video URI in completed operation");
    // Veo's URI needs our own proxy auth to fetch — classify via that proxied
    // path so Hive can actually retrieve the bytes.
    const proxied = `/api/video/file?uri=${encodeURIComponent(uri)}`;
    const absoluteUrl = new URL(proxied, req.url).toString();
    const blocked = await checkVideoOutput(absoluteUrl, userId);
    if (blocked) return blocked;
    return NextResponse.json({ done: true, output: proxied });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
