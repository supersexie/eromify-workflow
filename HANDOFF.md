# Eromify — Engineering Handoff

This document is the complete memory transfer for the **Eromify** project. A developer (or a fresh AI session) should be able to read this and continue building with zero prior context. Everything below reflects the actual code in the repository.

---

## Overview

**Eromify** (eromify.pro) is an AI-influencer content platform — a node-based canvas plus standalone studios for generating images, video, motion-controlled video, and upscaled media, all powered by AI models. The UI mimics Higgsfield.ai patterns. A reusable "@influencer" character system lets you summon a saved AI character (by face/likeness reference) into any generation.

| Aspect | Detail |
|---|---|
| **Framework** | Next.js `^15.0.3` (App Router) + React `^19.0.0` / react-dom `^19.0.0` |
| **Canvas UI** | React Flow (`@xyflow/react ^12.3.5`) |
| **Auth** | Clerk (`@clerk/nextjs ^7.5.7`) — **scaffolded but disabled** (no keys set); app is fully open |
| **AI providers** | fal.ai (`@fal-ai/client`) — images/video/upscale/motion; OpenAI — text, GPT image, prompt enhance, vision; ElevenLabs — TTS; Google Gemini/Veo — video |
| **Persistence** | Vercel Blob (`@vercel/blob ^2.4.1`) server-side; `localStorage` client-side |
| **MCP** | Open MCP server via `mcp-handler` + `@modelcontextprotocol/ext-apps` (inline media widget) |
| **Repo** | GitHub `supersexie/eromify-workflow` |
| **Deploy target** | Vercel (auto-deploys on push, ~1–2 min) |
| **Canonical domain** | `https://www.eromify.pro` (bare apex 308-redirects to www — see Domain section) |

A **single `FAL_KEY`** pays for ALL image/video/upscale/motion generation across fal, including the `openai/*` and `bytedance/*` namespaced endpoints hosted on fal.

> **Brand split:** the in-app UI says "Eromify"; the marketing/pricing page (`app/pricing/page.js`) and its copy/footers say "Genmax". The MCP connector URL is hardcoded to `eromify.pro`.

> **Heritage:** the project is derived from a prior "geoflix" template. `BACKEND.md`, `FRONTEND.md`, and `geoflix-mcp/index.js` are reference/template docs using old `GEOFLIX_*` names and `geoflix.online`. The live code uses `EROMIFY_*` / `eromify.pro`, but the Blob token resolver still **falls back to `GEOFLIX_READ_WRITE_TOKEN`**.

---

## Quick start

```bash
git clone https://github.com/supersexie/eromify-workflow.git
cd eromify-workflow
npm install
npm run dev          # next dev (port 3001 per .claude/launch.json)
```

Scripts (`package.json`): `dev` → `next dev`, `build` → `next build`, `start` → `next start`.

**Deploy flow:**

1. Edit code.
2. `npx next build` — verify it compiles.
3. `git commit` → `git push`.
4. Vercel auto-deploys (~1–2 min).

**Preview/dev server:** configured in `.claude/launch.json` (`npm run dev`, **port 3001**, config name `eromify-workflow`).

> ### CRITICAL GOTCHA — do not build against a live dev server
> Running `npx next build` while a `next dev` preview server is live **corrupts the dev server's `.next` cache** — you get blank pages, stale CSS, or `__webpack_modules__ is not a function`.
> **Fix:** stop the dev server, delete `.next`, restart. Always stop the dev server before building.

---

## Environment variables

Set in the Vercel dashboard. When a key is unset, the relevant route degrades to a mock/placeholder rather than crashing (except `prompt/from-image`, which hard-requires OpenAI).

| Variable | Required? | Purpose |
|---|---|---|
| `FAL_KEY` | **Yes** (for any real generation) | fal.ai credentials. Powers ALL image/video/upscale/motion generation. Also used as a **fallback file host** (`fal.storage.upload`) in `genstore.js`. Unset → routes return mock/picsum. |
| `BLOB_READ_WRITE_TOKEN` | **Yes** (for persistence) | Vercel Blob token. Stores influencers, the generations index, and hosts uploaded media. **The Blob store MUST be PUBLIC** — a private store rejects the public writes the code performs (`access:"public"`). |
| `OPENAI_API_KEY` | Recommended | Prompt Enhance (`/api/prompt/enhance`), image→prompt vision (`/api/prompt/from-image` — **503 if unset**), text generation, GPT image, assistant, TTS fallback. |
| `GEMINI_API_KEY` | Optional | Google Veo video models (`veo-3.1-*`), status polling, and the Veo file proxy. |
| `ELEVENLABS_API_KEY` | Optional | ElevenLabs TTS + voice listing (OpenAI TTS is the alternative path). |
| `EROMIFY_BASE_URL` | Optional | Overrides the MCP base URL. Defaults to `https://${VERCEL_PROJECT_PRODUCTION_URL}`, then `https://eromify.pro`. |
| `VERCEL_PROJECT_PRODUCTION_URL` | Auto (Vercel) | Production host; used as MCP base URL fallback. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | **Not set** | Master on/off switch for auth. **Currently unset → app is fully open, no sign-in.** When set: `ClerkProvider` wraps the app, middleware protects routes, sign-in/up render. |
| `CLERK_SECRET_KEY` | **Not set** | Clerk server secret; required by `@clerk/nextjs` whenever the publishable key is set. |
| `GEOFLIX_READ_WRITE_TOKEN` / `*_READ_WRITE_TOKEN` | Optional (legacy/fallback) | Secondary Blob token resolution. The resolver tries `BLOB_READ_WRITE_TOKEN` → `GEOFLIX_READ_WRITE_TOKEN` → any env key ending in `_READ_WRITE_TOKEN`. |
| `MCP_KEY` | **Not used** | Referenced only in `BACKEND.md`. The live MCP endpoint is intentionally OPEN and does not read it. |

