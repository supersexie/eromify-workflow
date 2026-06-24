# Geoflix — Frontend

All client-side code: Next.js App Router pages, React components, client libs, theme CSS, and auth middleware.

> Generated bundle of the actual Geoflix source. No API keys are included —
> all secrets are read from environment variables (see IMPLEMENTATION.md).
> Recreate each file at the path shown in its heading.

---

### `app/layout.js`

````js
import "@xyflow/react/dist/style.css";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";

export const metadata = {
  title: "Geoflix — The Node-Based Canvas for AI Creation",
  description: "Generate images, video, voiceovers, and scripts on one infinite canvas.",
};

export default function RootLayout({ children }) {
  const page = (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
  // Only wrap with Clerk once keys exist, so the site stays up until then.
  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <ClerkProvider
        signInUrl="/sign-in"
        signUpUrl="/sign-up"
        signInFallbackRedirectUrl="/app"
        signUpFallbackRedirectUrl="/app"
      >
        {page}
      </ClerkProvider>
    );
  }
  return page;
}

````

### `app/globals.css`

````css
/* SF Pro Display — self-hosted, subset to Latin (matches the landing page). */
@font-face {
  font-family: "SF Pro Display"; font-style: normal; font-weight: 400;
  font-display: swap; src: url("/fonts/SF-Pro-Display-Regular.woff2") format("woff2");
}
@font-face {
  font-family: "SF Pro Display"; font-style: normal; font-weight: 500;
  font-display: swap; src: url("/fonts/SF-Pro-Display-Medium.woff2") format("woff2");
}
@font-face {
  font-family: "SF Pro Display"; font-style: normal; font-weight: 600;
  font-display: swap; src: url("/fonts/SF-Pro-Display-Semibold.woff2") format("woff2");
}
@font-face {
  font-family: "SF Pro Display"; font-style: normal; font-weight: 700;
  font-display: swap; src: url("/fonts/SF-Pro-Display-Bold.woff2") format("woff2");
}
@font-face {
  font-family: "SF Pro Display"; font-style: normal; font-weight: 800;
  font-display: swap; src: url("/fonts/SF-Pro-Display-Heavy.woff2") format("woff2");
}

