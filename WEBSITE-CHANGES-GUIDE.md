# Website Changes — Full Implementation Guide

Every change we made (besides the interactive tutorial, which has its own file:
`INTERACTIVE-TUTORIAL-GUIDE.md`). Each section explains the change, the file(s),
and the **actual code**.

Stack: **Next.js (App Router) + React**. Some snippets reference CSS variables
(`--blue`, `--surface`, `--grad`, etc.) and app helpers — adapt names to your app.

## Contents
1. Default model & aspect ratio for new canvas nodes
2. "Enhance prompt" button label
3. Face Swap — upload a face-reference image (+ placeholder auto-grow)
4. Canvas AI Assistant — context-aware & knowledgeable (+ cleanup)
5. Dashboard — scrollable list + mini-canvas workflow previews
6. "Generating" cursor fix (progress instead of not-allowed)
7. Canvas node uploads persist (host on Blob instead of inline base64)

---

## 1) Default model & aspect ratio for new canvas nodes

**Goal:** new Image nodes default to model "Nano Banana Pro" @ 3:4; new Video
nodes to "Kling 2.6" @ 9:16.

**File:** `components/Canvas.js`

Add the default maps near the top:

```js
// Defaults for freshly-created nodes (overridable via addNode options).
const DEFAULT_MODEL = { image: "Nano Banana Pro", video: "Kling 2.6" };
const DEFAULT_ASPECT = { image: "3:4", video: "9:16" };
```

In `addNode(kind, options)`, resolve aspect/model from the defaults (so the node
dimensions, model chip, and aspect chip all reflect them):

```js
const addNode = (kind, options = {}) => {
  const aspect = options.aspect || DEFAULT_ASPECT[kind];
  const d = nodeDims(kind, aspect);
  const W = d ? d.width : (SIZE[kind] || 304);
  const H = d ? d.height : (HEIGHT[kind] || 340);
  // ...position logic...
  const id = nextId();
  const data = { kind, prompt: options.prompt || "" };
  const model = options.model || DEFAULT_MODEL[kind];
  if (model) data.model = model;
  if (aspect) data.aspect = aspect;
  // ...create node with width: W, height: H...
};
```

Because the values come from `options.model || DEFAULT_MODEL[kind]`, any flow
that passes an explicit model/aspect (e.g. an assistant/director feature) still
overrides the default.

---

## 2) "Enhance prompt" button label

**File:** `components/PromptBar.js` — make the canvas enhance button match the
image tab's wording.

```jsx
<span>{enhancing ? "Enhancing…" : "Enhance prompt"}</span>
```

---

## 3) Face Swap — upload a face-reference image

**Goal:** in Face Swap, let users upload a face photo directly (alternative to
`@mention`ing a saved influencer). Two upload buttons stacked: scene/body image,
and face reference. Placeholder updated; long placeholder shows in full (no
scrollbar).

**File:** `components/ImagePage.js`

State + handler (mirrors the existing scene-image one, but no aspect snapping):

```jsx
const [faceSource, setFaceSource] = useState(null); // data URI (face reference)

const faceFileRef = useRef(null);
const onPickFace = async (file) => {
  if (!file) return;
  setError(null);
  const r = new FileReader();
  r.onload = () => setFaceSource(r.result);
  r.readAsDataURL(file);
};
```

Allow generate when a scene image + (uploaded face OR one @mention) exist:

```jsx
const canRun = pending.length === 0 && (
  mode === "generate" ? !!prompt.trim() :
  mode === "edit"     ? (!!prompt.trim() && !!editSource) :
  /* swap */            (!!editSource && (!!faceSource || mentioned.length === 1))
);
```

Wire the uploaded face into the generation as the identity ("second image"):

```jsx
const includeSource = (mode === "edit" || mode === "swap") && editSource;
// Identity references follow the scene. An uploaded face takes priority, then
// any @mentioned influencers.
const faceRefs = [
  ...(mode === "swap" && faceSource ? [faceSource] : []),
  ...characters.map((c) => c.image),
];
const images = [
  ...(includeSource ? [editSource] : []),
  ...faceRefs,
].filter(Boolean);
const caption = original || (mode === "swap"
  ? (characters[0]?.handle ? `Face swap with @${characters[0].handle}` : "Face swap")
  : "");
```

The source row keeps the **scene/body** button; the **face** button goes into
the prompt input row (so it sits directly under the body button, left of the
placeholder):

