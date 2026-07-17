"use client";
import { useEffect, useState, useCallback } from "react";
import TopBar from "@/components/TopBar";
import UserMenu from "@/components/UserMenu";
import { listInfluencers, syncInfluencers, saveInfluencerRemote, deleteInfluencerRemote, normHandle } from "@/lib/influencers";

const VIBES = [
  { id: "teacher",  emoji: "📚", label: "Teacher",      blurb: "Bookish, glasses-optional scholar",      prompt: "wearing a blazer and pencil skirt in a cozy study room with bookshelves", style: "photo" },
  { id: "nurse",    emoji: "🩺", label: "Nurse",        blurb: "Scrubs & stethoscope, gentle energy",     prompt: "wearing medical scrubs and a stethoscope in a bright, modern clinic", style: "photo" },
  { id: "golf",     emoji: "⛳", label: "Golf girl",    blurb: "Preppy polo & pleats on the green",       prompt: "wearing a fitted golf polo and pleated skirt on a lush green golf course, golden hour", style: "photo" },
  { id: "gamer",    emoji: "🎮", label: "Gamer girl",   blurb: "RGB glow, headset, gaming chair",         prompt: "wearing a crop top and joggers, sitting in a gaming chair with RGB lighting and a dual-monitor setup", style: "photo" },
  { id: "egirl",    emoji: "🖤", label: "E-girl",       blurb: "Chunky chains, pastel streaks",           prompt: "e-girl aesthetic, chunky chains, pastel hair streaks, dark eyeliner, oversized band tee, fairy lights and anime posters in a cozy bedroom", style: "photo" },
  { id: "cottagecore", emoji: "🌻", label: "Cottagecore", blurb: "Wildflowers & warm linen",              prompt: "wearing a flowy linen dress with wildflowers, standing in a sun-drenched meadow with a rustic fence and cottage in the background", style: "photo" },
  { id: "cyberpunk", emoji: "🦾", label: "Cyberpunk",    blurb: "Neon alleys & chrome accents",           prompt: "cyberpunk outfit with chrome accents and LED trim, standing in a neon-lit rain-slicked alley with holographic signs", style: "photo" },
  { id: "streetwear", emoji: "🧢", label: "Streetwear",  blurb: "Oversized fits, sneaker heat",           prompt: "streetwear look, oversized graphic hoodie, cargo pants, chunky sneakers, standing on a graffiti-covered rooftop at sunset", style: "photo" },
  { id: "fitness",  emoji: "💪", label: "Fitness",      blurb: "Gym-ready, activewear glow",              prompt: "wearing sleek activewear, sports bra and leggings, in a modern gym with warm lighting and mirrors", style: "photo" },
  { id: "anime",    emoji: "✨", label: "Anime",        blurb: "Vibrant anime character style",           prompt: "anime-style character, detailed vibrant outfit, dynamic pose, colorful background", style: "anime" },
];

const ETHNICITIES = [
  { id: "any", label: "Any", adj: "" },
  { id: "white", label: "White / European", adj: "white European" },
  { id: "black", label: "Black / African", adj: "Black African" },
  { id: "east-asian", label: "East Asian", adj: "East Asian" },
  { id: "south-asian", label: "South Asian", adj: "South Asian" },
  { id: "southeast-asian", label: "Southeast Asian", adj: "Southeast Asian" },
  { id: "middle-eastern", label: "Middle Eastern", adj: "Middle Eastern" },
  { id: "latina", label: "Latina / Hispanic", adj: "Latina" },
  { id: "mixed", label: "Mixed / Ambiguous", adj: "mixed-race" },
];

const AGES = [
  { id: "young", label: "18-22", f: "in her late teens to early twenties", m: "in his late teens to early twenties" },
  { id: "mid", label: "23-29", f: "in her mid-to-late twenties", m: "in his mid-to-late twenties" },
  { id: "thirties", label: "30-39", f: "in her thirties", m: "in his thirties" },
  { id: "forties", label: "40+", f: "in her forties", m: "in his forties" },
];

