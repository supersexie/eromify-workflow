# Eromify — Engineering Handoff

Complete memory transfer for **Eromify**. A developer (or a fresh AI session) should be
able to read this and continue with zero prior context. Companion docs:
[PRODUCT-CHANGES.md](PRODUCT-CHANGES.md) (functional changelog) and
[FRONTEND-CHANGES.md](FRONTEND-CHANGES.md) (UI changelog).

---

## Overview

Eromify is an AI-influencer content platform: a node-based **Canvas** plus standalone
studios for generating **images, video, motion-controlled video, and upscales**, a
reusable **@influencer** character system, a **Library**, and a **Claude MCP** connector.

| Aspect | Detail |
|---|---|
| Framework | Next.js `^15` (App Router) + React `^19` |
| Canvas | React Flow (`@xyflow/react`) |
| Auth | Clerk (`@clerk/nextjs`) — scaffolded, **off** until keys are set (see Auth) |
| AI | fal.ai (images/video/upscale/motion), OpenAI (prompt enhance + vision), Google Veo (video), ElevenLabs (TTS) |
| Persistence | Vercel Blob (server) + `localStorage` (client) |
| MCP | `mcp-handler` + `@modelcontextprotocol/ext-apps` (inline media widget) |
| Repo | GitHub `supersexie/eromify-workflow` |
| Deploy | Vercel (auto-deploys on push to `main`) |
| Canonical domain | `https://www.eromify.pro` (apex 308-redirects to www) |

A **single `FAL_KEY`** pays for ALL image/video/upscale/motion generation, including the
`openai/*` and `bytedance/*` namespaces hosted on fal.

---

## Quick start

```bash
git clone https://github.com/supersexie/eromify-workflow.git
cd eromify-workflow
npm install
npm run dev          # next dev, port 3001 (.claude/launch.json)
```

**Deploy flow:** edit → `npx next build` (verify) → `git commit` → `git push` → Vercel
auto-deploys (~1–2 min).

> **GOTCHA:** never run `npx next build` while a `next dev` server is live — it corrupts
> the dev server's `.next` cache (blank pages / stale CSS / `__webpack_modules__ is not a
> function`). Stop dev, delete `.next`, restart.

---

## Environment variables (Vercel)

| Variable | Required? | Purpose |
|---|---|---|
| `FAL_KEY` | **Yes** | fal.ai — all image/video/upscale/motion. Unset → routes return mock/picsum. |
| `BLOB_READ_WRITE_TOKEN` | **Yes** | Vercel Blob. **Store MUST be PUBLIC** (code writes `access:"public"`). Stores influencers, the generations index, and hosts uploaded media. |
| `OPENAI_API_KEY` | Recommended | Prompt Enhance, image→prompt vision (**503 without it**), text/assistant. |
| `GEMINI_API_KEY` | Optional | Google Veo video models + status + file proxy. |
| `ELEVENLABS_API_KEY` | Optional | ElevenLabs TTS (OpenAI TTS is the alternative). |
| `EROMIFY_BASE_URL` | Optional | Overrides MCP base URL. Falls back to `VERCEL_PROJECT_PRODUCTION_URL`, then `https://eromify.pro`. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Off | Master auth switch. Unset → app is open, `uid()` = `"public"`. Set → auth turns on everywhere. |
| `CLERK_SECRET_KEY` | Off | Required alongside the publishable key. |
| `GEOFLIX_READ_WRITE_TOKEN` / `*_READ_WRITE_TOKEN` | Legacy fallback | Secondary Blob token resolution. |

---

## Architecture

### Pages (`app/**/page.js`)
| Route | Component | Purpose |
|---|---|---|
| `/` | — | `redirect("/app")` (workflow-first; no landing) |
| `/app` | `Dashboard` | Canvas list + hero |
| `/w/[id]` | `Canvas` | Node editor |
| `/image` | `ImagePage` | Generate / Edit / Face Swap |
| `/video` | `VideoPage` | Create / Edit / Motion (sub-tabs, `?sub=`) |
| `/upscale` | `UpscalePage` | Image/video upscaler |
| `/library` | `LibraryPage` | All generations, aggregated |
| `/influencers` | `InfluencersPage` | Character CRUD |
| `/mcp` | `MCPPage` | Claude connector setup |
| `/sign-in`, `/sign-up` | Clerk pages | Redirect to `/app` when Clerk off |

