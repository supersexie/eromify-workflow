# Interactive Canvas Tutorial — Full Implementation Guide

A hands-on, step-by-step product tour for a node-based canvas (React + Next.js).
It dims the screen, cuts a bright "spotlight" hole around a real UI element, and
**advances when the user actually performs the step** (adds a node, types a
prompt, hits generate). Welcome/finish steps are centered modals.

This guide contains **all the code**: the component, the CSS, and how to wire it
into your editor page.

---

## How it works (concept)

- Each step is either a **`modal`** (centered card with a blocking backdrop —
  used for Welcome / Finish) or a **`spotlight`** (dims the page, cuts a hole
  around a CSS-selector target, shows a tip card next to it).
- The dim layer is **click-through** (`pointer-events: none`), so the user can
  actually use the highlighted control.
- The parent (your canvas component) holds the current step index and **detects
  when the action happened** (e.g. node count went up) to auto-advance. "Optional"
  steps show a **Next** button instead.
- Auto-launches **once** on the user's first visit (flag in `localStorage`), and
  there's a **"How it works"** button to replay it anytime.

The tour in this build has 8 steps: Welcome → Add node → Write prompt → Enhance
(optional) → Pick model/aspect (optional) → Generate → Branch into a new node
(optional) → Finish.

---

## Assumptions / dependencies

- **React 18/19 + Next.js** (`"use client"` components).
- A few **CSS variables** are referenced for theming — define them (or replace
  with literals):
  ```css
  :root{
    --bg:#08080a; --surface:#111114; --surface-2:#17171c;
    --line:#232329; --line-2:#2c2c33; --ink:#fff; --text:#e7e7ea;
    --muted:#9ca3af; --muted-2:#6b7280; --blue:#ec4899;
    --grad:linear-gradient(135deg,#ec4899 0%,#a855f7 60%,#8b5cf6 100%);
    --shadow:0 10px 30px rgba(0,0,0,.45);
  }
  ```
- The spotlight **`target`** values are CSS selectors that must match your own
  UI (e.g. the add button, the prompt bar, the generate button). Adjust them and
  the advancement conditions to your app.

---

## 1) The component — `components/CanvasTutorial.js`