```jsx
{/* scene/body image button (existing) */}
<div className="ip-edit-src-row">
  <input ref={editFileRef} type="file" accept="image/*" style={{ display: "none" }}
         onChange={(e) => { onPickEdit(e.target.files?.[0]); e.target.value = ""; }} />
  <button className="ip-edit-src" onClick={() => editFileRef.current?.click()} title="Upload the scene image">
    {editSource ? <img src={editSource} alt="source" /> : (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg>
    )}
  </button>
  <span className="ip-edit-src-label">
    {/* status text + clear ✕ for editSource */}
  </span>
</div>

{/* prompt input row: face button at the left, then the field */}
<div className="ip-bar-input-row">
  {mode === "swap" && (
    <div className="ip-face-ref">
      <input ref={faceFileRef} type="file" accept="image/*" style={{ display: "none" }}
             onChange={(e) => { onPickFace(e.target.files?.[0]); e.target.value = ""; }} />
      <button className="ip-edit-src" onClick={() => faceFileRef.current?.click()} title="Upload a face reference">
        {faceSource ? <img src={faceSource} alt="face reference" /> : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M5.5 21a7 7 0 0 1 13 0"/></svg>
        )}
      </button>
      {faceSource && <button className="up-source-clear" onClick={() => setFaceSource(null)} title="Remove face reference">✕</button>}
    </div>
  )}
  <MentionField
    /* ...existing props... */
    placeholder={
      mode === "swap"
        ? "Add image for face reference or type @ to summon your influencer"
        : /* ...other modes... */ "Describe the scene…"
    }
  />
  {/* ...enhance button, etc... */}
</div>
```

**CSS** — align the two buttons (the input row gets the same left padding as the
source row, and gaps are equalized):

```css
.ip-edit-src-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; padding: 0 4px; }
.ip-bar-input-row { display: flex; align-items: flex-end; gap: 8px; padding: 0 4px; }
.ip-face-ref { display: flex; align-items: center; gap: 6px; flex: 0 0 auto; }
```

### Placeholder auto-grow (so the full hint shows, no scrollbar)

A `<textarea>` only auto-grows to its **value**, not its placeholder, so a long
placeholder in a narrowed field gets clipped behind a scrollbar. Fix the
auto-grow to also measure the placeholder when empty.

**File:** `components/MentionField.js` (the auto-grow effect)

```js
useEffect(() => {
  if (!multiline) return;
  const el = fieldRef.current;
  if (!el) return;
  el.style.height = "auto";
  let sh = el.scrollHeight;
  if (!value && placeholder) {
    // Measure the placeholder by briefly rendering it as the value.
    el.value = placeholder;
    sh = el.scrollHeight;
    el.value = "";
  }
  el.style.height = Math.min(sh, maxHeight) + "px";
}, [value, multiline, maxHeight, placeholder]);
```

---

## 4) Canvas AI Assistant — context-aware & knowledgeable

**Goals:**
- Remove the three example "tagline" suggestion buttons.
- Remove the video-model dropdown from the chatbox.
- Make the assistant *know everything*: it answers questions about the user's
  saved influencers (e.g. "who is @ash"), reads the canvas nodes (explain why a
  node failed), recommends models per task, and can either **create a node** or
  **answer a question**.

### Component — `components/Assistant.js`

Import the influencer store and accept the canvas `nodes` as a prop:

```jsx
import { listInfluencers } from "@/lib/influencers";

export default function Assistant({ open, onClose, onCreateAndMaybeRun, onDirector, hasSelectedImage, nodes = [] }) {
  // ...
  // default model for director videos (selector removed from UI)
  const videoModel = "LTX Video";
```

When sending, attach full context (influencers + a compact node summary):

```jsx
const influencers = listInfluencers().map((i) => ({
  handle: i.handle, name: i.name, description: i.description || "",
}));
const canvas = (nodes || []).map((n, i) => ({
  i,
  kind: n.data?.kind,
  model: n.data?.model || null,
  aspect: n.data?.aspect || null,
  status: n.data?.status || (n.data?.output ? "done" : "empty"),
  error: n.data?.error || null,
  prompt: (n.data?.prompt || "").slice(0, 200) || null,
}));

const res = await fetch("/api/assistant", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ input: text, history, context: { hasSelectedImage: !!hasSelectedImage, influencers, canvas } }),
});
```

Welcome block (suggestions removed, copy updated):

```jsx
<div className="cb-welcome">
  <div className="cb-welcome-icon">✦</div>
  <h3>How can I help?</h3>
  <p>Describe what you want and I'll create the right node and generate it — or ask me anything about your influencers, your canvas, or which model fits a task.</p>
</div>
```

The input toolbar row keeps only the auto-run toggle (the `<select>` for the
video model is deleted):

