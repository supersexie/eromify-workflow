// Content moderation for generation requests — minor-safety, real-person /
// deepfake protection, and broader prohibited-category screening required by
// CCBill's AI Generated Content Merchant guidelines (5967 MCC).
//
// Two gates, matching how every generation route in this app works:
//   1. screenPrompt() — call BEFORE queueing a generation job. Cheap, local,
//      no network call. Blocks/flags based on prompt text alone.
//   2. checkReferenceImage() — call BEFORE queueing a generation job that
//      includes a user-supplied reference image (img2img edit, image-to-video
//      start frame, motion control, video edit). Distinguishes "real photo"
//      from "one of our own AI-generated images being reused" so legitimate
//      AI-influencer workflows aren't broken.
//   3. classifyOutput() — call AFTER a generation job completes, before the
//      URL is returned to the client. Catches anything the pre-checks missed
//      (the model drifting off-prompt, etc).
//
// All three FAIL CLOSED: if HIVE_API_KEY isn't set or the API call errors,
// they return a blocking verdict rather than silently letting content
// through. This is deliberate — do not "fix" a missing-key error by making
// these best-effort like lib/genstore.js. Content safety must never
// degrade silently.
//
// Requires env var HIVE_API_KEY (https://thehive.ai). For the known-CSAM
// hash-matching baseline most payment processors require on top of this,
// see the SAFER_API_KEY notes in MODERATION.md — that's a separate,
// gated partnership (Thorn Safer / Microsoft PhotoDNA), not a Hive feature,
// and is not wired in here yet.

// Hive V3 API. Each model is its own endpoint under /api/v3/<model-key>, auth
// is a Bearer secret key (the "Secret Key" from Hive's Playground API Keys /
// project page — NOT the Access Key ID). One key covers every model your org
// has access to.
const HIVE_V3_BASE = "https://api.thehive.ai/api/v3";
const MODEL_VISUAL_MODERATION = "hive/visual-moderation";
const MODEL_AI_GENERATED = "hive/ai-generated-and-deepfake-content-detection";

// ─── prompt-level screening ────────────────────────────────────────────────

// Minor-indicator terms, matched with WORD BOUNDARIES (see matchesWord) so
// "kid" doesn't fire on "kidney"/"kidding", "teen" not on "canteen"/"eighteen",
// "child" not on "childhood". Plurals are enumerated explicitly since \b is
// exact-word. Deliberately EXCLUDES ambiguous endearments like "baby" (common
// in adult content) — the context-aware Hive text model (minor_* classes)
// catches those without the false positives keywords would cause.
const MINOR_INDICATOR_TERMS = [
  "child", "children", "kid", "kids", "toddler", "infant",
  "little girl", "little boy", "schoolgirl", "schoolboy",
  "teen", "teens", "teenager", "teenagers", "minor", "minors",
  "loli", "shota", "preteen", "pre-teen", "underage",
  "elementary school", "middle school", "high school student",
  "prepubescent", "pre-pubescent",
];

const YOUNG_AGE_PATTERN = /\b([1-9]|1[0-7])\s*[-]?\s*(years?\s*old|y\.?o\.?)\b/i;

const SEXUAL_CONTEXT_TERMS = [
  "nude", "naked", "nsfw", "explicit", "sexual", "sex",
  "porn", "erotic", "fetish", "lingerie", "topless", "deepfake",
];

