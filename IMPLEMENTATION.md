# Geoflix — Implementation & Deploy Guide

Everything needed to stand up **Geoflix** (node-based AI creative canvas + marketing site + Claude MCP connector) on a fresh deployment. **No API keys are in this repo** — every secret is read from environment variables, listed below.

- **Full source** is split across two companion files:
  - [`FRONTEND.md`](FRONTEND.md) — all client code (pages, components, client libs, CSS, auth middleware).
  - [`BACKEND.md`](BACKEND.md) — all server code (API routes, MCP server + inline-media widget, server libs, standalone stdio MCP).
- This file is the **operator runbook**: stack, env vars, per-service setup, build/deploy, and gotchas.

> The canonical, runnable copy already lives in the GitHub repo **`supersexie/workflow-canvas`**, which auto-deploys to Vercel on push to `main`. If your friend can get repo access, that's the fastest path — clone it and skip straight to "Environment variables". The two code-dump files exist so the project can be recreated from scratch without repo access.

---

## 1. What it is

A single Next.js app with two halves plus a connector:

1. **Marketing landing page** at `/` — hero, auto-scrolling video marquee, tools grid, features, a Claude-MCP showcase, pricing link, FAQ, CTA, footer.
2. **The app** at `/app` (dashboard) and `/w/[id]` (node editor) — build Image/Video/Text/Audio node workflows, connect them, generate real AI media, an AI Assistant side panel, and a Library gallery.
3. **MCP server** at `/api/[transport]` (mounted as `/api/mcp`) so Claude (claude.ai / Desktop) can generate media and have it **render inline in chat** via an MCP-Apps widget.

---

## 2. Stack

| Layer | Choice |
|---|---|
| Framework | **Next.js 15.5+** (App Router), **React 19** |
| Canvas | `@xyflow/react` (React Flow v12) |
| Auth | **Clerk** (`@clerk/nextjs`) — gates `/app` + `/w`; landing/auth pages public |
| MCP | `mcp-handler` + `@modelcontextprotocol/sdk` + `@modelcontextprotocol/ext-apps` |
| Persistence | Browser **localStorage** (workflows) + **Vercel Blob** (server-side generations index) — no SQL DB |
| Hosting | **Vercel** (Hobby = 60s serverless function cap; auto-deploys `main`) |
| Media providers | **fal.ai** (images + video + ffmpeg compose), **OpenAI** (text + TTS fallback), **ElevenLabs** (TTS), **Google Veo** (optional) |

> **`.npmrc` must contain `legacy-peer-deps=true`** — the ext-apps SDK (`^1.7`) conflicts with `mcp-handler`'s pinning otherwise. Install will fail without it.

---

## 3. Environment variables

Set these in **Vercel → Settings → Environment Variables** (and in a local `.env.local` for dev). Everything is **guarded** — if a key is missing the feature degrades gracefully (Clerk no-ops, Blob no-ops, audio falls back to OpenAI, generation falls back to mock URLs), so you can boot with a subset.

| Variable | Required? | Used for |
|---|---|---|
| `OPENAI_API_KEY` | Recommended | Text (`gpt-4o` / `gpt-4o-mini`), the AI Assistant brain, audio fallback (`tts-1`) |
| `FAL_KEY` | Recommended | Images (FLUX / Seedream / Nano Banana) + video (LTX / Wan / MiniMax / Kling) + ffmpeg compose |
| `ELEVENLABS_API_KEY` | Optional | Audio TTS via ElevenLabs voices (falls back to OpenAI `tts-1` if absent) |
| `GEMINI_API_KEY` | Optional | Google Veo video (wired; needs paid Gemini tier or it 429s) |
| `MCP_KEY` | Recommended | Shared secret gating `/api/mcp?key=…` (leave unset locally to disable the gate) |
| `GEOFLIX_READ_WRITE_TOKEN` **or** `BLOB_READ_WRITE_TOKEN` | Optional | Vercel Blob token for the generations index (code accepts any `*_READ_WRITE_TOKEN`) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Optional | Clerk auth (public key). Omit → auth no-ops, everything is open |
| `CLERK_SECRET_KEY` | Optional | Clerk auth (secret key). Pair with the publishable key |
| `GEOFLIX_BASE_URL` | Optional | Absolute base URL for server-side self-fetches (defaults to the Vercel production URL / request origin) |

**Standalone stdio MCP** (`geoflix-mcp/`, only if your friend wants the Claude Desktop local server — most users just use the hosted `/api/mcp` connector) reads its own: `MCP_SERVER_URL`, `MCP_KEY`, plus optional OAuth vars (`MCP_CLIENT_ID`, `MCP_CLIENT_SECRET`, `MCP_CLIENT_PRIVATE_KEY_PEM`, `MCP_CLIENT_ALGORITHM`, `MCP_AUTH_PORT`, `MCP_PORT`). See `geoflix-mcp/README.md` in BACKEND.md.