```jsx
<div className="cb-autorun-row">
  <button className={`cb-autorun ${autoRun ? "on" : ""}`} onClick={() => setAutoRun(v => !v)}>
    ⚡ Auto-run {autoRun ? "on" : "off"}
  </button>
</div>
```

Pass `nodes` from your canvas component:

```jsx
<Assistant /* ...other props... */ nodes={nodes} />
```

### API route — `app/api/assistant/route.js`

Two changes: (a) extend the system prompt with a **dual role + knowledge base**,
(b) inject the influencer/canvas context as system messages, (c) make the
keyless fallback answer questions instead of always making a node.

Append to the system prompt (`SYS`):

```
DUAL ROLE — CREATE vs ANSWER:
You don't only build nodes. When the user is ASKING A QUESTION rather than requesting a new asset, set kind=null (and no scenes) and put a complete, genuinely helpful answer in "message" — be specific and concrete. Use the knowledge below.

INFLUENCER KNOWLEDGE:
The user's saved influencers are provided in a context message ("User's saved influencers"), each with handle, name, and description. If the user asks "who is @ash", "tell me about katrina", or references any @handle or name, answer from that list. If a named influencer isn't in the list, say you don't see them saved.

CANVAS AWARENESS:
The current canvas nodes are provided in a context message ("Current canvas nodes") with kind, model, status, error, and prompt for each. If asked why a node failed, read its "error" and explain it plus how to fix it. If asked why an image/video "doesn't look good", give concrete improvement tips.

MODEL GUIDE (everything runs through fal):
Image — Nano Banana Pro: best for face swaps & identity-consistent edits, keep prompts CONCISE. Flux 2 Pro/Max: high-quality general text-to-image & realistic people. Seedream 4.5: stylized. GPT Image 2/1: strong prompt-following but aggressive moderation (refuse risqué/face requests) — steer to Nano Banana Pro/Flux.
Video — Kling 3.0/2.6/2.5: strong t2v & i2v (Kling 2.6 = good default to animate a still). Seedance 2.0: fast/value. Wan 2.7/2.2: solid, can take audio. MiniMax Hailuo: expressive. Sora 2 & Veo 3.1: cinematic, native audio. LTX: fast/cheap.
Pick-by-task: realistic person image → Flux 2 Pro or Nano Banana Pro; influencer's face onto a photo → Face Swap with Nano Banana Pro; animate a still → Kling 2.6 i2v; long/multi-scene story → director mode.

TROUBLESHOOTING:
- Failed: content-policy refusal (GPT Image on faces/NSFW → switch to Nano Banana Pro/Flux); expired source URL; missing API key; transient model error (retry). If the node has an "error", base your explanation on it.
- Looks bad: add concrete detail (lighting, lens, mood), pick a stronger model, raise quality (2K/1080p), match aspect ratio, attach a reference image/@influencer. For face swaps keep Nano Banana Pro prompts short.
```

Inject context as system messages before history:

```js
const influencers = Array.isArray(context.influencers) ? context.influencers : [];
const inflMsg = influencers.length
  ? "User's saved influencers — answer questions about them from this list:\n" +
    influencers.map((i) => `@${i.handle} — ${i.name}${i.description ? ` — ${i.description}` : ""}`).join("\n")
  : "User's saved influencers: none saved yet.";
const canvas = Array.isArray(context.canvas) ? context.canvas : [];
const canvasMsg = canvas.length
  ? "Current canvas nodes (for answering questions about the user's work):\n" + JSON.stringify(canvas)
  : "Current canvas nodes: the canvas is empty.";

const messages = [
  { role: "system", content: SYS },
  { role: "system", content: sel /* canvas selection hint */ },
  { role: "system", content: inflMsg },
  { role: "system", content: canvasMsg },
  ...history.slice(-6).map((m) => ({ role: m.role, content: m.content })),
  { role: "user", content: input },
];
```

Keyless fallback — answer questions (incl. influencer lookups from context)
instead of always classifying a node:

```js
if (!KEY) {
  const text = (input || "").toLowerCase();
  const isQuestion = /\?/.test(input || "") ||
    /^(who|what|why|which|how|when|where|is|are|can|could|does|do|should|tell me|explain)\b/.test(text);
  if (isQuestion) {
    const infl = Array.isArray(context.influencers) ? context.influencers : [];
    const hit = infl.find((i) =>
      text.includes("@" + (i.handle || "").toLowerCase()) ||
      (i.handle && text.includes((i.handle || "").toLowerCase())) ||
      (i.name && text.includes((i.name || "").toLowerCase()))
    );
    if (hit) {
      return NextResponse.json({
        kind: null,
        message: `@${hit.handle} is ${hit.name}${hit.description ? ` — ${hit.description}` : ""}.`,
      });
    }
    return NextResponse.json({
      kind: null,
      message: "I can answer questions about your influencers, your canvas, and which model to use — full answers need the AI model configured (set OPENAI_API_KEY on the server). Meanwhile, ask me to create an image/video/etc.",
    });
  }
  // ...existing keyword → node-kind classifier...
}
```