### API routes (`app/api/**/route.js`)
- `image/start` + `image/status` — image gen via fal queue.
- `video/start` + `video/status` — 4 branches: edit / motion / fal t2v-i2v / Veo.
- `video/combine/*`, `video/file`, `video/check` — stitching + Veo proxy.
- `upscale/start` + `upscale/status`.
- `generate` — **synchronous** gen (used by MCP + assistant).
- `generations` — **GET** server index; **POST** record a finished generation.
- `media` — allowlisted media proxy for the MCP widget iframe.
- `influencers` — GET/POST/DELETE per-user influencer CRUD (Blob).
- `prompt/enhance`, `prompt/from-image`, `audio/voices`, `assistant`.
- `[transport]` — the MCP server.

### lib/
- `run.js` — client gen orchestration (start + poll): `generateOutput`, `generateVideo`, `generateMotion`, `generateVideoEdit`, `upscaleMedia`, `combineVideos`.
- `genstore.js` — `uploadDataUrl` (host media → Blob, fal fallback), `getGenerations`/`addGeneration`, `configured()`.
- `serverGen.js` — `recordServerGen({url,kind,prompt})` fire-and-forget POST to `/api/generations` (used by Image/Video/Upscale).
- `influencers.js` — client store + `syncInfluencers`, `resolveMentions`, `IDENTITY_CLAUSE`, remote save/delete.
- `influencerStore.js` — server Blob store at `influencers/<userId>.json`.
- `falImage.js` — `FAL_IMAGE_MAP` / `FAL_EDIT_MAP` + `pickImageEndpoint`.
- `credits.js` — indicative cost estimators (no real billing).
- `store.js` — client workflow store (`wfc:workflows:v1`) + generation history. **`write()` is quota-robust** (see Canvas fix).
- `cardSize.js`, `mockRun.js`.

### Infra
- `middleware.js` — apex→www 308 redirect (skips `/api`) + Clerk route protection when the Clerk key is set. Protected: `/app /w /motion /image /video /upscale /library /influencers /mcp`.
- `app/layout.js` — conditional `<ClerkProvider>`; inline apex→www `<script>` guard; mobile `viewport` export.

---

## Core systems

### Generation pipeline
`/start` submits to the fal async queue (`https://queue.fal.run/<endpoint>`) and returns
`{statusUrl, responseUrl}`; `/status` polls. `lib/run.js` polls on an interval with a
wall-clock deadline. Status routes treat only `IN_QUEUE`/`IN_PROGRESS` as "keep polling"
and **throw on any other non-`COMPLETED` state** so fal failures don't look like timeouts.
`uploadDataUrl` hosts base64 media on Vercel Blob first (permanent) — fal URLs expire.

### Image studio — Generate / Edit / Face Swap
- **Generate** — text → image.
- **Edit** — upload a source image + prompt → fal `/edit` endpoint (`image_urls`). With an
  `@mention`, an order-explicit clause tells the model the first image is the scene and the
  reference is the person.
- **Face Swap** — source photo + exactly one `@influencer`. Auto-selects Nano Banana Pro.
  - *Nano Banana Pro*: concise prompt (it degrades with verbose prompts).
  - *Other models*: detailed "adaptive" prompt — transfers identity + hair, conforms head
    angle/gaze/expression/lighting to the scene.
  - Both keep the influencer's **hair color** and **harmonize body skin tone** to the face.
- **Aspect auto-match**: uploading a reference snaps the output ratio to the closest match.
- **Instant placeholder + resumable jobs**: a "Generating…" card appears immediately;
  pending jobs persist to `localStorage` and resume polling after navigation/refresh.
- **Cross-device gallery**: finished images are recorded server-side and merged with local.
- **Errors** show as a top toast auto-dismissing after 5s.

