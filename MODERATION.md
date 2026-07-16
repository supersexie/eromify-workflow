# Moderation — Magic Mint (magicmint.pro)

Content moderation for AI-generated content, built to satisfy CCBill's "Compliance Guidelines for AI Generated Content Merchants" (5967 MCC). Covers minor-safety, non-consensual/deepfake real-person protection, and the broader prohibited-content categories on page 3 of that document.

## Hive API — V3 (verified live)

Uses Hive's **V3** API. Auth is a single **Bearer** secret key (`HIVE_API_KEY` = the "Secret Key" from Hive's Playground API Keys page, NOT the Access Key ID). One key covers both models below. Each model is its own endpoint under `https://api.thehive.ai/api/v3/<model-key>`; request body is JSON `{"input":[{"media_url":"..."}]}` for hosted URLs, or multipart `media=@file` for uploads. Response shape is `output[0].classes[]`, where each entry's field is **`class`** (the live API uses `class`, though Hive's docs example shows `class_name` — the code reads `class ?? class_name`).

Two models, both confirmed working against the production key:

- **`hive/visual-moderation`** — used by `classifyOutput()`. Real class names verified against live responses (e.g. `yes_child_present`, `general_nsfw`, `general_suggestive`, `yes_sexual_activity`, `animal_genitalia_and_human`, `human_corpse`, `yes_self_harm`).
- **`hive/ai-generated-and-deepfake-content-detection`** — used by `checkReferenceImage()`. Class `ai_generated`. Verified: AI image → `ai_generated ≈ 0.9999` (allow); real photo → `ai_generated ≈ 0.0002` (block).

## What's wired in (code, done)

All logic lives in [`lib/moderation.js`](lib/moderation.js). Three gates, applied across every generation entry point:

1. **`screenPrompt(prompt)`** — local, no API call. Blocks minor-safety violations, deepfake/real-person-name combinations, and the CCBill prohibited categories (incest, non-consensual/sleeping scenarios, watersports, violence/snuff, bestiality, prostitution, polygamy, illegal-activity instructions, hate speech starter list).
2. **`checkReferenceImage(image, isExplicit)`** — calls the AI/deepfake-detection model. Only triggers on prompts flagged explicit. Blocks a reference that is NOT confidently AI-generated (`ai_generated ≤ 0.9`, i.e. a real photo) from explicit reuse, while allowing your own AI-influencer photos (which score ~1.0) — this is what stops the feature from breaking on the core "animate my influencer" use case while still blocking real-photo misuse.
3. **`classifyOutput(mediaUrl)`** — calls visual-moderation on the finished generation before the URL is ever returned. Adult NSFW is allowed (this is an adult platform); it blocks minor+sexual (CSAM proxy), any confidently-present minor, and bestiality/corpse/self-harm.

All three **fail closed**: if `HIVE_API_KEY` isn't set, or the Hive call errors, they block rather than silently pass content through.

Wired into:

| Route | Gates applied |
|---|---|
| `app/api/image/start/route.js` | prompt screen, reference-image guard |
| `app/api/image/status/route.js` | output classification |
| `app/api/video/start/route.js` | prompt screen, reference-image guard (covers t2v/i2v, edit, motion-control branches) |
| `app/api/video/status/route.js` | output classification (fal + Veo paths) |
| `app/api/generate/route.js` | prompt screen, reference-image guard, output classification (this is the MCP-connector path Claude/Cursor call directly) |
| `app/api/influencers/route.js` | not modified — influencer photos already pass through `image/start`/`image/status`, which are gated, before being saved |