const HAIR_COLORS = ["Black", "Brown", "Blonde", "Red", "Auburn", "Platinum", "Pink", "Blue", "Purple", "Silver"];
const HAIR_STYLES = ["Straight", "Wavy", "Curly", "Bob", "Ponytail", "Braids", "Pixie", "Long layered", "Bun", "Twin tails"];
const EYE_COLORS = ["Brown", "Blue", "Green", "Hazel", "Gray", "Amber"];
const BODY_TYPES = [
  { id: "slim", label: "Slim", desc: "slim build" },
  { id: "athletic", label: "Athletic", desc: "athletic, toned build" },
  { id: "average", label: "Average", desc: "average build" },
  { id: "curvy", label: "Curvy", desc: "curvy build" },
  { id: "plus", label: "Plus size", desc: "plus-size, full-figured build" },
];

const HOUSE_STYLE = "ultra-realistic, 8K, DSLR quality, soft natural lighting, shallow depth of field, skin pores visible, no AI artifacts";
const BEAUTY_CLAUSE_F = "conventionally attractive, clear skin, photogenic face, naturally beautiful, camera-ready";
const BEAUTY_CLAUSE_M = "conventionally attractive, strong jawline, clear skin, photogenic, camera-ready";
const FIT_CLAUSE = "wearing a well-fitted, flattering version of the outfit that accentuates her figure";

const BLANK_PICKS = { gender: "female", vibe: "teacher", ethnicity: "any", age: "mid", hairColor: "Brown", hairStyle: "Straight", eyeColor: "Brown", body: "athletic" };

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

const FRAMING = {
  knee: "three-quarter-length shot framed from the top of the head down to just below the knees, her full outfit and figure clearly visible, standing or lightly posed",
  full: "full-body shot from head to toe, standing pose, entire body and outfit fully visible in frame including feet, shot further back",
};
const BATCH_ASPECT = "3:4";