> The full LLM path uses `gpt-4o` with `response_format: { type: "json_object" }`.

---

## 5) Dashboard — scrollable + mini-canvas workflow previews

**Goals:** make the dashboard scroll so all canvases are reachable, and show a
**miniature render of each workflow** (nodes in their real positions joined by
edges) instead of an "N nodes" label.

**File:** `app/globals.css` — make the dashboard a fixed-height scroll container:

```css
.dash { height: 100vh; overflow-y: auto; }   /* was: min-height:100vh; overflow:auto */
```

**File:** `components/Dashboard.js` — preview component + helper:

```jsx
const isMediaUrl = (u) =>
  typeof u === "string" && (u.startsWith("http") || u.startsWith("data:") || u.startsWith("/api/"));

// A scaled-down render of the actual canvas: every node in its real position
// with its output thumbnail, joined by the same left→right connector edges.
// An SVG viewBox does the fit-to-tile scaling automatically.
function WorkflowPreview({ wf }) {
  const nodes = (wf.nodes || []).filter((n) => n.position);
  if (!nodes.length) return null;
  const dimOf = (n) => ({ w: n.width || 200, h: n.height || 240 });
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const n of nodes) {
    const { w, h } = dimOf(n);
    minX = Math.min(minX, n.position.x); minY = Math.min(minY, n.position.y);
    maxX = Math.max(maxX, n.position.x + w); maxY = Math.max(maxY, n.position.y + h);
  }
  const PAD = 40;
  const vb = `${minX - PAD} ${minY - PAD} ${maxX - minX + PAD * 2} ${maxY - minY + PAD * 2}`;
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  return (
    <svg className="wf-preview-canvas" viewBox={vb} preserveAspectRatio="xMidYMid meet">
      {(wf.edges || []).map((e, i) => {
        const s = byId[e.source], t = byId[e.target];
        if (!s || !t) return null;
        const sd = dimOf(s), td = dimOf(t);
        const sx = s.position.x + sd.w, sy = s.position.y + sd.h / 2;
        const tx = t.position.x, ty = t.position.y + td.h / 2;
        const dx = Math.max(30, Math.abs(tx - sx) / 2);
        return (
          <path key={i} className="wf-preview-edge" fill="none" vectorEffect="non-scaling-stroke"
            d={`M ${sx} ${sy} C ${sx + dx} ${sy} ${tx - dx} ${ty} ${tx} ${ty}`} />
        );
      })}
      {nodes.map((n) => {
        const { w, h } = dimOf(n);
        const out = n.data?.output;
        const isVid = n.data?.kind === "video";
        return (
          <foreignObject key={n.id} x={n.position.x} y={n.position.y} width={w} height={h}>
            <div className="wf-mini-node">
              {isMediaUrl(out)
                ? (isVid
                    ? <video src={`${out}#t=0.1`} muted playsInline preload="metadata" />
                    : <img src={out} alt="" />)
                : <div className={`wf-mini-ph wf-mini-${n.data?.kind || "image"}`} />}
            </div>
          </foreignObject>
        );
      })}
    </svg>
  );
}
```

Render it in each tile (fallback to node count when a canvas has no nodes):

```jsx
<div className="wf-tile-preview">
  {wf.nodes.some((n) => n.position) ? (
    <WorkflowPreview wf={wf} />
  ) : (
    <div className="wf-preview-empty">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
      <span>{wf.nodes.length} node{wf.nodes.length === 1 ? "" : "s"}</span>
    </div>
  )}
</div>
```

**CSS:**

```css
.wf-tile-preview { /* keep your existing height + bg; add: */ overflow: hidden; }

