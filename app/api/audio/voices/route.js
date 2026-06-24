// Lists ElevenLabs voices (stock library + user's cloned voices).
// Returns: { voices: [{ value, label, category }] }
//   - value: ElevenLabs voice_id (what we send when generating)
//   - label: display name (what the dropdown shows)
//   - category: "premade" | "cloned" | "professional" | ...
//
// Falls back to a small static OpenAI-TTS voice list if no ElevenLabs key.

export const runtime = "nodejs";

const ELEVEN = process.env.ELEVENLABS_API_KEY;

const OPENAI_VOICES = [
  { value: "alloy",   label: "Alloy (OpenAI)",   category: "openai" },
  { value: "echo",    label: "Echo (OpenAI)",    category: "openai" },
  { value: "fable",   label: "Fable (OpenAI)",   category: "openai" },
  { value: "onyx",    label: "Onyx (OpenAI)",    category: "openai" },
  { value: "nova",    label: "Nova (OpenAI)",    category: "openai" },
  { value: "shimmer", label: "Shimmer (OpenAI)", category: "openai" },
];

export async function GET() {
  if (!ELEVEN) return Response.json({ voices: OPENAI_VOICES, provider: "openai" });
  try {
    const r = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: { "xi-api-key": ELEVEN },
      cache: "no-store",
    });
    if (!r.ok) throw new Error(`ElevenLabs ${r.status}: ${(await r.text()).slice(0, 200)}`);
    const data = await r.json();
    const voices = (data.voices || []).map((v) => ({
      value: v.voice_id,
      label: v.name,
      category: v.category || "premade",
    }));
    // Cloned/professional first (the user's own voices), then premade.
    voices.sort((a, b) => {
      const rank = (c) => (c === "cloned" || c === "professional") ? 0 : 1;
      return rank(a.category) - rank(b.category);
    });
    return Response.json({ voices, provider: "elevenlabs" });
  } catch (e) {
    return Response.json({ voices: OPENAI_VOICES, provider: "openai", warning: e.message });
  }
}
