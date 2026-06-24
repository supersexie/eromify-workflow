# Geoflix — Project Handoff

> A node-based AI creative canvas (Picsart-Workflows clone) with a marketing landing page, deployed at **geoflix.online**, plus a Claude MCP connector that renders generated media **inline in claude.ai chat**. This doc lets a new Claude instance continue with full context.

Last updated: **2026-06-23.** Supersedes the 2026-06-22 version. The biggest change since then: **the inline-media-in-Claude problem is SOLVED** (was the #1 open item), plus a full marketing landing page, Clerk auth, a light theme, and an Assistant "director" mode.

---

## 1. What it is & current state

A web app with two halves:
1. **Marketing landing page** at `/` (geoflix.online) — viewmax.io-style. Hero, tool-card grid (with demo videos), features section, Claude-MCP 3-step guide, FAQ, CTA, footer, and an auto-scrolling video marquee.
2. **The app** at `/app` (dashboard) + `/w/[id]` (node editor) — build node workflows (Image/Video/Text/Audio), connect them, generate real AI media, an AI Assistant side panel, and a Library gallery.

Plus an **MCP server** (`/api/mcp`) so Claude (claude.ai connector / Desktop) can generate media — and it now **renders inline in chat** via an MCP-Apps widget.

**User:** Indian locale, GitHub `supersexie`, email `rishavvashisht347@gmail.com`. Vercel **Hobby** plan, **no card added** (so Vercel will never bill — it throttles/pauses instead). Real costs are **fal.ai + OpenAI + ElevenLabs** (their own accounts). Prefers fast, verified-against-reality work; dislikes guessing.

---

## 2. Architecture & stack

- **Next.js 15.5.x** (App Router), **React 19**.
- **Canvas:** `@xyflow/react` (React Flow v12).
- **Hosting:** Vercel (Hobby → **60s serverless function cap**). Auto-deploys on push to `main` (~90s).
- **Repo:** GitHub `supersexie/workflow-canvas`.
- **Domain:** `geoflix.online` (Hostinger DNS: A `@`→`76.76.21.21`, CNAME `www`→`cname.vercel-dns.com`). Use **`https://www.geoflix.online`**.
- **Persistence:** browser **localStorage** for workflows (key `wfc:workflows:v1`) + **Vercel Blob** for a server-side generations index (so MCP-generated media show in the Library). No SQL DB.
- **Auth:** **Clerk** (currently **DEV keys**). Gates `/app` + `/w`; landing + auth pages public.
- **`.npmrc`** has `legacy-peer-deps=true` (required — ext-apps SDK ^1.7 vs mcp-handler pinning).

### Env vars (Vercel → Settings → Environment Variables)
| Var | Used for |
|---|---|
| `OPENAI_API_KEY` | text (`gpt-4o`/`gpt-4o-mini`), audio fallback (`tts-1`) |
| `FAL_KEY` | images (FLUX/Seedream/Nano Banana) + video (LTX/Wan/MiniMax/Kling) + ffmpeg compose |
| `ELEVENLABS_API_KEY` | audio (TTS via ElevenLabs voices) |
| `GEMINI_API_KEY` | Google Veo video (wired, **billing-blocked**) |
| `MCP_KEY` | shared secret gating `/api/mcp?key=` |
| `GEOFLIX_READ_WRITE_TOKEN` | Vercel Blob (generations index). Created with a custom "GEOFLIX" prefix; code accepts any `*_READ_WRITE_TOKEN` or `BLOB_READ_WRITE_TOKEN`. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` | Clerk auth (dev keys) |

Everything is **guarded** — if a key is missing the feature degrades gracefully (Clerk no-ops, Blob no-ops, audio falls back to OpenAI, generation falls back to mock).

---

## 3. ⭐ Inline media in claude.ai (SOLVED — was the long-running blocker)

**Goal (achieved):** generated images & video render **inline in claude.ai chat** through the MCP connector, like Eromify.

**The mechanism:** an **MCP-Apps UI widget** (`ui://geoflix/media-v3.html`), registered via `registerAppResource`; image/video tools carry `_meta.ui.resourceUri` and return `structuredContent`; the widget runs in a sandboxed iframe and renders the media. claude.ai does **not** inline-render raw image/blob content blocks or markdown from custom connectors — the widget is the only path.

**What was actually broken (the fix):** the hand-written widget sent `ui/initialize` with the *regular* MCP shape `{capabilities, clientInfo}`, but the **MCP-Apps schema requires `{protocolVersion, appInfo, appCapabilities}`**. So the host never completed init → never sent `ui/notifications/tool-result` → widget stayed blank. Found by reading `node_modules/@modelcontextprotocol/ext-apps/dist/src/app.js`.

**How it works now:**
- **Images:** the tool fetches the fal image, embeds it as a **base64 `data:` URI inside `structuredContent`** (`{kind, url, image}`), and the widget renders it — no cross-origin fetch needed.
- **Video:** the tool returns the **raw `fal.media` URL** (widget CSP whitelists `*.fal.media`; fal's CDN supports HTTP range, so `<video>` plays). The `/api/media` proxy also got Range/206 passthrough for non-fal (Veo) media.
- **Sizing:** the widget reports `ui/notifications/size-changed` (height computed from the media's natural aspect ratio, like the official SDK) AND caps media at `max-height:100vh` so there's **never a scrollbar** even if the host ignores resize.
- **Clean UI:** an animated "Generating…" loader until media arrives (no debug log).

**Files:** `app/api/[transport]/route.js` (MCP server), `geoflix-widget/widget.html` (the ~3.5KB hand-written widget), `geoflix-widget/build.js` (emits `app/api/[transport]/widget-html.js` — **run `node build.js` after editing widget.html**, then push).

**⚠️ Cache gotcha (critical):** the widget HTML is **cached at connector-connect time**. ANY widget change requires the user to **fully remove + re-add** the connector in claude.ai (toggling/regenerating won't refresh it). Server-only changes (what URL/data a tool returns) do NOT need a re-add. Bumping the resource URI (`media.html`→`media-v2`→`media-v3`) is how we force-busted the cache during debugging.

---

## 4. Routing & auth

- `/` → **landing page** (`app/page.js`, styles in `app/landing.module.css`).
- `/app` → **dashboard** (`app/app/page.js` → `components/Dashboard.js`).
- `/w/[id]` → **editor** (`components/Canvas.js`).
- `/sign-in`, `/sign-up` → Clerk pages (catch-all routes).
- **`middleware.js`** protects `/app` + `/w`: signed-out users get redirected to `/sign-in`. Guarded — no-op until Clerk keys exist.
- Landing CTAs (Sign In / Sign Up / Start Creating / Open App) route into `/app` or the auth pages.
- **Clerk is on DEV keys** → works on the live domain but shows a dev banner + lower limits. For launch: create a **Production instance** in Clerk, add `geoflix.online` + the CNAME DNS records Clerk provides, swap in `pk_live_`/`sk_live_`, redeploy. Set the **Application name to "Geoflix"** in Clerk settings (that's the name shown on the sign-in card).
- Sign-out is the Clerk **`<UserButton>`** in the editor topbar + dashboard (`components/UserMenu.js`, guarded).

---

## 5. Theme

The whole app + landing use a **light / royal-blue** theme with **SF Pro Display** (self-hosted, Latin-subset woff2 in `public/fonts/`, declared in `globals.css` and `landing.module.css`). CSS variables live at `:root` in `app/globals.css` (`--blue #2563eb`, `--ink #0b1220`, `--bg #f3f6fb`, etc.). The editor was converted from the old dark/purple look to match. Connection edges are black; node connect-handles are a 20px dot that scales ~2.4× into a big "+" on hover.

> **Specificity gotcha:** `@xyflow/react`'s own CSS sometimes loads *after* `globals.css` and overrides plain `.react-flow__*` rules (handles stuck at 6px, edges grey). Scope such rules under `.react-flow .react-flow__…` to win. Bitten twice.

---

## 6. Landing page (`app/page.js` + `app/landing.module.css`)

viewmax.io-inspired. Sections: fixed/frosted nav; hero ("The Easiest Way to Make Viral Videos"); auto-scrolling **video marquee** (`SHOWCASE` array: 5 landscape 16:9 + 4 portrait 9:16 clips in `public/marquee/`, looping, each with a red "X.XM Views" pill floating above the tile); "Top Creators Don't Start from Scratch" showcase header; **tools grid** (6 cards: Image/Video/Voiceover/Scriptwriter/Assistant/**Genmax Flow** — each plays a demo video from `public/tools/`); **features** section (canvas screen-recording, card sized to the video's native ratio + blue outline); **Claude MCP** 3-step connect guide (with copy button); FAQ; CTA banner; footer.

> **Marquee pill gotcha:** the view pill must live in a non-clipping wrapper *outside* the tile — the tile has `overflow:hidden` for rounded corners and was clipping the pill. Marketing view counts are fabricated placeholders.

---

## 7. Generation backend & flows

### Routes
- `app/api/generate/route.js` — POST `{kind,prompt,model,images,voice}`. image(fal)/text(OpenAI gpt-4o-mini)/audio(ElevenLabs or OpenAI). Image-to-image when `images` present (fal edit endpoints). Mock fallback if no keys.
- `app/api/image/start` + `/status` — async fal image queue (start+poll) so slow edit models dodge the 60s cap. `lib/falImage.js` has the endpoint maps.
- `app/api/video/start` + `/status` — fal queue or Veo. Veo uses `bytesBase64Encoded` image format. **LTX & Wan i2v send an explicit `aspect_ratio`** (else fal 422s on "auto" resolved size). Unknown/missing video model defaults to **fal LTX** (not Veo).
- `app/api/video/combine/start` + `/status` — **fal `ffmpeg-api/compose`** stitches multiple clips into one (used by director mode).
- `app/api/audio/voices` — lists ElevenLabs voices (stock + cloned), OpenAI fallback.
- `app/api/media` — same-origin SSRF-allowlisted proxy with Range/206 support.
- `app/api/generations` — GET the Blob generations index (`lib/genstore.js`); returns `{items, configured}`.
- `app/api/assistant` — the AI Assistant brain (see §8).

### Client (`lib/run.js`)
`generateOutput(kind, prompt, model, images, {voice})`, `generateVideo(...)`, `combineVideos(urls, durations)`. Images/video poll async; text/audio sync.

### Models (`components/PromptBar.js`)
image = Flux 2 Pro/Max, Nano Banana Pro, Seedream 4.5 · video = LTX/Wan 2.2/MiniMax Hailuo/Kling v2/Veo 3.1 (Fast). Audio has **no model chip** — the **voice** is the choice (fetched live from `/api/audio/voices`). Durations 4–60s. Node cards **reshape to the selected aspect ratio** (`lib/cardSize.js`).

### Connections that mean something
- **Image → Video** = image-to-video (image seeds the clip).
- **Text → Video/Image/Audio** = the text becomes the prompt/speech (typed prompt still wins).
- Source propagation: `sourcesByNode` in `Canvas.js`; the prompt bar shows source thumbnails (video first frame via `#t=0.1`) / a "Prompt from Text" pill.

---

## 8. AI Assistant + "Director" mode (`app/api/assistant/route.js` + `components/Assistant.js`)

Model **`gpt-4o`**, JSON output. Classifies intent → creates+runs the right node. Key behaviors:
- **Adaptive style** — honors a named style; defaults to **photorealistic/cinematic** for real subjects (no more forced "Pixar").
- **Selected-image awareness** — Canvas passes `hasSelectedImage`; "turn this into a video" seeds from the selected image.
- **Director mode (multi-scene video):** for long/story prompts it returns a `scenes[]` array + a `character` reference-image prompt. `Canvas.runDirector` then: generates **one reference image** → per scene does an **image-to-image staging edit** seeded from it → **image-to-video** → **stitches all clips** into one via the combine endpoint. Builds the whole node graph live. Model is selectable in the Assistant (LTX/Wan/MiniMax/Kling). Scenes repeat the style+character verbatim for consistency. **Use LTX or Wan** in director mode (Kling/MiniMax i2v unverified).
- A director run is ~1 + N + N generations + a stitch — **real fal cost & a few minutes.**

---

## 9. Audio / TTS

ElevenLabs TTS wired (`eleven_multilingual_v2`), voice picker populated from `/api/audio/voices` (the user's account has ~23 voices incl. premades + a "Peter Griffin" clone). OpenAI `tts-1` fallback (6 voices) if no ElevenLabs key. **Voice cloning UI was built then removed** at the user's request — but cloned voices already in their ElevenLabs account still appear in the dropdown. Audio is **synchronous** via `/api/generate`.

---

## 10. Bugs fixed this session (so they don't get re-broken)
1. **Inline-media blank widget** → wrong `ui/initialize` params (see §3).
2. **Widget scrollbar** → report size from natural ratio + `max-height:100vh` cap.
3. **MCP video wouldn't play** → use raw fal URL + Range support in proxy.
4. **Video defaulted to Veo** when model unset → default to LTX in `runNode` + server.
5. **LTX/Wan i2v 422** → send explicit `aspect_ratio`.
6. **Veo i2v 400** → `bytesBase64Encoded` not `inlineData`.
7. **image-to-image ignored source** → forward `images`, use fal edit endpoints.
8. **Assistant JSON truncation** → `max_tokens` 250→2000.
9. **`position:sticky` nav scrolled away** → `.page{overflow-x:hidden}` breaks sticky; switched nav to `position:fixed`.
10. **Library slow/glitchy** → lazy images, `preload="none"` videos, `content-visibility:auto`.
11. **Landing couldn't scroll** → `globals.css` locks `body{overflow:hidden}` for the canvas; landing releases it on mount, restores on unmount.

---

## 11. Commands & workflow
- **Deploy:** `git push` (Vercel auto-deploys `main`). Commit author: `-c user.email="rishavvashisht347@gmail.com" -c user.name="supersexie"`.
- **Rebuild MCP widget after editing `geoflix-widget/widget.html`:** `cd geoflix-widget && node build.js` → regenerates `app/api/[transport]/widget-html.js` → push.
- **Local dev / verify:** `preview_start` (port 3000). Verify against the built output, not just dev. ⚠️ Never `npm run build` while `next dev` runs (corrupts `.next`; fix: stop dev, `rm -rf .next`, restart).
- **Test MCP locally:** POST `http://localhost:3000/api/mcp` with `Accept: application/json, text/event-stream`, body `{"jsonrpc":"2.0","id":1,"method":"tools/list"}` (gated only if `MCP_KEY` set; unset locally). Locally `/api/generate` returns mock URLs (no FAL key), which is enough to exercise tool shapes.
- **Connector URL (claude.ai):** `https://www.geoflix.online/api/mcp?key=<MCP_KEY>`
- **Screenshot tool is flaky** in this environment — prefer `preview_eval` + DOM/`getComputedStyle` assertions for verification; take screenshots sparingly.
- **Chrome MCP blocks `localhost` and `geoflix.online`** — can't drive the live site there; verify via `curl` and the local preview.

---

## 12. Outstanding / next (priority order)
1. **Lock down open API routes** — `/api/generate`, `/api/video/*`, `/api/image/*`, `/api/media`, `/api/audio/*` are **unauthenticated**. A leaked URL could burn fal/OpenAI/ElevenLabs credits. Add a secret/Clerk-session gate or rate-limit. (Highest real-money risk.)
2. **Clerk → production keys + DNS** (removes dev banner/limits, shows "Geoflix" on the sign-in card).
3. **Library thumbnails** — it still loads full-res fal URLs per tile (lazy now, but heavy). Generate/store small previews (or use fal resize on the URL).
4. **Persist media durably** — `lib/genstore.js` stores fal *URLs*, which **expire**. Re-host bytes to Blob for permanence.
5. **Veo** — paid Gemini tier to clear the 429, or drop Veo options.
6. **Verify Kling/MiniMax image-to-video** `aspect_ratio` handling (only LTX/Wan confirmed).

---

## 13. Key files map
```
app/
  page.js                     # LANDING (/), landing.module.css alongside
  app/page.js                 # Dashboard (/app)
  w/[id]/page.js              # Editor route → <Canvas>
  layout.js                   # ClerkProvider (guarded) + SF Pro fonts + xyflow css
  globals.css                 # app theme (light/blue, CSS vars, all editor styles)
  landing.module.css          # landing-only styles
  sign-in|sign-up/[[...]]/page.js
  api/
    [transport]/route.js      # MCP server (tools + widget resource)
    [transport]/widget-html.js# AUTO-GENERATED widget string (don't edit)
    generate/route.js         # image/text/audio (sync)
    image/{start,status}      # async fal image queue
    video/{start,status}      # fal/Veo video
    video/combine/{start,status} # fal ffmpeg stitch (director)
    audio/voices/route.js     # ElevenLabs voice list
    media/route.js            # same-origin media proxy (Range support)
    generations/route.js      # Blob generations index (GET)
    assistant/route.js        # Assistant brain (gpt-4o, director mode)
components/
  Canvas.js                   # editor: nodes/edges, runNode, runDirector, Assistant wiring
  nodes/WorkflowNode.js       # node card (per-kind, aspect-aware sizing, text output render)
  PromptBar.js                # bottom bar: model/aspect/duration/voice, Play
  Assistant.js                # right-side AI panel (+ video model selector)
  Library.js                  # gallery modal (lazy + content-visibility)
  Dashboard.js                # workflow list + name-on-create modal
  UserMenu.js                 # Clerk UserButton (guarded)
lib/
  store.js                    # localStorage CRUD + listGenerations()
  run.js                      # client generate/combine helpers
  cardSize.js                 # aspect-ratio → node card dimensions
  falImage.js                 # fal image endpoint maps
  genstore.js                 # Vercel Blob generations index
geoflix-widget/widget.html + build.js   # MCP Apps inline-media widget
middleware.js                 # Clerk route protection (guarded)
public/fonts|tools|marquee/   # SF Pro woff2; tool-card & marquee demo videos
geoflix-mcp/                  # local stdio MCP server (Claude Desktop/Code)
```

---

## 14. Memory notes (`~/.claude/.../memory/`)
- `nextjs-dev-no-minify-verify-built-css` — verify CSS against built/live, not dev; `inset` shorthand dodges minifier.
- `claude-mcp-inline-video` — historical inline-media findings (now SOLVED via §3; update if revisited).
- `railway-ffmpeg-no-drawtext`, `clipzo-ranking-oninput-unreliable` — unrelated older projects.
