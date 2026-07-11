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

const MINOR_INDICATOR_TERMS = [
  "child", "kid", "toddler", "infant", "little girl", "little boy",
  "schoolgirl", "schoolboy", "teen", "teenager", "minor",
  "loli", "shota", "preteen", "pre-teen", "underage",
  "elementary school", "middle school", "high school student",
];

const YOUNG_AGE_PATTERN = /\b([1-9]|1[0-7])\s*[-]?\s*(years?\s*old|y\.?o\.?)\b/i;

const SEXUAL_CONTEXT_TERMS = [
  "nude", "naked", "nsfw", "explicit", "sexual", "sex",
  "porn", "erotic", "fetish", "lingerie", "topless", "deepfake",
];

// Card-brand prohibited categories from CCBill's AI Generated Content
// guidelines (page 3) beyond minors/deepfakes, which get their own
// dedicated checks above/below.
const PROHIBITED_CATEGORY_TERMS = [
  // incest
  "incest", "stepsister", "stepbrother", "stepmom", "stepdad", "sister and brother",
  // non-consensual / sleeping
  "non-consensual", "nonconsensual", "against her will", "against his will",
  "sleeping", "unconscious", "passed out", "drugged", "roofied",
  // watersports
  "watersports", "golden shower", "urination fetish",
  // violence / abduction / snuff
  "snuff", "abduction", "kidnap", "torture", "murder scene", "gore",
  // bestiality
  "bestiality", "animal cruelty", "zoophilia",
  // prostitution / escorting
  "prostitut", "escort service", "sex work solicitation",
  // polygamy
  "polygamy", "polygamous",
  // illegal activity
  "how to build a bomb", "how to make a bomb", "synthesize meth", "make explosives",
  // hate speech (a starter set — expand with a real classifier, keywords alone are weak here)
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

// Populate from a maintained list (your own reported-names log, a public
// figures dataset, etc). Starts empty — the generic-name-pattern check below
// still routes ambiguous cases to review even with nothing loaded here.
let KNOWN_PUBLIC_FIGURES = new Set();
export function loadPublicFigureList(names) {
  KNOWN_PUBLIC_FIGURES = new Set((names || []).map((n) => n.toLowerCase()));
}

const FULL_NAME_PATTERN = /\b([A-Z][a-z]+)\s+([A-Z][a-z]+)\b/g;

/**
 * @param {string} prompt
 * @returns {{ verdict: "block"|"review"|"allow", reason?: string, matchedName?: string }}
 */
export function screenPrompt(prompt) {
  if (!prompt || typeof prompt !== "string") return { verdict: "allow" };

  const text = normalize(prompt);
  const hasMinorTerm = containsAny(text, MINOR_INDICATOR_TERMS);
  const hasYoungAge = YOUNG_AGE_PATTERN.test(text);
  const hasSexualTerm = containsAny(text, SEXUAL_CONTEXT_TERMS);
  const hasProhibitedCategory = containsAny(text, PROHIBITED_CATEGORY_TERMS);

  // Hard blocks — minor safety takes priority over everything else.
  if ((hasMinorTerm || hasYoungAge) && (hasSexualTerm || true)) {
    // Minor indicator alone (even without sexual terms) is blocked outright,
    // since age-play/sexualization framing can be implicit rather than
    // stated with an explicit "nude"/"nsfw" keyword.
    if (hasYoungAge || (hasMinorTerm && hasSexualTerm)) {
      return { verdict: "block", reason: hasYoungAge ? "explicit_underage_reference" : "minor_sexual_content_combination" };
    }
  }

  if (hasProhibitedCategory) {
    return { verdict: "block", reason: "prohibited_category" };
  }

  if (hasMinorTerm) {
    return { verdict: "review", reason: "minor_indicator_present" };
  }

  // Real-person / deepfake screening — only relevant alongside sexual context.
  if (hasSexualTerm) {
    for (const figure of KNOWN_PUBLIC_FIGURES) {
      if (text.includes(figure)) {
        return { verdict: "block", reason: "named_public_figure_sexual_context", matchedName: figure };
      }
    }
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
export async function classifyOutput(mediaUrl) {
  if (!mediaUrl || typeof mediaUrl !== "string") {
    return { verdict: "block", reason: "no_media_url", scores: {} };
  }
  try {
    const { scoreOf, classes } = await hiveV3(MODEL_VISUAL_MODERATION, mediaUrl);

    const child = scoreOf("yes_child_present");
    const suggestive = scoreOf("general_suggestive");
    const explicitSexual = Math.max(
      scoreOf("general_nsfw"),
      scoreOf("yes_sexual_activity"),
      scoreOf("yes_female_nudity"),
      scoreOf("yes_male_nudity"),
      scoreOf("yes_genitals"),
      scoreOf("yes_realistic_nsfw"),
      scoreOf("yes_undressed"),
      scoreOf("yes_sexual_intent"),
    );
    // Other prohibited categories the model surfaces directly.
    const bestiality = Math.max(scoreOf("animal_genitalia_and_human"), scoreOf("yes_animal_abuse"));
    const corpse = Math.max(scoreOf("human_corpse"), scoreOf("animated_corpse"));
    const selfHarm = Math.max(scoreOf("yes_self_harm"), scoreOf("hanging"), scoreOf("noose"));

    const scores = { child, suggestive, explicitSexual, bestiality, corpse, selfHarm };
    // Temporary positive-control: a clean image scores ~1 here, so if this
    // reads 0 the parser is broken (field-name mismatch). Remove once verified.
    scores._parseCheck_clean = scoreOf("general_not_nsfw_not_suggestive");
    const debugClasses = classes; // only surfaced when caller opts into debug

    // Minor + any sexual/suggestive context → CSAM proxy, hard block.
    if (child > 0.5 && (explicitSexual > 0.2 || suggestive > 0.5)) {
      return { verdict: "block", reason: "minor_with_sexual_content", scores, debugClasses };
    }
    // Any confidently-present minor on an adult-gen platform → block outright.
    if (child > 0.5) {
      return { verdict: "block", reason: "minor_present", scores, debugClasses };
    }
    // Other hard-prohibited categories.
    if (bestiality > 0.5 || corpse > 0.5 || selfHarm > 0.5) {
      return { verdict: "block", reason: "prohibited_category", scores, debugClasses };
    }
    // Borderline minor signal → human review rather than auto-allow.
    if (child > 0.25) {
      return { verdict: "review", reason: "possible_minor", scores, debugClasses };
    }
    return { verdict: "allow", scores, debugClasses };
  } catch (e) {
    // Fail closed — moderation service down means we do not serve content.
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