// Card-brand prohibited categories from CCBill's AI Generated Content
// guidelines (page 3) beyond minors/deepfakes, which get their own
// dedicated checks above/below.
// These categories have NO classifier support in either Hive model, so the
// keyword list is the only automated catch — kept deliberately broad. Matched
// as substrings (containsAny), so stems like "prostitut" cover
// prostitute/prostitution.
const PROHIBITED_CATEGORY_TERMS = [
  // incest
  "incest", "stepsister", "step-sister", "stepbrother", "step-brother",
  "stepmom", "step-mom", "stepmother", "stepdad", "step-dad", "stepfather",
  "stepdaughter", "stepson", "sister and brother", "brother and sister",
  "father and daughter", "mother and son", "family taboo", "blood related",
  // non-consensual / sleeping
  "non-consensual", "nonconsensual", "non consensual", "without consent",
  "against her will", "against his will", "against their will",
  "sleeping", "asleep", "unconscious", "passed out", "drugged", "roofied",
  "date rape", "molest", "rape", "rapist",
  // watersports
  "watersports", "water sports", "golden shower", "urination fetish",
  "peeing on", "urine play", "piss play",
  // violence / abduction / snuff
  "snuff", "abduction", "abducted", "kidnap", "torture", "murder scene",
  "gore", "strangulation", "strangle", "asphyxiation",
  // bestiality
  "bestiality", "animal cruelty", "zoophilia", "sex with animal", "sex with a dog",
  // sexual activity under the influence (drugs / alcohol / hypnosis)
  "hypnosis", "hypnotized", "hypnotised", "intoxicated", "too drunk",
  "drunk sex", "under the influence",
  // prostitution / escorting
  "prostitut", "escort service", "escorting", "sex work solicitation",
  "pay for sex", "hooker",
  // polygamy
  "polygamy", "polygamous", "polygamist",
  // illegal activity
  "how to build a bomb", "how to make a bomb", "synthesize meth",
  "make explosives", "build a weapon",
  // hate speech (starter set — the Hive text `hate` class is the real gate)
  "racial slur",
];

// Fictional characters + "sleeping"/non-consensual framing is still
// prohibited by CCBill's rules even with no real person involved, so this
// list is checked independent of the real-person name check below.

function normalize(text) {
  return (text || "").toLowerCase().normalize("NFKC");
}