```jsx
"use client";
import { useEffect, useLayoutEffect, useState } from "react";

// Hands-on guided tutorial for the Canvas. Steps come in two flavours:
//  - mode "modal": a centered card (welcome / finish) with a blocking backdrop.
//  - mode "spotlight": dims the screen but cuts a bright hole around a live UI
//    element (`target` CSS selector). The dim layer is click-THROUGH, so the
//    user can actually perform the step; the parent advances the step when it
//    detects the action (node added / prompt typed / generation started).
//
// `step` is the active index; `onNext`/`onBack`/`onSkip` are wired by Canvas.

export const TUTORIAL_DONE_KEY = "eromify:canvasTutorialDone:v1";

export const TUT_STEPS = [
  {
    mode: "modal",
    title: "Welcome to the Canvas",
    body: "The Canvas lets you chain creative steps together as nodes. Let's build your first one — it takes about 30 seconds.",
    cta: "Start",
  },
  {
    mode: "spotlight",
    target: '[data-tut="add"]',
    placement: "right",
    title: "Add your first node",
    body: "Click the + button to add a node. Pick Image (or use one of the cards in the centre).",
  },
  {
    mode: "spotlight",
    target: ".prompt-bar",
    placement: "bl",
    optional: true,
    title: "Write a prompt",
    body: "This is the prompt bar for the selected node. Describe what you want to create — tip: type @ to summon an influencer. Click Next when you're done.",
  },
  {
    mode: "spotlight",
    target: ".pb-enhance",
    placement: "top",
    optional: true,
    title: "Enhance your prompt (optional)",
    body: "Tap Enhance to let AI rewrite your prompt in the house style for richer results. Optional — skip it anytime with Next.",
  },
  {
    mode: "spotlight",
    target: ".pb-chips-left",
    placement: "bl",
    optional: true,
    title: "Pick model & aspect ratio",
    body: "Choose the generation model and aspect ratio (plus quality and batch size) for this node. Defaults are fine to start — tweak them, then Next.",
  },
  {
    mode: "spotlight",
    target: ".ip-bar-generate",
    placement: "top",
    title: "Generate it",
    body: "Hit Generate to run this node. Your result appears right on the card.",
  },
  {
    mode: "spotlight",
    target: ".react-flow__handle.source",
    tipTarget: ".react-flow__node",
    placement: "left-of",
    optional: true,
    revealHandles: true,
    title: "Branch into a new node",
    body: "See this + handle on the edge of your card? Click and drag it out onto empty canvas to turn this creation into a new connected node. Click Next to finish.",
  },
  {
    mode: "modal",
    title: "You're all set 🎉",
    body: "Drag a node's side handles onto empty space to chain steps. Re-open this tour anytime from the ? button.",
    cta: "Finish",
  },
];

function useTargetRect(selector, active) {
  const [rect, setRect] = useState(null);
  useLayoutEffect(() => {
    if (!selector || !active) { setRect(null); return; }
    let raf;
    const measure = () => {
      const el = document.querySelector(selector);
      setRect(el ? el.getBoundingClientRect() : null);
      raf = requestAnimationFrame(measure);
    };
    measure();
    return () => cancelAnimationFrame(raf);
  }, [selector, active]);
  return rect;
}

export default function CanvasTutorial({ step, total, onNext, onBack, onSkip, nextEnabled = true }) {
  const active = step != null && step >= 0 && step < TUT_STEPS.length;
  const spec = active ? TUT_STEPS[step] : null;
  const rect = useTargetRect(spec?.mode === "spotlight" ? spec.target : null, active);
  // Optional separate anchor for the tip card (e.g. position beside the node
  // card while the spotlight hole stays on the small + handle).
  const tipRect = useTargetRect(spec?.tipTarget || null, active);

  // Esc closes the tour.
  useEffect(() => {
    if (!active) return;
    const onKey = (e) => { if (e.key === "Escape") onSkip(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, onSkip]);

  // Some node handles are only visible on hover/selection. For steps that point
  // at one, force them visible via a body class so the spotlight isn't empty.
  useEffect(() => {
    const reveal = active && spec?.revealHandles;
    document.body.classList.toggle("tut-reveal-handles", !!reveal);
    return () => document.body.classList.remove("tut-reveal-handles");
  }, [active, spec]);

  if (!active) return null;
  const isModal = spec.mode === "modal";
  const pad = 8;

  // Tooltip position for spotlight steps.
  let tipStyle = {};
  if (!isModal && rect) {
    if (spec.placement === "left-of") {
      const CARD_W = 340;
      const anchor = tipRect || rect;
      const left = Math.max(16, anchor.left - CARD_W - 20);
      const top = Math.max(64, Math.min(anchor.top, window.innerHeight - 240));
      tipStyle = { left, top };
    } else if (spec.placement === "right") {
      tipStyle = { left: rect.right + 16, top: rect.top };
    } else if (spec.placement === "bl") {
      // Lower-left, just above the prompt bar (clear of dropdowns on the right).
      tipStyle = { left: 24, bottom: window.innerHeight - rect.top + 16 };
    } else if (spec.placement === "tl") {
      tipStyle = { left: 24, top: 70 };
    } else if (spec.placement === "top") {
      tipStyle = { left: Math.min(rect.left, window.innerWidth - 360), bottom: window.innerHeight - rect.top + 16 };
    } else {
      tipStyle = { left: rect.left, top: rect.bottom + 16 };
    }
  }

  return (
    <div className="tut-root">
      {isModal ? (
        <div className="tut-modal-backdrop">
          <div className="tut-card tut-card-modal">
            <div className="tut-progress">Step {step + 1} of {total}</div>
            <h3>{spec.title}</h3>
            <p>{spec.body}</p>
            <div className="tut-actions">
              <button className="tut-skip" onClick={onSkip}>Skip tour</button>
              <div className="tut-actions-right">
                {step > 0 && <button className="tut-back" onClick={onBack}>Back</button>}
                <button className="tut-next" onClick={onNext}>{spec.cta || "Next"}</button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Click-through dim layer with a cut-out hole around the target. */}
          <svg className="tut-overlay" width="100%" height="100%">
            <defs>
              <mask id="tut-hole">
                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                {rect && (
                  <rect
                    x={rect.left - pad} y={rect.top - pad}
                    width={rect.width + pad * 2} height={rect.height + pad * 2}
                    rx="12" fill="black"
                  />
                )}
              </mask>
            </defs>
            <rect x="0" y="0" width="100%" height="100%" fill="rgba(0,0,0,0.62)" mask="url(#tut-hole)" />
            {rect && (
              <rect
                className="tut-ring"
                x={rect.left - pad} y={rect.top - pad}
                width={rect.width + pad * 2} height={rect.height + pad * 2}
                rx="12" fill="none"
              />
            )}
          </svg>
          {/* Fallback to a centered card if the target isn't on screen yet, so
              the tour is never a blank dim screen. */}
          <div
            className={rect ? "tut-card tut-card-tip" : "tut-card tut-card-tip tut-card-fallback"}
            style={rect ? tipStyle : undefined}
          >
            <div className="tut-progress">Step {step + 1} of {total}</div>
            <h3>{spec.title}</h3>
            <p>{spec.body}</p>
            <div className="tut-actions">
              <button className="tut-skip" onClick={onSkip}>Skip tour</button>
              <div className="tut-actions-right">
                {step > 0 && <button className="tut-back" onClick={onBack}>Back</button>}
                {spec.optional || !rect
                  ? <button className="tut-next" onClick={onNext} disabled={!nextEnabled}>Next</button>
                  : <span className="tut-hint">Do the step to continue →</span>}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
```

