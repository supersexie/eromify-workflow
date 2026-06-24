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
  { q: "What are Genmax credits and how do they work?", a: "Every generation — an image, a video clip, a voiceover, or a script — uses credits from your monthly balance. Heavier jobs (longer video, premium models) cost more. Credits refresh at the start of each billing cycle." },
  { q: "Can I monetize content made with Genmax?", a: "Yes. Everything you generate on a paid plan is yours to use commercially — post it, sell it, and monetize it on any platform." },
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
            <b>Genmax</b>
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
          <div className={s.ctaKicker}>Genmax</div>
          <h2 className={s.h2}>Launch Your Channel Today!</h2>
          <p className={s.lead}>Join thousands of creators who are already making viral videos with Genmax.</p>
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
              <b>Genmax</b>
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
        <div className={s.footBar}>Genmax. All rights reserved. © 2026</div>
      </footer>
    </div>
  );
}