function containsAny(text, terms) {
  return terms.some((t) => text.includes(t));
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Word-boundary match — "kid" matches "a kid" but not "kidney"/"kidding".
// Used for hard-block term lists where substring false positives are unacceptable.
function matchesWord(text, terms) {
  const re = new RegExp(`\\b(${terms.map(escapeRegex).join("|")})\\b`, "i");
  return re.test(text);
}

// Word-START match — boundary before, any suffix after. So "prostitut" matches
// "prostitution"/"prostitute", "rape" matches "raped" but NOT "grape"/"drape",
// "forced"-style mid-word hits (e.g. "reinforced") are avoided.
function matchesWordPrefix(text, terms) {
  const re = new RegExp(`\\b(${terms.map(escapeRegex).join("|")})`, "i");
  return re.test(text);
}

// Well-known public figures whose sexualized likeness must be hard-blocked.
// This is a SEED starter set — expand it from a real dataset (celebrity /
// politician / athlete lists) and your own reported-names log. Stored
// lowercased; includes full names and well-known mononyms. Mononyms must be
// distinctive (never common words) to avoid false positives.
const STARTER_PUBLIC_FIGURES = [
  "taylor swift", "ariana grande", "selena gomez", "kim kardashian", "kylie jenner",
  "scarlett johansson", "margot robbie", "emma watson", "gal gadot", "megan fox",
  "billie eilish", "dua lipa", "jennifer lawrence", "angelina jolie", "natalie portman",
  "emma stone", "sydney sweeney", "jenna ortega", "hailey bieber", "kendall jenner",
  "zendaya", "rihanna", "beyonce", "shakira", "adele",
  "donald trump", "joe biden", "elon musk", "cristiano ronaldo", "lionel messi",
  "lebron james",
];
let KNOWN_PUBLIC_FIGURES = new Set(STARTER_PUBLIC_FIGURES);
// Replace/extend the list at startup. Merges with the seed so the starter set
// is always present. Pass your full maintained list here.
export function loadPublicFigureList(names) {
  KNOWN_PUBLIC_FIGURES = new Set([
    ...STARTER_PUBLIC_FIGURES,
    ...((names || []).map((n) => n.toLowerCase())),
  ]);
}

const FULL_NAME_PATTERN = /\b([A-Z][a-z]+)\s+([A-Z][a-z]+)\b/g;

/**
 * @param {string} prompt
 * @returns {{ verdict: "block"|"review"|"allow", reason?: string, matchedName?: string }}
 */
export function screenPrompt(prompt) {
  if (!prompt || typeof prompt !== "string") return { verdict: "allow" };

  const text = normalize(prompt);
  const hasMinorTerm = matchesWord(text, MINOR_INDICATOR_TERMS);
  const hasYoungAge = YOUNG_AGE_PATTERN.test(text);
  const hasSexualTerm = containsAny(text, SEXUAL_CONTEXT_TERMS);
  const hasProhibitedCategory = matchesWordPrefix(text, PROHIBITED_CATEGORY_TERMS);

  // Minor safety — HARD BLOCK on any minor indicator or explicit under-18 age,
  // regardless of sexual context. On an adult-content platform, generating
  // minors in ANY scenario is prohibited by the card-brand rules (CCBill),
  // so this is a block, not a review.
  if (hasYoungAge) {
    return { verdict: "block", reason: "explicit_underage_reference" };
  }
  if (hasMinorTerm) {
    return { verdict: "block", reason: "minor_indicator" };
  }

  if (hasProhibitedCategory) {
    return { verdict: "block", reason: "prohibited_category" };
  }

  // Real-person / deepfake screening — only relevant alongside sexual context.
  if (hasSexualTerm) {
    // Blocklist match, CASE-INSENSITIVE (users type names lowercase). Build
    // candidates from the normalized tokens: single tokens (mononym celebrities)
    // plus adjacent word bigrams/trigrams (full names), then check the Set.
    // O(prompt length), not O(list size).
    const tokens = text.split(/[^a-z]+/i).filter(Boolean);
    const candidates = new Set(tokens);
    for (let i = 0; i < tokens.length - 1; i++) {
      candidates.add(`${tokens[i]} ${tokens[i + 1]}`);
      if (i < tokens.length - 2) candidates.add(`${tokens[i]} ${tokens[i + 1]} ${tokens[i + 2]}`);
    }
    const hit = [...candidates].find((n) => KNOWN_PUBLIC_FIGURES.has(n));
    if (hit) {
      return { verdict: "block", reason: "named_public_figure_sexual_context", matchedName: hit };
    }
    // Generic unknown-name review — capitalized "Firstname Lastname" only, so we
    // don't flag ordinary two-word phrases ("grape juice") as names.
    const nameMatches = [...prompt.matchAll(FULL_NAME_PATTERN)];
    if (nameMatches.length > 0) {
      return { verdict: "review", reason: "possible_named_individual_sexual_context", matchedName: nameMatches[0][0] };
    }
  }

  return { verdict: "allow" };
}

/** Cheap heuristic for "is this generation request targeting explicit output" —
 * used to decide whether the stricter reference-image face/synthetic-origin
 * check applies. Errs toward treating ambiguous prompts as non-explicit
 * (the output classifier is the backstop either way). */
export function isExplicitPrompt(prompt) {
  return containsAny(normalize(prompt), SEXUAL_CONTEXT_TERMS);
}

// ─── Hive V3 API helper ─────────────────────────────────────────────────────

/**
 * Call a Hive V3 model against one image (http(s) URL or data: URI).
 * @param {string} modelKey e.g. "hive/visual-moderation"
 * @param {string} media http(s) URL or data: URI
 * @returns {Promise<{ classes: Array<{class_name:string,value:number}>, scoreOf: (n:string)=>number, raw: any }>}
 */
async function hiveV3(modelKey, media) {
  const apiKey = process.env.HIVE_API_KEY;
  if (!apiKey) {
    throw new Error("HIVE_API_KEY is not set — refusing to skip moderation");
  }
  if (!media || typeof media !== "string") {
    throw new Error("hiveV3 needs a media URL or data URI");
  }

  const endpoint = `${HIVE_V3_BASE}/${modelKey}`;
  let res;

  if (/^https?:/i.test(media)) {
    // Hosted URL → JSON body with media_url.
    res = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ input: [{ media_url: media }] }),
    });
  } else {
    // data: URI → multipart form upload (V3 can't fetch a data: URI itself).
    const m = /^data:([^;]+);base64,(.+)$/.exec(media);
    if (!m) throw new Error("Invalid data URI for moderation check");
    const buf = Buffer.from(m[2], "base64");
    const form = new FormData();
    form.append("media", new Blob([buf], { type: m[1] }), "media.jpg");
    res = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });
  }

  if (!res.ok) {
    const bodyText = await res.text().catch(() => "");
    throw new Error(`Hive ${modelKey} error: ${res.status} ${bodyText.slice(0, 300)}`);
  }

  const data = await res.json();
  // V3 shape: { output: [ { classes: [ {class, value} ] } ] }. NOTE: the live
  // API returns the field as `class` (confirmed against two real responses),
  // even though Hive's docs example shows `class_name` — support both so a
  // docs/version drift can't silently zero out every score again.
  const classes = data?.output?.[0]?.classes ?? [];
  const scoreOf = (name) => classes.find((c) => (c.class ?? c.class_name) === name)?.value ?? 0;
  return { classes, scoreOf, raw: data };
}

