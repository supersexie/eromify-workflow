import { NextResponse } from "next/server";
import { classifyOutput, queueForReview } from "@/lib/moderation";

export const runtime = "nodejs";
export const maxDuration = 30;

const FAL = process.env.FAL_KEY || process.env.FAL_API_KEY;

export async function POST(req) {
  const { statusUrl, responseUrl, userId } = await req.json();
  if (!FAL || !statusUrl) return NextResponse.json({ error: "Missing fal handle" }, { status: 400 });
  try {
    const st = await fetch(statusUrl, { headers: { Authorization: `Key ${FAL}` } });
    if (!st.ok) throw new Error(`fal status ${st.status}: ${(await st.text()).slice(0, 200)}`);
    const s = await st.json();
    // Only IN_QUEUE / IN_PROGRESS mean "keep polling". Anything else terminal
    // and non-COMPLETED (ERROR/FAILED, e.g. an OpenAI moderation refusal) must
    // surface as an error — otherwise we poll until the deadline and the user
    // sees a misleading "timed out".
    if (s.status === "IN_QUEUE" || s.status === "IN_PROGRESS") {
      return NextResponse.json({ done: false });
    }
    if (s.status && s.status !== "COMPLETED") {
      throw new Error(`fal ${s.status}: ${(s.error || JSON.stringify(s).slice(0, 200))}`);
    }
    const r = await fetch(responseUrl, { headers: { Authorization: `Key ${FAL}` } });
    if (!r.ok) throw new Error(`fal result ${r.status}: ${(await r.text()).slice(0, 300)}`);
    const result = await r.json();
    const url = result.images?.[0]?.url || result.image?.url;
    if (!url) throw new Error(`No image URL in fal result: ${JSON.stringify(result).slice(0, 200)}`);

    // --- Moderation gate 3: classify the output before it's ever returned ---
    const outputVerdict = await classifyOutput(url);
    if (outputVerdict.verdict === "block") {
      await queueForReview({ userId, verdict: "block", reason: "output_classifier_block", scores: outputVerdict.scores, mediaRef: url, stage: "image/status" });
      return NextResponse.json({ error: "Generated content violates policy and was not returned." }, { status: 403 });
    }
    if (outputVerdict.verdict === "review") {
      await queueForReview({ userId, verdict: "review", reason: "output_classifier_review", scores: outputVerdict.scores, mediaRef: url, stage: "image/status" });
      return NextResponse.json({ error: "Generated content has been flagged for review." }, { status: 202 });
    }

    return NextResponse.json({ done: true, output: url });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
