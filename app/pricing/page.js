"use client";
import { useState, useEffect } from "react";
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

// monthly = full monthly price; annual = effective monthly price when billed yearly.
// Kept in sync with the pricing teaser on app/page.js.
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
      "Romy AI assistant",
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
  { q: "What are Magic Mint credits and how do they work?", a: "Every generation — an image, a video clip, a voiceover, or a script — uses credits from your monthly balance. Heavier jobs (longer video, premium models) cost more. Credits refresh at the start of each billing cycle." },
  { q: "Can I monetize content made with Magic Mint?", a: "Yes. Everything you generate on a paid plan is yours to use commercially — post it, sell it, and monetize it on any platform." },
  { q: "Can I use my own media?", a: "Absolutely. Upload your own images to seed image-to-image and image-to-video generations, or bring your own scripts for voiceovers." },
  { q: "Can I switch or cancel anytime?", a: "Yes — upgrade, downgrade, or cancel from your account at any time. There are no cancellation fees, and annual plans are prorated." },
  { q: "Do you offer a free plan?", a: "You can sign up free and explore the canvas. Generating real AI media requires a paid plan so we can cover model costs." },
];

export default function Pricing() {
  const [annual, setAnnual] = useState(true);

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

  useEffect(() => {
    const faq = document.querySelector(".lp-faq[data-pricing-faq]");
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

  const signInHref = CLERK_ENABLED ? "/sign-in" : "/app";
  const signUpHref = CLERK_ENABLED ? "/sign-up" : "/app";

  return (
    <div className="lp-root">
      {/* HEADER */}
      <header className="lp-header">
        <Link href="/" className="lp-brand">
          <div className="lp-logo">m</div>
          <span className="lp-brand-name">Magic Mint</span>
        </Link>
        <nav className="lp-nav-links">
          <Link href="/#features">Features</Link>
          <Link href="/#models">Models</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/#mcp">Claude MCP</Link>
        </nav>
        <div className="lp-nav-right">
          <Link href={signInHref} className="lp-signin">Sign in</Link>
          <Link href={signUpHref} className="lp-btn">Start free <Arrow /></Link>
        </div>
      </header>

      <div className="lp-page">

        {/* PRICING HERO */}
        <div className="lp-hero">
          <div className="lp-eyebrow"><span className="lp-eyebrow-dot" />Pricing</div>
          <h1 className="lp-h1">A plan for every creator</h1>
          <p className="lp-lede">From your first upload to millions of views, we&apos;ve got you covered. Cancel anytime, no questions asked.</p>

          <div className="lp-billing-toggle">
            <button className={!annual ? "is-active" : ""} onClick={() => setAnnual(false)}>Monthly</button>
            <button className={annual ? "is-active" : ""} onClick={() => setAnnual(true)}>Annual</button>
          </div>

          <div className="lp-price-row">
            {PLANS.map((p) => (
              <div key={p.name} className={`lp-price ${p.popular ? "is-popular" : ""}`}>
                {p.popular && <span className="lp-price-badge">Most popular</span>}
                <span className="lp-price-name">{p.name}</span>
                <span className="lp-price-desc">{p.desc}</span>
                <span className="lp-price-amt">${annual ? p.annual : p.monthly}<span>/mo</span></span>
                <span className="lp-price-billed">{annual ? "billed annually" : "billed monthly"}</span>
                <Link href={signUpHref} className="lp-btn">Get started <Arrow /></Link>
                <ul className="lp-price-feats">
                  {p.features.map((f) => <li key={f} className="lp-feat"><Check />{f}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* PRICING FAQ */}
        <section className="lp-section lp-center">
          <div className="lp-eyebrow"><span className="lp-eyebrow-dot" />FAQs</div>
          <h2 className="lp-h2">Pricing questions</h2>
          <p className="lp-lead">Everything you need to know about plans and credits.</p>
          <div className="lp-faq" data-pricing-faq>
            {PRICE_FAQS.map((f) => (
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

        {/* CTA */}
        <div className="lp-closing">
          <div className="lp-eyebrow"><span className="lp-eyebrow-dot" />Magic Mint</div>
          <h2 className="lp-h2">Launch your channel today</h2>
          <p className="lp-lead">Join creators already making viral content with Magic Mint.</p>
          <Link href={signUpHref} className="lp-btn lp-btn-lg">Start creating <Arrow /></Link>
        </div>

      </div>

      {/* FOOTER */}
      <footer className="lp-footer">
        <div className="lp-foot-top">
          <div>
            <Link href="/" className="lp-brand" style={{ display: "inline-flex" }}>
              <div className="lp-logo">m</div>
              <span className="lp-brand-name">Magic Mint</span>
            </Link>
            <p className="lp-foot-blurb">The node-based AI creative canvas. Generate and connect images, video, audio, and text on one canvas.</p>
          </div>
          <div className="lp-foot-col">
            <h4>Product</h4>
            <Link href="/#features">Features</Link>
            <Link href="/#models">Models</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/app">Library</Link>
          </div>
          <div className="lp-foot-col">
            <h4>Info</h4>
            <Link href="/#mcp">Claude MCP</Link>
            <Link href="/app">Open App</Link>
          </div>
        </div>
        <div className="lp-foot-bar">Magic Mint · All rights reserved · © 2026</div>
      </footer>
    </div>
  );
}