/* Mini-canvas preview: nodes in their real positions joined by edges. */
.wf-preview-canvas { width: 100%; height: 100%; display: block; }
.wf-preview-edge { stroke: var(--line-2); stroke-width: 1.25; stroke-dasharray: 3 3; opacity: .85; }
.wf-mini-node {
  width: 100%; height: 100%; border-radius: 14px; overflow: hidden;
  border: 1px solid rgba(255,255,255,.07); background: var(--surface-2);
}
.wf-mini-node img,
.wf-mini-node video { width: 100%; height: 100%; object-fit: cover; display: block; }
.wf-mini-ph { width: 100%; height: 100%; }
.wf-mini-image  { background: linear-gradient(135deg, rgba(236,72,153,.28), rgba(124,58,237,.20)); }
.wf-mini-video  { background: linear-gradient(135deg, rgba(124,58,237,.30), rgba(99,102,241,.20)); }
.wf-mini-motion { background: linear-gradient(135deg, rgba(168,85,247,.28), rgba(99,102,241,.20)); }
.wf-preview-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; color: var(--muted-2); font-size: 12px; }
```

---

## 6) "Generating" cursor fix (progress, not forbidden)

**Problem:** the generate button is `disabled` while running, which gives it a
`not-allowed` cursor — misleading, since it's *working*, not blocked.

**File:** `components/PromptBar.js` — add an `is-running` class while running:

```jsx
<button
  className={`ip-bar-generate ip-bar-generate-corner${running ? " is-running" : ""}`}
  onClick={onRun}
  disabled={running}
>
```

**CSS:**

```css
.ip-bar-generate:disabled { opacity: .45; cursor: not-allowed; box-shadow: none; }
/* While actively generating the button is disabled, but it's WORKING, not
   forbidden — show a progress cursor and keep it looking active. */
.ip-bar-generate.is-running:disabled { cursor: progress; opacity: .9; }
```

(The `.is-running:disabled` selector out-specifies `:disabled`, so it wins
regardless of order.)

---

## 7) Canvas node uploads persist (host on Blob, not inline base64)

**Bug:** uploading an image/video to a node stored it as an inline base64 data
URI. The local store strips `data:` blobs to fit the `localStorage` quota, so the
upload **disappeared when the canvas was reopened**.

**Fix:** host the upload (Vercel Blob) and store the permanent URL — URLs are
tiny and never stripped.

### New endpoint — `app/api/upload/route.js`

```js
import { NextResponse } from "next/server";
import { uploadDataUrl } from "@/lib/genstore"; // your "host a data URI -> URL" helper

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const { data, prefix } = body || {};
  if (!data || typeof data !== "string" || !data.startsWith("data:")) {
    return NextResponse.json({ error: "Provide a data: URI in 'data'." }, { status: 400 });
  }
  try {
    const url = await uploadDataUrl(data, prefix || "canvas-upload");
    return NextResponse.json({ url });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
```

> `uploadDataUrl` uploads a base64 data URI to Vercel Blob (permanent public URL)
> with a fal-storage fallback. Requires `BLOB_READ_WRITE_TOKEN` (or `FAL_KEY`).
> If your app doesn't have such a helper, any "upload bytes → return a public
> URL" service works.

### Node upload handler — `components/nodes/WorkflowNode.js`

```jsx
const onFile = (e) => {
  const file = e.target.files?.[0];
  e.target.value = "";
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    const dataUrl = reader.result;
    // Show the uploaded media immediately for instant feedback.
    setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, data: { ...n.data, output: dataUrl, status: "done", uploadedName: file.name } } : n)));
    // Then host it on Blob and swap in the permanent URL — inline data: blobs
    // get stripped from localStorage to save quota, so without this the upload
    // vanishes when the canvas is reopened.
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: dataUrl, prefix: file.type.startsWith("video") ? "canvas-vid" : "canvas-img" }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok && j.url) {
        setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, data: { ...n.data, output: j.url } } : n)));
      }
    } catch {
      // Hosting failed (e.g. no Blob token) — keep the inline preview; it works
      // this session but may not survive a reload.
    }
  };
  reader.readAsDataURL(file);
};
```

### The storage-strip side (context)

The reason this matters — the workflow store drops inline `data:` blobs but keeps
URLs when persisting:

```js
// keeps http/blob URLs, nulls only inline base64 so the workflow structure fits
for (const k of ["output", "sourceThumb", "image", "media"]) {
  if (typeof d[k] === "string" && d[k].startsWith("data:")) d[k] = null;
}
```

So once an upload is a URL, it survives storage and reopening.

---

## Environment variables referenced

| Var | Used by | Purpose |
|---|---|---|
| `OPENAI_API_KEY` | assistant, prompt-enhance, image→prompt | LLM/vision calls (without it, assistant uses a heuristic fallback) |
| `BLOB_READ_WRITE_TOKEN` | `/api/upload`, media hosting | Vercel Blob — permanent file URLs |
| `FAL_KEY` | generation + Blob fallback | image/video models; fallback file host |

---

*Companion file: `INTERACTIVE-TUTORIAL-GUIDE.md` (the canvas tour).*
```