:root {
  --bg: #f3f6fb;
  --surface: #ffffff;
  --surface-2: #f1f4f9;
  --line: #e7eaef;
  --line-2: #dbe1ea;
  --ink: #0b1220;
  --text: #1f2733;
  --muted: #5b6472;
  --muted-2: #8a93a3;
  --faint: #aab2bf;
  --blue: #2563eb;
  --blue-dark: #1d4ed8;
  --blue-soft: rgba(37, 99, 235, 0.10);
  --grad: linear-gradient(135deg, #3b82f6, #2563eb);
  --shadow: 0 10px 30px rgba(16, 24, 40, 0.10);
  --shadow-sm: 0 4px 14px rgba(16, 24, 40, 0.06);
}

* { box-sizing: border-box; }
html, body, #__next { height: 100%; margin: 0; padding: 0; }
body {
  font-family: "SF Pro Display", "SF Pro Text", -apple-system, BlinkMacSystemFont,
    "Segoe UI", Roboto, sans-serif;
  background: var(--bg);
  color: var(--ink);
  overflow: hidden;
  -webkit-font-smoothing: antialiased;
}

/* ---- Top bar ---- */
.topbar {
  position: fixed; top: 0; left: 0; right: 0; height: 56px;
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px; z-index: 10; pointer-events: none;
}
.topbar > * { pointer-events: auto; }
.title-pill {
  display: flex; align-items: center; gap: 10px;
  background: var(--surface); border: 1px solid var(--line);
  padding: 8px 14px; border-radius: 10px;
  font-size: 14px; box-shadow: var(--shadow-sm);
}
.logo {
  width: 22px; height: 22px; border-radius: 6px;
  background: var(--grad);
  display: grid; place-items: center; color: white; font-weight: 700; font-size: 12px;
}
.dot { width: 6px; height: 6px; border-radius: 50%; background: var(--blue); }
.topbar-right { display: flex; align-items: center; gap: 8px; }
.chip {
  background: var(--surface); border: 1px solid var(--line);
  padding: 7px 12px; border-radius: 8px; font-size: 13px;
  display: flex; align-items: center; gap: 6px; color: var(--text);
  cursor: pointer; box-shadow: var(--shadow-sm);
}
.icon-btn {
  width: 36px; height: 36px; border-radius: 8px;
  background: var(--surface); border: 1px solid var(--line);
  display: grid; place-items: center; cursor: pointer; color: var(--muted);
  box-shadow: var(--shadow-sm);
}
.avatar {
  width: 32px; height: 32px; border-radius: 50%;
  background: linear-gradient(135deg, #bcd0f5, #93c5fd);
  border: 1px solid var(--line-2);
  display: grid; place-items: center; color: #2b3a55;
}
.title-pill input {
  background: transparent; border: none; color: var(--ink);
  font-size: 14px; font-weight: 700; font-family: inherit; outline: none;
  width: 160px;
}
.back-btn {
  display: grid; place-items: center; width: 28px; height: 28px;
  border-radius: 6px; background: transparent; border: none;
  color: var(--muted); cursor: pointer; margin-right: 2px;
}
.back-btn:hover { background: var(--surface-2); color: var(--ink); }
.save-indicator { font-size: 11px; color: var(--muted-2); margin-right: 4px; }

/* ---- Left rail ---- */
.rail {
  position: fixed; top: 50%; left: 12px; transform: translateY(-50%);
  display: flex; flex-direction: column; gap: 6px;
  background: var(--surface); border: 1px solid var(--line);
  padding: 6px; border-radius: 12px; z-index: 10; box-shadow: var(--shadow-sm);
}
.rail button {
  width: 36px; height: 36px; border-radius: 8px;
  background: transparent; border: none; color: var(--muted);
  display: grid; place-items: center; cursor: pointer;
}
.rail button:hover { background: var(--surface-2); color: var(--blue); }
.rail .divider { height: 1px; background: var(--line); margin: 4px 2px; }

/* ---- Empty state ---- */
.empty {
  position: absolute; inset: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  pointer-events: none; z-index: 5;
}
.empty h1 { font-size: 32px; font-weight: 700; letter-spacing: -0.02em; margin: 0 0 8px; color: var(--ink); }
.empty p { color: var(--muted); margin: 0 0 32px; font-size: 15px; }
.node-cards { display: flex; gap: 14px; pointer-events: auto; }
.node-card {
  width: 168px; height: 132px;
  background: var(--surface); border: 1px solid var(--line); border-radius: 14px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 10px; cursor: pointer; transition: all .15s ease; position: relative;
  box-shadow: var(--shadow-sm);
}
.node-card:hover { border-color: var(--blue); background: #fff; transform: translateY(-2px); box-shadow: var(--shadow); }
.node-card .ic {
  width: 40px; height: 40px; border-radius: 10px;
  background: var(--blue-soft); display: grid; place-items: center; color: var(--blue);
}
.node-card .label { font-size: 15px; font-weight: 600; color: var(--ink); }
.node-card .sub { font-size: 12px; color: var(--muted); }
.badge-new {
  position: absolute; background: var(--grad);
  color: white; font-size: 10px; padding: 2px 6px; border-radius: 4px;
  font-weight: 600; margin-left: 70px; margin-top: -28px;
}

/* ---- React Flow ---- */
.react-flow { background: var(--bg); }
.react-flow__background { background-color: var(--bg); }
/* scoped under .react-flow to outrank @xyflow's own .react-flow__handle rules */
.react-flow .react-flow__handle {
  background: var(--surface); width: 20px; height: 20px;
  border: 1.5px solid var(--line-2); border-radius: 50%;
  opacity: 0.9; transition: transform .14s ease, border-color .15s, background .15s, opacity .15s, box-shadow .15s;
}
.react-flow .react-flow__handle::after {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  background-image:
    linear-gradient(currentColor, currentColor),
    linear-gradient(currentColor, currentColor);
  background-size: 9px 1.6px, 1.6px 9px;
  background-position: center;
  background-repeat: no-repeat;
  color: var(--muted);
}
.react-flow__node:hover .react-flow__handle,
.react-flow__node.selected .react-flow__handle { opacity: 1; }
.react-flow .react-flow__handle:hover {
  border-color: var(--blue); background: var(--blue-soft);
  box-shadow: 0 0 0 6px rgba(37, 99, 235, 0.12);
  transform: translate(-50%, -50%) scale(2.4);
  z-index: 20;
}
.react-flow .react-flow__handle.source:hover { transform: translate(0, -50%) scale(2.4); }
.react-flow .react-flow__handle.target:hover { transform: translate(-100%, -50%) scale(2.4); }
.react-flow .react-flow__handle:hover::after { color: var(--blue); }
.react-flow .react-flow__edge-path { stroke: var(--ink); stroke-width: 1.5; }
.react-flow__edge.selected .react-flow__edge-path { stroke: var(--blue); }
.react-flow__connectionline path { stroke: var(--blue); stroke-width: 1.5; stroke-dasharray: 4 4; }

/* ---- Large editing card (node) ---- */
.wf-card {
  position: relative; padding: 0;
  display: flex; flex-direction: column;
  color: var(--ink);
}
.wf-card.card-square { width: 304px; }
.wf-card.card-wide { width: 525px; }
.wf-card.card-tall { width: 213px; }

.wf-card-header {
  display: flex; align-items: center; gap: 8px;
  font-size: 14px; color: var(--text); margin-bottom: 8px;
  padding-left: 4px;
}
.wf-card-header-ic { color: var(--muted); display: inline-flex; }
.wf-card-delete {
  margin-left: auto;
  width: 24px; height: 24px; border-radius: 6px;
  background: transparent; border: none; color: var(--muted-2);
  display: grid; place-items: center; cursor: pointer;
  opacity: 0; transition: opacity .15s, background .15s, color .15s;
}
.react-flow__node:hover .wf-card-delete,
.react-flow__node.selected .wf-card-delete { opacity: 1; }
.wf-card-delete:hover { background: #fee2e2; color: #dc2626; }

.wf-card-body {
  position: relative;
  border-radius: 18px;
  background:
    radial-gradient(circle at 50% 50%, rgba(37,99,235,.05), transparent 70%),
    var(--surface);
  border: 1.5px solid var(--line-2);
  box-shadow: var(--shadow-sm);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 10px;
  overflow: hidden;
}
.card-square .wf-card-body { width: 304px; height: 304px; }
.card-wide .wf-card-body { width: 525px; height: 290px; }
.card-tall .wf-card-body { width: 213px; height: 305px; }

.react-flow__node.selected .wf-card-body {
  border-color: var(--blue);
  box-shadow:
    inset 0 0 0 1px var(--blue),
    0 0 0 4px rgba(37,99,235,.12),
    var(--shadow);
}

.wf-card-placeholder {
  color: var(--muted); display: grid; place-items: center;
}
.wf-card-cta {
  font-size: 13px; color: var(--muted);
}
.wf-card-upload {
  font-size: 12px; color: var(--muted-2);
  display: inline-flex; align-items: center; gap: 6px;
}
.wf-card-upload-btn {
  background: transparent; border: none; cursor: pointer;
  padding: 6px 10px; border-radius: 6px; font-family: inherit; color: var(--muted);
}
.wf-card-upload-btn:hover { background: var(--blue-soft); color: var(--blue); }
.wf-card-source-corner { border: 2px solid #fff; cursor: pointer; }
.wf-card-source-corner:hover { filter: brightness(1.05); }
.wf-card-source-tile {
  position: relative; width: 56px; height: 56px; border-radius: 10px;
  overflow: hidden; border: 1px solid var(--line); background: var(--surface-2);
}
.wf-card-source-tile img { width: 100%; height: 100%; object-fit: cover; display: block; }
.wf-card-source-tile-badge {
  position: absolute; top: 3px; right: 3px;
  width: 16px; height: 16px; border-radius: 4px;
  background: var(--grad);
  display: grid; place-items: center; color: white;
}
.wf-card-output { width: 100%; height: 100%; object-fit: cover; }
.wf-card-text {
  width: 100%; height: 100%; overflow-y: auto;
  padding: 18px 20px; text-align: left;
  font-size: 13px; line-height: 1.55; color: var(--ink);
  white-space: pre-wrap; word-break: break-word; cursor: text;
}
.wf-card-running {
  position: absolute; bottom: 14px; left: 14px;
  background: var(--blue-soft); color: var(--blue-dark);
  border: 1px solid rgba(37,99,235,.3); border-radius: 6px;
  padding: 4px 10px; font-size: 11px;
}
.wf-card-resize {
  position: absolute; bottom: 6px; right: 6px;
  width: 12px; height: 12px;
  border-right: 2px solid var(--faint); border-bottom: 2px solid var(--faint);
  border-bottom-right-radius: 2px; opacity: .6;
}
.wf-card-source-corner {
  position: absolute; top: 8px; right: 8px;
  width: 28px; height: 28px; border-radius: 8px;
  background: var(--grad);
  display: grid; place-items: center; color: white;
  border: 2px solid #fff;
}

/* Type picker popover (drop-to-create) */
.type-picker {
  position: fixed; z-index: 100;
  background: var(--surface); border: 1px solid var(--line);
  border-radius: 10px; padding: 6px; display: flex; flex-direction: column; gap: 2px;
  box-shadow: var(--shadow);
  min-width: 170px;
}
.type-picker-header {
  font-size: 10px; color: var(--muted-2); text-transform: uppercase;
  letter-spacing: .06em; padding: 6px 10px 4px;
}
.type-picker button {
  display: flex; align-items: center; gap: 10px;
  background: transparent; border: none; color: var(--ink);
  padding: 7px 10px; border-radius: 6px; cursor: pointer;
  font-size: 13px; font-family: inherit; text-align: left;
}
.type-picker button:hover { background: var(--surface-2); }
.type-picker .ic {
  width: 20px; height: 20px; border-radius: 5px; background: var(--blue-soft);
  display: grid; place-items: center; color: var(--blue);
}

/* Source thumbnail attached to prompt bar */
.pb-source-thumb {
  width: 64px; height: 64px; border-radius: 8px; overflow: hidden;
  border: 1px solid var(--line); background: var(--surface-2); flex-shrink: 0;
}
.pb-source-thumb img, .pb-source-thumb video { width: 100%; height: 100%; object-fit: cover; display: block; }
.pb-sources { display: flex; gap: 8px; padding: 0 4px 12px; flex-wrap: wrap; }
.pb-source-text {
  display: inline-flex; align-items: center; gap: 6px; max-width: 260px;
  background: var(--blue-soft); border: 1px solid rgba(37,99,235,.25);
  color: var(--blue-dark); border-radius: 8px; padding: 6px 10px;
  font-size: 12px; font-weight: 600; white-space: nowrap;
  overflow: hidden; text-overflow: ellipsis;
}

/* ---- Prompt bar (bottom, attached to selected node) ---- */
.prompt-bar {
  position: fixed; left: 50%; bottom: 16px; transform: translateX(-50%);
  width: min(820px, calc(100vw - 96px));
  background: var(--surface); border: 1px solid var(--line);
  border-radius: 14px; padding: 12px 14px 12px;
  z-index: 12;
  box-shadow: var(--shadow);
}
.pb-divider { display: flex; justify-content: center; margin: -4px 0 10px; }
.pb-grip { width: 32px; height: 3px; border-radius: 2px; background: var(--line-2); }
.pb-title-row {
  display: flex; align-items: center; gap: 8px;
  padding: 0 4px 12px;
}
.pb-title {
  flex: 1; background: transparent; border: none; outline: none;
  color: var(--ink); font-size: 14px; font-family: inherit;
}
.pb-title::placeholder { color: var(--muted-2); }
.pb-title:disabled { color: var(--muted); }
.pb-tab {
  font-size: 11px; color: var(--muted); background: var(--surface-2);
  padding: 2px 8px; border-radius: 4px; border: 1px solid var(--line);
}
.pb-window {
  width: 24px; height: 24px; display: grid; place-items: center;
  background: transparent; border: none; color: var(--muted-2); cursor: pointer;
  border-radius: 4px;
}
.pb-window:hover { background: var(--surface-2); color: var(--text); }

.pb-chips {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
}
.pb-chips-left { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.chip-wrap { position: relative; }
.chip-btn {
  display: inline-flex; align-items: center; gap: 6px;
  background: var(--surface-2); border: 1px solid var(--line);
  color: var(--text); padding: 6px 10px; border-radius: 8px;
  font-size: 12px; cursor: pointer; font-family: inherit;
}
.chip-btn:hover { border-color: var(--blue); color: var(--blue); }
.pb-attached {
  display: inline-flex; align-items: center; gap: 4px;
  background: var(--surface-2); border: 1px solid var(--line);
  padding: 4px 6px; border-radius: 8px; position: relative;
}
.pb-attached-pill {
  display: inline-flex; align-items: center; justify-content: center;
  width: 24px; height: 24px; background: var(--blue-soft); border-radius: 6px; color: var(--blue);
}
.pb-play {
  display: inline-flex; align-items: center; gap: 4px;
  background: var(--blue); border: 1px solid var(--blue);
  color: #fff; padding: 6px 12px; border-radius: 8px;
  font-size: 12px; cursor: pointer; font-family: inherit; font-weight: 600;
}
.pb-play:hover { background: var(--blue-dark); border-color: var(--blue-dark); }
.pb-play:disabled { opacity: .5; cursor: not-allowed; }
.pb-play-inc {
  display: inline-flex; padding-left: 4px; margin-left: 4px;
  border-left: 1px solid rgba(255,255,255,.4); color: rgba(255,255,255,.85);
}

/* ---- Dropdown ---- */
.dd-backdrop { position: fixed; inset: 0; z-index: 20; }
.dd-menu {
  position: absolute; bottom: calc(100% + 4px); left: 0;
  background: var(--surface); border: 1px solid var(--line);
  border-radius: 8px; padding: 4px; z-index: 21;
  min-width: 180px; box-shadow: var(--shadow);
}
.dd-menu button {
  display: block; width: 100%; text-align: left;
  background: transparent; border: none; color: var(--text);
  padding: 7px 10px; border-radius: 6px; font-size: 12px; cursor: pointer;
  font-family: inherit;
}
.dd-menu button:hover { background: var(--surface-2); color: var(--ink); }

/* ---- Add-node popup menu (Picsart-style, categorized) ---- */
.add-menu-backdrop { position: fixed; inset: 0; z-index: 10; }
.add-menu {
  position: fixed; left: 60px; top: 50%; transform: translateY(-50%);
  background: var(--surface); border: 1px solid var(--line); border-radius: 14px;
  padding: 8px; z-index: 11; display: flex; flex-direction: column; gap: 2px;
  box-shadow: var(--shadow); min-width: 230px;
}
.add-menu-header {
  font-size: 11px; font-weight: 700; color: var(--muted-2);
  text-transform: uppercase; letter-spacing: .05em;
  padding: 10px 12px 4px;
}
.add-menu-sep { height: 1px; background: var(--line); margin: 6px 8px; }
.add-menu button {
  display: flex; align-items: center; gap: 12px; padding: 9px 12px;
  background: transparent; border: none; color: var(--ink);
  border-radius: 8px; cursor: pointer; font-size: 14px; width: 100%;
  text-align: left; font-family: inherit;
}
.add-menu button:hover { background: var(--surface-2); }
.add-menu .ic {
  width: 28px; height: 28px; border-radius: 7px; background: var(--blue-soft);
  display: grid; place-items: center; color: var(--blue); flex: 0 0 auto;
}
.add-menu-soon { color: var(--muted-2); cursor: not-allowed; }
.add-menu-soon:hover { background: transparent; }
.add-menu-soon .ic { background: var(--surface-2); color: var(--muted-2); }
.add-menu-tag {
  margin-left: auto; font-size: 10px; font-weight: 700;
  color: var(--muted-2); background: var(--surface-2);
  padding: 2px 7px; border-radius: 999px; letter-spacing: .02em;
}

/* ---- Library (gallery modal) ---- */
.lib-backdrop {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(11,18,32,.35); backdrop-filter: blur(3px);
  display: flex; align-items: center; justify-content: center; padding: 32px;
}
.lib-modal {
  width: 100%; max-width: 1200px; height: 88vh;
  background: var(--surface); border: 1px solid var(--line); border-radius: 16px;
  display: flex; flex-direction: column; overflow: hidden;
  box-shadow: 0 30px 80px rgba(16,24,40,.20);
}
.lib-head {
  flex: 0 0 auto; display: flex; align-items: center; justify-content: space-between;
  padding: 14px 18px; border-bottom: 1px solid var(--line);
}
.lib-head-title { display: flex; align-items: center; gap: 10px; font-size: 16px; font-weight: 700; color: var(--ink); }
.lib-count { font-size: 12px; color: var(--muted); background: var(--surface-2); border-radius: 10px; padding: 1px 9px; }
.lib-close { background: transparent; border: none; color: var(--muted); font-size: 16px; cursor: pointer; padding: 4px 8px; border-radius: 6px; }
.lib-close:hover { background: var(--surface-2); color: var(--ink); }
.lib-body { flex: 1 1 auto; min-height: 0; overflow-y: auto; padding: 20px; }
.lib-empty { margin: auto; text-align: center; color: var(--muted); max-width: 320px; padding-top: 80px; }
.lib-empty-icon { color: var(--faint); margin-bottom: 16px; }
.lib-empty h3 { color: var(--ink); font-size: 18px; margin: 0 0 8px; }
.lib-empty p { font-size: 13px; line-height: 1.5; margin: 0; }
.lib-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 6px;
}
.lib-block {
  position: relative; aspect-ratio: 16 / 9; background: var(--surface-2);
  border-radius: 8px; overflow: hidden; display: block; cursor: pointer;
  text-decoration: none; border: 1px solid var(--line);
  /* Skip rendering/decoding offscreen tiles — cheap virtualization for smooth scroll */
  content-visibility: auto;
  contain-intrinsic-size: 360px 203px;
}
.lib-block img, .lib-block video {
  width: 100%; height: 100%; object-fit: cover; display: block;
  transition: transform .25s ease;
}
.lib-block:hover img, .lib-block:hover video { transform: scale(1.04); }
.lib-audio, .lib-textthumb {
  width: 100%; height: 100%; display: grid; place-items: center; color: var(--muted);
  background: radial-gradient(circle at 50% 40%, rgba(37,99,235,.10), transparent 70%);
  text-transform: capitalize; font-size: 14px;
}
.lib-badge {
  position: absolute; top: 8px; left: 8px; z-index: 2; font-size: 10px; font-weight: 600;
  background: rgba(11,18,32,.55); color: #fff; padding: 3px 8px; border-radius: 5px;
  backdrop-filter: blur(4px); letter-spacing: .02em;
}
.lib-download {
  position: absolute; top: 8px; right: 8px; z-index: 3;
  width: 32px; height: 32px; border-radius: 8px;
  background: rgba(11,18,32,.55); backdrop-filter: blur(4px);
  border: 1px solid rgba(255,255,255,.18); color: #fff;
  display: grid; place-items: center; cursor: pointer;
  opacity: 0; transform: translateY(-2px); transition: opacity .15s, transform .15s, background .15s;
}
.lib-block:hover .lib-download { opacity: 1; transform: translateY(0); }
.lib-download:hover { background: var(--blue); border-color: var(--blue); }

.lib-overlay {
  position: absolute; inset: auto 0 0 0; padding: 24px 12px 10px;
  background: linear-gradient(transparent, rgba(11,18,32,.82));
  opacity: 0; transition: opacity .15s; pointer-events: none;
}
.lib-block:hover .lib-overlay { opacity: 1; }
.lib-overlay-prompt {
  font-size: 12px; color: #fff; line-height: 1.35;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.lib-overlay-wf { font-size: 10px; color: #cbd5e1; margin-top: 3px; }

/* ---- AI Chatbot (right side panel) ---- */
.cb-sidepanel {
  position: fixed; inset: 0 0 0 auto; z-index: 1000;
  width: 400px; max-width: 92vw;
  padding: 12px;
  pointer-events: none;
}
.cb-modal {
  width: 100%; height: 100%;
  background: var(--surface); border: 1px solid var(--line); border-radius: 16px;
  display: flex; flex-direction: column; overflow: hidden;
  box-shadow: -10px 0 60px rgba(16,24,40,.16);
  pointer-events: auto;
}
.cb-head {
  flex: 0 0 auto;
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 16px; border-bottom: 1px solid var(--line);
}
.cb-head-title { font-size: 15px; font-weight: 700; color: var(--ink); display: flex; align-items: center; gap: 8px; }
.cb-spark { color: var(--blue); }
.cb-head-actions { display: flex; align-items: center; gap: 8px; }
.cb-iconbtn {
  background: transparent; border: 1px solid var(--line); color: var(--muted);
  border-radius: 7px; padding: 5px 10px; font-size: 12px; cursor: pointer; font-family: inherit;
}
.cb-iconbtn:hover { background: var(--surface-2); color: var(--ink); }
.cb-close { border: none; font-size: 14px; padding: 5px 9px; }

.cb-messages {
  flex: 1 1 auto; min-height: 0;
  overflow-y: auto; padding: 18px 16px;
  display: flex; flex-direction: column; gap: 12px;
}
.cb-welcome { margin: auto; text-align: center; color: var(--muted); max-width: 320px; }
.cb-welcome-icon {
  width: 48px; height: 48px; margin: 0 auto 14px; border-radius: 12px;
  background: var(--grad);
  display: grid; place-items: center; color: #fff; font-size: 22px;
}
.cb-welcome h3 { color: var(--ink); font-size: 18px; margin: 0 0 8px; font-weight: 700; }
.cb-welcome p { font-size: 13px; line-height: 1.5; margin: 0 0 18px; }
.cb-suggestions { display: flex; flex-direction: column; gap: 8px; }
.cb-suggestion {
  background: var(--surface-2); border: 1px solid var(--line); color: var(--text);
  border-radius: 8px; padding: 9px 12px; font-size: 12.5px; cursor: pointer;
  text-align: left; font-family: inherit;
}
.cb-suggestion:hover { border-color: var(--blue); color: var(--blue); }

.cb-msg { display: flex; }
.cb-msg-user { justify-content: flex-end; }
.cb-msg-assistant { justify-content: flex-start; }
.cb-bubble {
  background: var(--surface-2); border: 1px solid var(--line);
  padding: 10px 14px; border-radius: 14px; max-width: 82%;
  font-size: 13px; line-height: 1.5; color: var(--ink);
  white-space: pre-wrap; word-break: break-word;
}
.cb-msg-user .cb-bubble {
  background: var(--blue); border-color: var(--blue); color: #fff;
}
.cb-chip {
  margin-top: 8px; padding: 6px 10px;
  background: var(--blue-soft); border: 1px solid rgba(37,99,235,.3);
  border-radius: 8px; font-size: 11px; color: var(--blue-dark);
}
.cb-thinking { display: flex; gap: 4px; align-items: center; }
.cb-dot {
  width: 6px; height: 6px; border-radius: 50%; background: var(--faint);
  animation: cb-blink 1.2s infinite both;
}
.cb-dot:nth-child(2) { animation-delay: .2s; }
.cb-dot:nth-child(3) { animation-delay: .4s; }
@keyframes cb-blink { 0%, 80%, 100% { opacity: .25; } 40% { opacity: 1; } }

.cb-inputbar {
  flex: 0 0 auto;
  border-top: 1px solid var(--line); padding: 12px 14px;
  display: flex; flex-direction: column; gap: 8px;
}
.cb-autorun-row { display: flex; align-items: center; gap: 8px; }
.cb-model {
  background: var(--surface-2); border: 1px solid var(--line); color: var(--text);
  border-radius: 7px; padding: 5px 8px; font-size: 11.5px; font-family: inherit;
  cursor: pointer; outline: none; margin-left: auto;
}
.cb-model:focus { border-color: var(--blue); }
.cb-autorun {
  background: var(--surface-2); border: 1px solid var(--line); color: var(--muted);
  border-radius: 7px; padding: 5px 10px; font-size: 11.5px; cursor: pointer; font-family: inherit;
}
.cb-autorun.on { color: var(--blue); border-color: var(--blue); background: var(--blue-soft); }
.cb-inputrow { display: flex; align-items: flex-end; gap: 8px; }
.cb-textarea {
  flex: 1 1 auto; background: var(--surface-2); border: 1px solid var(--line);
  border-radius: 10px; color: var(--ink); font-family: inherit; font-size: 14px;
  padding: 10px 12px; outline: none; resize: none; max-height: 120px;
}
.cb-textarea:focus { border-color: var(--blue); }
.cb-textarea::placeholder { color: var(--muted-2); }
.cb-send {
  flex: 0 0 auto; width: 40px; height: 40px; border-radius: 10px;
  background: var(--grad);
  color: #fff; border: none; cursor: pointer; display: grid; place-items: center;
}
.cb-send:disabled { opacity: .4; cursor: not-allowed; }

.assistant-open-btn {
  display: inline-flex; align-items: center; gap: 6px;
  background: var(--grad);
  border: none; color: #fff; padding: 7px 13px; border-radius: 8px;
  font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit;
}
.assistant-open-btn:hover { filter: brightness(1.05); }
.assistant-fab {
  position: fixed; bottom: 18px; right: 18px; z-index: 25;
  width: 44px; height: 44px; border-radius: 12px;
  background: var(--surface); border: 1px solid var(--line);
  color: var(--blue); cursor: pointer; display: grid; place-items: center;
  box-shadow: var(--shadow);
}
.assistant-fab:hover { background: var(--blue-soft); border-color: var(--blue); color: var(--blue-dark); }

/* ---- Zoom pill (bottom-left) ---- */
.zoom-pill {
  position: fixed; bottom: 16px; left: 16px; z-index: 10;
  background: var(--surface); border: 1px solid var(--line);
  width: 36px; height: 36px; border-radius: 10px;
  display: grid; place-items: center; color: var(--muted); font-size: 12px;
  box-shadow: var(--shadow-sm);
}

/* ---- Dashboard ---- */
.dash { min-height: 100vh; overflow: auto; }
.dash-topbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 32px; border-bottom: 1px solid var(--line);
}
.primary-btn {
  display: inline-flex; align-items: center; gap: 8px;
  background: var(--blue);
  border: none; color: white; padding: 9px 16px; border-radius: 10px;
  font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit;
}
.primary-btn:hover { background: var(--blue-dark); }
.dash-body { max-width: 1100px; margin: 0 auto; padding: 48px 32px; }
.dash-h1 { font-size: 32px; font-weight: 700; letter-spacing: -0.02em; margin: 0 0 6px; color: var(--ink); }
.dash-sub { color: var(--muted); margin: 0 0 32px; }
.dash-empty {
  border: 1px dashed var(--line-2); border-radius: 16px; padding: 64px 32px;
  text-align: center; color: var(--muted);
}
.dash-empty-icon { color: var(--faint); margin-bottom: 20px; }
.dash-empty h2 { color: var(--ink); margin: 0 0 6px; font-size: 18px; }
.dash-empty p { margin: 0 0 24px; }
.wf-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}
.wf-tile {
  background: var(--surface); border: 1px solid var(--line); border-radius: 12px;
  overflow: hidden; cursor: pointer; transition: all .15s ease;
  display: flex; flex-direction: column; position: relative; box-shadow: var(--shadow-sm);
}
.wf-tile:hover { border-color: var(--blue); transform: translateY(-2px); box-shadow: var(--shadow); }
.wf-tile-preview {
  height: 130px;
  background:
    radial-gradient(circle at 30% 40%, rgba(37,99,235,.12), transparent 60%),
    radial-gradient(circle at 70% 60%, rgba(124,58,237,.10), transparent 60%),
    var(--surface-2);
  display: flex; align-items: center; justify-content: center;
  color: var(--muted-2); font-size: 12px;
}
.wf-tile-meta { padding: 12px 14px; border-top: 1px solid var(--line); }
.wf-tile-name { font-size: 14px; font-weight: 600; margin-bottom: 4px; color: var(--ink); }
.wf-tile-time { font-size: 11px; color: var(--muted-2); }
.wf-tile-actions {
  position: absolute; top: 8px; right: 8px; display: flex; gap: 4px;
  opacity: 0; transition: opacity .15s;
}
.wf-tile:hover .wf-tile-actions { opacity: 1; }
.wf-tile-actions button {
  width: 28px; height: 28px; border-radius: 6px; border: 1px solid var(--line);
  background: rgba(255,255,255,.9); backdrop-filter: blur(4px);
  color: var(--text); cursor: pointer; display: grid; place-items: center;
}
.wf-tile-actions button:hover { background: #fff; color: var(--blue); }
.wf-tile-new {
  border-style: dashed; align-items: center; justify-content: center;
  min-height: 200px; gap: 8px; color: var(--muted); background: transparent; box-shadow: none;
}
.wf-tile-new-plus { font-size: 32px; color: var(--faint); }
.wf-rename {
  width: 100%; background: #fff; border: 1px solid var(--blue);
  color: var(--ink); padding: 4px 8px; border-radius: 4px; font-size: 14px;
  outline: none; font-family: inherit;
}

/* ---- Auth pages (Clerk sign-in / sign-up) ---- */
.auth-wrap {
  min-height: 100vh; width: 100%;
  display: grid; place-items: center; padding: 40px 20px;
  background:
    radial-gradient(1000px 400px at 50% -100px, #cfe0ff 0%, rgba(207,224,255,0) 70%),
    var(--bg);
}

/* ---- New-workflow name modal ---- */
.nw-backdrop {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(11,18,32,.35); backdrop-filter: blur(3px);
  display: flex; align-items: center; justify-content: center; padding: 24px;
}
.nw-modal {
  width: 100%; max-width: 440px;
  background: var(--surface); border: 1px solid var(--line); border-radius: 18px;
  padding: 28px; box-shadow: 0 30px 80px rgba(16,24,40,.20);
}
.nw-title { font-size: 22px; font-weight: 700; letter-spacing: -0.02em; color: var(--ink); margin: 0 0 6px; }
.nw-sub { font-size: 14px; color: var(--muted); margin: 0 0 20px; line-height: 1.5; }
.nw-input {
  width: 100%; background: var(--surface-2); border: 1px solid var(--line-2);
  color: var(--ink); padding: 12px 14px; border-radius: 10px; font-size: 15px;
  outline: none; font-family: inherit; transition: border-color .15s;
}
.nw-input:focus { border-color: var(--blue); }
.nw-input::placeholder { color: var(--muted-2); }
.nw-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 22px; }
.nw-cancel {
  background: transparent; border: 1px solid var(--line-2); color: var(--text);
  padding: 9px 16px; border-radius: 10px; font-size: 14px; font-weight: 600;
  cursor: pointer; font-family: inherit;
}
.nw-cancel:hover { background: var(--surface-2); }

````

### `app/page.js`

````js
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import s from "./landing.module.css";

const CLERK_ENABLED = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

const Arrow = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const PlayLogo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
);

const ClaudeMark = () => (
  <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor" aria-hidden="true">
    {Array.from({ length: 12 }).map((_, i) => (
      <rect key={i} x="11.1" y="2.6" width="1.8" height="7.2" rx="0.9" transform={`rotate(${i * 30} 12 12)`} />
    ))}
  </svg>
);

const MCP_FEATURES = [
  { h: "Generate without leaving chat", p: "Ask Claude for an image, video, voiceover, or script and it runs Geoflix for you — no tab-switching." },
  { h: "Every model, one prompt", p: "FLUX, Seedream, Kling, Veo and LTX — Claude routes to the right model automatically." },
  { h: "Media renders inline", p: "Generated images and video play right inside the conversation, ready to drop into your workflow." },
];

const TOOLS = [
  { icon: "🖼️", title: "Image Generation", desc: "Generate stunning images with FLUX, Seedream, and Nano Banana — straight to a public URL.", img: "/tools/image-card.jpg" },
  { icon: "🎬", title: "Video Generation", desc: "Text-to-video and image-to-video powered by LTX, Wan, MiniMax Hailuo, and Kling.", video: "/tools/video-card.mp4" },
  { icon: "🎙️", title: "AI Voiceover", desc: "Turn any script into natural-sounding narration with one click.", video: "/tools/voiceover-card.mp4" },
  { icon: "✍️", title: "AI Scriptwriter", desc: "Generate captions, copy, and full scripts from a single prompt.", video: "/tools/scriptwriter-card.mp4" },
  { icon: "🔗", title: "Genmax Flow", desc: "Connect image, video, text, and audio nodes on one infinite canvas.", video: "/tools/genmax-card.mp4", tag: "New" },
];

// Auto-scrolling showcase tiles — empty placeholders (3 landscape, 3 portrait).
const SHOWCASE = [
  // Most recently added videos first — the marquee starts here.
  { ratio: "9:16", views: "34.8M Views", video: "/marquee/p9.mp4", creator: "Doodle Doze", emoji: "🍋", color: "#facc15", title: "The Lemon Who Wanted to Be Sweet" },
  { ratio: "9:16", views: "11.2M Views", video: "/marquee/p10.mp4", creator: "Wander More", emoji: "🏔️", color: "#10b981", title: "Would You Dare Cross This?" },
  { ratio: "16:9", views: "92.5M Views", video: "/marquee/l6.mp4", creator: "Cinematic AI", emoji: "🎬", color: "#1e293b", title: "He Shouldn't Have Looked Back" },
  { ratio: "9:16", views: "47.1M Views", video: "/marquee/p11.mp4", creator: "Mega Machines", emoji: "🚜", color: "#f97316", title: "Building the World's Richest Garage" },
  { ratio: "9:16", views: "23.9M Views", video: "/marquee/p12.mp4", creator: "AI Critters", emoji: "🐈", color: "#14b8a6", title: "These Cats Built an Entire House" },
  { ratio: "9:16", views: "68.4M Views", video: "/marquee/p13.mp4", creator: "AI Critters", emoji: "🦁", color: "#d97706", title: "The Lion's First Haircut" },
  { ratio: "9:16", views: "15.6M Views", video: "/marquee/p14.mp4", creator: "Suburban Hacks", emoji: "🍂", color: "#65a30d", title: "This Yard Trick Went Viral" },
  { ratio: "9:16", views: "39.7M Views", video: "/marquee/p15.mp4", creator: "Flow State", emoji: "🤸", color: "#f43f5e", title: "Sunset Flips Hit Different" },
  { ratio: "9:16", views: "57.3M Views", video: "/marquee/p16.mp4", creator: "Oddly Satisfying", emoji: "🔪", color: "#22c55e", title: "What's Really Inside a Soda Can?" },
  { ratio: "9:16", views: "27.4M Views", video: "/marquee/p5.mp4", creator: "POV Daily", emoji: "🎥", color: "#0ea5e9", title: "You've Never Seen a City Like This" },
  { ratio: "9:16", views: "8.9M Views", video: "/marquee/p6.mp4", creator: "Whisker Tales", emoji: "🐱", color: "#a78bfa", title: "He Waits By the Door Every Night" },
  { ratio: "9:16", views: "51.2M Views", video: "/marquee/p7.mp4", creator: "Wander More", emoji: "🚵", color: "#10b981", title: "The Trail That Changed My Life" },
  { ratio: "9:16", views: "19.6M Views", video: "/marquee/p8.mp4", creator: "Track Nation", emoji: "🏃", color: "#ef4444", title: "The Comeback Nobody Saw Coming" },
  // Original showcase videos.
  { ratio: "16:9", views: "54.2M Views", video: "/marquee/l1.mp4", creator: "Tiny Tunes", emoji: "🍼", color: "#38bdf8", title: "Baby Shark's New Best Friend" },
  { ratio: "9:16", views: "12.7M Views", video: "/marquee/p1.mp4", creator: "Tiny Tunes", emoji: "🐮", color: "#38bdf8", title: "Old MacDonald's Surprise Guest" },
  { ratio: "16:9", views: "88.1M Views", video: "/marquee/l2.mp4", creator: "Pixel Pals", emoji: "🦎", color: "#34d399", title: "The Chameleon Who Couldn't Hide" },
  { ratio: "9:16", views: "31.5M Views", video: "/marquee/p2.mp4", creator: "Story Barn", emoji: "🐴", color: "#f59e0b", title: "The Pony Who Loved to Sing" },
  { ratio: "16:9", views: "117.3M Views", video: "/marquee/l3.mp4", creator: "Lullaby Land", emoji: "🐰", color: "#f472b6", title: "Bunny Teaches Baby to Hop" },
  { ratio: "9:16", views: "9.4M Views", video: "/marquee/p3.mp4", creator: "Anime Dreams", emoji: "🍙", color: "#fb7185", title: "A Quiet Morning in the Countryside" },
  { ratio: "9:16", views: "62.8M Views", video: "/marquee/p4.mp4", creator: "Monster Mash", emoji: "👾", color: "#8b5cf6", title: "Meet the Fuzziest Monster Yet" },
  { ratio: "16:9", views: "73.6M Views", video: "/marquee/l4.mp4", creator: "Whisker Tales", emoji: "🐱", color: "#a78bfa", title: "Two Cats, One Big Adventure" },
  { ratio: "16:9", views: "45.9M Views", video: "/marquee/l5.mp4", creator: "Night Reels", emoji: "🌙", color: "#6366f1", title: "What Lurks in the Attic" },
];

const FEATURES = [
  { h: "Node-Based Canvas", p: "Build creative workflows on an infinite canvas. Drag from any node to connect Image → Video, Text → Audio, and more." },
  { h: "Connect & Propagate", p: "An image output flows downstream as the source for a video node automatically — no copy-pasting URLs." },
  { h: "Multi-Model, One Place", p: "Switch between FLUX, Seedream, Kling, MiniMax and others from a single prompt bar per node." },
  { h: "Use in Claude", p: "The Geoflix MCP connector lets Claude generate images, video, audio and text through the same backend." },
];

const FAQS = [
  { q: "What is Geoflix?", a: "Geoflix is a node-based AI creative canvas. You connect Image, Video, Text, and Audio nodes on an infinite canvas to build and run generation workflows visually." },
  { q: "Which models can I use?", a: "Images use FLUX 2 Pro/Max, Nano Banana Pro, and Seedream 4.5. Video uses LTX, Wan 2.2, MiniMax Hailuo, and Kling v2. Text and audio are powered by OpenAI." },
  { q: "Do I need an account?", a: "Yes — sign up free with email or Google to open the app. Once you're in, your workflows save automatically in your browser." },
  { q: "Can I use Geoflix inside Claude?", a: "Yes. Geoflix ships an MCP connector so Claude can generate media through Geoflix directly from chat." },
  { q: "Is my work saved?", a: "Workflows auto-save to your browser as you edit, and every generation is collected in the Library." },
];

export default function Landing() {
  const [open, setOpen] = useState(0);
  const [active, setActive] = useState(0);

  // globals.css locks body { overflow:hidden; height:100% } for the canvas editor.
  // Release it on the landing page so it can scroll, then restore on unmount.
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prev = {
      bodyOverflow: body.style.overflow,
      bodyHeight: body.style.height,
      htmlHeight: html.style.height,
    };
    body.style.overflow = "auto";
    body.style.height = "auto";
    html.style.height = "auto";
    return () => {
      body.style.overflow = prev.bodyOverflow;
      body.style.height = prev.bodyHeight;
      html.style.height = prev.htmlHeight;
    };
  }, []);

  const MCP_URL = "https://www.geoflix.online/api/mcp?key=YOUR_KEY";
  const [copied, setCopied] = useState(false);
  const copyMcp = () => {
    navigator.clipboard?.writeText(MCP_URL).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  };

  // Auth routing: signed-out users hitting these are gated by middleware.
  const signInHref = CLERK_ENABLED ? "/sign-in" : "/app";
  const signUpHref = CLERK_ENABLED ? "/sign-up" : "/app";

  return (
    <div className={s.page}>
      {/* NAV */}
      <div className={s.navWrap}>
        <nav className={s.nav}>
          <div className={s.brand}>
            <span className={s.logoIcon}><PlayLogo /></span>
            <b>Geoflix</b> <span>Studio</span>
          </div>
          <div className={s.navLinks}>
            <a href="#tools">Tools</a>
            <a href="#features">Features</a>
            <Link href="/pricing">Pricing</Link>
            <a href="#mcp">Claude MCP</a>
            <a href="#faq">FAQs</a>
            <Link href="/app">Library</Link>
          </div>
          <div className={s.navRight}>
            <Link href={signInHref} className={s.signIn}>Sign In</Link>
            <Link href={signUpHref} className={s.btn}>Sign Up <Arrow /></Link>
          </div>
        </nav>
      </div>

      {/* HERO */}
      <header className={s.hero}>
        <span className={s.badge}><span className={s.accent}>New:</span> AI Assistant is live! &rarr;</span>
        <h1 className={s.h1}>
          The Easiest Way to Make<br />Viral Videos
        </h1>
        <p className={s.sub}>
          The AI tool suite for video generation, scripting, voiceovers, caption removal, and more.
        </p>
        <div className={s.heroCta}>
          <Link href="/app" className={`${s.btn} ${s.btnLg}`}>Start Creating <Arrow /></Link>
        </div>
        <div className={s.proof}>
          <div className={s.avatars}>
            <img className={s.avatarImg} src="/avatars/a1.jpg" alt="Creator" />
            <img className={s.avatarImg} src="/avatars/a2.jpg" alt="Creator" />
            <img className={s.avatarImg} src="/avatars/a3.jpg" alt="Creator" />
            <img className={s.avatarImg} src="/avatars/a4.png" alt="Creator" />
          </div>
          Built for creators who move fast.
        </div>

        <div className={s.center} style={{ marginTop: 80 }}>
          <span className={s.badge}>Viral Videos Made with Geoflix</span>
          <h2 className={s.showcaseHead}>Top Creators Don&apos;t Start from Scratch</h2>
          <p className={s.lead}>They use tools to copy what&apos;s already working.</p>
        </div>

        <div className={s.marquee}>
          <div className={s.marqueeTrack}>
            {[...SHOWCASE, ...SHOWCASE].map((t, i) => (
              <div key={i} className={`${s.mTileWrap} ${t.ratio === "9:16" ? s.mPortrait : s.mLandscape}`}>
                <span className={s.mViews}>{t.views}</span>
                <div className={s.mTile}>
                  {t.video && <video className={s.mVideo} src={t.video} autoPlay loop muted playsInline preload="metadata" />}
                  <div className={s.mCap}>
                    <div className={s.mCreator}>
                      <span className={s.mAvatar} style={{ background: t.color }}>{t.emoji}</span>
                      <span className={s.mName}>{t.creator}</span>
                      <svg className={s.mVerified} viewBox="0 0 22 22" aria-hidden="true"><path fill="#1d9bf0" d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816z"/><path fill="#fff" d="M9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"/></svg>
                    </div>
                    <div className={s.mTitle}>{t.title}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* TOOLS */}
      <section id="tools" className={`${s.section} ${s.center}`}>
        <span className={s.badge}>Powerful AI Tools</span>
        <h2 className={s.h2}>Everything You Need to Create</h2>
        <p className={s.lead}>AI-powered tools to generate images, video, voiceovers, scripts, and more.</p>
        <div className={s.grid}>
          {TOOLS.map((t) => (
            <div key={t.title} className={s.card}>
              <div className={s.cardTitle}>{t.title}{t.tag && <span className={s.tag}>{t.tag}</span>}</div>
              <p className={s.cardDesc}>{t.desc}</p>
              <div className={s.cardArt}>
                {t.img ? (
                  <img className={s.cardVideo} src={t.img} alt={t.title} loading="lazy" />
                ) : t.video ? (
                  <video className={s.cardVideo} src={t.video} autoPlay loop muted playsInline preload="metadata" />
                ) : (
                  t.art
                )}
              </div>
              <Link href="/app" className={`${s.btn} ${s.cardBtn}`}>Try Now <Arrow /></Link>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className={s.section}>
        <div className={s.center} style={{ marginBottom: 56 }}>
          <span className={s.badge}>Speed Up Your Workflow</span>
          <h2 className={s.h2}>Designed to Make Great Content</h2>
          <p className={s.lead}>Everything connects on one canvas, so ideas become finished media faster.</p>
        </div>
        <div className={s.features}>
          <div className={s.featList}>
            {FEATURES.map((f, i) => (
              <div
                key={f.h}
                className={`${s.feat} ${active === i ? s.featActive : ""}`}
                onMouseEnter={() => setActive(i)}
              >
                <div className={s.featH}>{f.h}</div>
                <div className={s.featP}>{f.p}</div>
              </div>
            ))}
          </div>
          <div className={s.featArt}>
            <video className={s.featVideo} src="/tools/canvas.mp4" autoPlay loop muted playsInline preload="metadata" />
          </div>
        </div>
      </section>

      {/* CLAUDE MCP */}
      <section id="mcp" className={s.section}>
        <div className={s.center}>
          <span className={s.badge}>MCP Connector · Claude</span>
          <h2 className={s.h2}>Turn <img className={s.claudeMark} src="/claude-mark.png" alt="Claude" /> Claude Into Your Creative Engine</h2>
          <p className={s.lead}>Connect Geoflix to Claude and generate images, video, voiceovers, and scripts right from your conversations.</p>
        </div>

        <div className={s.mcpShow}>
          {/* mock Claude chat */}
          <div className={s.chat}>
            <div className={s.chatBar}>
              <span className={s.chatDot} /><span className={s.chatDot} /><span className={s.chatDot} />
              <span className={s.chatLabel}>CLAUDE · GEOFLIX CONNECTOR</span>
            </div>
            <div className={s.chatBody}>
              <div className={s.chatUser}>Make a 4-clip cartoon short for my kids channel — bright, wholesome, 9:16.</div>
              <div className={s.chatAsst}>
                <span className={s.chatMark}><ClaudeMark /></span>
                <span className={s.chatAsstText}>On it. Spinning up 4 scenes — mixing characters, color, and motion.</span>
              </div>
              <div className={s.chatGrid}>
                {["/marquee/p1.mp4", "/marquee/p3.mp4", "/marquee/p4.mp4", "/marquee/p2.mp4"].map((src) => (
                  <video key={src} className={s.chatTile} src={src} autoPlay loop muted playsInline preload="metadata" />
                ))}
              </div>
              <div className={s.chatFoot}>4 CLIPS · 1080P · ~42S</div>
            </div>
          </div>

          {/* feature cards */}
          <div className={s.mcpFeats}>
            {MCP_FEATURES.map((f, i) => (
              <div key={f.h} className={s.mcpFeat}>
                <span className={s.mcpFeatNum}>0{i + 1}</span>
                <div>
                  <h3 className={s.mcpFeatH}>{f.h}</h3>
                  <p className={s.mcpFeatP}>{f.p}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className={s.mcpCta}>
          <div className={s.mcpCtaRow}>
            <button className={`${s.btn} ${s.btnLg}`} onClick={copyMcp}>{copied ? "Copied!" : "Connect Claude"} <Arrow /></button>
            <a className={s.mcpCtaSec} href="#faq">See how it works</a>
          </div>
          <div className={s.mcpRow}>
            <code className={s.mcpUrl}>{MCP_URL}</code>
            <button className={s.mcpCopy} onClick={copyMcp} title="Copy URL">
              {copied ? "Copied" : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              )}
            </button>
          </div>
          <div className={s.mcpFine}>Add as a custom connector in Claude → Settings → Connectors. Works with <b>Claude Desktop</b>, <b>claude.ai</b> &amp; <b>Cursor</b> · 5-minute setup.</div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className={`${s.section} ${s.center}`}>
        <span className={s.badge}>FAQs</span>
        <h2 className={s.h2}>Frequently Asked Questions</h2>
        <p className={s.lead}>Everything you need to know about Geoflix.</p>
        <div className={s.faq}>
          {FAQS.map((f, i) => (
            <div key={f.q} className={`${s.faqItem} ${open === i ? s.faqOpen : ""}`}>
              <button className={s.faqQ} onClick={() => setOpen(open === i ? -1 : i)}>
                {f.q}
                <svg className={s.faqChevron} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 9l6 6 6-6" /></svg>
              </button>
              <div className={s.faqA}>{f.a}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className={s.ctaBanner}>
        <div className={s.ctaPattern} />
        <div className={s.ctaInner}>
          <div className={s.ctaKicker}>Geoflix Studio</div>
          <h2 className={s.h2}>Launch Your Canvas Today!</h2>
          <p className={s.lead}>Join creators turning prompts into finished media with Geoflix.</p>
          <div style={{ marginTop: 30, display: "flex", justifyContent: "center" }}>
            <Link href="/app" className={`${s.btn} ${s.btnLg} ${s.btnWhite}`}>Start Creating <Arrow /></Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className={s.footer}>
        <div className={s.footTop}>
          <div>
            <div className={s.brand}>
              <span className={s.logoIcon}><PlayLogo /></span>
              <b>Geoflix</b> <span>Studio</span>
            </div>
            <p className={s.footBlurb}>The node-based AI creative canvas. Generate and connect images, video, audio, and text on one canvas.</p>
          </div>
          <div className={s.footCol}>
            <h4>Product</h4>
            <a href="#tools">Tools</a>
            <a href="#features">Features</a>
            <Link href="/pricing">Pricing</Link>
            <Link href="/app">Library</Link>
          </div>
          <div className={s.footCol}>
            <h4>Info</h4>
            <a href="#faq">FAQs</a>
            <Link href="/app">Open App</Link>
          </div>
        </div>
        <div className={s.footBar}>Geoflix. All rights reserved. © 2026</div>
      </footer>
    </div>
  );
}

````

### `app/landing.module.css`

````css
/* Geoflix landing — scoped, light theme. Modeled on viewmax.io. */

/* SF Pro Display — self-hosted, subset to Latin (same font viewmax.io uses). */
@font-face {
  font-family: "SF Pro Display"; font-style: normal; font-weight: 400;
  font-display: swap; src: url("/fonts/SF-Pro-Display-Regular.woff2") format("woff2");
}
@font-face {
  font-family: "SF Pro Display"; font-style: normal; font-weight: 500;
  font-display: swap; src: url("/fonts/SF-Pro-Display-Medium.woff2") format("woff2");
}
@font-face {
  font-family: "SF Pro Display"; font-style: normal; font-weight: 600;
  font-display: swap; src: url("/fonts/SF-Pro-Display-Semibold.woff2") format("woff2");
}
@font-face {
  font-family: "SF Pro Display"; font-style: normal; font-weight: 700;
  font-display: swap; src: url("/fonts/SF-Pro-Display-Bold.woff2") format("woff2");
}
@font-face {
  font-family: "SF Pro Display"; font-style: normal; font-weight: 800;
  font-display: swap; src: url("/fonts/SF-Pro-Display-Heavy.woff2") format("woff2");
}

.page {
  --blue: #2563eb;
  --blue-dark: #1d4ed8;
  --ink: #0b1220;
  --muted: #5b6472;
  --line: #e7eaef;
  --bg: #f3f6fb;
  background: var(--bg);
  color: var(--ink);
  min-height: 100vh;
  /* viewmax.io uses SF Pro Display. Use it where available (Apple devices /
     installed), with a clean system fallback elsewhere. */
  font-family: "SF Pro Display", "SF Pro Text", -apple-system, BlinkMacSystemFont,
    "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  letter-spacing: -0.01em;
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}
.page * { box-sizing: border-box; }

/* ---------- Nav ---------- */
.navWrap {
  position: fixed;            /* fixed (not sticky) — .page overflow-x breaks sticky */
  top: 0; left: 0; right: 0;
  z-index: 50;
  padding: 14px 24px 0;
}
.nav {
  max-width: 1240px;
  margin: 0 auto;
  height: 64px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(18px) saturate(160%);
  -webkit-backdrop-filter: blur(18px) saturate(160%);
  border: 1px solid var(--line);
  border-radius: 18px;
  box-shadow: 0 6px 24px rgba(16, 24, 40, 0.06);
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 0 18px;
}
.brand { display: flex; align-items: center; gap: 10px; font-size: 19px; }
.brand b { font-weight: 800; }
.brand span { color: var(--muted); font-weight: 500; }
.logoIcon {
  width: 34px; height: 34px; border-radius: 9px;
  display: grid; place-items: center;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #fff;
}
.navLinks { display: flex; gap: 28px; margin: 0 auto; }
.navLinks a { color: #3b4452; text-decoration: none; font-size: 15px; font-weight: 500; }
.navLinks a:hover { color: var(--ink); }
.navRight { display: flex; align-items: center; gap: 16px; }
.signIn { color: #3b4452; text-decoration: none; font-size: 15px; font-weight: 500; }

.btn {
  display: inline-flex; align-items: center; gap: 8px;
  font-weight: 700; font-size: 15px;
  border: none; cursor: pointer; text-decoration: none;
  padding: 11px 20px; border-radius: 999px;
  background: var(--blue); color: #fff;
  transition: transform .12s ease, background .12s ease;
}
.btn:hover { background: var(--blue-dark); transform: translateY(-1px); }
.btn svg { transition: transform .12s ease; }
.btn:hover svg { transform: translateX(3px); }
.btnLg { padding: 15px 28px; font-size: 17px; border-radius: 14px; }
.btnWhite { background: #fff; color: var(--ink); }
.btnWhite:hover { background: #f1f5ff; }

/* ---------- pill badge ---------- */
.badge {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 8px 16px; border-radius: 999px;
  font-size: 14px; font-weight: 600;
  background: linear-gradient(#fff, #fff) padding-box,
    linear-gradient(90deg, #7c3aed, #ec4899) border-box;
  border: 1.5px solid transparent;
  color: #6d28d9;
}
.badge .accent { color: var(--blue); }

/* ---------- Hero ---------- */
.hero {
  position: relative;
  text-align: center;
  padding: 130px 24px 90px; /* extra top room for the fixed nav */
  background:
    radial-gradient(1200px 500px at 50% -120px, #cfe0ff 0%, rgba(207,224,255,0) 70%),
    linear-gradient(180deg, #eef4ff 0%, #f3f6fb 100%);
}
.h1 {
  font-size: clamp(34px, 3.6vw, 56px);
  line-height: 1.05;
  letter-spacing: -0.03em;
  font-weight: 700;
  margin: 28px auto 0;
  max-width: 900px;
}
.h1 .grad {
  background: linear-gradient(90deg, #2563eb, #7c3aed);
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
.sub {
  color: var(--muted);
  font-size: clamp(17px, 2vw, 21px);
  max-width: 620px;
  margin: 22px auto 0;
  line-height: 1.5;
}
.heroCta { margin-top: 34px; display: flex; justify-content: center; }
.proof { margin-top: 26px; display: flex; align-items: center; justify-content: center; gap: 14px; color: var(--muted); font-size: 15px; }
.avatars { display: flex; }
.avatars span {
  width: 38px; height: 38px; border-radius: 50%;
  border: 2px solid #fff; margin-left: -10px;
  background: linear-gradient(135deg, #93c5fd, #c4b5fd);
  display: grid; place-items: center; font-size: 16px;
}
.avatars span:first-child { margin-left: 0; }
.avatarImg {
  width: 38px; height: 38px; border-radius: 50%;
  border: 2px solid #fff; margin-left: -10px;
  object-fit: cover; background: #eef2ff; display: block;
}
.avatarImg:first-child { margin-left: 0; }

/* ---------- Auto-scrolling video marquee ---------- */
.marquee {
  margin-top: 16px; width: 100%; overflow: hidden;
  -webkit-mask: linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent);
  mask: linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent);
}
.marqueeTrack {
  display: flex; gap: 16px; width: max-content;
  padding-top: 50px; /* room for the views pill to float fully above the card */
  animation: marquee 80s linear infinite;
}
.marquee:hover .marqueeTrack { animation-play-state: paused; }
@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
/* wrapper is NOT clipped, so the views pill can sit above the tile */
.mTileWrap { position: relative; flex: 0 0 auto; height: 300px; }
.mTile {
  width: 100%; height: 100%;
  border-radius: 18px; overflow: hidden;
  /* promote to own layer so rounded-corner clipping holds under the animated marquee ancestor (Chrome compositing bug) */
  transform: translateZ(0);
  background: linear-gradient(135deg, #eaf1ff, #f3ecff);
  border: 1px solid #e7ecff;
  box-shadow: 0 14px 34px rgba(16, 24, 40, 0.08);
}
.mPortrait { width: 169px; }   /* 9:16 */
.mLandscape { width: 533px; }  /* 16:9 */
.mVideo { width: 100%; height: 100%; object-fit: cover; display: block; border-radius: inherit; }
.mTile video { width: 100%; height: 100%; object-fit: cover; display: block; border-radius: inherit; }
.mViews {
  position: absolute; top: -30px; left: 50%; transform: translateX(-50%);
  z-index: 3; white-space: nowrap;
  background: #ff3b30; color: #fff; font-size: 11px; font-weight: 700;
  padding: 4px 11px; border-radius: 8px;
  box-shadow: 0 4px 12px rgba(255, 59, 48, 0.35);
}
.mBadge {
  position: absolute; top: 10px; left: 10px; z-index: 2;
  font-size: 11px; font-weight: 600; color: #fff;
  background: rgba(11, 18, 32, 0.55); backdrop-filter: blur(4px);
  padding: 3px 9px; border-radius: 999px;
}
.mCap {
  position: absolute; left: 0; right: 0; bottom: 0; padding: 40px 12px 12px;
  border-radius: 0 0 18px 18px;
  background: linear-gradient(transparent, rgba(11, 18, 32, 0.9));
  color: #fff; text-align: left; pointer-events: none;
}
.mCreator { display: flex; align-items: center; gap: 7px; margin-bottom: 6px; }
.mAvatar {
  flex: 0 0 auto; width: 26px; height: 26px; border-radius: 50%;
  display: grid; place-items: center; font-size: 14px; line-height: 1;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
}
.mName {
  font-size: 14px; font-weight: 700; color: #fff;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.mVerified { flex: 0 0 auto; width: 15px; height: 15px; }
.mTitle {
  font-size: 14px; font-weight: 700; color: #fff; line-height: 1.25;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

/* ---------- generic section ---------- */
.section { max-width: 1240px; margin: 0 auto; padding: 96px 24px; }
.center { text-align: center; }
.h2 {
  font-size: clamp(30px, 4vw, 46px);
  font-weight: 800; letter-spacing: -0.02em;
  margin: 18px 0 0;
}
.lead { color: var(--muted); font-size: 18px; max-width: 600px; margin: 16px auto 0; line-height: 1.5; }
.showcaseHead {
  font-size: clamp(22px, 2.6vw, 30px); font-weight: 700;
  letter-spacing: -0.02em; margin: 16px 0 0;
}

/* ---------- tools grid ---------- */
.grid {
  display: flex; flex-wrap: wrap; justify-content: center; gap: 22px;
  margin-top: 56px;
}
.card {
  flex: 0 1 calc((100% - 44px) / 3); min-width: 0;
  background: #fff; border: 1px solid var(--line);
  border-radius: 20px; padding: 26px;
  display: flex; flex-direction: column;
  box-shadow: 0 4px 18px rgba(16,24,40,.04);
  transition: transform .15s ease, box-shadow .15s ease;
}
.card:hover { transform: translateY(-4px); box-shadow: 0 14px 34px rgba(16,24,40,.10); }
.cardTitle { font-size: 20px; font-weight: 700; display: flex; align-items: center; gap: 10px; }
.tag { font-size: 11px; font-weight: 700; color: #6b7280; background: #eef0f4; padding: 3px 9px; border-radius: 999px; }
.cardDesc { color: var(--muted); font-size: 15px; line-height: 1.5; margin-top: 8px; }
.cardArt {
  margin-top: 18px; aspect-ratio: 16 / 9; border-radius: 14px;
  display: grid; place-items: center; font-size: 46px;
  background: linear-gradient(135deg, #eaf1ff, #f3ecff);
  border: 1px solid #e7ecff; overflow: hidden;
}
.cardVideo { width: 100%; height: 100%; object-fit: cover; display: block; }
.cardBtn { margin-top: 18px; align-self: stretch; justify-content: center; }

/* ---------- features (2-col) ---------- */
.features { display: grid; grid-template-columns: 1fr 1fr; gap: 56px; align-items: center; }
.featList { display: flex; flex-direction: column; gap: 6px; }
.feat { padding: 18px 22px; border-left: 3px solid transparent; border-radius: 0 8px 8px 0; }
.featActive { border-left-color: var(--blue); background: linear-gradient(90deg, rgba(37,99,235,.06), transparent); }
.featH { font-size: 21px; font-weight: 700; }
.featActive .featH { color: var(--blue); }
.featP { color: var(--muted); font-size: 15px; line-height: 1.5; margin-top: 6px; }
.featArt {
  aspect-ratio: 1640 / 740; border-radius: 22px;
  background: linear-gradient(135deg, #dbe7ff, #ede0ff);
  border: 2px solid #2563eb;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
  display: grid; place-items: center;
  position: relative; overflow: hidden;
}
.featVideo { width: 100%; height: 100%; object-fit: cover; display: block; }
.featArt .node {
  position: absolute; background: #fff; border: 1px solid #dbe3f0;
  border-radius: 12px; padding: 12px 16px; font-size: 13px; font-weight: 600;
  box-shadow: 0 8px 22px rgba(16,24,40,.10);
}

/* ---------- FAQ ---------- */
.faq { max-width: 860px; margin: 48px auto 0; display: flex; flex-direction: column; gap: 14px; }
.faqItem { background: #fff; border: 1px solid var(--line); border-radius: 16px; overflow: hidden; }
.faqQ {
  width: 100%; text-align: left; cursor: pointer; border: none; background: none;
  padding: 22px 24px; font-size: 17px; font-weight: 700; color: var(--ink);
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
}
.faqChevron { transition: transform .2s ease; flex: 0 0 auto; color: var(--muted); }
.faqOpen .faqChevron { transform: rotate(180deg); }
.faqA { padding: 0 24px; max-height: 0; overflow: hidden; transition: max-height .25s ease, padding .25s ease; color: var(--muted); font-size: 15px; line-height: 1.6; }
.faqOpen .faqA { max-height: 240px; padding: 0 24px 22px; }

/* ---------- Claude MCP (3-step connect) ---------- */
.mcpSteps {
  display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 22px;
  margin-top: 48px; text-align: left;
}
.mcpStep {
  min-width: 0;
  background: #fff; border: 1px solid var(--line); border-radius: 18px;
  padding: 26px; box-shadow: var(--shadow-sm);
}
.mcpStepNum {
  width: 30px; height: 30px; border-radius: 50%;
  background: var(--grad); color: #fff; font-weight: 700; font-size: 14px;
  display: grid; place-items: center; margin-bottom: 14px;
}
.mcpStepTitle { font-size: 19px; font-weight: 700; margin: 0 0 8px; }
.mcpStepBody { color: var(--muted); font-size: 15px; line-height: 1.55; margin: 0; }
.mcpStepBody b { color: var(--ink); font-weight: 600; }
.mcpRow {
  display: flex; align-items: center; gap: 10px; margin-top: 14px; min-width: 0;
  background: #0b1220; border-radius: 10px; padding: 10px 12px;
}
.mcpUrl {
  flex: 1; min-width: 0; color: #e6edff;
  font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  font-size: 12.5px; overflow-x: auto; white-space: nowrap;
}
.mcpCopy {
  flex: 0 0 auto; display: inline-flex; align-items: center; gap: 5px;
  background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.2);
  color: #fff; border-radius: 7px; padding: 6px 10px; font-size: 12px;
  cursor: pointer; font-family: inherit;
}
.mcpCopy:hover { background: rgba(255,255,255,.22); }

/* ---------- CTA banner ---------- */
.ctaBanner {
  max-width: 1240px; margin: 40px auto; padding: 80px 24px;
  border-radius: 28px; text-align: center; color: #fff;
  position: relative; overflow: hidden;
  background: linear-gradient(120deg, #1d4ed8, #3b82f6 55%, #22d3ee);
}
.ctaBanner .h2 { color: #fff; }
.ctaBanner .lead { color: rgba(255,255,255,.9); }
.ctaPattern { position: absolute; inset: 0; opacity: .14;
  background-image: radial-gradient(#fff 2px, transparent 2px);
  background-size: 26px 26px; }
.ctaInner { position: relative; z-index: 1; }
.ctaKicker { font-weight: 700; font-size: 17px; opacity: .95; }

/* ---------- footer ---------- */
.footer { border-top: 1px solid var(--line); background: #fff; }
.footTop { max-width: 1240px; margin: 0 auto; padding: 56px 24px; display: grid; grid-template-columns: 1.4fr 1fr 1fr; gap: 40px; }
.footCol h4 { font-size: 14px; color: var(--muted); font-weight: 600; margin: 0 0 16px; }
.footCol a { display: block; color: var(--ink); text-decoration: none; font-weight: 600; font-size: 15px; margin-bottom: 12px; }
.footCol a:hover { color: var(--blue); }
.footBlurb { color: var(--muted); font-size: 15px; line-height: 1.5; max-width: 320px; margin-top: 14px; }
.footBar { border-top: 1px solid var(--line); text-align: center; padding: 22px; color: var(--muted); font-size: 14px; }

/* ---------- pricing ---------- */
.billing {
  display: inline-flex; align-items: center; gap: 4px;
  margin: 34px auto 0; padding: 5px;
  background: #fff; border: 1px solid var(--line); border-radius: 999px;
  box-shadow: 0 4px 18px rgba(16,24,40,.05);
}
.billOpt {
  display: inline-flex; align-items: center; gap: 8px;
  border: none; cursor: pointer; background: transparent;
  font-size: 15px; font-weight: 700; color: var(--muted);
  padding: 9px 20px; border-radius: 999px;
  transition: background .15s ease, color .15s ease;
}
.billActive { background: var(--blue); color: #fff; }
.billSave {
  font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 999px;
  background: #dcfce7; color: #15803d;
}
.billActive .billSave { background: rgba(255,255,255,.22); color: #fff; }

.priceGrid {
  display: grid; grid-template-columns: repeat(3, 1fr);
  gap: 22px; max-width: 1080px; margin: 48px auto 0;
  text-align: left; align-items: start;
}
.priceCard {
  position: relative; background: #fff; border: 1px solid var(--line);
  border-radius: 22px; padding: 30px 28px;
  display: flex; flex-direction: column;
  box-shadow: 0 4px 18px rgba(16,24,40,.04);
}
.priceCardPop {
  border: 2px solid var(--blue);
  box-shadow: 0 20px 50px rgba(37,99,235,.18);
  transform: translateY(-8px);
}
.popBadge {
  position: absolute; top: -13px; left: 50%; transform: translateX(-50%);
  white-space: nowrap; background: var(--blue); color: #fff;
  font-size: 12px; font-weight: 800; letter-spacing: .02em;
  padding: 6px 16px; border-radius: 999px;
  box-shadow: 0 6px 16px rgba(37,99,235,.35);
}
.priceName { font-size: 22px; font-weight: 800; }
.priceDesc { color: var(--muted); font-size: 14px; line-height: 1.5; margin-top: 6px; min-height: 42px; }
.priceAmount {
  display: flex; align-items: flex-end; gap: 2px;
  font-size: 52px; font-weight: 800; letter-spacing: -0.03em;
  margin-top: 16px; line-height: 1;
}
.priceCurrency { font-size: 26px; font-weight: 700; margin-right: 2px; align-self: flex-start; margin-top: 6px; }
.pricePer { font-size: 17px; font-weight: 600; color: var(--muted); margin-bottom: 6px; }
.priceBilled { color: var(--muted); font-size: 13px; margin: 6px 0 20px; }
.priceFeatures { list-style: none; padding: 0; margin: 24px 0 0; display: flex; flex-direction: column; gap: 13px; }
.priceFeat { display: flex; align-items: flex-start; gap: 10px; font-size: 14.5px; font-weight: 500; line-height: 1.4; }
.priceCheck { flex: 0 0 auto; color: var(--blue); margin-top: 1px; }
.priceCardPop .priceCheck { color: var(--blue); }
.btnOutline { background: #fff; color: var(--ink); border: 1.5px solid var(--line); }
.btnOutline:hover { background: #f1f5ff; color: var(--blue); border-color: #c7d7ff; }

/* ---------- Claude MCP showcase ---------- */
.claudeMark {
  display: inline-block; vertical-align: -0.14em;
  width: 0.92em; height: 0.92em; border-radius: 0.22em;
  margin: 0 0.12em; object-fit: contain;
}
.mcpShow {
  display: grid; grid-template-columns: 1.5fr 1fr; gap: 24px;
  max-width: 1120px; margin: 48px auto 0; text-align: left; align-items: start;
}
.chat {
  background: #1b1b19; border: 1px solid #2c2c28; border-radius: 18px;
  overflow: hidden; box-shadow: 0 24px 60px rgba(16, 24, 40, 0.22);
}
.chatBar {
  display: flex; align-items: center; gap: 7px;
  padding: 12px 16px; border-bottom: 1px solid #2c2c28; background: #161614;
}
.chatDot { width: 11px; height: 11px; border-radius: 50%; background: #3a3a36; }
.chatDot:nth-child(1) { background: #ff5f57; }
.chatDot:nth-child(2) { background: #febc2e; }
.chatDot:nth-child(3) { background: #28c840; }
.chatLabel {
  margin-left: auto; font-size: 11px; letter-spacing: 0.08em;
  color: #8a8a82; font-weight: 600; font-family: ui-monospace, "SF Mono", Menlo, monospace;
}
.chatBody { padding: 18px; display: flex; flex-direction: column; gap: 14px; }
.chatUser {
  align-self: flex-end; max-width: 88%;
  background: #2a2a27; color: #ececea; border-radius: 14px 14px 4px 14px;
  padding: 12px 15px; font-size: 14.5px; line-height: 1.5;
}
.chatAsst { display: flex; gap: 10px; align-items: flex-start; }
.chatMark {
  flex: 0 0 auto; width: 28px; height: 28px; border-radius: 7px;
  background: #d97757; color: #fff; display: grid; place-items: center; padding: 6px;
}
.chatAsstText { color: #d6d6d2; font-size: 14.5px; line-height: 1.5; padding-top: 3px; }
.chatGrid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.chatTile {
  width: 100%; aspect-ratio: 9 / 16; object-fit: cover;
  border-radius: 10px; display: block; background: #000;
}
.chatFoot {
  font-size: 11px; letter-spacing: 0.08em; color: #7a7a72;
  font-weight: 600; font-family: ui-monospace, "SF Mono", Menlo, monospace;
}
.mcpFeats { display: flex; flex-direction: column; gap: 16px; }
.mcpFeat {
  display: flex; gap: 14px; align-items: flex-start;
  background: #fff; border: 1px solid var(--line); border-radius: 16px;
  padding: 22px; box-shadow: 0 4px 18px rgba(16, 24, 40, 0.04);
}
.mcpFeatNum {
  flex: 0 0 auto; font-size: 13px; font-weight: 800; color: var(--blue);
  font-family: ui-monospace, "SF Mono", Menlo, monospace; padding-top: 3px;
}
.mcpFeatH { font-size: 18px; font-weight: 700; margin: 0 0 6px; }
.mcpFeatP { color: var(--muted); font-size: 14.5px; line-height: 1.55; margin: 0; }
.mcpCta { display: flex; flex-direction: column; align-items: center; gap: 18px; margin-top: 44px; }
.mcpCtaRow { display: flex; align-items: center; gap: 20px; }
.mcpCtaSec { color: var(--muted); font-weight: 600; font-size: 15px; text-decoration: none; }
.mcpCtaSec:hover { color: var(--ink); }
.mcpCta .mcpRow { max-width: 520px; width: 100%; margin-top: 0; }
.mcpFine { color: var(--muted); font-size: 13.5px; text-align: center; max-width: 560px; line-height: 1.5; }
.mcpFine b { color: var(--ink); font-weight: 600; }

/* ---------- responsive ---------- */
@media (max-width: 900px) {
  .navLinks { display: none; }
  .card { flex-basis: 100%; }
  .mcpSteps { grid-template-columns: minmax(0, 1fr); }
  .features { grid-template-columns: 1fr; gap: 32px; }
  .footTop { grid-template-columns: 1fr; }
  .section { padding: 64px 24px; }
  .priceGrid { grid-template-columns: minmax(0, 1fr); max-width: 420px; }
  .priceCardPop { transform: none; }
  .mcpShow { grid-template-columns: 1fr; }
  .mcpCtaRow { flex-direction: column; gap: 12px; }
}

````

### `app/pricing/page.js`

````js
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import s from "../landing.module.css";

const CLERK_ENABLED = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

const Arrow = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const PlayLogo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
);

const Check = () => (
  <svg className={s.priceCheck} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

// monthly = full monthly price; annual = effective monthly price when billed yearly.
const PLANS = [
  {
    name: "Starter",
    desc: "For casual creators just getting started.",
    monthly: 29,
    annual: 12,
    features: [
      "200 credits per month",
      "Image, video, voiceover & script generation",
      "Core AI models (FLUX, Seedream, LTX, Wan)",
      "Node-based canvas",
      "Up to 100 exports",
    ],
  },
  {
    name: "Creator",
    desc: "Best for creators serious about growth.",
    monthly: 49,
    annual: 19,
    popular: true,
    features: [
      "400 credits per month",
      "Everything in Starter",
      "Premium models (Kling v2, MiniMax, Veo)",
      "AI Assistant director mode",
      "Claude MCP connector",
      "Up to 200 exports",
    ],
  },
  {
    name: "Studio",
    desc: "For pros who want the best tools, no limits.",
    monthly: 99,
    annual: 49,
    features: [
      "1,000 credits per month",
      "Everything in Creator",
      "1080p & Pro video models",
      "Priority generation queue",
      "Up to 600 exports",
      "Up to 2 TB media storage",
    ],
  },
];

const PRICE_FAQS = [
  { q: "What are Geoflix credits and how do they work?", a: "Every generation — an image, a video clip, a voiceover, or a script — uses credits from your monthly balance. Heavier jobs (longer video, premium models) cost more. Credits refresh at the start of each billing cycle." },
  { q: "Can I monetize content made with Geoflix?", a: "Yes. Everything you generate on a paid plan is yours to use commercially — post it, sell it, and monetize it on any platform." },
  { q: "Can I use my own media?", a: "Absolutely. Upload your own images to seed image-to-image and image-to-video generations, or bring your own scripts for voiceovers." },
  { q: "Can I switch or cancel anytime?", a: "Yes — upgrade, downgrade, or cancel from your account at any time. There are no cancellation fees, and annual plans are prorated." },
  { q: "Do you offer a free plan?", a: "You can sign up free and explore the canvas. Generating real AI media requires a paid plan so we can cover model costs." },
];

export default function Pricing() {
  const [annual, setAnnual] = useState(true);
  const [open, setOpen] = useState(-1);

  // globals.css locks body overflow for the canvas editor — release it here so the page scrolls.
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prev = { bodyOverflow: body.style.overflow, bodyHeight: body.style.height, htmlHeight: html.style.height };
    body.style.overflow = "auto";
    body.style.height = "auto";
    html.style.height = "auto";
    return () => {
      body.style.overflow = prev.bodyOverflow;
      body.style.height = prev.bodyHeight;
      html.style.height = prev.htmlHeight;
    };
  }, []);

  const signInHref = CLERK_ENABLED ? "/sign-in" : "/app";
  const signUpHref = CLERK_ENABLED ? "/sign-up" : "/app";

  return (
    <div className={s.page}>
      {/* NAV */}
      <div className={s.navWrap}>
        <nav className={s.nav}>
          <Link href="/" className={s.brand} style={{ textDecoration: "none", color: "inherit" }}>
            <span className={s.logoIcon}><PlayLogo /></span>
            <b>Geoflix</b> <span>Studio</span>
          </Link>
          <div className={s.navLinks}>
            <Link href="/#tools">Tools</Link>
            <Link href="/#features">Features</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/#mcp">Claude MCP</Link>
            <Link href="/app">Library</Link>
          </div>
          <div className={s.navRight}>
            <Link href={signInHref} className={s.signIn}>Sign In</Link>
            <Link href={signUpHref} className={s.btn}>Sign Up <Arrow /></Link>
          </div>
        </nav>
      </div>

      {/* PRICING HERO */}
      <header className={s.hero} style={{ paddingBottom: 40 }}>
        <span className={s.badge}>Pricing</span>
        <h1 className={s.h1}>You Need a Plan<br />to Go Viral</h1>
        <p className={s.sub}>From your first upload to millions of views, we&apos;ve got you covered. Cancel anytime, no questions asked.</p>

        <div className={s.billing}>
          <button
            className={`${s.billOpt} ${!annual ? s.billActive : ""}`}
            onClick={() => setAnnual(false)}
          >Monthly</button>
          <button
            className={`${s.billOpt} ${annual ? s.billActive : ""}`}
            onClick={() => setAnnual(true)}
          >Annual <span className={s.billSave}>Save 60%</span></button>
        </div>

        <div className={s.priceGrid}>
          {PLANS.map((p) => (
            <div key={p.name} className={`${s.priceCard} ${p.popular ? s.priceCardPop : ""}`}>
              {p.popular && <div className={s.popBadge}>Most Popular</div>}
              <div className={s.priceName}>{p.name}</div>
              <p className={s.priceDesc}>{p.desc}</p>
              <div className={s.priceAmount}>
                <span className={s.priceCurrency}>$</span>
                {annual ? p.annual : p.monthly}
                <span className={s.pricePer}>/mo</span>
              </div>
              <div className={s.priceBilled}>{annual ? "billed annually" : "billed monthly"}</div>
              <Link href={signUpHref} className={`${s.btn} ${s.btnLg} ${p.popular ? "" : s.btnOutline}`} style={{ width: "100%", justifyContent: "center", marginTop: 4 }}>
                Get Started <Arrow />
              </Link>
              <ul className={s.priceFeatures}>
                {p.features.map((f) => (
                  <li key={f} className={s.priceFeat}><Check />{f}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </header>

      {/* PRICING FAQ */}
      <section className={`${s.section} ${s.center}`}>
        <span className={s.badge}>FAQs</span>
        <h2 className={s.h2}>Pricing Questions</h2>
        <p className={s.lead}>Everything you need to know about plans and credits.</p>
        <div className={s.faq}>
          {PRICE_FAQS.map((f, i) => (
            <div key={f.q} className={`${s.faqItem} ${open === i ? s.faqOpen : ""}`}>
              <button className={s.faqQ} onClick={() => setOpen(open === i ? -1 : i)}>
                {f.q}
                <svg className={s.faqChevron} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 9l6 6 6-6" /></svg>
              </button>
              <div className={s.faqA}>{f.a}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className={s.ctaBanner}>
        <div className={s.ctaPattern} />
        <div className={s.ctaInner}>
          <div className={s.ctaKicker}>Geoflix Studio</div>
          <h2 className={s.h2}>Launch Your Channel Today!</h2>
          <p className={s.lead}>Join thousands of creators who are already making viral videos with Geoflix.</p>
          <div style={{ marginTop: 30, display: "flex", justifyContent: "center" }}>
            <Link href={signUpHref} className={`${s.btn} ${s.btnLg} ${s.btnWhite}`}>Start Creating <Arrow /></Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className={s.footer}>
        <div className={s.footTop}>
          <div>
            <div className={s.brand}>
              <span className={s.logoIcon}><PlayLogo /></span>
              <b>Geoflix</b> <span>Studio</span>
            </div>
            <p className={s.footBlurb}>The node-based AI creative canvas. Generate and connect images, video, audio, and text on one canvas.</p>
          </div>
          <div className={s.footCol}>
            <h4>Product</h4>
            <Link href="/#tools">Tools</Link>
            <Link href="/#features">Features</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/app">Library</Link>
          </div>
          <div className={s.footCol}>
            <h4>Info</h4>
            <Link href="/#faq">FAQs</Link>
            <Link href="/app">Open App</Link>
          </div>
        </div>
        <div className={s.footBar}>Geoflix. All rights reserved. © 2026</div>
      </footer>
    </div>
  );
}

````

### `app/app/page.js`

````js
import Dashboard from "@/components/Dashboard";

export default function Page() {
  return <Dashboard />;
}

````

### `app/w/[id]/page.js`

````js
import Canvas from "@/components/Canvas";

export default async function EditorPage({ params }) {
  const { id } = await params;
  return <Canvas workflowId={id} />;
}

````

### `app/sign-in/[[...sign-in]]/page.js`

````js
import { SignIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";

export default function Page() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) redirect("/app");
  return (
    <div className="auth-wrap">
      <SignIn signUpUrl="/sign-up" forceRedirectUrl="/app" />
    </div>
  );
}

````

### `app/sign-up/[[...sign-up]]/page.js`

````js
import { SignUp } from "@clerk/nextjs";
import { redirect } from "next/navigation";

export default function Page() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) redirect("/app");
  return (
    <div className="auth-wrap">
      <SignUp signInUrl="/sign-in" forceRedirectUrl="/app" />
    </div>
  );
}

````

### `middleware.js`

````js
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Gate the app + editor; the marketing site (/) and auth pages stay public.
const isProtected = createRouteMatcher(["/app(.*)", "/w(.*)"]);

const handler = clerkMiddleware(async (auth, req) => {
  if (!isProtected(req)) return;
  const { userId } = await auth();
  if (!userId) {
    // Explicit redirect — auth.protect() can't infer our custom sign-in URL
    // from middleware (ClerkProvider props don't reach here) and 404s instead.
    const url = new URL("/sign-in", req.url);
    url.searchParams.set("redirect_url", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
});

// Until Clerk keys are set, run a no-op so the site keeps working (app open).
export default process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? handler : function middleware() {};

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|mp4)).*)",
    "/(api|trpc)(.*)",
  ],
};

````

### `components/Canvas.js`

````js
"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  useReactFlow,
} from "@xyflow/react";
import WorkflowNode from "./nodes/WorkflowNode";
import PromptBar from "./PromptBar";
import Assistant from "./Assistant";
import Library from "./Library";
import UserMenu from "./UserMenu";
import { getWorkflow, saveWorkflow, renameWorkflow } from "@/lib/store";
import { generateOutput, generateVideo, combineVideos } from "@/lib/run";
import { nodeDims } from "@/lib/cardSize";

const NODE_TYPES_META = [
  { kind: "image", label: "Image", sub: "Generate or upload" },
  { kind: "video", label: "Video", sub: "Generate or upload" },
  { kind: "text", label: "Text", sub: "Write or generate" },
  { kind: "audio", label: "Audio", sub: "Generate or upload" },
];

const CARD_ICONS = {
  image: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" /></svg>,
  video: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m22 8-6 4 6 4V8Z" /><rect x="2" y="6" width="14" height="12" rx="2" /></svg>,
  text: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 7V5h16v2M9 19h6M12 5v14" /></svg>,
  audio: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M11 5 6 9H2v6h4l5 4V5z"/></svg>,
  motion: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="6 3 20 12 6 21 6 3" fill="currentColor" /></svg>,
};

// Picsart-style "Transformation" operations. Not wired to a backend yet, so
// these render as disabled "Soon" rows to match the reference layout honestly.
const XFORM_META = [
  { key: "upscale", label: "Upscale", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3M11 8v6M8 11h6"/></svg> },
  { key: "enhance", label: "Enhance", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15l-1.9-4.1L5.5 9l4.6-1.4L12 3zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z"/></svg> },
  { key: "removebg", label: "Remove Background", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="3 3"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg> },
  { key: "animate", label: "Animate", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none"/></svg> },
  { key: "extract", label: "Extract Frames", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 9h4M3 15h4M17 9h4M17 15h4M9 5v14"/></svg> },
];

const RAIL_ICONS = {
  cursor: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z" /></svg>,
  plus: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>,
  frame: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" /><path d="M3 12h2M19 12h2M12 3v2M12 19v2"/></svg>,
  grid: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>,
  chat: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" /></svg>,
  folder: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h6l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" /></svg>,
  undo: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-15-6.7L3 13"/></svg>,
  redo: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 15-6.7L21 13"/></svg>,
};

const SIZE = { image: 304, video: 525, text: 213, audio: 304, motion: 304 };
const HEIGHT = { image: 340, video: 320, text: 340, audio: 340, motion: 340 };

let idCounter = 0;
const nextId = () => `n_${++idCounter}_${Math.random().toString(36).slice(2, 6)}`;

function CanvasInner({ workflowId }) {
  const router = useRouter();
  const { screenToFlowPosition, fitView } = useReactFlow();
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [name, setName] = useState("Untitled Workflow");
  const [loaded, setLoaded] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [runningId, setRunningId] = useState(null);
  const [savedAt, setSavedAt] = useState(null);
  const [picker, setPicker] = useState(null); // { x, y, flowPos, sourceId }
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);
  const saveTimer = useRef(null);
  const histTimer = useRef(null);
  const connectingRef = useRef(null);
  const skipNextHistRef = useRef(false);
  const lastSnapshotRef = useRef(null);
  const nodesRef = useRef(nodes);
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);

  // Snapshot helpers
  const snapshot = useCallback(() => ({
    nodes: nodes.map((n) => ({ ...n, data: { ...n.data } })),
    edges: edges.map((e) => ({ ...e })),
  }), [nodes, edges]);

  const restore = useCallback((snap) => {
    skipNextHistRef.current = true;
    setNodes(snap.nodes);
    setEdges(snap.edges);
  }, []);

  const undo = useCallback(() => {
    setPast((p) => {
      if (!p.length) return p;
      const prev = p[p.length - 1];
      setFuture((f) => [snapshot(), ...f].slice(0, 50));
      restore(prev);
      return p.slice(0, -1);
    });
  }, [snapshot, restore]);

  const redo = useCallback(() => {
    setFuture((f) => {
      if (!f.length) return f;
      const next = f[0];
      setPast((p) => [...p, snapshot()].slice(-50));
      restore(next);
      return f.slice(1);
    });
  }, [snapshot, restore]);

  useEffect(() => {
    if (!workflowId) return;
    const wf = getWorkflow(workflowId);
    if (!wf) { router.replace("/app"); return; }
    setNodes(wf.nodes || []);
    setEdges(wf.edges || []);
    setName(wf.name || "Untitled Workflow");
    setLoaded(true);
  }, [workflowId, router]);

  useEffect(() => {
    if (!loaded || !workflowId) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveWorkflow({ id: workflowId, name, nodes, edges });
      setSavedAt(Date.now());
    }, 500);
    return () => clearTimeout(saveTimer.current);
  }, [nodes, edges, name, workflowId, loaded]);

  // History snapshot (debounced) — captures the PREVIOUS state before the change settled
  useEffect(() => {
    if (!loaded) return;
    if (skipNextHistRef.current) {
      skipNextHistRef.current = false;
      lastSnapshotRef.current = { nodes, edges };
      return;
    }
    clearTimeout(histTimer.current);
    histTimer.current = setTimeout(() => {
      const prev = lastSnapshotRef.current;
      if (prev) {
        setPast((p) => [...p, prev].slice(-50));
        setFuture([]);
      }
      lastSnapshotRef.current = {
        nodes: nodes.map((n) => ({ ...n, data: { ...n.data } })),
        edges: edges.map((e) => ({ ...e })),
      };
    }, 500);
    return () => clearTimeout(histTimer.current);
  }, [nodes, edges, loaded]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || e.target?.isContentEditable) return;
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
      } else if (mod && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  // Propagate upstream output → downstream sourceThumb
  const sourcesByNode = useMemo(() => {
    const map = {};
    for (const e of edges) {
      const src = nodes.find((n) => n.id === e.source);
      if (!src) continue;
      const out = src.data?.output;
      if (!out || typeof out !== "string") continue;
      const isUrl = out.startsWith("http") || out.startsWith("data:") || out.startsWith("/api/");
      const isText = src.data.kind === "text";
      if (!isUrl && !isText) continue;
      (map[e.target] ||= []).push({
        id: src.id,
        kind: src.data.kind,
        url: isUrl ? out : null,
        text: isText ? out : null,
      });
    }
    return map;
  }, [nodes, edges]);

  // Sync sourceThumb into each node's data (so the node renders it)
  useEffect(() => {
    setNodes((ns) => {
      let changed = false;
      const next = ns.map((n) => {
        const wanted = (sourcesByNode[n.id] || []).find((x) => x.url)?.url || null;
        if ((n.data?.sourceThumb || null) === wanted) return n;
        changed = true;
        return { ...n, data: { ...n.data, sourceThumb: wanted } };
      });
      return changed ? next : ns;
    });
  }, [sourcesByNode]);

  const nodeTypes = useMemo(() => ({ workflow: WorkflowNode }), []);

  const onNodesChange = useCallback((c) => setNodes((n) => applyNodeChanges(c, n)), []);
  const onEdgesChange = useCallback((c) => setEdges((e) => applyEdgeChanges(c, e)), []);
  const onConnect = useCallback((p) => setEdges((e) => addEdge({ ...p, animated: true }, e)), []);

  const updateNodeData = useCallback((id, newData) => {
    setNodes((ns) => ns.map((n) => {
      if (n.id !== id) return n;
      const next = { ...n, data: newData };
      // Keep React Flow's stored size in sync so the card reshapes with the
      // chosen aspect ratio (handles/edges follow). Null for text/audio.
      const d = nodeDims(newData.kind, newData.aspect);
      if (d) { next.width = d.width; next.height = d.height; }
      return next;
    }));
  }, []);

  const addNode = (kind, options = {}) => {
    const d = nodeDims(kind, options.aspect);
    const W = d ? d.width : (SIZE[kind] || 304);
    const H = d ? d.height : (HEIGHT[kind] || 340);
    let pos = options.position;
    if (!pos) {
      pos = {
        x: 200 + (nodes.length % 3) * (W + 60),
        y: 80 + Math.floor(nodes.length / 3) * (H + 60),
      };
    }
    const id = nextId();
    const data = { kind, prompt: options.prompt || "" };
    if (options.model) data.model = options.model;
    if (options.aspect) data.aspect = options.aspect;
    const node = { id, type: "workflow", position: pos, data, width: W, height: H };
    setNodes((n) => [...n, node]);
    if (options.connectFrom) {
      setEdges((e) => addEdge({ source: options.connectFrom, target: id, animated: true }, e));
    }
    setSelectedId(id);
    setAddMenuOpen(false);
    return id;
  };

  const onSelectionChange = useCallback(({ nodes: selNodes }) => {
    setSelectedId(selNodes?.[0]?.id || null);
  }, []);

  const onTitleChange = (v) => {
    setName(v);
    if (workflowId) renameWorkflow(workflowId, v);
  };

  const runNode = async (id) => {
    if (runningId) return;
    const node = nodesRef.current.find((n) => n.id === id);
    if (!node) return;
    setRunningId(id);
    setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, data: { ...n.data, status: "running", output: null, error: null } } : n)));
    try {
      let output;
      // A connected Text node supplies the prompt when the node's own prompt
      // is empty (typed prompt always wins).
      const srcs = sourcesByNode[id] || [];
      const textPrompt = srcs.find((s) => s.kind === "text" && s.text)?.text;
      const typed = (node.data.prompt || "").trim();
      const prompt = typed || textPrompt || "";
      if (node.data.kind === "video") {
        const [aspectRatio, resolution] = (node.data.aspect || "16:9 · 720p").split("·").map((s) => s.trim());
        const dur = parseInt(node.data.duration) || 8;
        output = await generateVideo({
          prompt,
          model: node.data.model || "LTX Video", // match the prompt bar's displayed default (else falls through to Veo)
          image: node.data.sourceThumb || null,
          aspect: aspectRatio,
          resolution,
          duration: dur,
        });
      } else {
        // For image nodes, forward connected source image(s) → image-to-image edit.
        const images = node.data.kind === "image"
          ? srcs.filter((s) => s.kind === "image" && s.url).map((s) => s.url)
          : [];
        output = await generateOutput(node.data.kind, prompt, node.data.model, images, { voice: node.data.voice });
      }
      setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, data: { ...n.data, status: "done", output } } : n)));
    } catch (e) {
      setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, data: { ...n.data, status: "error", error: e.message } } : n)));
    } finally {
      setRunningId(null);
    }
  };

  const setNodeData = (id, patch) =>
    setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...patch } } : n)));

  const addEdgeBetween = (source, target) =>
    setEdges((es) => [...es, { id: `e_${source}_${target}`, source, target, animated: true }]);

  // Director mode (character-consistent): one reference image → per-scene
  // staged image (image-to-image) → image-to-video → stitch into one video.
  const runDirector = async ({ scenes, character, seedImage }, model = "LTX Video") => {
    const list = (scenes || []).slice(0, 6);
    if (list.length < 2) return;
    const IMG_MODEL = "Flux 2 Pro"; // reliable for text-to-image + image-to-image
    const colX = { ref: 40, img: 420, vid: 900, out: 1480 };
    const gapY = 330;
    const midY = 80 + ((list.length - 1) * gapY) / 2;

    // 1) Reference image (shared seed for every scene). Use the selected image
    //    if provided ("turn this image into a video"), else generate one.
    let refUrl = seedImage || null;
    let refId = null;
    if (!refUrl && character) {
      refId = addNode("image", { prompt: character, model: IMG_MODEL, aspect: "16:9 · 1080p", position: { x: colX.ref, y: midY } });
      setNodeData(refId, { status: "running", output: null, error: null });
      try {
        refUrl = await generateOutput("image", character, IMG_MODEL);
        setNodeData(refId, { status: "done", output: refUrl });
      } catch (e) {
        setNodeData(refId, { status: "error", error: e.message });
      }
    }

    // 2) Per scene: stage the character into the scene (image-to-image), then
    //    animate that staged image (image-to-video). Runs in parallel.
    const combineId = addNode("video", { prompt: "Combined video", aspect: "16:9 · 720p", position: { x: colX.out, y: midY } });
    setNodeData(combineId, { status: "running" });

    const vidIds = [];
    const results = await Promise.all(
      list.map(async (scene, i) => {
        const y = 80 + i * gapY;
        const vidId = addNode("video", { prompt: scene, model, aspect: "16:9 · 720p", position: { x: colX.vid, y } });
        vidIds.push(vidId);
        // Staged scene image (only if we have a reference to seed from).
        let seed = null;
        if (refUrl) {
          const imgId = addNode("image", { prompt: scene, model: IMG_MODEL, aspect: "16:9 · 1080p", position: { x: colX.img, y } });
          if (refId) addEdgeBetween(refId, imgId);
          addEdgeBetween(imgId, vidId);
          setNodeData(imgId, { status: "running" });
          try {
            seed = await generateOutput("image", scene, IMG_MODEL, [refUrl]);
            setNodeData(imgId, { status: "done", output: seed });
          } catch (e) {
            setNodeData(imgId, { status: "error", error: e.message });
          }
        }
        addEdgeBetween(vidId, combineId);
        setNodeData(vidId, { status: "running" });
        try {
          const clip = await generateVideo({ prompt: scene, model, image: seed || null, aspect: "16:9", resolution: "720p", duration: 6 });
          setNodeData(vidId, { status: "done", output: clip });
          return clip;
        } catch (e) {
          setNodeData(vidId, { status: "error", error: e.message });
          return null;
        }
      })
    );

    // 3) Stitch the finished clips into one video.
    const urls = results.filter(Boolean);
    if (urls.length < 2) {
      setNodeData(combineId, { status: "error", error: "Not enough scenes generated to combine" });
      return;
    }
    try {
      const finalUrl = await combineVideos(urls, urls.map(() => 5));
      setNodeData(combineId, { status: "done", output: finalUrl });
      fitView({ padding: 0.2, duration: 400 });
    } catch (e) {
      setNodeData(combineId, { status: "error", error: e.message });
    }
  };

  // Drop-to-create wiring
  const onConnectStart = useCallback((_, params) => {
    connectingRef.current = params; // { nodeId, handleId, handleType }
  }, []);

  const onConnectEnd = useCallback((event) => {
    const conn = connectingRef.current;
    connectingRef.current = null;
    if (!conn || conn.handleType !== "source") return;
    const targetIsPane = event.target.classList?.contains("react-flow__pane");
    if (!targetIsPane) return;

    const clientX = "touches" in event ? event.changedTouches[0].clientX : event.clientX;
    const clientY = "touches" in event ? event.changedTouches[0].clientY : event.clientY;
    const flowPos = screenToFlowPosition({ x: clientX, y: clientY });
    setPicker({ x: clientX, y: clientY, flowPos, sourceId: conn.nodeId });
  }, [screenToFlowPosition]);

  const pickType = (kind) => {
    if (!picker) return;
    const W = SIZE[kind] || 304;
    const H = HEIGHT[kind] || 340;
    addNode(kind, {
      position: { x: picker.flowPos.x, y: picker.flowPos.y - H / 2 },
      connectFrom: picker.sourceId,
    });
    setPicker(null);
  };

  const selectedNode = nodes.find((n) => n.id === selectedId);
  const selectedSources = selectedId ? (sourcesByNode[selectedId] || []) : [];
  const selectedImageUrl =
    selectedNode?.data?.kind === "image" &&
    typeof selectedNode.data.output === "string" &&
    /^(https?:|data:|\/api\/)/.test(selectedNode.data.output)
      ? selectedNode.data.output
      : null;

  if (!loaded) return <div style={{ color: "#5b6472", padding: 32 }}>Loading…</div>;

  return (
    <>
      <div className="topbar">
        <div className="title-pill">
          <button className="back-btn" onClick={() => router.push("/app")} title="Back">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <div className="logo">p</div>
          <input value={name} onChange={(e) => onTitleChange(e.target.value)} />
          <span className="dot" />
        </div>
        <div className="topbar-right">
          {savedAt && <span className="save-indicator">Saved</span>}
          <button className="assistant-open-btn" onClick={() => setAssistantOpen(true)} title="Open AI Assistant">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2 6h6l-5 4 2 7-7-4-7 4 2-7-5-4h6z"/></svg>
            Assistant
          </button>
          <div className="chip">68% <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg></div>
          <div className="icon-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z"/></svg></div>
          <div className="icon-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/></svg></div>
          <UserMenu />
        </div>
      </div>

      <div className="rail">
        <button title="Select">{RAIL_ICONS.cursor}</button>
        <button title="Add node" onClick={() => setAddMenuOpen((v) => !v)}>{RAIL_ICONS.plus}</button>
        <button title="Fit view" onClick={() => fitView({ padding: 0.3, duration: 300 })}>{RAIL_ICONS.frame}</button>
        <button title="Templates">{RAIL_ICONS.grid}</button>
        <button title="Comments">{RAIL_ICONS.chat}</button>
        <button title="Library" onClick={() => setLibraryOpen(true)}>{RAIL_ICONS.folder}</button>
        <div className="divider" />
        <button title="Undo (Ctrl+Z)" onClick={undo} disabled={!past.length} style={!past.length ? { opacity: .3, cursor: "not-allowed" } : null}>{RAIL_ICONS.undo}</button>
        <button title="Redo (Ctrl+Shift+Z)" onClick={redo} disabled={!future.length} style={!future.length ? { opacity: .3, cursor: "not-allowed" } : null}>{RAIL_ICONS.redo}</button>
      </div>

      {addMenuOpen && (
        <>
          <div className="add-menu-backdrop" onClick={() => setAddMenuOpen(false)} />
          <div className="add-menu">
            <div className="add-menu-header">Content</div>
            {NODE_TYPES_META.map((t) => (
              <button key={t.kind} onClick={() => addNode(t.kind)}>
                <span className="ic">{CARD_ICONS[t.kind]}</span>
                {t.label}
              </button>
            ))}
            <div className="add-menu-sep" />
            <div className="add-menu-header">Transformation</div>
            {XFORM_META.map((x) => (
              <button key={x.key} className="add-menu-soon" disabled title="Coming soon">
                <span className="ic">{x.icon}</span>
                {x.label}
                <span className="add-menu-tag">Soon</span>
              </button>
            ))}
          </div>
        </>
      )}

      <div style={{ width: "100vw", height: "100vh" }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onConnectStart={onConnectStart}
          onConnectEnd={onConnectEnd}
          onSelectionChange={onSelectionChange}
          onPaneClick={() => { setSelectedId(null); setAddMenuOpen(false); }}
          deleteKeyCode={["Backspace", "Delete"]}
          fitView={nodes.length > 0}
          fitViewOptions={{ padding: 0.3, maxZoom: 0.85 }}
          defaultViewport={{ x: 0, y: 0, zoom: 0.7 }}
          proOptions={{ hideAttribution: true }}
          minZoom={0.2}
          maxZoom={2}
        >
          <Background variant={BackgroundVariant.Dots} gap={22} size={1.5} color="#c7d0de" />
        </ReactFlow>
      </div>

      {nodes.length === 0 && (
        <div className="empty">
          <h1>Add your first node to the canvas</h1>
          <p>Each node is a creative step in your workflow.</p>
          <div className="node-cards">
            {NODE_TYPES_META.map((t) => (
              <div key={t.kind} className="node-card" onClick={() => addNode(t.kind)}>
                <div className="ic">{CARD_ICONS[t.kind]}</div>
                <div className="label">
                  {t.label}
                  {t.isNew && <span className="badge-new">New</span>}
                </div>
                <div className="sub">{t.sub}</div>
              </div>
            ))}
            <div className="node-card" onClick={() => setLibraryOpen(true)}>
              <div className="ic">{RAIL_ICONS.folder}</div>
              <div className="label">Library</div>
              <div className="sub">All your generations</div>
            </div>
          </div>
        </div>
      )}

      <div className="zoom-pill"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="6"/></svg></div>

      {picker && (
        <>
          <div className="dd-backdrop" onClick={() => setPicker(null)} />
          <div className="type-picker" style={{ left: picker.x + 8, top: picker.y + 8 }}>
            <div className="type-picker-header">Add connected node</div>
            {NODE_TYPES_META.map((t) => (
              <button key={t.kind} onClick={() => pickType(t.kind)}>
                <span className="ic">{CARD_ICONS[t.kind]}</span>
                {t.label}
              </button>
            ))}
          </div>
        </>
      )}

      {selectedNode && (
        <PromptBar
          node={selectedNode}
          sources={selectedSources}
          onChange={updateNodeData}
          onRun={() => runNode(selectedNode.id)}
          running={runningId === selectedNode.id}
        />
      )}

      {!assistantOpen && (
        <button className="assistant-fab" onClick={() => setAssistantOpen(true)} title="Open Assistant">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2 6h6l-5 4 2 7-7-4-7 4 2-7-5-4h6z"/></svg>
        </button>
      )}

      <Library open={libraryOpen} onClose={() => setLibraryOpen(false)} />

      <Assistant
        open={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        hasSelectedImage={!!selectedImageUrl}
        onCreateAndMaybeRun={({ kind, prompt }, autoRun, useSelected) => {
          // "turn this image into a video" → seed a video node from the selected image
          if (kind === "video" && useSelected && selectedImageUrl && selectedId) {
            const id = addNode("video", { prompt, aspect: "16:9 · 720p", connectFrom: selectedId });
            if (autoRun) setTimeout(() => runNode(id), 50);
            return;
          }
          const id = addNode(kind, { prompt });
          if (autoRun) setTimeout(() => runNode(id), 50);
        }}
        onDirector={(payload, model, useSelected) =>
          runDirector({ ...payload, seedImage: useSelected ? selectedImageUrl : null }, model)
        }
      />
    </>
  );
}

export default function Canvas(props) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  );
}

````

### `components/nodes/WorkflowNode.js`

````js
"use client";
import { useRef } from "react";
import { Handle, Position, useReactFlow } from "@xyflow/react";
import { bodyDims } from "@/lib/cardSize";

const ACCEPT = {
  image: "image/*",
  video: "video/*",
  audio: "audio/*",
  motion: "video/*,image/*",
};

const HEADER_ICONS = {
  image: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  ),
  video: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m22 8-6 4 6 4V8Z" />
      <rect x="2" y="6" width="14" height="12" rx="2" />
    </svg>
  ),
  text: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 7V5h16v2M9 19h6M12 5v14" />
    </svg>
  ),
  audio: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 5 6 9H2v6h4l5 4V5zM19 12a4 4 0 0 0-2-3.5M23 12a8 8 0 0 0-4-7" />
    </svg>
  ),
  motion: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="6 3 20 12 6 21 6 3" fill="currentColor" />
    </svg>
  ),
};

const KIND_TITLE = {
  image: "Image",
  video: "Video",
  text: "Text",
  audio: "Audio",
  motion: "Motion",
};

const PLACEHOLDER = {
  image: (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.4">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  ),
  video: (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.4">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <polygon points="10 9 16 12 10 15 10 9" fill="currentColor" />
    </svg>
  ),
  text: (
    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.4">
      <path d="M4 6h16M4 10h16M4 14h10M4 18h12" />
    </svg>
  ),
  audio: (
    <svg width="80" height="60" viewBox="0 0 80 60" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.5" strokeLinecap="round">
      <path d="M8 30v0M16 22v16M24 16v28M32 26v8M40 12v36M48 22v16M56 18v24M64 26v8M72 30v0" />
    </svg>
  ),
  motion: (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.4">
      <polygon points="6 3 20 12 6 21 6 3" />
    </svg>
  ),
};

const SIZE_CLASS = {
  image: "card-square",
  video: "card-wide",
  text: "card-tall",
  audio: "card-square",
  motion: "card-square",
};

export default function WorkflowNode({ id, data, selected }) {
  const kind = data.kind || "image";
  const fileRef = useRef(null);
  const { setNodes, deleteElements } = useReactFlow();
  const dims = bodyDims(kind, data.aspect); // null for text/audio (fixed sizes)

  const onDelete = (e) => {
    e.stopPropagation();
    deleteElements({ nodes: [{ id }] });
  };

  const onPickFile = (e) => {
    e.stopPropagation();
    fileRef.current?.click();
  };

  const onFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result;
      setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, data: { ...n.data, output: url, status: "done", uploadedName: file.name } } : n)));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className={`wf-card ${SIZE_CLASS[kind]} ${selected ? "is-selected" : ""}`} style={dims ? { width: dims.w } : undefined}>
      {ACCEPT[kind] && (
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPT[kind]}
          multiple
          style={{ display: "none" }}
          onChange={onFile}
          onClick={(e) => e.stopPropagation()}
        />
      )}
      <Handle type="target" position={Position.Left} />
      <div className="wf-card-header">
        <span className="wf-card-header-ic">{HEADER_ICONS[kind]}</span>
        <span>{KIND_TITLE[kind]}</span>
        <button
          type="button"
          className="wf-card-delete"
          onClick={onDelete}
          onPointerDown={(e) => e.stopPropagation()}
          title="Delete node"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          </svg>
        </button>
      </div>
      <div className="wf-card-body" style={dims ? { width: dims.w, height: dims.h } : undefined}>
        {data.output && (kind === "image" || kind === "video") && (data.output.startsWith("http") || data.output.startsWith("data:") || data.output.startsWith("/api/")) ? (
          <>
            {kind === "video" ? (
              <video src={data.output} className="wf-card-output" muted loop playsInline autoPlay controls />
            ) : (
              <img src={data.output} alt="output" className="wf-card-output" />
            )}
            <button
              type="button"
              className="wf-card-source-corner"
              title="Upload a different file"
              onClick={onPickFile}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
            </button>
          </>
        ) : data.output && kind === "audio" && data.output.startsWith("data:") ? (
          <>
            <div className="wf-card-placeholder">{PLACEHOLDER[kind]}</div>
            <audio src={data.output} controls style={{ width: "85%", marginTop: 8 }} onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} />
            <button type="button" className="wf-card-source-corner" title="Upload different audio" onClick={onPickFile} onPointerDown={(e) => e.stopPropagation()}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
            </button>
          </>
        ) : data.output && kind === "text" ? (
          <div
            className="wf-card-text"
            onPointerDown={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            {data.output}
          </div>
        ) : data.sourceThumb ? (
          <>
            <div className="wf-card-source-tile">
              <img src={data.sourceThumb} alt="source" />
              <div className="wf-card-source-tile-badge">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
              </div>
            </div>
            <div className="wf-card-cta">
              {kind === "video" ? "Click to describe your scene" : kind === "audio" ? "Click to describe the sound" : "Click to describe"}
            </div>
          </>
        ) : (
          <>
            <div className="wf-card-placeholder">{PLACEHOLDER[kind]}</div>
            <div className="wf-card-cta">
              {kind === "text" ? "Click to describe or type" : "Click to describe"}
            </div>
            {kind === "text" ? (
              <div className="wf-card-upload">Type manually</div>
            ) : (
              <button
                type="button"
                className="wf-card-upload wf-card-upload-btn"
                onClick={onPickFile}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                </svg>
                Upload one or more
              </button>
            )}
          </>
        )}
        {data.status === "running" && <div className="wf-card-running">{kind === "video" ? "Generating video… (1-3 min)" : "Generating…"}</div>}
        {data.status === "error" && <div className="wf-card-running" style={{ background: "rgba(248,113,113,.15)", color: "#fca5a5", borderColor: "#7f1d1d" }}>{data.error || "Failed"}</div>}
        {kind === "text" && <div className="wf-card-resize" />}
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

````

### `components/PromptBar.js`

````js
"use client";
import { useEffect, useState } from "react";

const MODELS = {
  image: ["Flux 2 Pro", "Flux 2 Max", "Nano Banana Pro", "Seedream 4.5"],
  video: ["LTX Video", "Wan 2.2", "MiniMax Hailuo", "Kling v2", "Veo 3.1 Fast", "Veo 3.1"],
  text: ["GPT-5.1", "Claude Opus 4.7", "Gemini 2.5 Pro"],
  // Audio doesn't use a model chip — the voice IS the choice. Backend
  // routes to ElevenLabs / OpenAI automatically.
  motion: ["Motion Pro", "After Effects AI"],
};

// Cached so we don't refetch on every selection change.
let _voicesCache = null;

const ASPECTS = {
  image: ["1:1 · 1080p", "16:9 · 1080p", "9:16 · 1080p", "4:3 · 1024p"],
  video: ["16:9 · 720p", "16:9 · 1080p", "9:16 · 720p"],
  motion: ["16:9 · 1080p", "1:1 · 1080p"],
};

const DURATIONS = ["4s", "6s", "8s", "10s", "30s", "45s", "60s"];

const MODEL_ICON = {
  image: <svg width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b"><polygon points="12 2 2 22 22 22 12 2" /></svg>,
  video: <svg width="12" height="12" viewBox="0 0 24 24" fill="#a855f7"><path d="M12 2l2 6h6l-5 4 2 7-7-4-7 4 2-7-5-4h6z" /></svg>,
  text: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M8 12h8" /></svg>,
  audio: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2"><rect x="6" y="3" width="12" height="14" rx="6" /><path d="M8 11v4M16 11v4" /></svg>,
  motion: <svg width="12" height="12" viewBox="0 0 24 24" fill="#a855f7"><polygon points="6 3 20 12 6 21 6 3" /></svg>,
};

function Chip({ icon, label, accent, onClick }) {
  return (
    <button className="chip-btn" onClick={onClick}>
      {icon && <span style={{ display: "inline-flex" }}>{icon}</span>}
      <span style={accent ? { color: accent } : null}>{label}</span>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0.6"><path d="M6 9l6 6 6-6" /></svg>
    </button>
  );
}

function Dropdown({ open, options, onPick, onClose }) {
  if (!open) return null;
  return (
    <>
      <div className="dd-backdrop" onClick={onClose} />
      <div className="dd-menu">
        {options.map((o) => {
          const value = typeof o === "string" ? o : o.value;
          const label = typeof o === "string" ? o : o.label;
          return <button key={value} onClick={() => { onPick(value); onClose(); }}>{label}</button>;
        })}
      </div>
    </>
  );
}

export default function PromptBar({ node, sources = [], onChange, onRun, running }) {
  const [openMenu, setOpenMenu] = useState(null);
  const [voices, setVoices] = useState(_voicesCache || []);

  const kind = node?.data?.kind;
  const isAudio = kind === "audio";

  // Fetch voices once the first time an audio node is selected.
  useEffect(() => {
    if (!isAudio || _voicesCache) return;
    let cancelled = false;
    fetch("/api/audio/voices")
      .then((r) => (r.ok ? r.json() : { voices: [] }))
      .then(({ voices }) => { if (!cancelled && voices) { _voicesCache = voices; setVoices(voices); } })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isAudio]);

  if (!node) return null;
  const data = node.data;

  const set = (patch) => onChange(node.id, { ...data, ...patch });
  const toggle = (k) => setOpenMenu((m) => (m === k ? null : k));

  const modelList = MODELS[kind] || [];
  const aspectList = ASPECTS[kind] || null;
  const isVideo = kind === "video";
  const hasSources = sources.length > 0;
  const currentVoiceLabel = voices.find((v) => v.value === data.voice)?.label
    || voices[0]?.label
    || (isAudio ? "Loading voices…" : "");
  const placeholder = isAudio
    ? "Type what to speak…"
    : hasSources
      ? "Describe your next edit..."
      : "Describe what you want…";

  const runCount = data.runCount || 1;
  const incRun = (e) => { e.stopPropagation(); set({ runCount: ((runCount % 9) + 1) }); };

  return (
    <div className="prompt-bar">
      <div className="pb-divider"><div className="pb-grip" /></div>

      <div className="pb-title-row">
        <input
          className="pb-title"
          placeholder={placeholder}
          value={data.prompt || ""}
          onChange={(e) => set({ prompt: e.target.value })}
          onKeyDown={(e) => e.stopPropagation()}
          onPaste={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const text = e.clipboardData.getData("text");
            const el = e.target;
            const cur = data.prompt || "";
            const start = el.selectionStart ?? cur.length;
            const end = el.selectionEnd ?? start;
            set({ prompt: cur.slice(0, start) + text + cur.slice(end) });
          }}
        />
        <span className="pb-tab">Tab</span>
        <button className="pb-window" title="Detach">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18"/></svg>
        </button>
      </div>

      {hasSources && (
        <div className="pb-sources">
          {sources.map((s) =>
            s.kind === "text" ? (
              <div key={s.id} className="pb-source-text" title={s.text}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7V5h16v2M9 19h6M12 5v14" /></svg>
                Prompt from Text
              </div>
            ) : s.kind === "video" && s.url ? (
              <div key={s.id} className="pb-source-thumb">
                <video src={`${s.url}#t=0.1`} muted playsInline preload="metadata" />
              </div>
            ) : (
              <div key={s.id} className="pb-source-thumb">
                {s.url && <img src={s.url} alt="source" />}
              </div>
            )
          )}
        </div>
      )}

      <div className="pb-chips">
        <div className="pb-chips-left">
          {isAudio && (
            <div className="pb-attached">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b"><path d="M12 2 1 21h22z" /><path d="M12 9v4M12 17h.01" fill="#0a0a0a"/></svg>
              <span className="pb-attached-pill">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 10h16M4 14h10M4 18h12" /></svg>
              </span>
            </div>
          )}
          {!isAudio && modelList.length > 0 && (
            <div className="chip-wrap">
              <Chip icon={MODEL_ICON[kind]} label={data.model || modelList[0]} onClick={() => toggle("model")} />
              <Dropdown open={openMenu === "model"} options={modelList} onPick={(v) => set({ model: v })} onClose={() => setOpenMenu(null)} />
            </div>
          )}
          {aspectList && (
            <div className="chip-wrap">
              <Chip
                icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>}
                label={data.aspect || aspectList[0]}
                onClick={() => toggle("aspect")}
              />
              <Dropdown open={openMenu === "aspect"} options={aspectList} onPick={(v) => set({ aspect: v })} onClose={() => setOpenMenu(null)} />
            </div>
          )}
          {isVideo && (
            <div className="chip-wrap">
              <Chip
                icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>}
                label={data.duration || DURATIONS[0]}
                onClick={() => toggle("duration")}
              />
              <Dropdown open={openMenu === "duration"} options={DURATIONS} onPick={(v) => set({ duration: v })} onClose={() => setOpenMenu(null)} />
            </div>
          )}
          {isVideo && (
            <Chip
              icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M22 9 18 13M18 9l4 4"/></svg>}
              label={data.audio || "No Audio"}
            />
          )}
          {isAudio && (
            <div className="chip-wrap">
              <Chip
                icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2"><rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 12a7 7 0 0 0 14 0M12 19v3"/></svg>}
                label={currentVoiceLabel}
                onClick={() => toggle("voice")}
              />
              <Dropdown
                open={openMenu === "voice"}
                options={voices}
                onPick={(v) => set({ voice: v })}
                onClose={() => setOpenMenu(null)}
              />
            </div>
          )}
          {kind !== "text" && (
            <Chip
              icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/></svg>}
              label={data.ep || "No EP"}
            />
          )}
        </div>

        <button className="pb-play" onClick={onRun} disabled={running}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          <span>{runCount}</span>
          <span onClick={incRun} className="pb-play-inc">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 9l6 6 6-6"/></svg>
          </span>
        </button>
      </div>
    </div>
  );
}

````

### `components/PropertiesPanel.js`

````js
"use client";

const PROMPT_KINDS = new Set(["image", "video", "text", "audio", "motion"]);

export default function PropertiesPanel({ node, onChange, onClose }) {
  if (!node) return null;
  const data = node.data || {};

  const set = (patch) => onChange(node.id, { ...data, ...patch });

  return (
    <div className="props">
      <h3>
        Properties
        <button className="props-close" onClick={onClose}>×</button>
      </h3>
      <div className="props-kind">{data.kind} node</div>

      <label>Label</label>
      <input
        value={data.label || ""}
        onChange={(e) => set({ label: e.target.value })}
      />

      {PROMPT_KINDS.has(data.kind) && (
        <>
          <label>Prompt</label>
          <textarea
            placeholder={`Describe the ${data.kind} you want to generate...`}
            value={data.prompt || ""}
            onChange={(e) => set({ prompt: e.target.value })}
          />
        </>
      )}

      {data.output && (
        <>
          <div className="props-output-label">Last output</div>
          {data.kind === "image" && data.output.startsWith("http") ? (
            <img src={data.output} alt="output" style={{ width: "100%", borderRadius: 6, border: "1px solid #1f1f1f" }} />
          ) : (
            <div className="props-output">{data.output}</div>
          )}
        </>
      )}
    </div>
  );
}

````

### `components/Assistant.js`

````js
"use client";
import { useEffect, useRef, useState } from "react";

const VIDEO_MODELS = ["LTX Video", "Wan 2.2", "MiniMax Hailuo", "Kling v2"];

export default function Assistant({ open, onClose, onCreateAndMaybeRun, onDirector, hasSelectedImage }) {
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState("");
  const [autoRun, setAutoRun] = useState(true);
  const [videoModel, setVideoModel] = useState("LTX Video");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [history, sending]);

  if (!open) return null;

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);
    setHistory((h) => [...h, { role: "user", content: text }]);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: text, history, context: { hasSelectedImage: !!hasSelectedImage } }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      const isDirector = Array.isArray(data.scenes) && data.scenes.length >= 2;
      setHistory((h) => [
        ...h,
        {
          role: "assistant",
          content: data.message || "Done.",
          action: isDirector
            ? { director: true, count: data.scenes.length }
            : data.kind
              ? { kind: data.kind, prompt: data.prompt }
              : null,
        },
      ]);
      if (isDirector) onDirector({ scenes: data.scenes, character: data.character }, videoModel, data.useSelectedImage);
      else if (data.kind) onCreateAndMaybeRun({ kind: data.kind, prompt: data.prompt }, autoRun, data.useSelectedImage);
    } catch (e) {
      setHistory((h) => [...h, { role: "assistant", content: `⚠ ${e.message}` }]);
    } finally {
      setSending(false);
    }
  };

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="cb-sidepanel">
      <div className="cb-modal">
        <div className="cb-head">
          <div className="cb-head-title">
            <span className="cb-spark">✦</span> AI Assistant
          </div>
          <div className="cb-head-actions">
            {history.length > 0 && (
              <button className="cb-iconbtn" onClick={() => setHistory([])} title="New chat">New chat</button>
            )}
            <button className="cb-iconbtn cb-close" onClick={onClose} title="Close">✕</button>
          </div>
        </div>

        <div className="cb-messages" ref={scrollRef}>
          {history.length === 0 && (
            <div className="cb-welcome">
              <div className="cb-welcome-icon">✦</div>
              <h3>How can I help?</h3>
              <p>Describe what you want and I'll create the right node and generate it.</p>
              <div className="cb-suggestions">
                {[
                  "Generate an image of a sunset over mountains",
                  "Write a tagline for a coffee brand",
                  "Make a 30-second kids rhyme video about colors",
                ].map((s) => (
                  <button key={s} className="cb-suggestion" onClick={() => setInput(s)}>{s}</button>
                ))}
              </div>
            </div>
          )}

          {history.map((m, i) => (
            <div key={i} className={`cb-msg cb-msg-${m.role}`}>
              <div className="cb-bubble">
                {m.content}
                {m.action && (
                  <div className="cb-chip">
                    {m.action.director
                      ? `✦ Directing ${m.action.count} scenes → generating in parallel & stitching into one video…`
                      : `✦ Created ${m.action.kind} node${m.action.prompt ? ` — "${m.action.prompt.slice(0, 50)}${m.action.prompt.length > 50 ? "…" : ""}"` : ""}`}
                  </div>
                )}
              </div>
            </div>
          ))}

          {sending && (
            <div className="cb-msg cb-msg-assistant">
              <div className="cb-bubble cb-thinking">
                <span className="cb-dot" /><span className="cb-dot" /><span className="cb-dot" />
              </div>
            </div>
          )}
        </div>

        <div className="cb-inputbar">
          <div className="cb-autorun-row">
            <button
              className={`cb-autorun ${autoRun ? "on" : ""}`}
              onClick={() => setAutoRun((v) => !v)}
              title="When on, generated nodes run automatically"
            >
              ⚡ Auto-run {autoRun ? "on" : "off"}
            </button>
            <select
              className="cb-model"
              value={videoModel}
              onChange={(e) => setVideoModel(e.target.value)}
              title="Video model used for multi-scene (director) videos"
            >
              {VIDEO_MODELS.map((m) => (
                <option key={m} value={m}>🎬 {m}</option>
              ))}
            </select>
          </div>
          <div className="cb-inputrow">
            <textarea
              ref={inputRef}
              className="cb-textarea"
              placeholder="Describe what you want to create…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              rows={1}
            />
            <button className="cb-send" onClick={send} disabled={!input.trim() || sending} title="Send">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

````

### `components/Library.js`

````js
"use client";
import { useEffect, useState } from "react";
import { listGenerations } from "@/lib/store";

const KIND_LABEL = { image: "Image", video: "Video", audio: "Audio", text: "Text", motion: "Motion" };
const KIND_EXT = { image: "jpg", video: "mp4", audio: "mp3" };

function extFor(it) {
  const m = /\.(jpe?g|png|webp|gif|mp4|webm|mov|mp3|wav|m4a)(?:[?#]|$)/i.exec(it.url || "");
  if (m) return m[1].toLowerCase();
  return KIND_EXT[it.kind] || "bin";
}

async function downloadItem(e, it) {
  e.preventDefault();
  e.stopPropagation();
  const name = `geoflix-${it.kind || "file"}-${Date.now()}.${extFor(it)}`;
  try {
    const res = await fetch(it.url);
    if (!res.ok) throw new Error("fetch failed");
    const blob = await res.blob();
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(href), 4000);
  } catch {
    // Cross-origin without CORS, etc. — fall back to opening the file.
    window.open(it.url, "_blank", "noopener");
  }
}

export default function Library({ open, onClose }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!open) return;
    const local = listGenerations();
    setItems(local);
    // Merge in server-side (Claude MCP) generations, deduped by url.
    let cancelled = false;
    fetch("/api/generations")
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then(({ items: server }) => {
        if (cancelled || !Array.isArray(server) || server.length === 0) return;
        const seen = new Set(local.map((g) => g.url));
        const extra = server
          .filter((g) => g && g.url && !seen.has(g.url))
          .map((g) => ({ ...g, workflowName: g.workflowName || "Claude MCP" }));
        if (extra.length) {
          const merged = [...local, ...extra].sort((a, b) => (b.ts || 0) - (a.ts || 0));
          setItems(merged);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="lib-backdrop" onMouseDown={onClose}>
      <div className="lib-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="lib-head">
          <div className="lib-head-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h6l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/></svg>
            Library <span className="lib-count">{items.length}</span>
          </div>
          <button className="lib-close" onClick={onClose} title="Close">✕</button>
        </div>

        <div className="lib-body">
          {items.length === 0 ? (
            <div className="lib-empty">
              <div className="lib-empty-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M4 4h6l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/></svg>
              </div>
              <h3>No generations yet</h3>
              <p>Images, videos, and audio you generate or upload will collect here.</p>
            </div>
          ) : (
            <div className="lib-grid">
              {items.map((it, i) => (
                <a key={i} className="lib-block" href={it.url} target="_blank" rel="noreferrer">
                  {it.kind === "image" && <img src={it.url} alt="" loading="lazy" decoding="async" />}
                  {it.kind === "video" && (
                    <video
                      src={it.url}
                      muted
                      loop
                      playsInline
                      preload="none"
                      onMouseOver={(e) => { e.target.play().catch(() => {}); }}
                      onMouseOut={(e) => { e.target.pause(); e.target.currentTime = 0; }}
                    />
                  )}
                  {it.kind === "audio" && (
                    <div className="lib-audio">
                      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M19 12a4 4 0 0 0-2-3.5"/></svg>
                    </div>
                  )}
                  {(it.kind === "text" || it.kind === "motion") && <div className="lib-textthumb">{KIND_LABEL[it.kind] || it.kind}</div>}
                  <span className="lib-badge">{KIND_LABEL[it.kind] || it.kind}</span>
                  {(it.kind === "image" || it.kind === "video" || it.kind === "audio") && (
                    <button className="lib-download" title="Download" onClick={(e) => downloadItem(e, it)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                    </button>
                  )}
                  <div className="lib-overlay">
                    <div className="lib-overlay-prompt">{it.prompt || "(no prompt)"}</div>
                    <div className="lib-overlay-wf">{it.workflowName}</div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

````

### `components/Dashboard.js`

````js
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { listWorkflows, createWorkflow, deleteWorkflow, renameWorkflow } from "@/lib/store";
import UserMenu from "@/components/UserMenu";

function relTime(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function Dashboard() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState("");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    setItems(listWorkflows());
  }, []);

  const refresh = () => setItems(listWorkflows());

  const onCreate = () => {
    setNewName("");
    setCreating(true);
  };

  const onCreateConfirm = () => {
    const wf = createWorkflow(newName.trim() || "Untitled Workflow");
    router.push(`/w/${wf.id}`);
  };

  const onDelete = (id, e) => {
    e.stopPropagation();
    if (!confirm("Delete this workflow?")) return;
    deleteWorkflow(id);
    refresh();
  };

  const onRenameStart = (wf, e) => {
    e.stopPropagation();
    setEditingId(wf.id);
    setDraft(wf.name);
  };

  const onRenameCommit = (id) => {
    const name = draft.trim() || "Untitled Workflow";
    renameWorkflow(id, name);
    setEditingId(null);
    refresh();
  };

  return (
    <div className="dash">
      <div className="dash-topbar">
        <div className="title-pill">
          <div className="logo">w</div>
          <span>Workflows</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button className="primary-btn" onClick={onCreate}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
            New Workflow
          </button>
          <UserMenu />
        </div>
      </div>

      <div className="dash-body">
        <h1 className="dash-h1">Your workflows</h1>
        <p className="dash-sub">Build node-based creative pipelines. Saved automatically in this browser.</p>

        {items.length === 0 ? (
          <div className="dash-empty">
            <div className="dash-empty-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </div>
            <h2>No workflows yet</h2>
            <p>Create your first workflow to get started.</p>
            <button className="primary-btn" onClick={onCreate}>Create workflow</button>
          </div>
        ) : (
          <div className="wf-grid">
            <div className="wf-tile wf-tile-new" onClick={onCreate}>
              <div className="wf-tile-new-plus">+</div>
              <div>New workflow</div>
            </div>
            {items.map((wf) => (
              <div key={wf.id} className="wf-tile" onClick={() => router.push(`/w/${wf.id}`)}>
                <div className="wf-tile-preview">
                  <span>{wf.nodes.length} node{wf.nodes.length === 1 ? "" : "s"}</span>
                </div>
                <div className="wf-tile-meta">
                  {editingId === wf.id ? (
                    <input
                      className="wf-rename"
                      autoFocus
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onBlur={() => onRenameCommit(wf.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") onRenameCommit(wf.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <div className="wf-tile-name" onDoubleClick={(e) => onRenameStart(wf, e)}>{wf.name}</div>
                  )}
                  <div className="wf-tile-time">Updated {relTime(wf.updatedAt)}</div>
                </div>
                <div className="wf-tile-actions">
                  <button onClick={(e) => onRenameStart(wf, e)} title="Rename">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                  </button>
                  <button onClick={(e) => onDelete(wf.id, e)} title="Delete">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {creating && (
        <div className="nw-backdrop" onClick={() => setCreating(false)}>
          <div className="nw-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="nw-title">Name your workflow</h3>
            <p className="nw-sub">Give it a name to get started. You can rename it later.</p>
            <input
              className="nw-input"
              autoFocus
              placeholder="Untitled Workflow"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onCreateConfirm();
                if (e.key === "Escape") setCreating(false);
              }}
            />
            <div className="nw-actions">
              <button className="nw-cancel" onClick={() => setCreating(false)}>Cancel</button>
              <button className="primary-btn" onClick={onCreateConfirm}>Create workflow</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

````

### `components/UserMenu.js`

````js
"use client";
import { UserButton } from "@clerk/nextjs";

const CLERK_ENABLED = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

// Clerk avatar + sign-out menu. Renders nothing until Clerk keys are set
// (so the app works with auth disabled).
export default function UserMenu() {
  if (!CLERK_ENABLED) return null;
  return (
    <UserButton
      afterSignOutUrl="/"
      appearance={{ elements: { userButtonAvatarBox: { width: 32, height: 32 } } }}
    />
  );
}

````

### `lib/run.js`

````js
export async function generateOutput(kind, prompt, model, images, opts = {}) {
  // Images go through the async fal queue (start + poll) so slow edit models
  // aren't bound by the 60s serverless cap. Text/audio stay synchronous.
  if (kind === "image") return generateImage({ prompt, model, images });

  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, prompt, model, images, voice: opts.voice }),
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { msg = (await res.json()).error || msg; } catch {}
    throw new Error(msg);
  }
  const { output } = await res.json();
  return output;
}

// Stitch multiple clip URLs into one video via the combine endpoint (start + poll).
export async function combineVideos(urls, durations, onProgress) {
  const startRes = await fetch("/api/video/combine/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ urls, durations }),
  });
  const start = await startRes.json();
  if (!startRes.ok) throw new Error(start.error || `HTTP ${startRes.status}`);

  const handle = { statusUrl: start.statusUrl, responseUrl: start.responseUrl };
  const deadline = Date.now() + 4 * 60 * 1000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 4000));
    onProgress?.();
    const sRes = await fetch("/api/video/combine/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(handle),
    });
    const s = await sRes.json();
    if (!sRes.ok) throw new Error(s.error || `HTTP ${sRes.status}`);
    if (s.done) return s.output;
  }
  throw new Error("Combine timed out (over 4 min)");
}

async function generateImage({ prompt, model, images }) {
  const startRes = await fetch("/api/image/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, model, images }),
  });
  const start = await startRes.json();
  if (!startRes.ok) throw new Error(start.error || `HTTP ${startRes.status}`);
  if (start.output) return start.output; // synchronous fallback (OpenAI/mock)

  const handle = { statusUrl: start.statusUrl, responseUrl: start.responseUrl };
  const deadline = Date.now() + 3 * 60 * 1000; // 3 min cap
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 3000));
    const sRes = await fetch("/api/image/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(handle),
    });
    const s = await sRes.json();
    if (!sRes.ok) throw new Error(s.error || `HTTP ${sRes.status}`);
    if (s.done) return s.output;
  }
  throw new Error("Image generation timed out (over 3 min)");
}

// Video uses an async long-running operation (Veo). Start, then poll until done.
export async function generateVideo({ prompt, model, image, aspect, resolution, duration }, onProgress) {
  const startRes = await fetch("/api/video/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, model, image, aspect, resolution, duration }),
  });
  const start = await startRes.json();
  if (!startRes.ok) throw new Error(start.error || `HTTP ${startRes.status}`);
  if (start.mock) return start.output;

  // Forward the provider-specific handle (veo: {operation}, fal: {endpoint,requestId}) to status.
  const handle = start;
  const deadline = Date.now() + 5 * 60 * 1000; // 5 min cap
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 6000));
    onProgress?.();
    const sRes = await fetch("/api/video/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(handle),
    });
    const s = await sRes.json();
    if (!sRes.ok) throw new Error(s.error || `HTTP ${sRes.status}`);
    if (s.done) return s.output;
  }
  throw new Error("Video generation timed out (over 5 min)");
}

````

### `lib/store.js`

````js
"use client";

const KEY = "wfc:workflows:v1";

function read() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

function write(all) {
  localStorage.setItem(KEY, JSON.stringify(all));
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function listWorkflows() {
  const all = read();
  return Object.values(all).sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getWorkflow(id) {
  return read()[id] || null;
}

export function createWorkflow(name = "Untitled Workflow") {
  const all = read();
  const id = uid();
  const now = Date.now();
  all[id] = {
    id,
    name,
    nodes: [],
    edges: [],
    createdAt: now,
    updatedAt: now,
  };
  write(all);
  return all[id];
}

export function saveWorkflow(wf) {
  const all = read();
  all[wf.id] = { ...wf, updatedAt: Date.now() };
  write(all);
}

export function renameWorkflow(id, name) {
  const all = read();
  if (!all[id]) return;
  all[id].name = name;
  all[id].updatedAt = Date.now();
  write(all);
}

export function deleteWorkflow(id) {
  const all = read();
  delete all[id];
  write(all);
}

// Collect every generated/uploaded media output across all workflows.
export function listGenerations() {
  const all = read();
  const out = [];
  for (const wf of Object.values(all)) {
    for (const n of wf.nodes || []) {
      const o = n.data?.output;
      const kind = n.data?.kind;
      if (
        o &&
        typeof o === "string" &&
        (o.startsWith("http") || o.startsWith("data:") || o.startsWith("/api/"))
      ) {
        out.push({
          url: o,
          kind,
          prompt: n.data?.prompt || "",
          workflowId: wf.id,
          workflowName: wf.name,
          nodeId: n.id,
          ts: wf.updatedAt || 0,
        });
      }
    }
  }
  return out.sort((a, b) => b.ts - a.ts);
}

````

### `lib/cardSize.js`

````js
// Shared card sizing so a node's shape follows its selected aspect ratio.
// Used by WorkflowNode (to size the rendered card) and Canvas (to keep React
// Flow's stored node width/height in sync so handles and edges stay aligned).

export const CARD_HEADER = 32; // header row height above the card body

// Parse the "W:H" prefix from an aspect label like "16:9 · 1080p".
export function aspectRatio(aspect) {
  const m = /(\d+)\s*:\s*(\d+)/.exec(aspect || "");
  return m ? [Number(m[1]), Number(m[2])] : null;
}

// Body (preview) dimensions for image/video nodes; null for other kinds
// (text/audio keep their fixed sizes).
export function bodyDims(kind, aspect) {
  if (kind !== "image" && kind !== "video") return null;
  const r = aspectRatio(aspect) || (kind === "video" ? [16, 9] : [1, 1]);
  const [w, h] = r;
  if (w === h) return { w: 320, h: 320 };
  const LONG = 460;
  if (w > h) return { w: LONG, h: Math.round((LONG * h) / w) };
  return { w: Math.round((LONG * w) / h), h: LONG };
}

// Full React Flow node dimensions (body + header).
export function nodeDims(kind, aspect) {
  const b = bodyDims(kind, aspect);
  return b ? { width: b.w, height: b.h + CARD_HEADER } : null;
}

````

### `lib/mockRun.js`

````js
const MOCKS = {
  image: () => "https://picsum.photos/seed/" + Math.floor(Math.random() * 9999) + "/300/200",
  video: () => "Generated 6s video clip (mock)",
  text: (prompt) => `Generated text for: "${prompt || "no prompt"}" — Lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
  audio: () => "Generated 12s audio track (mock)",
  motion: () => "Generated motion graphics scene (mock)",
};

export function mockOutput(kind, prompt) {
  return (MOCKS[kind] || (() => "mock output"))(prompt);
}

export function topoOrder(nodes, edges) {
  const incoming = new Map(nodes.map((n) => [n.id, 0]));
  const adj = new Map(nodes.map((n) => [n.id, []]));
  for (const e of edges) {
    if (!incoming.has(e.target) || !incoming.has(e.source)) continue;
    incoming.set(e.target, incoming.get(e.target) + 1);
    adj.get(e.source).push(e.target);
  }
  const queue = nodes.filter((n) => incoming.get(n.id) === 0).map((n) => n.id);
  const out = [];
  while (queue.length) {
    const id = queue.shift();
    out.push(id);
    for (const next of adj.get(id) || []) {
      incoming.set(next, incoming.get(next) - 1);
      if (incoming.get(next) === 0) queue.push(next);
    }
  }
  if (out.length !== nodes.length) return nodes.map((n) => n.id);
  return out;
}

````