/**
 * Call Hive V3 text-moderation on a prompt string.
 * Same envelope as hiveV3, but the input is { text } and each class value is
 * an INTEGER SEVERITY 0–3 (0 = clean … 3 = most severe) — NOT a 0–1 score.
 * @returns {Promise<{ scoreOf: (n:string)=>number, classes: Array, raw: any }>}
 */
async function hiveV3Text(prompt) {
  const apiKey = process.env.HIVE_API_KEY;
  if (!apiKey) throw new Error("HIVE_API_KEY is not set — refusing to skip moderation");

  const res = await fetch(`${HIVE_V3_BASE}/hive/text-moderation`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ input: [{ text: String(prompt ?? "") }] }),
  });
  if (!res.ok) {
    const bodyText = await res.text().catch(() => "");
    throw new Error(`Hive text-moderation error: ${res.status} ${bodyText.slice(0, 300)}`);
  }
  const data = await res.json();
  const classes = data?.output?.[0]?.classes ?? [];
  const scoreOf = (name) => classes.find((c) => (c.class ?? c.class_name) === name)?.value ?? 0;
  return { scoreOf, classes, raw: data };
}

/**
 * Second-pass prompt screening via Hive text-moderation (0–3 severity).
 * Runs after the local keyword `screenPrompt`; catches evasions keywords miss.
 * Adult platform: `sexual` alone never blocks — only minor/child, extreme
 * violence, self-harm intent, and slurs do.
 *
 * @param {string} prompt
 * @returns {Promise<{ verdict:"block"|"review"|"allow", reason?:string, severities?:object }>}
 */
export async function screenPromptHive(prompt) {
  if (!prompt || typeof prompt !== "string") return { verdict: "allow" };
  try {
    const { scoreOf } = await hiveV3Text(prompt);
    const childExploit = scoreOf("child_exploitation");
    const childSafety = scoreOf("child_safety");
    const minorExplicit = scoreOf("minor_explicitly_mentioned");
    const minorImplicit = scoreOf("minor_implicitly_mentioned");
    const sexual = Math.max(scoreOf("sexual"), scoreOf("sexual_description"));
    const hate = scoreOf("hate");
    const selfHarmIntent = scoreOf("self_harm_intent");
    const selfHarm = scoreOf("self_harm");
    const violence = Math.max(scoreOf("violence"), scoreOf("violent_description"));
    const drugs = scoreOf("drugs");

    const severities = { childExploit, childSafety, minorExplicit, minorImplicit, sexual, hate, selfHarmIntent, selfHarm, violence, drugs };

    // Hard blocks — minor safety first. Any context-aware minor signal is a
    // hard block (not review) on this adult platform: generating minors in any
    // scenario is prohibited, and this model understands context so it won't
    // trip on innocent words the way keywords would.
    if (childExploit >= 1) return { verdict: "block", reason: "text_child_exploitation", severities };
    if (childSafety >= 1) return { verdict: "block", reason: "text_child_safety", severities };
    if (minorExplicit >= 1) return { verdict: "block", reason: "text_minor_mentioned", severities };
    if (minorImplicit >= 2) return { verdict: "block", reason: "text_minor_implied", severities };
    if (hate >= 3) return { verdict: "block", reason: "text_hate_slur", severities };
    if (selfHarmIntent >= 2) return { verdict: "block", reason: "text_self_harm_intent", severities };
    if (violence >= 3) return { verdict: "block", reason: "text_extreme_violence", severities };

    // Review band — a human decides.
    if (minorImplicit >= 1) return { verdict: "review", reason: "text_possible_minor", severities };
    if (hate >= 2 || selfHarmIntent >= 1 || selfHarm >= 2 || violence >= 2 || drugs >= 2) {
      return { verdict: "review", reason: "text_flagged_category", severities };
    }
    return { verdict: "allow", severities };
  } catch (e) {
    // Fail OPEN for this layer specifically: the local screenPrompt already
    // ran (and passed) before this, and the output classifier fails CLOSED as
    // the hard backstop — so a text-API outage must not take down all
    // generation. Log via the caller's queueForReview if desired.
    return { verdict: "allow", reason: "text_moderation_unavailable", debugError: e.message };
  }
}