> **Because Clerk is off,** `uid()` resolves to the shared `"public"` bucket everywhere — influencers and per-user data are a single shared store.

---

## Architecture

App root: `C:/Users/91821/eromify-workflow`.

### Pages (`app/**/page.js`)

| Route | File | Purpose |
|---|---|---|
| `/` | `app/page.js` | `redirect("/app")` — workflow-first launch; real landing TODO. |
| `/app` | `app/app/page.js` | `<Dashboard />` — canvas list / home. |
| `/w/[id]` | `app/w/[id]/page.js` | `<Canvas workflowId={id} />` — node editor. |
| `/pricing` | `app/pricing/page.js` | Self-contained "Genmax" marketing pricing page. |
| `/image` | `app/image/page.js` | `<ImagePage />`. |
| `/video` | `app/video/page.js` | `<VideoPage />` (Create / Edit / Motion sub-tabs via `?sub=`). |
| `/motion` | `app/motion/page.js` | Legacy redirect → `/video?sub=motion`. |
| `/upscale` | `app/upscale/page.js` | `<UpscalePage />`. |
| `/influencers` | `app/influencers/page.js` | `<InfluencersPage />`. |
| `/mcp` | `app/mcp/page.js` | `<MCPPage />` — connector setup instructions. |
| `/sign-in/[[...sign-in]]` | `app/sign-in/.../page.js` | Clerk `<SignIn>`; redirects to `/app` if Clerk disabled. |
| `/sign-up/[[...sign-up]]` | `app/sign-up/.../page.js` | Clerk `<SignUp>`; redirects to `/app` if Clerk disabled. |

### Components (`components/`)

| Component | Used by | Role |
|---|---|---|
| `Dashboard.js` | `/app` | Canvas list, create/rename/delete, "New Canvas" modal. |
| `Canvas.js` | `/w/[id]` | Core React Flow editor: nodes/edges, autosave, 50-step undo/redo, batch runs, **Director mode**, rail, add-node menu, PromptBar, Assistant, Library. |
| `ImagePage.js` | `/image` | Image studio (Generate / Edit), model+aspect+quality+batch, Enhance, image→prompt, lightbox, `localStorage` gallery. |
| `VideoPage.js` | `/video` | Create / Edit / Motion sub-tabs. |
| `UpscalePage.js` | `/upscale` | Image/video upscaler. |
| `InfluencersPage.js` | `/influencers` | CRUD for AI characters (handle + photo). |
| `MCPPage.js` | `/mcp` | Static connector/CLI/Skill setup instructions. |
| `TopBar.js` | all section pages | Brand + centered nav pill + right actions slot. |
| `Tabs.js` | TopBar / Canvas | Section tab strip (Suspense-wrapped). |
| `SectionHero.js` | Image/Video/Influencers | Empty-state hero. |
| `PromptBar.js` | Canvas | Per-node prompt/controls + Generate button. |
| `MentionField.js` | Image/Video/PromptBar | `@handle` pink-pill overlay + autocomplete. |
| `Assistant.js` | Canvas | Chat panel → creates/runs nodes or triggers Director mode. |
| `Library.js` | Canvas | Modal gallery merging local + server generations. |
| `UserMenu.js` | all TopBars / Canvas | Clerk `<UserButton>`; renders `null` when Clerk off. |
| `nodes/WorkflowNode.js` | Canvas | Custom React Flow node (`type:"workflow"`). |
| `PropertiesPanel.js` | **nobody** | Dead/legacy; superseded by `PromptBar`. |

### lib/ (`lib/`)