Review/block events log to console and, if `BLOB_READ_WRITE_TOKEN` (or any `*_READ_WRITE_TOKEN`) is set, to a `moderation-queue.json` blob (same pattern as `lib/genstore.js`'s generations index). **This is not real alerting** — wire it to Slack/email before launch, or nobody will see flagged content promptly.

## Known gaps in the code (not done)

- **Video output classification is weak.** `classifyOutput()` sends the video URL to Hive's image-classification endpoint — depending on how Hive handles that, it may only inspect a thumbnail/first frame, not the whole clip. The pre-generation reference-image guard is the primary defense for video; the post-generation check is a backstop, not full video moderation. Frame-sampling a video properly (extract N frames, classify each) would close this but isn't built.
- **`editVideo` (the source video being edited in the Kling video-edit path) is not frame-checked.** Only `editRefs` (reference images) and the i2v `image` are checked before an edit job runs.
- **Known-CSAM hash matching (Thorn Safer / PhotoDNA) is not implemented.** This is the baseline most payment processors and legal counsel expect on top of a classifier — a classifier makes a probabilistic judgment on new content, hash matching gives a near-certain match against material NCMEC has already confirmed. It requires a gated partnership/approval process (not a self-serve API key) — start that process early, it's the piece most likely to block a compliance review if missing. Once approved, add a `checkKnownHash()` function to `lib/moderation.js` following the same fail-closed pattern, and call it first, before `screenPrompt`, on every route above.
- **`KNOWN_PUBLIC_FIGURES` starts empty** (`loadPublicFigureList()` in `lib/moderation.js`) — populate/maintain it from wherever you're tracking reported names.
- **Youthful-adult false-positive risk on `yes_child_present`.** The Influencer Builder offers an "18–22" range with a beauty bias toward youthful faces. `classifyOutput` blocks on `yes_child_present > 0.5` and flags 0.25–0.5 for review. A legitimately-adult-but-youthful influencer could occasionally trip this. Thresholds are starting values — tune against real traffic; consider widening the review band vs. hard-block for borderline scores.
- **Hive URL fetch can fail for some hosts.** When a reference image is passed as a hosted URL, Hive fetches it server-side; some hosts (e.g. Wikimedia) block that fetcher, returning a 400 and a fail-closed block. In the real app, uploads arrive as data URIs (sent to Hive as multipart bytes — no fetch) and influencer photos are on fal.media / Vercel Blob (confirmed fetchable), so this is not a production concern, but keep it in mind for any new reference-image source.
- **Text-to-text chat** (if Magic Mint ever adds a chatbot beyond `/api/assistant`'s internal routing) is not covered by `screenPrompt` for prohibited *outputs* (only inputs) — the CCBill list includes "professional advice" and "illegal activity" as prohibited chatbot outputs too, which would need output-side text classification if that feature ships.

## Testing without any keys

`screenPrompt()` and `isExplicitPrompt()` in `lib/moderation.js` are pure local functions — test immediately with no setup:

```js
import { screenPrompt } from "@/lib/moderation";
console.log(screenPrompt("a photo of a mountain"));        // { verdict: "allow" }
console.log(screenPrompt("nude photo of a 15 year old"));  // { verdict: "block", reason: "explicit_underage_reference" }
```

`checkReferenceImage()` and `classifyOutput()` need `HIVE_API_KEY` set (see `.env.example`) — without it they throw/block by design, they don't skip.

---

# Website checklist (CCBill 5967 MCC requirements — not code)

Everything below is legal copy / product UI, not backend logic. None of it is built yet in this repo.

## Footer links (standalone pages, not buried in T&Cs)

Current footer (`app/page.js`, `mm-footer` section) has **Product** and **App** columns only — no policy links at all. Needs a third column, or additions to an existing one:

- [ ] **Content moderation and boarding policy** — new page, footer-linked
- [ ] **Content Removal Policy** — new page, footer-linked
- [ ] **Complaints Policy** — new page, footer-linked, with a complaints contact channel **separate from general support** (a dedicated form/inbox, not shared with your regular "Contact Us")

## Terms of Service / Acceptable Use Policy

No ToS/Privacy/AUP pages currently exist anywhere in `app/` (confirmed — no matches for a terms or privacy route). Needed:

- [ ] ToS/AUP page with an **explicit deepfake-generation prohibition clause** — not just generic "no illegal content"
- [ ] **Mandatory click-through acceptance** before a user can generate anything — currently `/app`, `/image`, `/video`, `/influencers` have no acceptance gate in front of them
- [ ] Content Creator Agreement — only needed if the platform will host user-contributed content beyond prompted generations; confirm applicability
- [ ] 3rd Party Consent Agreement + a place to actually store signed consent / proof-of-age documentation, retrievable within CCBill's 5-business-day window if requested. `checkReferenceImage()` blocks real-face+explicit combinations, but for any case where a user has legitimate consent (e.g. a paid model shoot), you need a documented consent-capture flow — that doesn't exist yet, on purpose (a checkbox isn't proof of consent).

## AI-content disclosure

- [ ] Visible labelling/watermark marking generated media as AI-generated/synthetic — no such indicator currently renders anywhere images/videos are shown (`components/Library.js`, `components/ImagePage.js`, `components/VideoPage.js`, the influencer builder lightbox, etc.)

## Paperwork (not website, but required)

- [ ] AI Attestation form, officer-signed, submitted to CCBill directly
- [ ] Documented internal moderation procedure (separate from the code — CCBill wants the *process* written down and auditable)
- [ ] Confirm CCBill's standard Adult Content policy requirements are also met (age-verification gate on the site itself, etc.) — that's a separate document from the AI-specific one this checklist is based on; request it from CCBill if you don't have it
