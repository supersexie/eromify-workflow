"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";

const CLERK_ENABLED = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

const Arrow = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const Check = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

// ─── content ────────────────────────────────────────────────────────────────
const FEATURES = [
  { h: "Train your persona", p: "Build a custom AI influencer once with the guided Influencer Builder — a username and a look is all it takes. Magic Mint keeps their face and identity locked across every image and video after that." },
  { h: "Generate images and video", p: "Text-to-image, image-to-video, and editing, using Flux 2, Nano Banana Pro, Seedream 4.5, GPT Image, Kling, Veo, LTX, Wan, and Hailuo." },
  { h: "Motion control and face swap", p: "Transfer movement from a reference video onto your character, swap faces, and upscale stills or footage without leaving the studio." },
  { h: "Generate from inside Claude", p: "The Magic Mint MCP connector lets you generate images and videos directly in a Claude, Cursor, or Hermes conversation." },
];

const MODELS = ["Flux 2 Pro", "Flux 2 Max", "Nano Banana Pro", "Seedream 4.5", "GPT Image 1", "GPT Image 2", "Kling v2", "Veo", "LTX Video", "Wan", "Hailuo", "MiniMax"];

const STEPS = [
  { h: "Build your influencer", p: "Use the guided Influencer Builder — pick a vibe, dial in the look, generate a few options, and pick a favorite. No prompt-writing, no AI slop." },
  { h: "Generate on the Canvas", p: "Put them in any scene, outfit, or lighting. Generate stills, then bring them to life as video. Chain nodes together for multi-step pipelines." },
  { h: "Publish anywhere", p: "Download ready-to-post images and video, or generate straight from Claude with the MCP connector while you do something else." },
];

const DIFFS = [
  { h: "Every model, one subscription", p: "Flux, Nano Banana, Seedream, Kling, Veo, and more, in one place. Most platforms lock you into a single model family." },
  { h: "A guided builder, not a blank prompt", p: "Beginners pick a vibe and appearance from curated options instead of wrestling with prompt engineering to avoid a generic AI look." },
  { h: "Consistency across every generation", p: "The same face holds across hundreds of generations — the part that breaks on most other tools." },
  { h: "It plugs into Claude", p: "The MCP connector makes Magic Mint usable from inside a conversation — describe the week's content, get it rendered." },
];

// monthly = full monthly price; annual = effective monthly price when billed yearly.
// Kept in sync with app/pricing/page.js.
const PLANS = [
  { name: "Starter", desc: "For casual creators just getting started.", monthly: 29, annual: 12 },
  { name: "Creator", desc: "Best for creators serious about growth.", monthly: 49, annual: 19, popular: true,
    features: ["400 credits/mo", "Premium models", "Claude MCP connector"] },
  { name: "Studio", desc: "For pros who want the best tools, no limits.", monthly: 99, annual: 49,
    features: ["1,000 credits/mo", "1080p & Pro video", "Priority queue"] },
];
PLANS[0].features = ["200 credits/mo", "Core AI models", "Node-based canvas"];

const FAQS = [
  { q: "What is Magic Mint?", a: "Magic Mint is an all-in-one AI studio for building, customizing, and monetizing AI influencers. It puts leading image and video models in one place, keeps a trained persona consistent across every generation, and turns that into content you can publish." },
  { q: "Do I need to write prompts?", a: "No. The Influencer Builder walks you through curated vibes and appearance options and composes the prompt for you. You can still write freeform prompts anywhere else in the app if you want full control." },
  { q: "What AI models are included?", a: "Flux 2 Pro/Max, Nano Banana Pro, Seedream 4.5, GPT Image 1/2 for images; Kling v2, Veo, LTX Video, Wan, Hailuo, and MiniMax for video. New models are added as they ship." },
  { q: "Can I use Magic Mint from Claude or Cursor?", a: "Yes. The MCP connector lets you generate images and videos directly from any MCP-compatible tool — paste the connector URL and start prompting." },
  { q: "Is there a free plan?", a: "You can sign up and explore the Canvas for free. Generating AI media requires a paid plan to cover model costs — see full pricing for details." },
];

