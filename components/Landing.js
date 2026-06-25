"use client";
import { useState } from "react";
import Link from "next/link";
import "./Landing.css";

const MODELS = [
  { name: "Seedance 2.0", type: "image-to-video", new: true, desc: "ByteDance's most advanced video generation model. Cinematic output with native audio, real-world physics, and director-level camera control." },
  { name: "Kling 3.0 Pro", type: "image-to-video", new: true, desc: "Top-tier image-to-video with cinematic visuals, fluid motion, and native audio generation, with custom element support." },
  { name: "Nano Banana Pro", type: "text-to-image", new: true, desc: "Google's state-of-the-art fast image generation and editing model — best in class at preserving identity." },
  { name: "Sora 2", type: "image-to-video", new: false, desc: "OpenAI's state-of-the-art video model — richly detailed dynamic clips with audio from natural language or images." },
  { name: "Veo 3.1", type: "image-to-video", new: true, desc: "The latest state-of-the-art video generation model from Google DeepMind. Native audio." },
  { name: "Flux 2 Pro", type: "text-to-image", new: false, desc: "Ultra-high-quality image generation for maximum detail, realism, and prompt accuracy." },
  { name: "GPT Image 2", type: "text-to-image", new: false, desc: "OpenAI's image model — extraordinary at text rendering and prompt adherence." },
  { name: "Kling Motion Control Pro", type: "video-to-video", new: false, desc: "Transfer movements from a reference video to any character image — ideal for complex dance moves." },
  { name: "Kling 2.6 Pro", type: "image-to-video", new: false, desc: "Top-tier image-to-video with cinematic visuals, fluid motion, and native audio generation." },
  { name: "Seedream 4.5", type: "text-to-image", new: false, desc: "ByteDance's unified image generation + editing architecture." },
  { name: "Topaz Video Upscale", type: "upscale", new: false, desc: "Professional-grade video upscaling — enhance your videos with high-quality 4K upscaling." },
  { name: "Wan 2.7", type: "image-to-video", new: false, desc: "AI video generation supporting stylized motion and creative scenes." },
];

const TOOLS = [
  { title: "Create Image", desc: "Generate AI images", href: "/image", icon: "image" },
  { title: "Create Video", desc: "Generate AI videos", href: "/video", icon: "video" },
  { title: "Create Influencer", desc: "Build a reusable AI persona", href: "/influencers", icon: "user" },
  { title: "Motion Control", desc: "Precise control of character motion", href: "/video?sub=motion", icon: "motion" },
  { title: "Face Swap", desc: "Swap faces while keeping scene intact", href: "/image", icon: "swap" },
  { title: "Edit Video", desc: "Advanced video editing", href: "/video?sub=edit", icon: "edit" },
];

const TIERS = [
  {
    name: "Builder",
    blurb: "Start creating AI images in minutes.",
    priceMonthly: 4.99, priceYearly: 2.99,
    credits: "500 credits per month",
    cta: "Start creating",
    badge: null,
  },
  {
    name: "Launch",
    blurb: "Train your own AI persona and create on autopilot.",
    priceMonthly: 12.99, priceYearly: 7.99,
    credits: "1,000 credits per month",
    cta: "Train my AI",
    badge: null,
  },
  {
    name: "Growth",
    blurb: "Unlock video, face swap, and the full studio.",
    priceMonthly: 24.99, priceYearly: 15.99,
    credits: "4,000 credits per month",
    cta: "Unlock video",
    badge: "MOST POPULAR",
    highlight: true,
  },
  {
    name: "Creator",
    blurb: "Every model unlocked. 4K, premium video, unlimited.",
    priceMonthly: 39.99, priceYearly: 23.99,
    credits: "6,000 credits per month",
    cta: "Get everything",
    badge: "BEST VALUE",
  },
];

const TIER_FEATURES = [
  "Influencer Training", "Image generation", "Video generation",
  "Motion Control", "Face Swap", "Image Upscale", "Video Upscale", "Claude MCP",
];