> Never commit real values. `.env.local` is gitignored; Vercel stores prod values encrypted.

---

## 4. Per-service setup

### Vercel
1. Import the repo (or `vercel` CLI deploy). Framework preset: **Next.js**.
2. Add the env vars above (Production + Preview).
3. Auto-deploys on push to `main` (~90s). Hobby plan caps serverless functions at **60s** — the async image/video `start`+`status` polling pattern exists specifically to dodge this.

### Domain / DNS (example used `geoflix.online` on Hostinger)
- A record `@` → `76.76.21.21`
- CNAME `www` → `cname.vercel-dns.com`
- Prefer the `www` host.

### Clerk
1. Create an application (set the **Application name** to what you want shown on the sign-in card, e.g. "Geoflix").
2. Copy `pk_…` → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `sk_…` → `CLERK_SECRET_KEY`.
3. For production: create a **Production instance**, add your domain + the CNAME records Clerk provides, and swap dev keys (`pk_test_`/`sk_test_`) for live (`pk_live_`/`sk_live_`). `middleware.js` protects `/app` + `/w`.

### fal.ai
Create an account, generate an API key → `FAL_KEY`. Costs are real per generation. Endpoint maps live in `lib/falImage.js` (images) and the video routes.

### OpenAI
API key → `OPENAI_API_KEY`. Powers text nodes, the Assistant (`gpt-4o`), and TTS fallback.

### ElevenLabs
API key → `ELEVENLABS_API_KEY`. Voices are fetched live via `/api/audio/voices`.

### Vercel Blob
Create a Blob store; the token can have any prefix as long as it ends in `_READ_WRITE_TOKEN`. Used so MCP-generated media show up in the Library.

---

## 5. Local development

```bash
# from the project root
npm install            # needs .npmrc legacy-peer-deps=true
cp .env.example .env.local   # then fill in keys (or leave blank for mock mode)
npm run dev            # http://localhost:3000
```

- With **no `FAL_KEY`**, `/api/generate` returns **mock URLs** — enough to exercise the UI and MCP tool shapes without spending money.
- **Never run `npm run build` while `next dev` is running** — it corrupts `.next`. If that happens: stop dev, `rm -rf .next`, restart.
- Test the MCP endpoint locally:
  ```bash
  curl -s http://localhost:3000/api/mcp \
    -H 'Accept: application/json, text/event-stream' \
    -H 'Content-Type: application/json' \
    -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
  ```
  (Gated only if `MCP_KEY` is set; unset locally.)

---

## 6. Build & deploy

```bash
npm run build && npm run start   # production build locally
# or just: git push origin main  → Vercel auto-deploys
```

**Connector URL for claude.ai:** `https://<your-domain>/api/mcp?key=<MCP_KEY>`

---

## 7. The inline-media MCP widget (important)

Generated media render **inline in claude.ai chat** through an **MCP-Apps UI widget** (`ui://geoflix/media-v3.html`). The widget HTML is hand-written and tiny; a build step inlines it into the server.

