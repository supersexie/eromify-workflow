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
// Action steps hide the Next button (you advance by doing the thing); modal
// steps show it.

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
    title: "Write a prompt",
    body: "This is the prompt bar for the selected node. Describe what you want to create — tip: type @ to summon an influencer.",
  },
  {
    mode: "spotlight",
    target: ".pb-enhance",
    placement: "top",
    optional: true,
    title: "Enhance your prompt (optional)",
    body: "Tap Enhance to let AI rewrite your prompt in Eromify's house style for richer results. Optional — skip it anytime with Next.",
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
    mode: "modal",
    title: "You're all set 🎉",
    body: "Drag a node's side handles onto empty space to chain steps. Use the left rail to fit the view, open your Library, or undo. Re-open this tour anytime from the ? button.",
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

export default function CanvasTutorial({ step, total, onNext, onBack, onSkip }) {
  const active = step != null && step >= 0 && step < TUT_STEPS.length;
  const spec = active ? TUT_STEPS[step] : null;
  const rect = useTargetRect(spec?.mode === "spotlight" ? spec.target : null, active);

  // Esc closes the tour.
  useEffect(() => {
    if (!active) return;
    const onKey = (e) => { if (e.key === "Escape") onSkip(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, onSkip]);

  if (!active) return null;
  const isModal = spec.mode === "modal";
  const pad = 8;

  // Tooltip position for spotlight steps.
  let tipStyle = {};
  if (!isModal && rect) {
    if (spec.placement === "right") {
      tipStyle = { left: rect.right + 16, top: rect.top };
    } else if (spec.placement === "bl") {
      // Lower-left, just above the prompt bar — used for the prompt step so the
      // card sits beside the chatbox and clear of the @influencer dropdown,
      // which opens on the right.
      tipStyle = { left: 24, bottom: window.innerHeight - rect.top + 16 };
    } else if (spec.placement === "tl") {
      // Top-left of the viewport — used for the model/aspect step. The prompt
      // bar is centered, so its chip dropdowns open upward from the middle;
      // the top-left corner stays clear of them.
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
          {/* When the target element isn't on screen yet (e.g. the prompt bar
              before a node is selected), fall back to a centered card so the
              tour is never a blank dim screen. */}
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
                  ? <button className="tut-next" onClick={onNext}>Next</button>
                  : <span className="tut-hint">Do the step to continue →</span>}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