---

## 2) The CSS (add to your global stylesheet)

```css
/* ---- Canvas hands-on tutorial ---- */
/* Root is click-through so spotlight steps let the user interact with the live
   UI underneath; only the tip card / modal backdrop re-enable pointer events. */
.tut-root { position: fixed; inset: 0; z-index: 1000; pointer-events: none; }
.tut-overlay { position: fixed; inset: 0; pointer-events: none; } /* click-through dim */
.tut-ring {
  stroke: var(--blue); stroke-width: 2.5;
  filter: drop-shadow(0 0 10px rgba(236, 72, 153, 0.55));
  animation: tut-pulse 1.6s ease-in-out infinite;
}
@keyframes tut-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }

.tut-modal-backdrop {
  position: fixed; inset: 0; background: rgba(0, 0, 0, 0.62);
  display: flex; align-items: center; justify-content: center; padding: 24px;
  pointer-events: auto;
}

.tut-card {
  width: 340px; max-width: calc(100vw - 32px);
  background: var(--surface); border: 1px solid var(--line-2);
  border-radius: 14px; padding: 18px; box-shadow: var(--shadow);
}
.tut-card-tip { position: fixed; pointer-events: auto; }
.tut-card-fallback { left: 50%; top: 50%; transform: translate(-50%, -50%); }
.tut-card-modal { width: 400px; }
.tut-card h3 { margin: 6px 0 8px; font-size: 17px; color: var(--ink); }
.tut-card p { margin: 0; font-size: 13.5px; line-height: 1.55; color: var(--muted); }
.tut-progress {
  font-size: 11px; font-weight: 600; letter-spacing: 0.04em;
  text-transform: uppercase; color: var(--blue);
}
.tut-actions {
  display: flex; align-items: center; justify-content: space-between;
  gap: 8px; margin-top: 16px;
}
.tut-actions-right { display: flex; align-items: center; gap: 8px; }
.tut-skip {
  background: none; border: none; color: var(--muted-2);
  font-size: 12.5px; cursor: pointer; padding: 6px 2px;
}
.tut-skip:hover { color: var(--text); }
.tut-back {
  background: var(--surface-2); border: 1px solid var(--line);
  color: var(--text); font-size: 13px; font-weight: 500;
  padding: 7px 14px; border-radius: 9px; cursor: pointer;
}
.tut-back:hover { background: var(--line); }
.tut-next {
  background: var(--grad); border: none; color: #fff;
  font-size: 13px; font-weight: 600; padding: 8px 18px;
  border-radius: 9px; cursor: pointer;
}
.tut-next:hover { filter: brightness(1.08); }
.tut-next:disabled { opacity: 0.4; cursor: not-allowed; filter: none; }
.tut-hint { font-size: 12px; color: var(--blue); font-weight: 500; }

/* During the "branch into a new node" step, reveal node source handles so the
   spotlight has something visible to point at (they're hover-only otherwise). */
body.tut-reveal-handles .react-flow .react-flow__handle.source { opacity: 1; }

/* The "How it works" replay button (place in your top bar). */
.howitworks-btn {
  display: inline-flex; align-items: center; gap: 6px;
  background: var(--surface); border: 1px solid var(--line);
  color: var(--muted); padding: 6px 11px; border-radius: 8px;
  font-size: 12.5px; font-weight: 500; cursor: pointer; font-family: inherit;
}
.howitworks-btn:hover { color: var(--ink); border-color: var(--line-2); background: var(--surface-2); }
```

### IMPORTANT — z-index gotcha

The tutorial overlay sits at `z-index: 1000`. Any popup the user opens **during**
a spotlight step (e.g. an "add node" menu, a connect-type picker) must render
**above** it or it appears buried in the dim and looks dead. Raise them:

```css
.add-menu-backdrop { z-index: 1090; }
.add-menu          { z-index: 1100; }
.type-picker       { z-index: 1100; }
```