### Video studio — Create / Edit / Motion
- **Create**: text or start-image → video. **Audio toggle** sends `enable_audio` only to
  models that accept it (MiniMax Hailuo 2.3, Wan 2.7); Sora 2 + Veo are natively audio.
- **Edit**: source clip + prompt (+ up to 4 reference images) via Kling O1 video-to-video.
  Source-video preview is a fixed-height box so it can't collapse on upload.
- **Motion**: character image + reference video → animated character.
- Uploaded media shows uncropped; the picker icon reflects the kind.

### Upscale
Image or video upscaling via fal. Source-picker icon reflects the kind; hero shows images
in Image mode / videos in Video mode.

### Library
`/library` aggregates the server index (MCP + Image/Video/Upscale recordings) plus local
Image/Video/Upscale/Canvas histories, deduped by URL, filterable by All/Images/Videos.

### Influencers & @mention
Character = `{id, handle, name, description, image, ts}`. Server Blob
(`influencers/<userId>.json`) + localStorage cache + `syncInfluencers`. `resolveMentions`
swaps `@handle`→name and attaches her photo; `IDENTITY_CLAUSE` locks identity. `@mention`
works in the Image studio and Canvas **image** nodes only.

### Canvas (`/w/[id]`)
React Flow editor; debounced autosave + 50-step undo/redo; Director mode; node types =
**Image, Video** (Text/Audio removed). Drag a node's **left** handle to empty space to
create an **upstream** node (`ConnectionMode.Loose`); right handle creates downstream.
Per-node hover **download** button. Default video model **Kling 2.6**. The Canvas nav tab
returns to the open canvas if one's open, else the dashboard.

**Node-persistence fix:** `lib/store write()` now catches `QuotaExceededError` and retries
with a "lite" copy that strips inline `data:` blobs, so the workflow structure always
persists (previously, exceeding the ~5MB quota silently dropped saves → nodes vanished on
reload). The load effect runs **once per workflow** so a re-render can't clobber live nodes.

### Claude MCP
Open endpoint `https://eromify.pro/api/mcp` (no auth — Claude treats 401 as an OAuth
challenge and fails to register). Tools: `generate_image`, `generate_video`, `check_video`,
`generate_text`, `generate_audio`, `list_influencers`. Images/videos render **inline** via a
hand-written `ui://` MCP-Apps widget (`app/api/[transport]/widget-html.js`): video uses raw
`*.fal.media` URLs (range requests), images embed base64. `@influencer` reads the shared
`"public"` bucket. claude.ai **caches the widget + tool list at connect time** — to ship
changes, remove and re-add the connector. The page UI is Claude-only (CLI/Skill removed).

---

## Models

| Type | Models |
|---|---|
| Image (t2i + `/edit`) | Flux 2 Pro, Flux 2 Max, Nano Banana Pro, Seedream 4.5, GPT Image 2, GPT Image 1 |
| Video (t2v + i2v) | Kling 3.0/2.6/2.5 Turbo/v2, Seedance 2.0 (+Fast), Wan 2.7/2.2, MiniMax Hailuo 2.3/02, PixVerse v6, Sora 2, LTX Video, Veo 3.1/3.1 Fast |
| Motion | Kling 3.0/2.6 motion-control (pro+std), Wan Motion, Wan 2.2 Animate (move/replace) |
| Video edit | Kling O1 video-to-video edit, Kling motion-control |
| Upscale | Clarity, Topaz Image, ESRGAN, AuraSR (image); Topaz Video, SeedVR2 (video) |

Endpoints: `lib/falImage.js` (image), `app/api/video/start/route.js` (video/motion/edit/Veo),
`app/api/upscale/start/route.js`. **Size params:** Flux 2 + GPT Image 2 use the preset
`image_size` enum; Nano Banana uses `aspect_ratio`; others use snapped `{width,height}`.

---

## Authentication (Clerk) — how to enable

The app is **open** until Clerk keys exist; the code is fully wired to turn auth on the
moment they're present (no code change needed for the basic gate).

1. Create a Clerk app at dashboard.clerk.com (skip its "create Next.js app / install SDK"
   steps — already done here).
2. Copy `Publishable key` + `Secret key`.
3. Vercel → Settings → Environment Variables (Production): add
   `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`.