- Edit **`geoflix-widget/widget.html`**, then run **`cd geoflix-widget && node build.js`** → regenerates `app/api/[transport]/widget-html.js` (an auto-generated string — don't edit it directly) → commit + push.
- **Cache gotcha:** the widget HTML is cached at connector-connect time. **Any widget change requires the user to fully remove + re-add the connector** in claude.ai (toggling won't refresh it). Bumping the resource URI (`media-v3` → `media-v4`) force-busts it. Server-only changes (what data a tool returns) do **not** need a re-add.
- Mechanism detail: MCP-Apps `ui/initialize` requires `{protocolVersion, appInfo, appCapabilities}` (NOT the regular MCP `{capabilities, clientInfo}` shape) — getting this wrong leaves the widget blank.

---

## 8. File tree

```
app/
  layout.js                   # ClerkProvider (guarded) + fonts + xyflow css
  globals.css                 # app theme (light/blue, CSS vars, editor styles)
  page.js + landing.module.css# LANDING (/)
  pricing/page.js             # /pricing
  app/page.js                 # Dashboard (/app)
  w/[id]/page.js              # Editor route → <Canvas>
  sign-in|sign-up/[[...]]/page.js
  api/
    generate/route.js         # image/text/audio (sync)
    image/{start,status}      # async fal image queue
    video/{start,status,check,file} ; video/combine/{start,status}
    audio/voices/route.js     # ElevenLabs voice list
    media/route.js            # same-origin media proxy (Range support)
    generations/route.js      # Blob generations index (GET)
    assistant/route.js        # Assistant brain (gpt-4o, director mode)
    [transport]/route.js      # MCP server (tools + widget resource)
    [transport]/widget-html.js# AUTO-GENERATED widget string (don't edit)
components/
  Canvas.js                   # editor: nodes/edges, runNode, runDirector, Assistant wiring
  nodes/WorkflowNode.js       # per-kind node card (aspect-aware)
  PromptBar.js                # bottom bar: model/aspect/duration/voice, Play
  PropertiesPanel.js          # node properties
  Assistant.js                # right-side AI panel (+ video model selector)
  Library.js                  # gallery modal
  Dashboard.js                # workflow list + name-on-create modal
  UserMenu.js                 # Clerk UserButton (guarded)
lib/
  store.js                    # localStorage CRUD + listGenerations()
  run.js                      # client generate/combine helpers
  cardSize.js                 # aspect-ratio → node card dimensions
  falImage.js                 # fal image endpoint maps (server)
  genstore.js                 # Vercel Blob generations index (server)
  mockRun.js                  # mock fallback generators
geoflix-widget/               # MCP Apps inline-media widget + build.js
geoflix-mcp/                  # standalone stdio MCP server (Claude Desktop)
middleware.js                 # Clerk route protection (guarded)
public/                       # fonts, tool/marquee/tools videos, avatars, claude-mark.png
```

> **`public/` assets are NOT in the code dumps** (they're binary: fonts, marquee/tool demo videos, avatar images, the Claude logo). Copy the `public/` folder from the repo, or supply your own media. Paths referenced in the code: `/fonts/*.woff2`, `/marquee/{l1..l6,p1..p16}.mp4`, `/tools/*.mp4` + `/tools/image-card.jpg`, `/avatars/a1..a4.*`, `/claude-mark.png`.

---

## 9. Config files (verbatim)

**`package.json`**
````json
{
  "name": "workflow-canvas",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "@clerk/nextjs": "^7.5.7",
    "@modelcontextprotocol/ext-apps": "^1.7.4",
    "@modelcontextprotocol/sdk": "^1.29.0",
    "@vercel/blob": "^2.4.1",
    "@xyflow/react": "^12.3.5",
    "mcp-handler": "^1.0.1",
    "next": "^15.0.3",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "zod": "^3.23.8"
  }
}
````

**`next.config.js`**
````js
/** @type {import('next').NextConfig} */
module.exports = { reactStrictMode: true };
````

**`jsconfig.json`**
````json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./*"] }
  }
}
````

**`.npmrc`**
````
legacy-peer-deps=true
````

**`.env.example`** (create this; fill values in `.env.local`, never commit real keys)
````
OPENAI_API_KEY=
FAL_KEY=
ELEVENLABS_API_KEY=
GEMINI_API_KEY=
MCP_KEY=
GEOFLIX_READ_WRITE_TOKEN=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
GEOFLIX_BASE_URL=
````

---

## 10. Generation backend cheatsheet

- `POST /api/generate` `{kind,prompt,model,images,voice}` — image(fal)/text(OpenAI)/audio(ElevenLabs|OpenAI). Image-to-image when `images` present. Mock fallback if no keys.
- `POST /api/image/start` + `GET /api/image/status` — async fal image queue (dodges the 60s cap).
- `POST /api/video/start` + `/status` — fal queue or Veo. **LTX & Wan i2v must send explicit `aspect_ratio`** (else fal 422s). Unknown model → defaults to fal **LTX** (not Veo). Veo i2v uses `bytesBase64Encoded`.
- `POST /api/video/combine/start` + `/status` — fal `ffmpeg-api/compose` stitches clips (director mode).
- `GET /api/audio/voices` — ElevenLabs voices (+ OpenAI fallback).
- `GET /api/media` — same-origin SSRF-allowlisted proxy with Range/206 support.
- `GET /api/generations` — Blob generations index.
- `POST /api/assistant` — Assistant brain (`gpt-4o`, JSON). Classifies intent → builds + runs nodes. "Director mode" returns a `scenes[]` array + a character reference prompt; the client generates a reference image → per-scene image-to-image → image-to-video → stitches. **Use LTX or Wan in director mode** (Kling/MiniMax i2v unverified).

---

## 11. Known gotchas (don't re-break these)

1. **Open API routes are unauthenticated** (`/api/generate`, `/api/video/*`, `/api/image/*`, `/api/media`, `/api/audio/*`). A leaked URL can burn fal/OpenAI/ElevenLabs credits. **Add a secret/Clerk-session gate or rate-limit before a public launch.** (Highest real-money risk.)
2. **`@xyflow/react` CSS can load after `globals.css`** and override `.react-flow__*` rules. Scope such rules under `.react-flow .react-flow__…` to win.
3. **`position:sticky` breaks** when an ancestor has `overflow-x:hidden` — the landing nav uses `position:fixed` for this reason.
4. **Landing scroll lock:** `globals.css` locks `body{overflow:hidden}` for the canvas editor; the landing + pricing pages release it on mount and restore on unmount.
5. **fal URLs expire** — `lib/genstore.js` stores fal URLs in the Blob index; re-host bytes to Blob for permanence if you need durable media.
6. **Marquee rounded corners** under the scrolling animation need `transform: translateZ(0)` on the tile (Chrome compositing clip bug).