---

## 3) Wiring it into your canvas/editor component

Add the import, state, effects, target markers, and render. The exact
advancement conditions depend on your app's state (node list, selection, a
"running" set). Below is the integration used here.

### Import + state

```jsx
import CanvasTutorial, { TUT_STEPS, TUTORIAL_DONE_KEY } from "./CanvasTutorial";

// inside the component:
const [tutStep, setTutStep] = useState(null); // null = tour closed
```

### Auto-launch once + close helper

```jsx
// Auto-launch the hands-on tour only once — on the user's first canvas. Mark it
// shown immediately so it never auto-opens again; the "How it works" button
// lets them replay it anytime.
useEffect(() => {
  if (!loaded) return; // `loaded` = your "workflow has loaded" flag
  try {
    if (!localStorage.getItem(TUTORIAL_DONE_KEY)) {
      setTutStep(0);
      localStorage.setItem(TUTORIAL_DONE_KEY, "1");
    }
  } catch {}
}, [loaded]);

const closeTutorial = useCallback(() => {
  setTutStep(null);
  try { localStorage.setItem(TUTORIAL_DONE_KEY, "1"); } catch {}
}, []);
```

### Hands-on advancement (auto-advance when the user does the thing)

```jsx
// `nodes`, `selectedId`, `runningIds` are your canvas state.
const selectedNodeForTut = nodes.find((n) => n.id === selectedId);

// Step 1 (add a node) -> advance once a node exists.
useEffect(() => {
  if (tutStep === 1 && nodes.length >= 1) setTutStep(2);
}, [tutStep, nodes.length]);

// Step 5 (generate) -> advance once a run starts.
useEffect(() => {
  if (tutStep === 5 && runningIds.size > 0) setTutStep(6);
}, [tutStep, runningIds]);

// Steps that point at the prompt bar (2-6) need a node selected so the bar is
// mounted; auto-select one so the spotlight never dims to a blank screen.
useEffect(() => {
  if ([2, 3, 4, 5, 6].includes(tutStep) && !selectedId && nodes.length > 0) {
    setSelectedId(nodes[nodes.length - 1].id);
  }
}, [tutStep, selectedId, nodes]);

// Step 2 (write prompt) advances via Next, enabled only once a prompt is typed.
const tutNextEnabled = tutStep === 2
  ? !!(selectedNodeForTut?.data?.prompt || "").trim()
  : true;
```

> Steps 3 (Enhance) and 4 (model/aspect) are `optional` — they advance when the
> user clicks **Next** (no special effect needed; `onNext` just increments).

### Mark the spotlight targets

Add `data-tut="add"` to your "add node" button. The other steps target existing
classes (`.prompt-bar`, `.pb-enhance`, `.pb-chips-left`, `.ip-bar-generate`,
`.react-flow__handle.source`, `.react-flow__node`) — rename these in `TUT_STEPS`
to match your markup.

```jsx
<button title="Add node" data-tut="add" onClick={() => setAddMenuOpen(v => !v)}>+</button>
```

### "How it works" replay button (top bar, every canvas)

```jsx
<button className="howitworks-btn" onClick={() => setTutStep(0)} title="Replay the tutorial">
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>
  </svg>
  How it works
</button>
```

### Render the tour

```jsx
<CanvasTutorial
  step={tutStep}
  total={TUT_STEPS.length}
  nextEnabled={tutNextEnabled}
  onNext={() => setTutStep((s) => (s >= TUT_STEPS.length - 1 ? (closeTutorial(), null) : s + 1))}
  onBack={() => setTutStep((s) => Math.max(0, (s ?? 0) - 1))}
  onSkip={closeTutorial}
/>
```

---

## Adapting to your own app — checklist

1. Define the CSS variables (or swap them for literal colors).
2. Add the CSS, including the **z-index raise** for any in-tour popups.
3. Edit `TUT_STEPS`: set each `target` to a selector that exists in your UI, and
   rewrite the copy.
4. In your editor component, wire the advancement `useEffect`s to your own state
   (node list, selection, "is generating" flag).
5. Put `data-tut="add"` on your add button and add the "How it works" button.
6. Render `<CanvasTutorial …/>` once near the root of your editor.

### Placement values reference
- `right` — to the right of the target (e.g. a left-rail button).
- `bl` — lower-left of the viewport, just above the target (good beside a
  bottom-centered prompt bar).
- `tl` — fixed top-left corner.
- `top` — above the target.
- `left-of` — just left of a separate `tipTarget` (spotlight stays on `target`).
- (default) — below the target.
```