export default function InfluencerStudio() {
  const [items, setItems] = useState([]);
  const [picks, setPicks] = useState(BLANK_PICKS);
  const [slots, setSlots] = useState([]);
  const [selectedUrl, setSelectedUrl] = useState(null);
  const [handle, setHandle] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedInf, setSelectedInf] = useState(null);
  const [showNamer, setShowNamer] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    const cached = listInfluencers();
    setItems(cached.length ? cached : []);
    syncInfluencers()
      .then((list) => { if (Array.isArray(list)) setItems(list); })
      .catch(() => {});
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, []);

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
    const initial = Array.from({ length: 4 }, () => ({ status: "pending" }));
    setSlots(initial);
    setSelectedUrl(null);
    setSelectedInf(null);
    initial.forEach((_, i) => {
      generateOne(prompt, BATCH_ASPECT)
        .then((url) => setSlots((s) => s.map((sl, j) => (j === i ? { status: "done", url } : sl))))
        .catch((e) => setSlots((s) => s.map((sl, j) => (j === i ? { status: "error", error: e.message } : sl))));
    });
  }, [composePrompt]);

  const retrySlot = (i) => {
    const prompt = composePrompt();
    setSlots((s) => s.map((sl, j) => (j === i ? { status: "pending" } : sl)));
    generateOne(prompt, BATCH_ASPECT)
      .then((url) => setSlots((s) => s.map((sl, j) => (j === i ? { status: "done", url } : sl))))
      .catch((e) => setSlots((s) => s.map((sl, j) => (j === i ? { status: "error", error: e.message } : sl))));
  };

  const onSave = async () => {
    if (!selectedUrl || !normHandle(handle) || saving) return;
    setSaving(true);
    try {
      const h = normHandle(handle);
      const id = `inf_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const vibe = VIBES.find((v) => v.id === picks.vibe);
      const body = BODY_TYPES.find((b) => b.id === picks.body);
      const desc = [vibe?.label, body?.label].filter(Boolean).join(" · ");
      await saveInfluencerRemote({ id, handle: h, name: h, description: desc, image: selectedUrl, ts: Date.now() });
      const list = await syncInfluencers({ force: true });
      if (Array.isArray(list)) setItems(list);
      setShowNamer(false);
      setHandle("");
      setSlots([]);
      setSelectedUrl(null);
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id) => {
    if (!confirm("Delete this influencer?")) return;
    await deleteInfluencerRemote(id);
    const list = await syncInfluencers({ force: true });
    if (Array.isArray(list)) setItems(list);
    if (selectedInf?.id === id) setSelectedInf(null);
  };

  const pendingCount = slots.filter((s) => s.status === "pending").length;
  const generating = pendingCount > 0;
  const doneCount = slots.filter((s) => s.status === "done").length;

  const currentVibe = VIBES.find((v) => v.id === picks.vibe) || VIBES[0];
  const currentEth = ETHNICITIES.find((e) => e.id === picks.ethnicity) || ETHNICITIES[0];
  const currentAge = AGES.find((a) => a.id === picks.age) || AGES[1];
  const currentBody = BODY_TYPES.find((b) => b.id === picks.body) || BODY_TYPES[1];

  const previewTags = [
    picks.gender === "male" ? "Male" : "Female",
    currentEth.label !== "Any" ? currentEth.label : null,
    currentAge.label,
    currentVibe.label,
    picks.hairColor,
    currentBody.label,
  ].filter(Boolean);

  return (
    <div className="studio-page">
      <TopBar right={<UserMenu />} />

      <div className="studio-layout">
        {/* ── LEFT SIDEBAR: Created influencers ── */}
        <div className="studio-left">
          <div className="studio-left-head">
            <h3>My Influencers</h3>
            <span className="studio-left-count">{items.length}</span>
          </div>
          <div className="studio-left-list">
            {items.map((inf) => (
              <button
                key={inf.id}
                className={`studio-inf-item ${selectedInf?.id === inf.id ? "is-active" : ""}`}
                onClick={() => { setSelectedInf(inf); setSelectedUrl(null); setSlots([]); }}
              >
                <img src={inf.image} alt="" className="studio-inf-thumb" />
                <div className="studio-inf-meta">
                  <div className="studio-inf-name">@{inf.handle}</div>
                  <div className="studio-inf-desc">{inf.description || "Influencer"}</div>
                </div>
                <button className="studio-inf-del" onClick={(e) => { e.stopPropagation(); onDelete(inf.id); }} title="Delete">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
                </button>
              </button>
            ))}
          </div>
          <button className="studio-create-btn" onClick={() => { setSelectedInf(null); setSelectedUrl(null); setSlots([]); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
            Create new
          </button>
        </div>

        {/* ── CENTER: Preview area ── */}
        <div className="studio-center">
          {selectedInf && !slots.length ? (
            <div className="studio-preview-wrap">
              <img src={selectedInf.image} alt={selectedInf.handle} className="studio-preview-img" />
              <div className="studio-preview-handle">@{selectedInf.handle}</div>
            </div>
          ) : selectedUrl ? (
            <div className="studio-preview-wrap">
              <img src={selectedUrl} alt="Selected" className="studio-preview-img" />
              <div className="studio-preview-tags">
                {previewTags.map((t) => <span key={t} className="studio-tag">{t}</span>)}
              </div>
            </div>
          ) : slots.length ? (
            <div className="studio-gen-grid">
              {slots.map((s, i) => (
                <button
                  key={i}
                  className={`studio-gen-card ${s.status === "error" ? "is-error" : ""}`}
                  disabled={s.status === "pending"}
                  onClick={() => {
                    if (s.status === "error") retrySlot(i);
                    else if (s.status === "done") setSelectedUrl(s.url);
                  }}
                >
                  {s.status === "pending" && <span className="inf-spinner" />}
                  {s.status === "error" && (
                    <span className="bld-gen-error">
                      <span className="bld-gen-error-msg">{s.error || "Failed"}</span>
                      <span className="bld-gen-error-retry">Tap to retry</span>
                    </span>
                  )}
                  {s.status === "done" && <img src={s.url} alt={`Option ${i + 1}`} />}
                </button>
              ))}
              {generating && (
                <div className="studio-gen-status">Generating {doneCount}/{slots.length}</div>
              )}
            </div>
          ) : (
            <div className="studio-empty-preview">
              <div className="studio-empty-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--muted-2)" strokeWidth="1.5">
                  <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
                </svg>
              </div>
              <p>Pick a vibe on the right and hit Generate</p>
            </div>
          )}
        </div>

        {/* ── RIGHT SIDEBAR: Builder options ── */}
        <div className="studio-right">
          <div className="studio-right-head">
            <h3>Builder</h3>
          </div>
          <div className="studio-right-scroll">
            <div className="studio-section">
              <div className="studio-section-label">Gender</div>
              <div className="bld-seg" style={{ marginBottom: 0 }}>
                <button className={picks.gender === "female" ? "is-active" : ""} onClick={() => set("gender", "female")}>Female</button>
                <button className={picks.gender === "male" ? "is-active" : ""} onClick={() => set("gender", "male")}>Male</button>
              </div>
            </div>

            <div className="studio-section">
              <div className="studio-section-label">Vibe</div>
              <div className="studio-vibe-grid">
                {VIBES.map((v) => (
                  <button
                    key={v.id}
                    className={`studio-vibe-card ${picks.vibe === v.id ? "is-active" : ""}`}
                    onClick={() => set("vibe", v.id)}
                  >
                    <span className="studio-vibe-emoji">{v.emoji}</span>
                    <span className="studio-vibe-label">{v.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="studio-section">
              <div className="studio-section-label">Ethnicity</div>
              <div className="bld-chip-row">
                {ETHNICITIES.map((e) => (
                  <button key={e.id} className={`bld-chip ${picks.ethnicity === e.id ? "is-active" : ""}`} onClick={() => set("ethnicity", e.id)}>{e.label}</button>
                ))}
              </div>
            </div>

            <div className="studio-section">
              <div className="studio-section-label">Age</div>
              <div className="bld-chip-row">
                {AGES.map((a) => (
                  <button key={a.id} className={`bld-chip ${picks.age === a.id ? "is-active" : ""}`} onClick={() => set("age", a.id)}>{a.label}</button>
                ))}
              </div>
            </div>

            <div className="studio-section">
              <div className="studio-section-label">Hair color</div>
              <div className="bld-chip-row">
                {HAIR_COLORS.map((c) => (
                  <button key={c} className={`bld-chip ${picks.hairColor === c ? "is-active" : ""}`} onClick={() => set("hairColor", c)}>{c}</button>
                ))}
              </div>
            </div>

            <div className="studio-section">
              <div className="studio-section-label">Hair style</div>
              <div className="bld-chip-row">
                {HAIR_STYLES.map((c) => (
                  <button key={c} className={`bld-chip ${picks.hairStyle === c ? "is-active" : ""}`} onClick={() => set("hairStyle", c)}>{c}</button>
                ))}
              </div>
            </div>

            <div className="studio-section">
              <div className="studio-section-label">Eye color</div>
              <div className="bld-chip-row">
                {EYE_COLORS.map((c) => (
                  <button key={c} className={`bld-chip ${picks.eyeColor === c ? "is-active" : ""}`} onClick={() => set("eyeColor", c)}>{c}</button>
                ))}
              </div>
            </div>

            <div className="studio-section">
              <div className="studio-section-label">Body type</div>
              <div className="bld-chip-row">
                {BODY_TYPES.map((b) => (
                  <button key={b.id} className={`bld-chip ${picks.body === b.id ? "is-active" : ""}`} onClick={() => set("body", b.id)}>{b.label}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="studio-right-footer">
            {selectedUrl && !showNamer ? (
              <button className="primary-btn studio-gen-btn" onClick={() => setShowNamer(true)}>
                Save influencer
              </button>
            ) : showNamer ? (
              <div className="studio-namer">
                <div className="inf-handle-input">
                  <span>@</span>
                  <input
                    autoFocus
                    placeholder="katrina"
                    value={handle}
                    onChange={(e) => setHandle(normHandle(e.target.value))}
                    onKeyDown={(e) => { if (e.key === "Enter") onSave(); }}
                  />
                </div>
                <button className="primary-btn" onClick={onSave} disabled={!normHandle(handle) || saving}>
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            ) : (
              <button className="primary-btn studio-gen-btn" onClick={runBatch} disabled={generating}>
                {generating ? `Generating ${doneCount}/${slots.length}...` : "Generate Influencer"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
