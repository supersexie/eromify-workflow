"use client";
import { useCallback, useState } from "react";
import { normHandle, saveInfluencerRemote } from "@/lib/influencers";

// Same realism guide the Enhance endpoint uses — keeps builder output looking
// like a real photo instead of the glossy over-smoothed "AI slop" look.
const HOUSE_STYLE = "hyper-realistic UGC-style photo shot on a modern phone, natural skin texture with realistic pores and subtle imperfections, soft natural lighting, shallow depth of field, candid and photogenic, authentic not over-produced, no plastic skin, no over-smoothing, no airbrushing, no cartoon, no illustration, no 3D render";

// Curated "vibes" carry the creative direction so a beginner never has to
// write a prompt themselves — each one is a hand-tuned descriptor block.
const VIBES = [
  { id: "glam", label: "Glam Baddie", emoji: "💋", blurb: "Glossy makeup, sultry confidence", prompt: "glamorous instagram-baddie makeup with defined contour, glossy lips, sharp eyeliner, confident sultry expression, form-fitting fashionable outfit, moody upscale setting" },
  { id: "girl-next-door", label: "Girl Next Door", emoji: "🌼", blurb: "Fresh, natural, warm smile", prompt: "fresh natural makeup, warm genuine smile, casual cozy outfit like an oversized sweater or sundress, soft daylight, cozy home or cafe setting" },
  { id: "fitness", label: "Fitness Icon", emoji: "💪", blurb: "Athletic, toned, gym-ready", prompt: "toned athletic physique, form-fitting activewear or gym set, confident energetic pose, gym or outdoor fitness setting, healthy glow" },
  { id: "luxury", label: "Luxury Elegant", emoji: "💎", blurb: "Editorial, designer, refined", prompt: "elegant refined makeup, designer fashion outfit, poised editorial pose, upscale luxury setting like a penthouse or fine hotel lobby" },
  { id: "street", label: "Streetwear Cool", emoji: "🖤", blurb: "Urban, edgy, effortless", prompt: "edgy streetwear outfit, urban city backdrop, confident effortless pose, natural makeup with a cool undertone, graffiti or city street setting" },
  { id: "boho", label: "Boho Free Spirit", emoji: "🌿", blurb: "Beachy, natural light, flowy", prompt: "boho flowy fashion, sun-kissed natural makeup, beach or golden-hour outdoor setting, relaxed carefree pose" },
  { id: "kbeauty", label: "K-Beauty Glow", emoji: "✨", blurb: "Glass skin, soft glam", prompt: "korean-beauty inspired soft glam makeup, dewy glass skin, cute pastel or minimalist outfit, clean bright studio or cafe setting" },
  { id: "business", label: "Business Chic", emoji: "💼", blurb: "Polished, confident, professional", prompt: "polished professional makeup, tailored blazer or business-chic outfit, confident composed expression, modern office or city skyline setting" },
];

const ETHNICITIES = [
  { id: "any", label: "Any", adj: "" },
  { id: "caucasian", label: "Caucasian", adj: "caucasian" },
  { id: "latina", label: "Latina", adj: "latina" },
  { id: "black", label: "Black", adj: "black" },
  { id: "eastasian", label: "East Asian", adj: "east asian" },
  { id: "southasian", label: "South Asian", adj: "south asian" },
  { id: "middleeastern", label: "Middle Eastern", adj: "middle eastern" },
  { id: "mixed", label: "Mixed", adj: "mixed-race" },
];

const AGES = [
  { id: "early20s", label: "18–22", f: "in her early twenties", m: "in his early twenties" },
  { id: "mid20s", label: "23–27", f: "in her mid-twenties", m: "in his mid-twenties" },
  { id: "early30s", label: "28–34", f: "in her early thirties", m: "in his early thirties" },
];

const HAIR_COLORS = ["Black", "Brunette", "Blonde", "Auburn", "Platinum", "Pastel Pink"];
const HAIR_STYLES = ["Long Waves", "Sleek Straight", "Curly", "Short Bob", "High Ponytail"];
const EYE_COLORS = ["Brown", "Blue", "Green", "Hazel", "Grey"];
const BODY_TYPES = [
  { id: "slim", label: "Slim", desc: "slim build" },
  { id: "athletic", label: "Athletic", desc: "athletic toned build" },
  { id: "curvy", label: "Curvy", desc: "curvy figure" },
  { id: "average", label: "Average", desc: "average build" },
];

const BLANK_PICKS = {
  gender: "female",
  vibe: "glam",
  ethnicity: "any",
  age: "mid20s",
  hairColor: "Brunette",
  hairStyle: "Long Waves",
  eyeColor: "Brown",
  body: "athletic",
};

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function pollUntilDone(job) {
  const deadline = Date.now() + 5 * 60 * 1000;
  while (Date.now() < deadline) {
    await sleep(3000);
    const res = await fetch("/api/image/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statusUrl: job.statusUrl, responseUrl: job.responseUrl }),
    });
    const s = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    if (!res.ok) throw new Error(s.error || `HTTP ${res.status}`);
    if (s.done) return s.output;
  }
  throw new Error("Generation timed out");
}