const UNLIMITED_MODELS = [
  "Flux 2 Pro", "Nano Banana Pro", "GPT Image 2", "Seedream 4.5",
  "Kling 2.6 Pro", "Kling 3.0 Pro", "Veo 3.1", "Sora 2",
  "Seedance 2.0", "Wan 2.7", "Topaz Upscale",
];

const FAQS = [
  { q: "How do credits work?", a: "Each generation costs credits based on model and quality. Image generations start at 1–3 credits; video starts around 6–12. Your monthly credits refresh on your billing date." },
  { q: "Is my subscription automatically renewed?", a: "Yes. You can cancel anytime from your account — you'll keep access through the end of the billing period." },
  { q: "How many images or videos can I generate?", a: "On the Creator plan, all premium video models are unlimited. On lower tiers you're bounded by your monthly credit pool." },
  { q: "How can I purchase extra credits?", a: "Top-up packs are available from the billing page once you're on any paid plan." },
  { q: "Can I change my subscription after purchase?", a: "Yes. Upgrade, downgrade, or switch between monthly and yearly billing at any time." },
];

function ToolIcon({ kind }) {
  const stroke = "currentColor";
  const sw = 1.6;
  switch (kind) {
    case "image": return <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw}><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" /></svg>;
    case "video": return <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw}><rect x="3" y="5" width="14" height="14" rx="2" /><path d="m17 9 4-2v10l-4-2z" /></svg>;
    case "user":  return <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw}><circle cx="12" cy="8" r="4" /><path d="M4 21c1.2-4 4.5-6 8-6s6.8 2 8 6" /></svg>;
    case "motion":return <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw}><circle cx="6" cy="6" r="2" /><circle cx="18" cy="18" r="2" /><path d="M7 7c4 0 4 10 8 10" /></svg>;
    case "swap":  return <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw}><path d="M3 8h13l-3-3M21 16H8l3 3" /></svg>;
    case "edit":  return <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw}><path d="M3 21v-4l11-11 4 4L7 21H3z" /><path d="m14 6 4 4" /></svg>;
    default: return null;
  }
}

