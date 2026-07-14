"use client";
import { useCallback, useState } from "react";
import { normHandle, saveInfluencerRemote } from "@/lib/influencers";

// Realism guide — kept word-for-word in sync with the Enhance endpoint's
// HOUSE_STYLE (app/api/prompt/enhance/route.js) so Canvas/Image and the
// Influencer Builder produce the same raw-UGC look instead of drifting into
// a blurred, over-produced "photoshoot" style. No "shallow depth of field" —
// a real candid phone snapshot keeps the background in focus.
const HOUSE_STYLE = "hyper-realistic UGC-style photo shot on a modern phone, natural skin texture with realistic pores and subtle imperfections, soft natural lighting, candid and photogenic, authentic not over-produced, the photo fills the entire frame with NO phone, NO smartphone, NO screen, NO device, NO app interface and NO UI visible, no plastic skin, no over-smoothing, no airbrushing, no cartoon, no illustration, no 3D render";

// Every generation is biased HARD toward maximally attractive results — baked
// into the base prompt every time so a beginner never has to ask. Gender-aware
// so the "male" option doesn't get "most beautiful woman" descriptors.
// NOTE: no body-shape words here — physique is driven solely by the chosen
// BODY_TYPES descriptor, so "curvy" isn't overridden by a forced "toned" body.
const BEAUTY_CLAUSE_F = "the most beautiful woman in the world, breathtakingly gorgeous, absolute supermodel-level stunning looks, sharp striking sculpted face with high chiseled cheekbones and an angular defined jawline, hooded sultry bedroom eyes, plump glossy lips, long fluttery lashes, radiant sun-kissed glowing skin, perfectly styled voluminous glossy hair, flawless glam makeup, smoldering seductive confident gaze, alluring femme-fatale vixen look, glamorous and instantly head-turning, top-tier Instagram model aesthetic, professional beauty-photoshoot quality";
const BEAUTY_CLAUSE_M = "the most handsome man in the world, breathtakingly good-looking, absolute supermodel-level stunning looks, flawless perfectly symmetrical face, chiseled sharp jawline, captivating eyes, radiant flawless skin, perfectly styled hair, perfectly groomed, magnetic and instantly head-turning, top-tier male-model aesthetic";

// Nudges every vibe's outfit to hug the figure so the chosen body type actually
// reads through the clothing (a blazer/scrubs otherwise hide the shape).
const FIT_CLAUSE = "wearing a figure-flattering, well-fitted version of the outfit that hugs and shows off her curves and silhouette";