async function generateOne(prompt) {
  const startRes = await fetch("/api/image/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, model: "Nano Banana Pro", aspect: "4:5", quality: "1K" }),
  });
  const start = await startRes.json().catch(() => ({ error: `HTTP ${startRes.status}` }));
  if (!startRes.ok) throw new Error(start.error || `HTTP ${startRes.status}`);
  if (start.output) return start.output;
  return pollUntilDone(start);
}

const STEP_TITLES = ["Pick a vibe", "Fine-tune the look", "Choose your favorite", "Name & save"];

export default function InfluencerBuilder({ onClose, onCreated }) {
  const [step, setStep] = useState(1);
  const [picks, setPicks] = useState(BLANK_PICKS);
  const [slots, setSlots] = useState([]); // [{status:'pending'|'done'|'error', url, error}]
  const [selectedUrl, setSelectedUrl] = useState(null);
  const [handle, setHandle] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setPicks((p) => ({ ...p, [k]: v }));

  const composePrompt = useCallback(() => {
    const vibe = VIBES.find((v) => v.id === picks.vibe) || VIBES[0];
    const eth = ETHNICITIES.find((e) => e.id === picks.ethnicity) || ETHNICITIES[0];
    const age = AGES.find((a) => a.id === picks.age) || AGES[1];
    const body = BODY_TYPES.find((b) => b.id === picks.body) || BODY_TYPES[1];
    const genderNoun = picks.gender === "male" ? "man" : "woman";
    const ageDesc = picks.gender === "male" ? age.m : age.f;
    const ethPart = eth.adj ? `${eth.adj} ` : "";
    return `Photorealistic portrait of a ${ethPart}${genderNoun} ${ageDesc}, with ${picks.hairColor.toLowerCase()} ${picks.hairStyle.toLowerCase()} hair and ${picks.eyeColor.toLowerCase()} eyes, ${body.desc}. ${vibe.prompt}. ${HOUSE_STYLE}. Fully original, fictional face — not resembling any real person.`;
  }, [picks]);

  const runBatch = useCallback(() => {
    const prompt = composePrompt();
    const initial = Array.from({ length: 4 }, () => ({ status: "pending" }));
    setSlots(initial);
    setSelectedUrl(null);
    initial.forEach((_, i) => {
      generateOne(prompt)
        .then((url) => setSlots((s) => s.map((sl, j) => (j === i ? { status: "done", url } : sl))))
        .catch((e) => setSlots((s) => s.map((sl, j) => (j === i ? { status: "error", error: e.message } : sl))));
    });
  }, [composePrompt]);

  const goGenerate = () => { setStep(3); runBatch(); };
  const regenerate = () => runBatch();

  const canContinueFromPick = !!selectedUrl;
  const canSave = selectedUrl && normHandle(handle) && !saving;

  const onSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const h = normHandle(handle);
      const id = `inf_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const vibe = VIBES.find((v) => v.id === picks.vibe);
      const body = BODY_TYPES.find((b) => b.id === picks.body);
      const desc = [vibe?.label, body?.label].filter(Boolean).join(" · ");
      const saved = await saveInfluencerRemote({ id, handle: h, name: h, description: desc, image: selectedUrl, ts: Date.now() });
      onCreated?.(saved);
    } finally {
      setSaving(false);
    }
  };

  const pendingCount = slots.filter((s) => s.status === "pending").length;
  const anyDone = slots.some((s) => s.status === "done");

  return (
    <div className="nw-backdrop bld-backdrop" onClick={onClose}>
      <div className="bld-modal" onClick={(e) => e.stopPropagation()}>
        <div className="bld-head">
          <div>
            <div className="bld-step-label">Step {step} of 4</div>
            <h3 className="nw-title" style={{ margin: 0 }}>{STEP_TITLES[step - 1]}</h3>
          </div>
          <button className="bld-close" onClick={onClose} title="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="bld-steps-track">
          {[1, 2, 3, 4].map((n) => <div key={n} className={`bld-steps-dot ${n <= step ? "is-active" : ""}`} />)}
        </div>

        {/* ── STEP 1: gender + vibe ── */}
        {step === 1 && (
          <div className="bld-body">
            <p className="nw-sub">No prompt-writing needed — pick a curated look and we handle the rest.</p>
            <div className="bld-seg">
              <button className={picks.gender === "female" ? "is-active" : ""} onClick={() => set("gender", "female")}>Female</button>
              <button className={picks.gender === "male" ? "is-active" : ""} onClick={() => set("gender", "male")}>Male</button>
            </div>
            <div className="bld-vibe-grid">
              {VIBES.map((v) => (
                <button key={v.id} className={`bld-vibe-card ${picks.vibe === v.id ? "is-active" : ""}`} onClick={() => set("vibe", v.id)}>
                  <span className="bld-vibe-emoji">{v.emoji}</span>
                  <span className="bld-vibe-label">{v.label}</span>
                  <span className="bld-vibe-blurb">{v.blurb}</span>
                </button>
              ))}
            </div>
            <div className="nw-actions">
              <button className="nw-cancel" onClick={onClose}>Cancel</button>
              <button className="primary-btn" onClick={() => setStep(2)}>Next</button>
            </div>
          </div>
        )}

        {/* ── STEP 2: details ── */}
        {step === 2 && (
          <div className="bld-body">
            <p className="nw-sub">Dial in the specifics — every option below is optional to change.</p>

            <div className="bld-field">
              <div className="bld-field-label">Ethnicity</div>
              <div className="bld-chip-row">
                {ETHNICITIES.map((e) => (
                  <button key={e.id} className={`bld-chip ${picks.ethnicity === e.id ? "is-active" : ""}`} onClick={() => set("ethnicity", e.id)}>{e.label}</button>
                ))}
              </div>
            </div>

            <div className="bld-field">
              <div className="bld-field-label">Age range</div>
              <div className="bld-chip-row">
                {AGES.map((a) => (
                  <button key={a.id} className={`bld-chip ${picks.age === a.id ? "is-active" : ""}`} onClick={() => set("age", a.id)}>{a.label}</button>
                ))}
              </div>
            </div>

            <div className="bld-field">
              <div className="bld-field-label">Hair color</div>
              <div className="bld-chip-row">
                {HAIR_COLORS.map((c) => (
                  <button key={c} className={`bld-chip ${picks.hairColor === c ? "is-active" : ""}`} onClick={() => set("hairColor", c)}>{c}</button>
                ))}
              </div>
            </div>

            <div className="bld-field">
              <div className="bld-field-label">Hair style</div>
              <div className="bld-chip-row">
                {HAIR_STYLES.map((c) => (
                  <button key={c} className={`bld-chip ${picks.hairStyle === c ? "is-active" : ""}`} onClick={() => set("hairStyle", c)}>{c}</button>
                ))}
              </div>
            </div>

            <div className="bld-field">
              <div className="bld-field-label">Eye color</div>
              <div className="bld-chip-row">
                {EYE_COLORS.map((c) => (
                  <button key={c} className={`bld-chip ${picks.eyeColor === c ? "is-active" : ""}`} onClick={() => set("eyeColor", c)}>{c}</button>
                ))}
              </div>
            </div>

            <div className="bld-field">
              <div className="bld-field-label">Body type</div>
              <div className="bld-chip-row">
                {BODY_TYPES.map((b) => (
                  <button key={b.id} className={`bld-chip ${picks.body === b.id ? "is-active" : ""}`} onClick={() => set("body", b.id)}>{b.label}</button>
                ))}
              </div>
            </div>

            <div className="nw-actions">
              <button className="nw-cancel" onClick={() => setStep(1)}>Back</button>
              <button className="primary-btn" onClick={goGenerate}>Generate 4 looks</button>
            </div>
          </div>
        )}

        {/* ── STEP 3: pick a generation ── */}
        {step === 3 && (
          <div className="bld-body">
            <p className="nw-sub">
              {pendingCount > 0 ? `Generating your influencer… ${4 - pendingCount}/4 done` : "Tap your favorite to continue."}
            </p>
            <div className="bld-gen-grid">
              {slots.map((s, i) => (
                <button
                  key={i}
                  className={`bld-gen-card ${selectedUrl === s.url ? "is-selected" : ""}`}
                  disabled={s.status !== "done"}
                  onClick={() => setSelectedUrl(s.url)}
                >
                  {s.status === "pending" && <span className="inf-spinner" />}
                  {s.status === "error" && <span className="bld-gen-error">Failed</span>}
                  {s.status === "done" && (
                    <>
                      <img src={s.url} alt={`Option ${i + 1}`} />
                      {selectedUrl === s.url && <span className="bld-gen-check">✓</span>}
                    </>
                  )}
                </button>
              ))}
            </div>
            <div className="nw-actions">
              <button className="nw-cancel" onClick={() => setStep(2)}>Back</button>
              <button className="nw-cancel" onClick={regenerate} disabled={pendingCount > 0}>Regenerate</button>
              <button className="primary-btn" onClick={() => setStep(4)} disabled={!canContinueFromPick}>Continue</button>
            </div>
          </div>
        )}

        {/* ── STEP 4: name & save ── */}
        {step === 4 && (
          <div className="bld-body">
            <p className="nw-sub">Give her a handle so you can summon her anywhere with @handle.</p>
            <div className="bld-final">
              <img src={selectedUrl} alt="Selected" className="bld-final-photo" />
              <div className="inf-fields" style={{ flex: 1 }}>
                <label className="inf-label">user_name</label>
                <div className="inf-handle-input">
                  <span>@</span>
                  <input
                    autoFocus
                    placeholder="katrina"
                    value={handle}
                    onChange={(e) => setHandle(normHandle(e.target.value))}
                  />
                </div>
              </div>
            </div>
            <div className="nw-actions">
              <button className="nw-cancel" onClick={() => setStep(3)}>Back</button>
              <button className="primary-btn" onClick={onSave} disabled={!canSave}>{saving ? "Saving…" : "Save influencer"}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
