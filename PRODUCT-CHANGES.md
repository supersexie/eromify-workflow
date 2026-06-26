# Eromify — Product Changelog

Product-level changes (features, generation logic, data/persistence, models, MCP,
and functional bug fixes). Pure UI/layout/visual tweaks are intentionally omitted.

---

## Influencers & @mention

- **Influencer system.** Create a reusable AI character from a single photo + a
  `user_name` (handle). Stored server-side in Vercel Blob (`influencers/<userId>.json`)
  with a localStorage write-through cache; `syncInfluencers()` reconciles the two and
  migrates any local-only characters up to the server.
- **`@handle` mentions.** Typing `@handle` in a prompt resolves to the character's
  name and attaches her reference photo. Works in the Image studio and on Canvas
  **image** nodes.
- **Identity lock.** When a character is referenced, `IDENTITY_CLAUSE` is appended so
  the model keeps her exact face/hair (Nano Banana Pro otherwise renders a stranger).
- **Scope.** `@mention` is image-generation only — removed from the Video studio and
  Canvas non-image nodes to avoid implying unsupported behavior.

## Face Swap (new feature)

- **New Face Swap mode** in the Image studio: upload a scene photo, `@mention` one
  influencer, and her face is placed into the scene. Auto-selects Nano Banana Pro.
- **Per-model prompting:**
  - *Nano Banana Pro* uses a concise, proven prompt (it degrades with verbose prompts).
  - *Other models* use a detailed "adaptive" prompt that transfers only the identity
    and conforms head angle, gaze, expression, perspective, and lighting to the scene.
- **Hair preservation.** Both prompts keep the influencer's exact hair color/style.
- **Skin-tone harmonization.** The visible body skin (neck, shoulders, arms, hands) is
  recolored to match the swapped face's complexion — fixes the pale-face/tanner-body
  mismatch at the neckline.