export default function LandingPage() {
  const signInHref = CLERK_ENABLED ? "/sign-in" : "/app";
  const signUpHref = CLERK_ENABLED ? "/sign-up" : "/app";
  const faqRef = useRef(null);

  useEffect(() => {
    const faq = faqRef.current;
    if (!faq) return;
    const handler = (e) => {
      const btn = e.target.closest(".lp-qa-q");
      if (!btn) return;
      const item = btn.closest(".lp-qa");
      const isOpen = item.classList.contains("is-open");
      faq.querySelectorAll(".lp-qa").forEach((el) => el.classList.remove("is-open"));
      if (!isOpen) item.classList.add("is-open");
    };
    faq.addEventListener("click", handler);
    return () => faq.removeEventListener("click", handler);
  }, []);

  // globals.css locks body overflow for the canvas editor — release it here so this page scrolls.
  useEffect(() => {
    const b = document.body, h = document.documentElement;
    const pB = b.style.overflow, pBH = b.style.height, pH = h.style.height;
    b.style.overflow = "auto"; b.style.height = "auto"; h.style.height = "auto";
    return () => { b.style.overflow = pB; b.style.height = pBH; h.style.height = pH; };
  }, []);

  return (
    <div className="lp-root">
      {/* ── HEADER ── */}
      <header className="lp-header">
        <Link href="/" className="lp-brand">
          <div className="lp-logo">m</div>
          <span className="lp-brand-name">Magic Mint</span>
        </Link>
        <nav className="lp-nav-links">
          <a href="#features">Features</a>
          <a href="#models">Models</a>
          <a href="#pricing">Pricing</a>
          <a href="#mcp">Claude MCP</a>
        </nav>
        <div className="lp-nav-right">
          <Link href={signInHref} className="lp-signin">Sign in</Link>
          <Link href={signUpHref} className="lp-btn">Start free <Arrow /></Link>
        </div>
      </header>

      <div className="lp-page">

        {/* ── HERO ── */}
        <div className="lp-hero">
          <div className="lp-eyebrow"><span className="lp-eyebrow-dot" />AI Influencer Studio</div>
          <h1 className="lp-h1">Build AI Influencers That Go Viral</h1>
          <p className="lp-lede">A guided studio for building, customizing, and monetizing AI influencers — no prompt-writing required, no generic AI-slop look.</p>
          <div style={{ display: "flex", gap: ".9rem", flexWrap: "wrap", justifyContent: "center" }}>
            <Link href={signUpHref} className="lp-btn lp-btn-lg">Start Creating Free <Arrow /></Link>
            <Link href="/app" className="lp-btn lp-btn-lg lp-btn-ghost">Open Canvas <Arrow /></Link>
          </div>
          <p className="lp-proof">Loved by AI creators · No credit card required</p>

          {/* Stylized canvas mock — not a screenshot, an illustration of the node graph */}
          <div className="lp-hero-mock">
            <div className="lp-hero-mock-grid" />
            <div className="lp-hero-edge" style={{ left: "18%", top: "36%", width: "16%", transform: "rotate(6deg)" }} />
            <div className="lp-hero-edge" style={{ left: "34%", top: "42%", width: "14%", transform: "rotate(-8deg)" }} />
            <div className="lp-hero-edge" style={{ left: "56%", top: "34%", width: "16%", transform: "rotate(4deg)" }} />
            <div className="lp-hero-edge" style={{ left: "72%", top: "44%", width: "12%", transform: "rotate(-10deg)" }} />
            <div className="lp-hero-node" style={{ left: "6%", top: "28%" }}><span className="lp-hero-node-dot" style={{ background: "#60a5fa" }} />Influencer</div>
            <div className="lp-hero-node" style={{ left: "30%", top: "58%" }}><span className="lp-hero-node-dot" style={{ background: "#34d399" }} />Image</div>
            <div className="lp-hero-node" style={{ left: "52%", top: "22%" }}><span className="lp-hero-node-dot" style={{ background: "#f472b6" }} />Video</div>
            <div className="lp-hero-node" style={{ left: "70%", top: "56%" }}><span className="lp-hero-node-dot" style={{ background: "#facc15" }} />Publish</div>
          </div>
        </div>

        {/* ── WHAT IT DOES ── */}
        <section className="lp-section" id="features">
          <div className="lp-eyebrow"><span className="lp-eyebrow-dot" />What it does</div>
          <h2 className="lp-h2">Everything you need to run an AI influencer</h2>
          <p className="lp-lead">Running an AI influencer normally means stitching together five tools. Magic Mint collapses that into one workflow.</p>
          <div className="lp-grid">
            {FEATURES.map((f) => (
              <div key={f.h} className="lp-card">
                <h3>{f.h}</h3>
                <p>{f.p}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── MODELS ── */}
        <section className="lp-section" id="models">
          <div className="lp-eyebrow"><span className="lp-eyebrow-dot" />Models</div>
          <h2 className="lp-h2">Every leading model, one subscription</h2>
          <p className="lp-lead">No separate accounts, no local setup, no GPU.</p>
          <div className="lp-pills">
            {MODELS.map((m) => <span key={m} className="lp-pill">{m}</span>)}
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="lp-section">
          <div className="lp-eyebrow"><span className="lp-eyebrow-dot" />How it works</div>
          <h2 className="lp-h2">Three steps, start to finish</h2>
          <div className="lp-steps">
            {STEPS.map((s, i) => (
              <div key={s.h} className="lp-step">
                <span className="lp-step-n">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{s.h}</h3>
                  <p>{s.p}</p>
                </div>
              </div>
            ))}
          </div>
          <Link href={signUpHref} className="lp-btn" style={{ alignSelf: "flex-start" }}>Create Your AI Persona <Arrow /></Link>
        </section>

        {/* ── DIFFERENTIATORS ── */}
        <section className="lp-section">
          <div className="lp-eyebrow"><span className="lp-eyebrow-dot" />Why Magic Mint</div>
          <h2 className="lp-h2">What makes it different</h2>
          <div className="lp-grid">
            {DIFFS.map((d) => (
              <div key={d.h} className="lp-card">
                <h3>{d.h}</h3>
                <p>{d.p}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── MCP ── */}
        <section className="lp-section" id="mcp">
          <div className="lp-eyebrow"><span className="lp-eyebrow-dot" />Claude MCP</div>
          <h2 className="lp-h2">Generate from Claude, Cursor & more</h2>
          <p className="lp-lead">Connect Magic Mint to any MCP-compatible AI tool and generate images and videos without leaving your workflow.</p>
          <Link href="/mcp" className="lp-btn lp-btn-ghost" style={{ alignSelf: "flex-start" }}>See MCP setup <Arrow /></Link>
        </section>

        {/* ── PRICING TEASER ── */}
        <section className="lp-section lp-center" id="pricing">
          <div className="lp-eyebrow"><span className="lp-eyebrow-dot" />Pricing</div>
          <h2 className="lp-h2">Plans that scale with you</h2>
          <p className="lp-lead">Monthly shown below; billing annually brings the effective rate down. See full pricing for the complete breakdown.</p>
          <div className="lp-price-row">
            {PLANS.map((p) => (
              <div key={p.name} className={`lp-price ${p.popular ? "is-popular" : ""}`}>
                {p.popular && <span className="lp-price-badge">Most popular</span>}
                <span className="lp-price-name">{p.name}</span>
                <span className="lp-price-desc">{p.desc}</span>
                <span className="lp-price-amt">${p.annual}<span>/mo billed annually</span></span>
                <span className="lp-price-billed">or ${p.monthly}/mo billed monthly</span>
                <Link href={signUpHref} className="lp-btn">Get started <Arrow /></Link>
                <ul className="lp-price-feats">
                  {p.features.map((f) => <li key={f} className="lp-feat"><Check />{f}</li>)}
                </ul>
              </div>
            ))}
          </div>
          <Link href="/pricing" className="lp-btn lp-btn-ghost">See full pricing <Arrow /></Link>
        </section>

        {/* ── FAQ ── */}
        <section className="lp-section">
          <div className="lp-eyebrow"><span className="lp-eyebrow-dot" />FAQ</div>
          <h2 className="lp-h2">Common questions</h2>
          <div className="lp-faq" ref={faqRef}>
            {FAQS.map((f) => (
              <div key={f.q} className="lp-qa">
                <button className="lp-qa-q">
                  {f.q}
                  <svg className="lp-qa-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 9l6 6 6-6" /></svg>
                </button>
                <div className="lp-qa-a">{f.a}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CLOSING ── */}
        <div className="lp-closing">
          <div className="lp-eyebrow"><span className="lp-eyebrow-dot" />Magic Mint</div>
          <h2 className="lp-h2">Launch your AI influencer today</h2>
          <p className="lp-lead">Join creators already building with Magic Mint.</p>
          <div style={{ display: "flex", gap: ".9rem", flexWrap: "wrap", justifyContent: "center" }}>
            <Link href={signUpHref} className="lp-btn lp-btn-lg">Start for free <Arrow /></Link>
            <Link href="/pricing" className="lp-btn lp-btn-lg lp-btn-ghost">See pricing <Arrow /></Link>
          </div>
        </div>

      </div>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="lp-foot-top">
          <div>
            <Link href="/" className="lp-brand" style={{ display: "inline-flex" }}>
              <div className="lp-logo">m</div>
              <span className="lp-brand-name">Magic Mint</span>
            </Link>
            <p className="lp-foot-blurb">The node-based AI creative canvas. Generate and connect images, video, audio, and text for your AI influencers.</p>
          </div>
          <div className="lp-foot-col">
            <h4>Product</h4>
            <a href="#features">Features</a>
            <a href="#models">Models</a>
            <Link href="/pricing">Pricing</Link>
            <a href="#mcp">Claude MCP</a>
          </div>
          <div className="lp-foot-col">
            <h4>App</h4>
            <Link href="/app">Open Canvas</Link>
            <Link href="/image">Image Studio</Link>
            <Link href="/video">Video Studio</Link>
            <Link href="/influencers">Influencers</Link>
          </div>
        </div>
        <div className="lp-foot-bar">Magic Mint · All rights reserved · © 2026</div>
      </footer>
    </div>
  );
}