/**
 * Combined prompt gate: local keyword screen (instant, free, fail-closed by
 * nature) THEN Hive text-moderation (stronger, fail-open). Routes call this.
 * @param {string} prompt
 * @returns {Promise<{ verdict:"block"|"review"|"allow", reason?:string, source:string, severities?:object }>}
 */
export async function moderatePrompt(prompt) {
  const local = screenPrompt(prompt);
  if (local.verdict === "block") return { ...local, source: "local" };

  const hive = await screenPromptHive(prompt);
  if (hive.verdict === "block") return { ...hive, source: "hive" };
  // If either flagged for review, surface review.
  if (local.verdict === "review") return { ...local, source: "local" };
  if (hive.verdict === "review") return { ...hive, source: "hive" };
  return { verdict: "allow", source: "combined" };
}

/**
 * Moderate a TEXT OUTPUT (Romy reply, generated copy, scriptwriter text)
 * before it's returned to the user. Runs the local keyword screen AND the Hive
 * text model, and treats BOTH block and review as "do not emit" — there's no
 * human-in-the-loop for a live text response, so borderline text isn't shown.
 * Covers the CCBill chatbot-output rules (professional advice / illegal
 * plotting / hate speech / minors in generated text). Fails OPEN on a Hive
 * outage (returns ok), same rationale as screenPromptHive.
 * @param {string} text
 * @returns {Promise<{ ok: boolean, reason?: string }>}
 */
export async function moderateTextOutput(text) {
  if (!text || typeof text !== "string") return { ok: true };
  const local = screenPrompt(text);
  if (local.verdict === "block") return { ok: false, reason: local.reason };
  const hive = await screenPromptHive(text);
  if (hive.verdict === "block" || hive.verdict === "review") {
    return { ok: false, reason: hive.reason };
  }
  return { ok: true };
}

// ─── post-generation output classification ─────────────────────────────────

/**
 * Classify a generated image against Hive's visual-moderation model.
 *
 * This is an ADULT platform, so adult NSFW on its own is allowed — the job
 * here is to catch the card-brand-prohibited combinations, above all a minor
 * (`yes_child_present`) appearing with any sexual/suggestive signal, which is
 * the CSAM proxy and a hard block. It also blocks a few other prohibited
 * categories from CCBill's list that the model exposes directly (bestiality,
 * animated/real corpse, self-harm).
 *
 * Class names are Hive visual-moderation's real outputs (verified against a
 * live response) — do not swap these for guesses.
 *
 * @param {string} mediaUrl public URL (or data: URI) of the generated media
 * @returns {Promise<{ verdict: "block"|"review"|"allow", scores: object }>}
 */