- **Edit + @mention** uses an order-explicit identity clause ("first image is the scene,
  reference image is the person") so the model doesn't confuse which input is which.

## Image generation

- **Aspect auto-match.** Uploading a reference in Edit / Face Swap measures its
  dimensions and snaps the output aspect ratio to the closest match (e.g. a 9:16 photo
  → 9:16 output).
- **Instant placeholder + resumable jobs.** Pressing Generate shows a "Generating…"
  card immediately; in-flight jobs are persisted to localStorage so they survive
  navigating away or refreshing and **resume polling** when you return.
- **Cross-origin / cross-device gallery.** Every finished image is recorded in a
  server-side index, so generations show up regardless of which origin (apex vs www),
  device, or browser produced them — not just whoever's localStorage.
- **Edit endpoints fixed.** Flux 2 uses its dedicated `/edit` endpoint (the base
  endpoint silently ignored reference images); GPT Image 2 uses the preset `image_size`
  enum (custom dims 422'd).
- **Error surfacing.** Generation errors (e.g. fal `422 content_policy_violation`) show
  as a top toast that auto-dismisses after 5s instead of failing silently / looking like
  a timeout.
- **Enhance model picker** trimmed to GPT-4.1 mini and GPT-4.1.

## Video generation

- **Audio toggle** on Create. `enable_audio` is sent only to models that accept it
  (MiniMax Hailuo 2.3, Wan 2.7); Sora 2 and Veo produce audio natively; other endpoints
  don't expose audio and are left untouched (they 422 on unknown fields).
- **Status handling.** Video/image/upscale status routes treat only `IN_QUEUE` /
  `IN_PROGRESS` as "keep polling" and surface any other non-`COMPLETED` state as an
  error, so fal failures don't masquerade as timeouts.
- **Uploaded media** is shown full/uncropped (no forced crop) and hosted before being
  sent to fal (data URIs are rejected by `video_url` / strict `image_url` fields).

## Library (new feature)

- **`/library`** aggregates **every** generation regardless of where it was made — the
  server index (MCP + Image/Video/Upscale recordings) plus the local Image, Video,
  Upscale, and Canvas histories — deduped by URL, newest first, filterable by
  All / Images / Videos.
- **Server-side recording** added for Video and Upscale (`lib/serverGen.js`,
  `POST /api/generations`) so the library is complete across devices, matching what the
  Image studio already did.

## Canvas

- **Default video model** for new video nodes is now Kling 2.6.
- **Upstream node creation.** Dragging from a node's **left** handle onto empty canvas
  opens the node picker and wires the new node *into* the current one
  (`ConnectionMode.Loose`); the right handle still creates downstream nodes.
- **Per-node download.** Generated image/video nodes have a hover download button
  (replaced the non-functional upload button).
- **Node types** reduced to Image and Video (Text and Audio removed from the picker);
  legacy nodes of those kinds still render.
- **Node-persistence bug fixed (important).** `lib/store` `write()` had no error
  handling, so once a canvas exceeded the ~5MB localStorage quota (large base64
  outputs/uploads in node data) every autosave threw `QuotaExceededError` silently and
  newly-added nodes vanished on reload/return. `write()` now retries with a "lite" copy
  that strips inline `data:` blobs, so the workflow structure (nodes, edges, positions,
  prompts, URL outputs) always persists. The load effect also runs once per workflow so
  a stray re-render can't overwrite live in-memory nodes.
- **Navigation.** The Canvas tab returns to the open canvas if one is open, or the
  dashboard if you were on the dashboard — instead of always reopening the last workflow.

## Media hosting & persistence

- **Permanent hosting.** `uploadDataUrl` hosts media on Vercel Blob first (permanent),
  falling back to fal storage — fal URLs expire, which had caused influencer photos and
  generations to vanish.
- **Public Blob store** required; per-user data keyed by `uid()` which resolves to a
  shared `"public"` bucket while Clerk auth is disabled.

## Claude MCP connector

- **Open endpoint** at `/api/mcp` (no auth gate): Claude treats any 401 as an OAuth
  challenge and fails to register, so the endpoint is intentionally open.
- **Tools:** `generate_image`, `generate_video`, `check_video`, `generate_text`,
  `generate_audio`, `list_influencers`. Images/videos render **inline** in Claude via a
  hand-written MCP-Apps `ui://` widget; video uses raw `*.fal.media` URLs (range
  requests), images embed base64.
- **`@influencer` in MCP** reads the same shared influencer bucket.
- **Surface simplified** to Claude-only — removed the CLI one-line installer and the
  Anthropic Skill download options.

## Models

| Type | Models |
|---|---|
| Image (text-to-image + `/edit`) | Flux 2 Pro, Flux 2 Max, Nano Banana Pro, Seedream 4.5, GPT Image 2, GPT Image 1 |
| Video (t2v + i2v) | Kling 3.0 / 2.6 / 2.5 Turbo / v2, Seedance 2.0 (+ Fast), Wan 2.7 / 2.2, MiniMax Hailuo 2.3 / 02, PixVerse v6, Sora 2, LTX Video, Veo 3.1 / 3.1 Fast |
| Motion control | Kling 3.0/2.6 (pro + std) motion-control, Wan Motion, Wan 2.2 Animate (move/replace) |
| Video edit | Kling O1 video-to-video edit, Kling motion-control |
| Upscale | Clarity, Topaz Image, ESRGAN, AuraSR (image); Topaz Video, SeedVR2 (video) |

A single `FAL_KEY` powers all of them (including the `openai/*` and `bytedance/*`
namespaces hosted on fal).

## Known follow-ups (not yet done)

- Per-user auth (Clerk) + per-user MCP — currently open + shared `"public"` bucket.
- Real credit/billing — `lib/credits.js` is indicative numbers only.
- Host Canvas uploads to Blob instead of inline base64 (removes the quota pressure at
  its source).