// Curated "vibes" carry the creative direction so a beginner never has to
// write a prompt themselves — each one is a hand-tuned descriptor block.
// `style: "anime"` opts a vibe out of the photoreal HOUSE_STYLE pipeline.
const VIBES = [
  { id: "teacher", label: "Teacher / Professor", emoji: "📚", blurb: "Smart, warm, academic-chic", prompt: "academic-chic outfit like a fitted blazer or cardigan, chic reading glasses, confident alluring posture, classroom or campus library setting" },
  { id: "nurse", label: "Nurse", emoji: "💉", blurb: "Caring, clean, classic scrubs", prompt: "cute fitted nurse scrubs or a classic nurse uniform, clean bright hospital or clinic setting, soft professional lighting" },
  { id: "golf", label: "Golf Baddie", emoji: "⛳", blurb: "Country-club fashion, poised", prompt: "golf-course fashion like a fitted polo and pleated skirt, visor or cap, confident poised stance, sunny golf course or country club backdrop" },
  { id: "supertall", label: "Supertall Baddie", emoji: "📏", blurb: "Statuesque, editorial, striking", prompt: "tall statuesque model physique with elongated silhouette, long legs emphasized by the framing, high-fashion runway-style outfit, confident editorial pose, upscale city or studio backdrop" },
  { id: "gamer", label: "Gamer Girl", emoji: "🎮", blurb: "Cozy setup, playful energy", prompt: "cute gamer aesthetic with a fitted crop hoodie or graphic tee, gaming headset around the neck, cozy RGB-lit gaming setup in the background, confident expression" },
  { id: "egirl", label: "E-Girl", emoji: "🖤", blurb: "Colorful makeup, grunge edge", prompt: "e-girl aesthetic with colorful eyeshadow and blush, striped or grunge-inspired outfit, choker or chain accessories, moody colorful lighting, urban bedroom or city setting" },
  { id: "gymbaddie", label: "Gym Baddie", emoji: "🏋️", blurb: "Toned, confident, gym-fit", prompt: "form-fitting gym set or leggings and sports bra, confident workout pose, modern gym setting" },
  { id: "tradwife", label: "Trad Wife", emoji: "🌾", blurb: "Wholesome, vintage, homely", prompt: "vintage-inspired outfit like a fitted floral dress, warm homely kitchen or farmhouse setting" },
  { id: "waifu", label: "Anime Waifu", emoji: "✨", blurb: "Vibrant anime character art", style: "anime", prompt: "vibrant anime character design, expressive large eyes, stylish anime outfit, colorful anime background, cel-shaded lighting" },
  { id: "goth", label: "Goth", emoji: "🦇", blurb: "Dark fashion, dramatic makeup", prompt: "dark gothic fashion with black lace or leather, dramatic dark eye makeup, pale striking features, moody atmospheric setting like a dark alley or gothic architecture" },
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
// Body-type descriptors drive the physique — kept explicit so the model
// actually renders the shape (a bare "curvy figure" barely registers).
const BODY_TYPES = [
  { id: "slim", label: "Slim", desc: "slim slender figure, lean build, long legs, gentle subtle curves" },
  { id: "athletic", label: "Athletic", desc: "fit athletic toned body, defined figure, flat toned stomach, sporty physique" },
  { id: "curvy", label: "Curvy", desc: "extremely voluptuous curvy hourglass bombshell figure, dramatic exaggerated feminine curves, tiny cinched waist, very wide hips, large full bust, thick curvy shapely thighs, thicc body" },
  { id: "average", label: "Average", desc: "natural balanced everyday figure, softly feminine proportions" },
];

const BLANK_PICKS = {
  gender: "female",
  vibe: "teacher",
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

async function generateOne(prompt, aspect = "4:5") {
  const startRes = await fetch("/api/image/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, model: "Nano Banana Pro", aspect, quality: "1K" }),
  });
  const start = await startRes.json().catch(() => ({ error: `HTTP ${startRes.status}` }));
  if (!startRes.ok) throw new Error(start.error || `HTTP ${startRes.status}`);
  if (start.output) return start.output;
  return pollUntilDone(start);
}

// Framing presets. Default builder output is KNEE-UP (shows the full outfit
// and figure, not just a headshot); the lightbox "full body" regen uses `full`.
const FRAMING = {
  knee: "three-quarter-length shot framed from the top of the head down to just below the knees, her full outfit and figure clearly visible, standing or lightly posed",
  full: "full-body shot from head to toe, standing pose, entire body and outfit fully visible in frame including feet, shot further back",
};
// Taller aspect ratio so the knee-up / full framings actually fit vertically.
const BATCH_ASPECT = "3:4";

const STEP_TITLES = ["Pick a vibe", "Fine-tune the look", "Choose your favorite", "Name & save"];

export default function InfluencerBuilder({ onClose, onCreated }) {
  const [step, setStep] = useState(1);
  const [picks, setPicks] = useState(BLANK_PICKS);
  const [slots, setSlots] = useState([]); // [{status:'pending'|'done'|'error', url, error}]
  const [selectedUrl, setSelectedUrl] = useState(null);
  const [handle, setHandle] = useState("");
  const [saving, setSaving] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(null); // index into slots being previewed full-size

  const set = (k, v) => setPicks((p) => ({ ...p, [k]: v }));

  const composePrompt = useCallback((framing = "knee") => {
    const vibe = VIBES.find((v) => v.id === picks.vibe) || VIBES[0];
    const eth = ETHNICITIES.find((e) => e.id === picks.ethnicity) || ETHNICITIES[0];
    const age = AGES.find((a) => a.id === picks.age) || AGES[1];
    const body = BODY_TYPES.find((b) => b.id === picks.body) || BODY_TYPES[1];
    const genderNoun = picks.gender === "male" ? "man" : "woman";
    const ageDesc = picks.gender === "male" ? age.m : age.f;
    const ethPart = eth.adj ? `${eth.adj} ` : "";
    const subject = `a ${ethPart}${genderNoun} ${ageDesc}, with ${picks.hairColor.toLowerCase()} ${picks.hairStyle.toLowerCase()} hair and ${picks.eyeColor.toLowerCase()} eyes, ${body.desc}`;
    // Gender-aware beauty bias, placed right after the subject so it carries
    // strong weight in the prompt.
    const beauty = picks.gender === "male" ? BEAUTY_CLAUSE_M : BEAUTY_CLAUSE_F;
    const frame = FRAMING[framing] || FRAMING.knee;
    const fit = picks.gender === "male"
      ? "wearing a well-fitted, flattering version of the outfit"
      : FIT_CLAUSE;

    if (vibe.style === "anime") {
      return `Anime-style character illustration of ${subject} — ${beauty}. ${vibe.prompt}. ${fit}. ${frame}. High-quality anime illustration, vibrant colors, detailed line art, studio-quality anime art style. Fully original character design, not resembling any real person or existing franchise character.`;
    }
    return `Photorealistic photo of ${subject} — ${beauty}. ${vibe.prompt}. ${fit}. ${frame}. ${HOUSE_STYLE}. Fully original, fictional face — not resembling any real person.`;
  }, [picks]);

  const runBatch = useCallback(() => {
    const prompt = composePrompt();
    const initial = Array.from({ length: 2 }, () => ({ status: "pending" }));
    setSlots(initial);
    setSelectedUrl(null);
    initial.forEach((_, i) => {
      generateOne(prompt, BATCH_ASPECT)
        .then((url) => setSlots((s) => s.map((sl, j) => (j === i ? { status: "done", url } : sl))))
        .catch((e) => setSlots((s) => s.map((sl, j) => (j === i ? { status: "error", error: e.message } : sl))));
    });
  }, [composePrompt]);

  const goGenerate = () => { setStep(3); runBatch(); };
  const regenerate = () => runBatch();

  // Retry a single failed slot in place — no need to redo the batch for one
  // transient fal.ai error (rate limit, queue hiccup, moderation flag, etc).
  const retrySlot = (i) => {
    const prompt = composePrompt();
    setSlots((s) => s.map((sl, j) => (j === i ? { status: "pending" } : sl)));
    generateOne(prompt, BATCH_ASPECT)
      .then((url) => setSlots((s) => s.map((sl, j) => (j === i ? { status: "done", url } : sl))))
      .catch((e) => setSlots((s) => s.map((sl, j) => (j === i ? { status: "error", error: e.message } : sl))));
  };

  const openLightbox = (i) => { if (slots[i]?.status === "done") setLightboxIdx(i); };
  const closeLightbox = () => setLightboxIdx(null);

  const useThisPhoto = () => {
    if (lightboxIdx == null) return;
    const s = slots[lightboxIdx];
    if (s?.status === "done") { setSelectedUrl(s.url); closeLightbox(); }
  };

  const generateFullBody = () => {
    if (lightboxIdx == null) return;
    const i = lightboxIdx;
    const prompt = composePrompt("full");
    setSlots((s) => s.map((sl, j) => (j === i ? { status: "pending" } : sl)));
    generateOne(prompt, "2:3")
      .then((url) => setSlots((s) => s.map((sl, j) => (j === i ? { status: "done", url } : sl))))
      .catch((e) => setSlots((s) => s.map((sl, j) => (j === i ? { status: "error", error: e.message } : sl))));
  };

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
  const lightboxSlot = lightboxIdx != null ? slots[lightboxIdx] : null;

  return (
    <>
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
              <button className="primary-btn" onClick={goGenerate}>Generate 2 looks</button>
            </div>
          </div>
        )}

        {/* ── STEP 3: pick a generation ── */}
        {step === 3 && (
          <div className="bld-body">
            <p className="nw-sub">
              {pendingCount > 0 ? `Generating your influencer… ${2 - pendingCount}/2 done` : "Tap your favorite to continue."}
            </p>
            <div className="bld-gen-grid">
              {slots.map((s, i) => (
                <button
                  key={i}
                  className={`bld-gen-card ${selectedUrl === s.url ? "is-selected" : ""} ${s.status === "error" ? "is-error" : ""}`}
                  disabled={s.status === "pending"}
                  onClick={() => (s.status === "error" ? retrySlot(i) : openLightbox(i))}
                >
                  {s.status === "pending" && <span className="inf-spinner" />}
                  {s.status === "error" && (
                    <span className="bld-gen-error">
                      <span className="bld-gen-error-msg">{s.error || "Generation failed"}</span>
                      <span className="bld-gen-error-retry">Tap to retry</span>
                    </span>
                  )}
                  {s.status === "done" && (
                    <>
                      <img src={s.url} alt={`Option ${i + 1}`} />
                      {selectedUrl === s.url && <span className="bld-gen-check">✓</span>}
                      <span className="bld-gen-expand">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
                      </span>
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

    {lightboxSlot && (
      <div className="bld-lightbox-backdrop" onClick={closeLightbox}>
        <div className="bld-lightbox" onClick={(e) => e.stopPropagation()}>
          <button className="bld-lightbox-close" onClick={closeLightbox} title="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
          <div className="bld-lightbox-frame">
            {lightboxSlot.status === "pending" && <span className="inf-spinner bld-lightbox-spinner" />}
            {lightboxSlot.status === "done" && <img src={lightboxSlot.url} alt="Preview" />}
            {lightboxSlot.status === "error" && (
              <span className="bld-gen-error">
                <span className="bld-gen-error-msg">{lightboxSlot.error || "Generation failed"}</span>
                <span className="bld-gen-error-retry">Try again below</span>
              </span>
            )}
          </div>
          <div className="bld-lightbox-actions">
            <button className="nw-cancel" onClick={generateFullBody} disabled={lightboxSlot.status === "pending"}>
              {lightboxSlot.status === "error" ? "Retry full body shot" : "Generate full body shot"}
            </button>
            <button className="primary-btn" onClick={useThisPhoto} disabled={lightboxSlot.status !== "done"}>
              Use this photo
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