export default function Landing() {
  const [promoOpen, setPromoOpen] = useState(true);
  const [billing, setBilling] = useState("yearly");
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <div className="lp-root">
      {promoOpen && (
        <div className="lp-promo">
          <span>Face Swap is live. <Link href="/image">Try it free →</Link></span>
          <button className="lp-promo-x" onClick={() => setPromoOpen(false)} aria-label="Dismiss">×</button>
        </div>
      )}

      <header className="lp-nav">
        <Link href="/" className="lp-brand">eromify</Link>
        <nav className="lp-nav-links">
          <Link href="#how-it-works">How it works</Link>
          <Link href="/mcp">Claude MCP</Link>
          <Link href="#pricing">Pricing</Link>
          <Link href="#faq">FAQ</Link>
        </nav>
        <div className="lp-nav-actions">
          <Link href="/app" className="lp-nav-login">Log in</Link>
          <Link href="/app" className="lp-pill">Sign up</Link>
        </div>
      </header>

      <section className="lp-hero">
        <div className="lp-hero-eyebrow">The Future of AI Influencers</div>
        <h1 className="lp-hero-h1">
          Create Your
          <br />AI Influencer
          <br /><em>Empire</em>
        </h1>
        <p className="lp-hero-sub">
          Build, customize and monetize stunning AI personas that look and sound like real influencers.
          Create authentic UGC ads that drive 3× higher conversion rates.
        </p>
        <div className="lp-hero-ctas">
          <Link href="/app" className="lp-pill lp-pill-lg">Create Your AI Persona</Link>
          <Link href="#how-it-works" className="lp-ghost">How It Works</Link>
        </div>
        <div className="lp-hero-proof">
          <div className="lp-proof-stack">
            <span className="lp-avatar lp-avatar-a" />
            <span className="lp-avatar lp-avatar-b" />
            <span className="lp-avatar lp-avatar-c" />
            <span className="lp-avatar lp-avatar-d" />
          </div>
          <div className="lp-proof-text">
            <div className="lp-proof-line">5,000+ creators already building</div>
            <div className="lp-proof-stars">★★★★★ <span>4.9/5 from 500+ reviews</span></div>
          </div>
        </div>
      </section>

      <section className="lp-mcp" id="how-it-works">
        <div className="lp-mcp-eyebrow">MCP CONNECTOR · GROWTH & CREATOR</div>
        <h2 className="lp-mcp-h2">
          Turn <em>Claude</em>
          <br />into your creative engine
        </h2>
        <p className="lp-mcp-sub">
          Connect Eromify to Claude and generate avatar images, videos, and full campaigns right from your conversations.
        </p>

        <div className="lp-chat">
          <div className="lp-chat-head">
            <span className="lp-chat-dot" /><span className="lp-chat-dot" /><span className="lp-chat-dot" />
            <span className="lp-chat-title">CLAUDE · EROMIFY CONNECTOR</span>
          </div>
          <div className="lp-chat-body">
            <div className="lp-bubble lp-bubble-you">
              Generate 8 IG-ready photos of <span className="lp-mention">@lily</span> for this week — vary the outfits, moods, and lighting. Mix indoor and outdoor. 4:5 portrait.
            </div>
            <div className="lp-bubble lp-bubble-ai">
              On it. Generating 8 portraits of Lily — mixing café, rooftop, and golden-hour outdoor scenes.
              <div className="lp-bubble-meta">8 IMAGES · 60 CREDITS · ~38S</div>
              <div className="lp-bubble-grid">
                {Array.from({ length: 8 }).map((_, i) => <span key={i} className={`lp-thumb lp-thumb-${(i % 4) + 1}`} />)}
              </div>
            </div>
          </div>
        </div>

        <div className="lp-mcp-steps">
          {[
            { n: "01", h: "Talk to your avatars by name", d: "Lily, Aria, Maya — Claude knows which influencer to use and never breaks character." },
            { n: "02", h: "Batch generate 12 at a time", d: "One prompt. One coffee. A week of content rendered while you focus on shipping." },
            { n: "03", h: "Spin up videos without leaving the chat", d: "Bring stills to life with Kling, Veo, and Sora — Claude routes the right model automatically." },
          ].map((s) => (
            <div className="lp-step" key={s.n}>
              <div className="lp-step-n">{s.n}</div>
              <div className="lp-step-h">{s.h}</div>
              <div className="lp-step-d">{s.d}</div>
            </div>
          ))}
        </div>

        <div className="lp-mcp-ctas">
          <Link href="/mcp" className="lp-pill">Connect Claude</Link>
          <Link href="/mcp" className="lp-ghost">See how it works</Link>
        </div>
        <div className="lp-mcp-note">Available on Growth and Creator plans · 5-minute setup · Works with Claude Desktop, claude.ai & Cursor</div>
      </section>

      <section className="lp-models">
        <div className="lp-section-head">
          <h2>Featured Models</h2>
          <p>Generate images, videos, edits and more with the latest AI models.</p>
        </div>
        <div className="lp-model-grid">
          {MODELS.map((m) => (
            <div className="lp-model-card" key={m.name}>
              <div className="lp-model-thumb" />
              {m.new && <span className="lp-model-new">NEW</span>}
              <div className="lp-model-body">
                <div className="lp-model-top">
                  <span className="lp-model-name">{m.name}</span>
                  <span className="lp-model-type">{m.type}</span>
                </div>
                <p className="lp-model-desc">{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="lp-models-cta">
          <Link href="/app" className="lp-pill">Explore All Tools</Link>
        </div>
      </section>

      <section className="lp-tools">
        <div className="lp-section-head">
          <div className="lp-tools-eyebrow">WHAT WILL YOU CREATE TODAY?</div>
          <h2>Create authentic images and videos with natural texture and easy style</h2>
          <Link href="/app" className="lp-link">Explore all tools →</Link>
        </div>
        <div className="lp-tool-grid">
          {TOOLS.map((t) => (
            <Link href={t.href} key={t.title} className="lp-tool-card">
              <div className="lp-tool-icon"><ToolIcon kind={t.icon} /></div>
              <div>
                <div className="lp-tool-title">{t.title}</div>
                <div className="lp-tool-desc">{t.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="lp-pricing" id="pricing">
        <div className="lp-section-head">
          <div className="lp-tools-eyebrow">PRICING</div>
          <h2>Pay as you grow</h2>
          <p>Credits that scale with your business. No hidden fees.</p>
        </div>

        <div className="lp-bill-seg">
          <button className={billing === "monthly" ? "is-active" : ""} onClick={() => setBilling("monthly")}>Monthly</button>
          <button className={billing === "yearly" ? "is-active" : ""} onClick={() => setBilling("yearly")}>Yearly <span className="lp-save">−40%</span></button>
        </div>

        <div className="lp-tier-grid">
          {TIERS.map((t) => (
            <div className={`lp-tier ${t.highlight ? "is-highlight" : ""}`} key={t.name}>
              {t.badge && <div className="lp-tier-badge">{t.badge}</div>}
              <h3>{t.name}</h3>
              <p className="lp-tier-blurb">{t.blurb}</p>
              <div className="lp-tier-price">
                <span className="lp-price-d">${billing === "yearly" ? t.priceYearly : t.priceMonthly}</span>
                <span className="lp-price-per">/mo</span>
              </div>
              <div className="lp-tier-bill">
                {billing === "yearly" ? "Billed for 12 months" : "Billed monthly"}
              </div>
              <Link href="/app" className="lp-pill lp-pill-block">{t.cta}</Link>
              <div className="lp-tier-credits">✦ {t.credits}</div>
              <ul className="lp-tier-feats">
                {TIER_FEATURES.map((f) => (
                  <li key={f}><span className="lp-check">✓</span> {f}</li>
                ))}
              </ul>
              <div className="lp-tier-sep">UNLIMITED ACCESS</div>
              <ul className="lp-tier-feats lp-tier-feats-models">
                {UNLIMITED_MODELS.map((m) => <li key={m}><span className="lp-check">✓</span> {m}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="lp-faq" id="faq">
        <h2>Frequently Asked Questions</h2>
        <div className="lp-faq-list">
          {FAQS.map((f, i) => (
            <div className={`lp-faq-item ${openFaq === i ? "is-open" : ""}`} key={f.q}>
              <button className="lp-faq-q" onClick={() => setOpenFaq(openFaq === i ? -1 : i)}>
                <span>{f.q}</span>
                <span className="lp-faq-caret">{openFaq === i ? "−" : "+"}</span>
              </button>
              {openFaq === i && <div className="lp-faq-a">{f.a}</div>}
            </div>
          ))}
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-footer-eyebrow">EXPLORE MORE AI FEATURES</div>
        <div className="lp-footer-grid">
          {[
            "Influencer Training", "Face Swap", "Flux 2 Pro", "Flux 2 Max", "Nano Banana Pro",
            "GPT Image 2", "GPT Image 1", "Seedream 4.5", "Seedance 2.0",
            "Kling 2.6 Pro", "Kling 3.0 Pro", "Kling 2.5 Turbo", "Kling Motion Control",
            "Sora 2", "Veo 3.1", "Veo 3.1 Fast", "Wan 2.7",
            "MiniMax Hailuo 2.3", "PixVerse v6", "LTX Video",
            "Topaz Image Upscale", "Topaz Video Upscale", "Clarity Upscaler",
          ].map((f) => (
            <Link href="/app" key={f}>{f}</Link>
          ))}
        </div>
        <div className="lp-footer-bottom">
          <div className="lp-footer-brand">© 2026 Eromify. All rights reserved.</div>
          <div className="lp-footer-legal">
            <Link href="/app">Contact</Link>
            <Link href="/app">Terms of Service</Link>
            <Link href="/app">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