// Shared threshold logic. `scoreFn(className)` returns the score to test — for a
// single image it's the classifier's scoreOf; for a video it's the WORST score
// for that class across all sampled frames. Used by classifyOutput (image) and
// classifyVideoOutput (video) so both apply identical rules.
function evaluateVisualScores(scoreFn, extra = {}) {
  const child = scoreFn("yes_child_present");
  const suggestive = scoreFn("general_suggestive");
  const explicitSexual = Math.max(
    scoreFn("general_nsfw"),
    scoreFn("yes_sexual_activity"),
    scoreFn("yes_female_nudity"),
    scoreFn("yes_male_nudity"),
    scoreFn("yes_genitals"),
    scoreFn("yes_realistic_nsfw"),
    scoreFn("yes_undressed"),
    scoreFn("yes_sexual_intent"),
  );
  const bestiality = Math.max(scoreFn("animal_genitalia_and_human"), scoreFn("yes_animal_abuse"));
  const corpse = Math.max(scoreFn("human_corpse"), scoreFn("animated_corpse"));
  const selfHarm = Math.max(scoreFn("yes_self_harm"), scoreFn("hanging"), scoreFn("noose"));

  const scores = { child, suggestive, explicitSexual, bestiality, corpse, selfHarm, ...extra };

  if (child > 0.5 && (explicitSexual > 0.2 || suggestive > 0.5)) {
    return { verdict: "block", reason: "minor_with_sexual_content", scores };
  }
  if (child > 0.5) return { verdict: "block", reason: "minor_present", scores };
  if (bestiality > 0.5 || corpse > 0.5 || selfHarm > 0.5) {
    return { verdict: "block", reason: "prohibited_category", scores };
  }
  if (child > 0.25) return { verdict: "review", reason: "possible_minor", scores };
  return { verdict: "allow", scores };
}

export async function classifyOutput(mediaUrl) {
  if (!mediaUrl || typeof mediaUrl !== "string") {
    return { verdict: "block", reason: "no_media_url", scores: {} };
  }
  try {
    const { scoreOf } = await hiveV3(MODEL_VISUAL_MODERATION, mediaUrl);
    return evaluateVisualScores(scoreOf);
  } catch (e) {
    // Fail closed — moderation service down means we do not serve content.
    return { verdict: "block", reason: "moderation_service_unavailable", scores: {}, debugError: e.message };
  }
}

/**
 * Classify a generated VIDEO. Hive's visual-moderation splits a video into
 * frames and returns one output entry per frame (with a timestamp); this checks
 * ALL frames and blocks if ANY frame trips a threshold (worst-case), instead of
 * only looking at the first frame. Falls back to single-frame scoring if Hive
 * returns just one output entry. FAILS CLOSED.
 * @param {string} mediaUrl public URL of the generated video
 */
export async function classifyVideoOutput(mediaUrl) {
  if (!mediaUrl || typeof mediaUrl !== "string") {
    return { verdict: "block", reason: "no_media_url", scores: {} };
  }
  try {
    const { raw, scoreOf } = await hiveV3(MODEL_VISUAL_MODERATION, mediaUrl);
    const frames = raw?.output ?? [];
    if (frames.length > 1) {
      // Worst (max) score for each class across every sampled frame.
      const worst = (name) => Math.max(
        0,
        ...frames.map((f) => f.classes?.find((c) => (c.class ?? c.class_name) === name)?.value ?? 0),
      );
      return evaluateVisualScores(worst, { frameCount: frames.length });
    }
    // Single frame returned — same as image scoring.
    return evaluateVisualScores(scoreOf, { frameCount: frames.length });
  } catch (e) {
    return { verdict: "block", reason: "moderation_service_unavailable", scores: {}, debugError: e.message };
  }
}

// ─── reference-image (real-person / face-swap) guard ───────────────────────