| File | Role |
|---|---|
| `run.js` | Client generation orchestration — POST `/start`, poll `/status`. Exports `generateOutput`, `generateVideo`, `generateMotion`, `generateVideoEdit`, `upscaleMedia`, `combineVideos`. |
| `genstore.js` | Server-side: `uploadDataUrl` (host media → Blob/fal), `getGenerations` / `addGeneration` (Blob index `generations.json`, max 500), `configured()`. |
| `influencers.js` | Client influencer store (localStorage `eromify:influencers:v1`) + `syncInfluencers`, `resolveMentions`, `IDENTITY_CLAUSE`, remote save/delete. |
| `influencerStore.js` | Server-side per-user Blob store at `influencers/<userId>.json`. |
| `falImage.js` | `FAL_IMAGE_MAP` / `FAL_EDIT_MAP` + `pickImageEndpoint(model, hasImages)`. |
| `credits.js` | Pure credit-cost estimators (indicative only). |
| `store.js` | Client workflow store (localStorage `wfc:workflows:v1`) + generation history (`eromify:genHistory:v1`). |
| `cardSize.js` | Aspect-ratio-driven node sizing (`bodyDims`, `nodeDims`, `aspectRatio`). |
| `mockRun.js` | `mockOutput(kind, prompt)` + `topoOrder` (Kahn's topological sort). |

### API routes (`app/api/**/route.js`)

| Route | Methods | Purpose |
|---|---|---|
| `image/start` | POST | Submit image gen to fal **queue**; returns `{statusUrl, responseUrl}`. |
| `image/status` | POST | Poll fal; returns `{done, output}`. |
| `video/start` | POST | 4 branches: edit / motion / fal t2v-i2v / Veo. |
| `video/status` | POST | Poll fal or Veo. |
| `video/combine/start` + `/status` | POST | Stitch clips into one video. |
| `video/file`, `video/check` | GET/POST | Veo file proxy + status. |
| `upscale/start` + `/status` | POST | Image/video upscale via fal queue. |
| `generate` | POST | **Synchronous** gen (image/text/audio) — used by MCP + assistant. |
| `generations` | GET | Read Blob generations index. |
| `media` | GET | Allowlisted media proxy (`?u=`) for the MCP widget iframe. |
| `influencers` | GET/POST/DELETE | Per-user influencer CRUD (Blob). |
| `prompt/enhance` | POST | LLM prompt rewriter (graceful fallback w/o OpenAI). |
| `prompt/from-image` | POST | Vision reverse-prompt (**503 without OpenAI**). |
| `audio/voices` | GET | List TTS voices. |
| `assistant` | POST | Canvas chat assistant. |
| `[transport]` | GET/POST/DELETE | The MCP server. |

### Infrastructure

- **`middleware.js`** — (1) canonical-host 308 redirect apex→www (skips `/api*`); (2) Clerk route protection (only active when the Clerk key is set). When Clerk is unset, only the host redirect runs. Protected matcher: `/app`, `/w`, `/motion`, `/image`, `/video`, `/upscale`, `/influencers`, `/mcp`.
- **`app/layout.js`** — root layout; metadata; inline `<head>` apex→www `location.replace` guard; conditional `<ClerkProvider>`.
- **`next.config.js`** — minimal: `{ reactStrictMode: true }`.

---

## Core systems

### 1. Generation pipeline (start + poll)

The async media routes all follow the same pattern: a `/start` route submits a job to the **fal async queue** (`https://queue.fal.run/<endpoint>`, `Authorization: Key <FAL_KEY>`) and returns `{ statusUrl, responseUrl }`; the matching `/status` route polls it. Client orchestration lives in `lib/run.js` (POST `/start`, then poll `/status` on an interval until `done`, with a wall-clock deadline).

| Operation | start route | client fn (`run.js`) | deadline / poll |
|---|---|---|---|
| Image | `image/start` | `generateImage` (internal) | 5 min / 3s |
| Video | `video/start` | `generateVideo` | 5 min / 6s |
| Video edit | `video/start` (`kind:"edit"`) | `generateVideoEdit` | 15 min / 6s |
| Motion | `video/start` (`kind:"motion"`) | `generateMotion` | 15 min / 6s |
| Upscale | `upscale/start` | `upscaleMedia` | 15 min / 6s video, 3s image |
| Combine | `video/combine/start` | `combineVideos` | 4 min / 4s |

> **Note:** `app/api/generate/route.js` is the **synchronous** path (calls `https://fal.run/<endpoint>` directly, not the queue). It's used by the MCP and the canvas assistant for image/text/audio.

**Status error handling (critical invariant):** every `/status` route treats **only `IN_QUEUE` / `IN_PROGRESS` as "keep polling"** (`{done:false}`). Any other non-`COMPLETED` state (e.g. `ERROR`, `FAILED`, OpenAI moderation rejections) **throws (500)** and surfaces as an error. Without this, fal failures look like silent timeouts. On `COMPLETED`, the route GETs the `responseUrl` and extracts the output URL:
- image: `result.images[0].url || result.image.url`
- video: `result.video.url || result.videos[0].url`
- upscale: `result.image.url || result.images[0].url || result.video.url || result.output.url`

`lib/run.js`'s internal `safeJson()` detects Vercel timeout HTML pages (`FUNCTION_INVOCATION_TIMEOUT`) and converts them into clean error messages suggesting a cheaper model.

**Media hosting — `lib/genstore.js` `uploadDataUrl(dataUrl, prefix)`:** fal endpoints reject `data:` URIs for `video_url` / strict `image_url` fields, so any base64 media must be hosted to a real URL first.
- Pass-through if already `http(s)` or not a data URI.
- **Strategy 1 (preferred, permanent):** Vercel Blob `put` (`access:"public"`, `addRandomSuffix:false`). Chosen because **fal storage URLs EXPIRE**.
- **Strategy 2 (fallback):** `fal.storage.upload` (only if `FAL_KEY` set).
- Throws if neither host is configured (a Blob failure only rethrows when there's no fal fallback).

### 2. Models & fal endpoints

All endpoints dispatch against `https://queue.fal.run/{endpoint}` (Veo → Google instead). A single `FAL_KEY` covers all of them, including `openai/*` and `bytedance/*` namespaces.

#### Image — text-to-image (`FAL_IMAGE_MAP`, `lib/falImage.js`)

| Model label | fal endpoint |
|---|---|
| Flux 2 Pro | `fal-ai/flux-2-pro` |
| Flux 2 Max | `fal-ai/flux-2-max` |
| Nano Banana Pro | `fal-ai/nano-banana-pro` |
| Seedream 4.5 | `fal-ai/bytedance/seedream/v4.5/text-to-image` |
| GPT Image 2 | `openai/gpt-image-2` |
| GPT Image 1 | `fal-ai/gpt-image-1/text-to-image` |

#### Image — edit / image-to-image (`FAL_EDIT_MAP`) — takes `prompt` + `image_urls`

| Model label | fal edit endpoint |
|---|---|
| Flux 2 Pro | `fal-ai/flux-2-pro/edit` |
| Flux 2 Max | `fal-ai/flux-2-max/edit` |
| Nano Banana Pro | `fal-ai/nano-banana-pro/edit` |
| Seedream 4.5 | `fal-ai/bytedance/seedream/v4.5/edit` |
| GPT Image 2 | `openai/gpt-image-2/edit` |
| GPT Image 1 | `fal-ai/gpt-image-1/edit-image` |

`pickImageEndpoint(model, hasImages)`: edit if `hasImages` (fallback `fal-ai/nano-banana-pro/edit`), else t2i (fallback `fal-ai/flux-2-pro`).

**Aspect/size snapping (`image/start`):** Flux 2 Pro/Max + GPT Image 2 → `image_size` **preset enum** (`square_hd`, `portrait_*`, `landscape_*`); Nano Banana Pro → `aspect_ratio` string; everything else → custom `{width,height}` snapped to multiples of 64 (max edge 1024/2048/4096 by quality 1K/2K/4K).

#### Video — Create (`FAL_MODELS`, `app/api/video/start/route.js`) — `i2v` used when a start `image` is present

| Model label | text-to-video | image-to-video | `ar` flag |
|---|---|---|---|
| Kling 3.0 | `fal-ai/kling-video/v3/pro/text-to-video` | `fal-ai/kling-video/v3/pro/image-to-video` | — |
| Kling 2.6 | `fal-ai/kling-video/v2.6/pro/text-to-video` | `fal-ai/kling-video/v2.6/pro/image-to-video` | — |
| Kling 2.5 Turbo | `fal-ai/kling-video/v2.5-turbo/pro/text-to-video` | `fal-ai/kling-video/v2.5-turbo/pro/image-to-video` | — |
| Kling v2 | `fal-ai/kling-video/v2/master/text-to-video` | `fal-ai/kling-video/v2/master/image-to-video` | — |
| Seedance 2.0 | `bytedance/seedance-2.0/text-to-video` | `bytedance/seedance-2.0/image-to-video` | — |
| Seedance 2.0 Fast | `bytedance/seedance-2.0/fast/text-to-video` | `bytedance/seedance-2.0/fast/image-to-video` | — |
| Wan 2.7 | `fal-ai/wan/v2.7/text-to-video` | `fal-ai/wan/v2.7/image-to-video` | — |
| Wan 2.2 | `fal-ai/wan/v2.2-a14b/text-to-video` | `fal-ai/wan/v2.2-a14b/image-to-video` | **true** |
| MiniMax Hailuo 2.3 | `fal-ai/minimax/hailuo-2.3/pro/text-to-video` | `fal-ai/minimax/hailuo-2.3/pro/image-to-video` | — |
| MiniMax Hailuo | `fal-ai/minimax/hailuo-02/standard/text-to-video` | `fal-ai/minimax/hailuo-02/standard/image-to-video` | — |
| PixVerse v6 | `fal-ai/pixverse/v6/text-to-video` | `fal-ai/pixverse/v6/image-to-video` | — |
| Sora 2 | `fal-ai/sora-2/text-to-video` | `fal-ai/sora-2/image-to-video` | — |
| LTX Video | `fal-ai/ltx-video` | `fal-ai/ltx-video/image-to-video` | **true** |

`ar:true` endpoints (Wan 2.2, LTX) get an explicit `aspect_ratio` (the endpoint 422s on "auto"). fal fallback for unknown models → **LTX Video**.

#### Video — Google Veo (`VEO_MODELS`) — routed to Google, NOT fal

| Model label | Veo model id |
|---|---|
| Veo 3.1 Fast | `veo-3.1-fast-generate-preview` |
| Veo 3.1 | `veo-3.1-generate-preview` |

Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/{modelId}:predictLongRunning` with `x-goog-api-key: <GEMINI_API_KEY>`. Veo fallback: `veo-3.1-fast-generate-preview`. Output video is wrapped as `/api/video/file?uri=...`.

#### Motion Control (`FAL_MOTION_MODELS`) — `{image_url, video_url, prompt?}`; Kling endpoints also set `character_orientation:"video"`

| Model label | fal endpoint |
|---|---|
| Kling 3.0 Motion Control | `fal-ai/kling-video/v3/pro/motion-control` |
| Kling 3.0 Motion Control Std | `fal-ai/kling-video/v3/standard/motion-control` |
| Kling Motion Control Pro | `fal-ai/kling-video/v2.6/pro/motion-control` |
| Kling Motion Control Std | `fal-ai/kling-video/v2.6/standard/motion-control` |
| Wan Motion | `fal-ai/wan-motion` |
| Wan 2.2 Animate Move | `fal-ai/wan/v2.2-14b/animate/move` |
| Wan 2.2 Animate Replace | `fal-ai/wan/v2.2-14b/animate/replace` |

Motion fallback: `Kling Motion Control Pro`.

#### Video Edit (`FAL_EDIT_MODELS`) — `{video_url, prompt, image_urls?(≤4)}`

| Model label (UI) | fal endpoint |
|---|---|
| Kling O1 Video Edit | `fal-ai/kling-video/o1/video-to-video/edit` |
| Kling O3 Omni Edit | `fal-ai/kling-video/o1/video-to-video/edit` *(same as O1 — placeholder/dup)* |
| Kling Motion Control | `fal-ai/kling-video/v2.6/pro/motion-control` |

Edit fallback: `Kling O1 Video Edit`.

#### Upscale (`app/api/upscale/start/route.js`)

| Model label | fal endpoint | factor param |
|---|---|---|
| Clarity Upscaler (image) | `fal-ai/clarity-upscaler` | `upscale_factor` |
| Topaz Image | `fal-ai/topaz/upscale/image` | `upscale_factor` |
| ESRGAN | `fal-ai/esrgan` | `scale` |
| AuraSR (4x) | `fal-ai/aura-sr` | none (fixed 4×) |
| Topaz Video | `fal-ai/topaz/upscale/video` | `upscale_factor` |
| SeedVR2 | `fal-ai/seedvr/upscale/video` | `upscale_factor` |

Fallbacks: image → `Clarity Upscaler`, video → `Topaz Video`.

> **Two model catalogs exist and are maintained independently:** the **fal endpoint maps** (routing, above) and the **`credits.js` price tables** (cost, below). They do not fully overlap.

### 3. Influencers & @mention

An influencer/character = `{ id, handle, name, description, image, ts }` (image = downscaled ~1024px JPEG likeness reference). The UI form collects only a `user_name` (handle) + one photo; `name == handle`.

**Two parallel persistence layers:**
- **Server (durable source of truth):** `lib/influencerStore.js` → Vercel Blob at `influencers/<userId>.json`. With Clerk off, `userId` is always `"public"` → a single shared bucket. Backed by `app/api/influencers` (GET/POST/DELETE).
- **Client cache + offline fallback:** `lib/influencers.js` → localStorage `eromify:influencers:v1`. This is the fast cache `resolveMentions` reads during generation.

**`syncInfluencers()`** reconciles the two (SSR-safe), with a 4s failsafe timeout in `InfluencersPage.js`:
- Server has non-empty `items` → **server wins**, overwrite local cache.
- Server empty but local has entries → **migrate up** (`POST {seed: local}`), recovering characters created before the server store existed.
- Error / no data → fall back to `listInfluencers()`.

**`resolveMentions(text)`** regex-replaces `@([a-z0-9_]+)` (case-insensitive): unknown handles left untouched; known handles swapped for the character's natural-language `name`; returns `{ prompt, characters }` (each carries its hosted `image` reference, deduped by `id`). The matched character's image is sent to the model's **edit** endpoint (image-to-image) for images, or as the **start frame** for video.

**`IDENTITY_CLAUSE`** (appended whenever a reference image is attached), verbatim:
> "Use the person shown in the reference image as the exact subject — keep their exact face, facial features, and hair identical to the reference; do not invent a different person."

This is needed because Nano Banana Pro (Gemini) renders a generic stranger otherwise; it's harmless reinforcement for other edit models.

`@mention` works in: Image page, Video (create), Canvas nodes, and the MCP. UI rendering of `@handle` pills lives in `components/MentionField.js` (overlay technique + autocomplete dropdown).

> **Per-origin localStorage caveat:** localStorage is PER-ORIGIN. The www/non-www domain split caused influencers to "disappear" repeatedly — always use `www.eromify.pro`. (The server Blob store and the canonical redirect both exist to mitigate this.)

### 4. Canvas (`components/Canvas.js`)

The node-based editor on `/w/[id]`, built on React Flow (`@xyflow/react`), wrapped in `<ReactFlowProvider>`.

- Loads/saves the workflow via `lib/store` (`wfc:workflows:v1`), with **debounced autosave** and **50-step undo/redo** (Ctrl/Cmd+Z / +Y).
- Manages nodes/edges; upstream output propagates to downstream `sourceThumb`; drop-to-create connected nodes (type picker).
- **Batch runs:** 1–4 clones in parallel.
- **Director mode** (`runDirector`): reference image → per-scene image-to-image → image-to-video → stitched `combineVideos`.
- Custom node `nodes/WorkflowNode.js` (`type:"workflow"`): per-kind header/preview (image/video/text/audio/motion), upload affordance, source-thumb tile from upstream, running/error states, left target + right source handles; sized via `lib/cardSize`.
- **`PromptBar.js`** is the per-selected-node controls bar: model lists (image/video/text/motion), aspect/quality chips, video duration/audio chips, voice picker (`/api/audio/voices`, cached), batch stepper (1–4), prompt Enhance (selectable+persisted model), reference-image→prompt, `MentionField`, live credit estimate, Generate button.
- **`Assistant.js`** posts to `/api/assistant` → creates+optionally-auto-runs a single node, or triggers Director mode (≥2 scenes → parallel generate + stitch). Has an auto-run toggle + director video-model select.
- **`Library.js`** merges local `listGenerations()` with server `/api/generations` (e.g. MCP-created items), deduped by URL, with cross-origin blob download fallback.
- Generations run via `lib/run` and `@mentions` resolve via `lib/influencers`.

### 5. Prompt Enhance (`app/api/prompt/enhance/route.js`)

LLM prompt-rewriter. Picks one of four system prompts: `kind` (image/video) × `hasSourceImage`. The **FROM_SOURCE** variants avoid injecting the Eromify house-style realism template when a source image already locks identity/scene (i.e. identity lock takes precedence over house style). Model allowlist: `{gpt-4.1-mini, gpt-4.1, gpt-4o, gpt-4o-mini, gpt-5.5, gpt-5.5-pro}`, default `gpt-4.1-mini`; `max_tokens:400, temperature:0.7`; strips surrounding quotes. The enhance model is selectable in the UI and persisted.

Without `OPENAI_API_KEY`: graceful fallback (no 503) — returns `{ prompt: hasSourceImage ? input : "<input>, <HOUSE_STYLE>", fallback:true }`.

**`prompt/from-image`** (reverse-prompt/vision) is stricter: it **hard-requires `OPENAI_API_KEY` (503 if unset)**, default `gpt-4o-mini`, sends `{type:"image_url", detail:"low"}`. Two system prompts (image vs. video starting-frame description).

### 6. Credits estimator (`lib/credits.js`)

**Indicative cost only — there is NO real billing/credit system.** All estimators are pure (UI recomputes live on every settings change) and floor at 1. `QUALITY_MULT = {1K:1, 2K:2, 4K:4}`.

| Export | Formula |
|---|---|
| `imageCredits({model,quality,batch,edit})` | `round(IMAGE_BASE[model]??2 × QUALITY_MULT) + (edit?1:0)`, `× batch` |
| `videoCredits({model,duration,quality})` | `round(VIDEO_BASE[model]??6 × (secs/4) × q)`, `q=1.5` for 1080p |
| `motionCredits({model,quality})` | `round(MOTION_BASE[model]??8 × (1080p?1.5:1))` |
| `editCredits({model,quality})` | `round(EDIT_BASE[model]??8 × (1080p?1.5:1))` |
| `upscaleCredits({kind,model,scale})` | `f=2` if `≥4x` else 1; video `VID_UPSCALE_BASE??6`, image `IMG_UPSCALE_BASE??2`, `× f` |

Base tables (credit cost, NOT fal endpoints): e.g. `IMAGE_BASE` Flux 2 Pro 2 / Flux 2 Max 3 / GPT Image 2 3; `VIDEO_BASE` Sora 2 12 / LTX Video 3 / Veo 3.1 12; `MOTION_BASE` Kling 3.0 Motion Control 10; `EDIT_BASE` Kling O3 Omni Edit 10; upscalers Topaz Video 8 / ESRGAN 1.

### 7. MCP connector

Endpoint: **`https://eromify.pro/api/mcp`** (served by `app/api/[transport]/route.js` via `createMcpHandler`, `basePath:"/api"`, `maxDuration=60`). Bound to `GET`/`POST`/`DELETE`.

> **Intentionally OPEN — no auth.** claude.ai treats any `401` from an MCP connector as an OAuth challenge and attempts dynamic client registration (which this server doesn't implement), failing with "couldn't register with sign-in service". A `?key=` gate broke the connection and was removed.

**Base URL resolution:** `EROMIFY_BASE_URL` → `https://${VERCEL_PROJECT_PRODUCTION_URL}` → `https://eromify.pro`. MCP tools call the app's own `/api/*` routes via `postJson`, record results via `addGeneration`, and read influencers from the shared `getInfluencers("public")` bucket.

**Tools:**

| Tool | Type | Inline? | Inputs |
|---|---|---|---|
| `generate_image` | app tool | yes | `prompt` (req), `model?` (Flux 2 Pro/Max, Nano Banana Pro, Seedream 4.5, GPT Image 2/1) |
| `generate_video` | app tool | yes | `prompt` (req), `model?` (15 video models; default **LTX Video**), `image_url?`, `aspect?` (16:9\|9:16), `resolution?` (720p\|1080p), `duration?` |
| `check_video` | app tool | yes | `handle` (JSON string from `generate_video`) |
| `generate_text` | plain | no | `prompt` (req) |
| `generate_audio` | plain | no (native audio) | `prompt` (req) |
| `list_influencers` | plain | no | none |

- `generate_image`: resolves `@handle` → if an influencer image matched, routes through `/api/image/start` (edit + `IDENTITY_CLAUSE`), polls `/api/image/status` (≤55s); else `/api/generate`. Embeds the result as a base64 `data:` URI in `structuredContent:{kind:"image", url:proxied(url), image:<dataURI>}`. OpenAI base64 outputs return a native `{type:"image", data, mimeType}` block.
- `generate_video`: resolves `@handle` → influencer photo becomes the start frame + identity lock. Default model **LTX Video**. Polls `pollVideo` (≤45s). If not done, returns the JSON `handle` for `check_video` (which polls ≤50s).
- **Inline media widget** (`app/api/[transport]/widget-html.js`, resource `ui://eromify/media-v1.html`): a tiny hand-written self-contained HTML/JS doc (auto-generated by `geoflix-widget/build.js`). It does the MCP-Apps handshake (`ui/initialize` with `protocolVersion:'2026-01-26'`, `appInfo`, `appCapabilities:{availableDisplayModes:['inline']}`, then `ui/notifications/initialized`), runs `findMedia()` recursively (depth ≤10) over inbound messages — embedded base64 `image` wins, then `url` — and renders an `<img>` (base64) or `<video>` (autoplay/loop/muted/controls), reporting iframe size back via `ui/notifications/size-changed`.
- **Video URL strategy:** raw `*.fal.media` / `*.fal.run` URLs are passed through directly (the fal CDN supports HTTP **range requests**, so `<video>` can seek/stream); non-fal URLs go through `proxied()`. (The MEMORY note confirms the tiny hand-written widget works inline; the full ext-apps SDK bundle renders blank, and embedded video/mp4 blobs / bare .mp4 URLs don't play.)
- **CSP `resourceDomains`:** `[BASE, "https://*.fal.media", "https://*.googleapis.com"]`. (Note: `*.fal.run` is used in the pass-through regex but NOT in this allowlist.)
- The **`/api/media` proxy** (`app/api/media/route.js`) is the security boundary for what the widget iframe can load: host allowlist (`*.fal.media`, `*.fal.run`, `*.googleapis.com`, `storage.googleapis.com`, `*.eromify.com`, `generativelanguage.googleapis.com`), forwards `Range` for streaming, else **403**.

> **claude.ai CACHES the widget + tool list at connect time.** Changing tools or the widget HTML requires **removing and re-adding the connector** in Claude.

---

## Domain & data persistence

- **`www.eromify.pro` is canonical.** The bare apex `eromify.pro` 308-redirects to www via `middleware.js` (pages) **plus** an inline `<script>` `location.replace` guard in `app/layout.js`. The redirect **skips `/api*`** so the MCP connector URL and same-origin `/api` calls keep working (and to avoid a CORS split that made influencers appear empty).
- **Vercel Blob store must be PUBLIC** — the code writes with `access:"public"`; a private store rejects these writes. Used for: `influencers/<userId>.json`, the `generations.json` index, and hosting uploaded media (permanent, vs expiring fal URLs).
- **Per-user "public" bucket:** with Clerk off, `uid()` → `"public"` everywhere (web API and MCP). All influencer/data reads/writes share this one bucket.
- **Client persistence:** image/video/upscale galleries in `localStorage` (`eromify:imageHistory:v1`, `eromify:videoHistory:v1`, `eromify:upscaleHistory:v1`); workflows in `wfc:workflows:v1`; generation history in `eromify:genHistory:v1` (`MAX_GENS=500`); influencer cache in `eromify:influencers:v1`.

---

## Known issues & TODOs

| Item | Status |
|---|---|
| **Per-user MCP auth via OAuth (Clerk)** | Deferred. User chose per-user, but currently the MCP is open + shared `"public"` bucket. Comment in route: "will be added before public launch." |
| **Real credit/billing system** | TODO. `lib/credits.js` is fake/indicative numbers only. |
| **"brooke" influencer photo expired** | Its original fal URL 404'd before re-host; needs a fresh upload. (`ash`/`katrina`/`ellie` were re-hosted to permanent Blob URLs.) |
| **Clerk sign-in not enabled** | Scaffolded (middleware, `ClerkProvider`, sign-in/up pages) but keys unset → app is open. |
| **Real landing page** | `/` redirects to `/app`. The pricing nav anchors (`/#tools`, `/#features`, `/#mcp`, `/#faq`) point at a landing page that doesn't exist yet. |
| **`PropertiesPanel.js`** | Dead/legacy component, no importer; superseded by `PromptBar`. |
| **Kling O3 Omni Edit** | Maps to the same endpoint as Kling O1 Video Edit — placeholder/duplicate. |
| **`*.fal.run` CSP gap** | Used in the video pass-through regex but not listed in widget `resourceDomains`. |

---

## Gotchas / hard-won lessons

| Lesson | Detail |
|---|---|
| **fal storage URLs expire** | This is why influencer photos vanished. `uploadDataUrl` prefers permanent Vercel Blob; fal storage is fallback only. |
| **www/non-www localStorage split** | localStorage is per-origin; the domain split made influencers "disappear". Always use `www.eromify.pro`; the canonical redirect + server Blob store mitigate it. |
| **401 → OAuth in MCP** | Any 401 makes claude.ai attempt dynamic client registration and fail. The MCP endpoint MUST stay open (no auth gate, no `?key=`). |
| **Flux 2 needs `/edit`** | The base Flux endpoint **ignores `image_urls`** — references silently don't apply. Must use the dedicated `/edit` endpoint for image-to-image. |
| **GPT Image 2 preset enum** | Must use the `image_size` preset enum (`square_hd`, etc.); custom dims return a **422**. |
| **Status non-COMPLETED handling** | Only `IN_QUEUE`/`IN_PROGRESS` mean "keep polling"; any other non-`COMPLETED` state must throw, or fal failures (e.g. OpenAI moderation) look like silent timeouts. |
| **Dev-build cache corruption** | Running `npx next build` against a live `next dev` server corrupts `.next` (blank pages / stale CSS / `__webpack_modules__ is not a function`). Stop dev, delete `.next`, restart. |
| **MCP widget/tool caching** | claude.ai caches the widget HTML + tool list at connect time. To ship changes, remove and re-add the connector. |
| **Tiny widget only** | The hand-written ~1.6KB `ui://` widget renders video inline; the 376KB ext-apps SDK bundle renders blank. Embedded video/mp4 blobs and bare `.mp4` URLs don't play — use raw `*.fal.media` URLs (range requests). |
| **Railway ffmpeg** | (prior-project memory) ffmpeg has no `drawtext` on Railway — burn text via ASS/libass; `acopy` is gone in ffmpeg 7.x (use `anull`). Relevant if video combine ever moves off fal. |
| **`prompt/from-image` 503** | Unlike `prompt/enhance`, it hard-requires `OPENAI_API_KEY`. |

---

## Where to look ("if you want to change X, edit Y")

| Want to change… | Edit… |
|---|---|
| Image model list / fal endpoints | `lib/falImage.js` (maps) + `components/ImagePage.js` (UI catalog) |
| Image size/aspect snapping | `app/api/image/start/route.js` |
| Video / motion / edit model endpoints | `app/api/video/start/route.js` (`FAL_MODELS`, `FAL_MOTION_MODELS`, `FAL_EDIT_MODELS`, `VEO_MODELS`) + `components/VideoPage.js` |
| Upscale models | `app/api/upscale/start/route.js` + `components/UpscalePage.js` |
| Poll deadlines / intervals / error parsing | `lib/run.js` |
| Status output extraction / polling invariant | `app/api/{image,video,upscale}/status/route.js` |
| Media hosting (Blob vs fal) | `lib/genstore.js` (`uploadDataUrl`) |
| Influencer @mention resolution / IDENTITY_CLAUSE | `lib/influencers.js` |
| Influencer server storage | `lib/influencerStore.js` + `app/api/influencers/route.js` |
| Prompt enhance behavior / house style / model allowlist | `app/api/prompt/enhance/route.js` |
| Image→prompt vision | `app/api/prompt/from-image/route.js` |
| Credit prices | `lib/credits.js` |
| Canvas editor / Director mode / undo-redo | `components/Canvas.js` |
| Per-node controls / Generate button | `components/PromptBar.js` |
| Node rendering / sizing | `components/nodes/WorkflowNode.js` + `lib/cardSize.js` |
| @mention input UI | `components/MentionField.js` |
| Workflow / generation-history storage | `lib/store.js` |
| MCP tools / inline rendering | `app/api/[transport]/route.js` |
| MCP widget HTML | `app/api/[transport]/widget-html.js` (auto-generated by `geoflix-widget/build.js` — don't hand-edit) |
| Media proxy allowlist | `app/api/media/route.js` |
| Canonical redirect / auth gate | `middleware.js` (+ `app/layout.js` inline guard) |
| Enable Clerk auth | Set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` (then `middleware.js`, `layout.js`, `UserMenu.js` activate) |
| Section nav tabs | `components/Tabs.js` |
| MCP/CLI setup page | `components/MCPPage.js` |
| Pricing / marketing ("Genmax") | `app/pricing/page.js` |