4. For production: switch the Clerk instance to **Production**, add `www.eromify.pro`
   (and `eromify.pro`) under **Configure → Domains**, use the `pk_live_/sk_live_` keys.
5. Redeploy.

**Implications once on:** every app page requires login; `uid()` returns the Clerk user id,
so data becomes **per-user** — existing `"public"`-bucket influencers/generations won't show
for logged-in accounts, and the open MCP keeps reading `"public"` (per-user MCP needs OAuth —
a TODO). A one-time `"public"`→user migration can be added if needed.

---

## Hero / showcase media (`public/hero/`)
- `cv1–cv4.png` — Canvas dashboard hero tiles.
- `img1–img4.png` — Image hero (one blonde girl); also the MCP demo grid + Upscale image hero.
- `inf1–inf4.png` — Influencers hero.
- `v1–v5.mp4` — Video Create hero (v2–v5 also Edit hero + Upscale video hero); v1–v3 Motion hero tiles.
- `ml1, ml2, ml4, ml5.mp4` — Motion Control library cards (9:16). **iPhone HEVC `.mov`
  uploads must be transcoded to H.264 MP4** (browsers can't play HEVC) — `ffmpeg -c:v libx264 -pix_fmt yuv420p -movflags +faststart`.

---

## Known issues & TODOs
- Per-user MCP auth (OAuth) — MCP is open + shared `"public"` bucket.
- Real credit/billing — `lib/credits.js` is indicative numbers only.
- Host Canvas uploads to Blob instead of inline base64 (removes localStorage quota pressure at its source).
- Brand leftovers: pricing page says "Genmax"; `geoflix-*` template files + `GEOFLIX_READ_WRITE_TOKEN` fallback remain.
- A few non-blocking nested-`<button>` hydration warnings may remain in places.

## Gotchas (hard-won)
- **fal URLs expire** → host on Blob (`uploadDataUrl` is Blob-first).
- **www vs apex** localStorage is per-origin → always use www; canonical redirect + server Blob mitigate.
- **401 → OAuth in MCP** → endpoint must stay open.
- **Flux needs `/edit`**; **GPT Image 2 needs the preset enum** (custom dims 422).
- **Status non-COMPLETED must throw** or failures look like timeouts.
- **Don't `next build` against a live dev server.**
- **MCP widget/tool list is cached** at connect — re-add the connector to ship changes.
- **Nano Banana Pro degrades with verbose prompts** — keep its face-swap prompt concise.
- **GPT Image 2 has aggressive moderation** — face swaps get refused more often (the `422 content_policy_violation`).
- **HEVC `.mov` won't play in browsers** — transcode to H.264 mp4.

## Where to look ("change X → edit Y")
| Want to change | Edit |
|---|---|
| Image models / endpoints | `lib/falImage.js` + `components/ImagePage.js` |
| Image size/aspect snapping | `app/api/image/start/route.js` |
| Face-swap / edit prompts | `components/ImagePage.js` (`generate()`) |
| Video/motion/edit/Veo endpoints | `app/api/video/start/route.js` + `components/VideoPage.js` |
| Upscale models | `app/api/upscale/start/route.js` + `components/UpscalePage.js` |
| Poll deadlines / error parsing | `lib/run.js` |
| Media hosting (Blob vs fal) | `lib/genstore.js` |
| Cross-device recording | `lib/serverGen.js` + `app/api/generations/route.js` |
| @mention / IDENTITY_CLAUSE | `lib/influencers.js` |
| Influencer server storage | `lib/influencerStore.js` + `app/api/influencers/route.js` |
| Workflow persistence (quota) | `lib/store.js` |
| Canvas editor / nodes | `components/Canvas.js` + `components/nodes/WorkflowNode.js` |
| MCP tools / inline rendering | `app/api/[transport]/route.js` + `widget-html.js` |
| Nav tabs / Canvas-tab routing | `components/Tabs.js` |
| Section heroes (img/video tiles) | `components/SectionHero.js` |
| Enable Clerk auth | set env vars (code already wired in `middleware.js` + `layout.js`) |
| Styling | `app/globals.css` |