/**
 * Guards img2img edits, image-to-video start frames, motion control, and
 * video edits that take a user-supplied reference image/video frame.
 *
 * Policy: if the reference is NOT confidently AI-generated (i.e. likely a
 * real photo) AND the request targets explicit output -> BLOCK. This lets
 * users legitimately reuse their own AI-influencer photos (which the detector
 * scores as AI-generated) as video-start frames for explicit content, while
 * blocking a real uploaded photo (partner, ex, coworker, public figure, or
 * the user's own photo) from being sexualized.
 *
 * Uses Hive's dedicated AI-generated/deepfake detection model, which returns
 * `ai_generated` / `not_ai_generated` class scores.
 *
 * There is no consent-exception path here — a checkbox cannot verify "this
 * is a face I have consent to use" or "this is my own face." If you want a
 * verified self-portrait exception later, it requires real identity
 * verification (ID + liveness check), not client-side trust.
 *
 * @param {string} referenceDataUrlOrUrl the reference image, data: URI or
 *   already-hosted https URL
 * @param {boolean} isExplicitRequest from isExplicitPrompt(prompt)
 * @returns {Promise<{ verdict: "block"|"allow", reason?: string, aiScore?: number }>}
 */
export async function checkReferenceImage(referenceDataUrlOrUrl, isExplicitRequest) {
  if (!referenceDataUrlOrUrl) return { verdict: "allow" };
  if (!isExplicitRequest) return { verdict: "allow" };

  try {
    const { scoreOf } = await hiveV3(MODEL_AI_GENERATED, referenceDataUrlOrUrl);
    const aiScore = scoreOf("ai_generated");
    // High bar: only a confident synthetic-origin verdict clears a reference
    // for explicit reuse. Ambiguous cases are treated as "possibly real photo"
    // and blocked.
    const confidentlyAiGenerated = aiScore > 0.9;

    if (!confidentlyAiGenerated) {
      return { verdict: "block", reason: "real_photo_reference_with_explicit_request", aiScore };
    }
    return { verdict: "allow", aiScore };
  } catch (e) {
    // Fail closed — cannot verify origin, cannot allow explicit generation
    // from an unverified reference image.
    return { verdict: "block", reason: "moderation_service_unavailable", debugError: e.message };
  }
}

// ─── review queue (Vercel Blob, mirrors lib/genstore.js's pattern) ─────────

import { put, list } from "@vercel/blob";

const QUEUE_INDEX_PATH = "moderation-queue.json";
const QUEUE_MAX_ITEMS = 1000;

function blobToken() {
  return (
    process.env.BLOB_READ_WRITE_TOKEN ||
    process.env.GEOFLIX_READ_WRITE_TOKEN ||
    (Object.keys(process.env).find((k) => k.endsWith("_READ_WRITE_TOKEN")) &&
      process.env[Object.keys(process.env).find((k) => k.endsWith("_READ_WRITE_TOKEN"))])
  );
}

/**
 * Logs a block/review verdict for human follow-up. Unlike the checks above,
 * this is best-effort (matching lib/genstore.js) — a queueing hiccup should
 * never be the reason a block/review verdict fails to apply, it just means
 * the audit trail entry is missing. Wire real alerting (Slack/email) here
 * before launch; a JSON blob nobody looks at is not a review process.
 */
export async function queueForReview(record) {
  const entry = { ...record, queuedAt: new Date().toISOString() };
  console.warn(`[moderation] ${entry.verdict}: ${entry.reason || "unspecified"} — user=${entry.userId || "unknown"}`);
  const token = blobToken();
  if (!token) return entry;
  try {
    let existing = [];
    try {
      const { blobs } = await list({ prefix: QUEUE_INDEX_PATH, limit: 1, token });
      const url = blobs.find((b) => b.pathname === QUEUE_INDEX_PATH)?.url;
      if (url) {
        const res = await fetch(`${url}?t=${Date.now()}`, { cache: "no-store" });
        if (res.ok) existing = await res.json();
      }
    } catch {}
    const next = [entry, ...(Array.isArray(existing) ? existing : [])].slice(0, QUEUE_MAX_ITEMS);
    await put(QUEUE_INDEX_PATH, JSON.stringify(next), {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
      token,
    });
  } catch {
    // swallow — the console.warn above is the fallback audit trail
  }
  return entry;
}
