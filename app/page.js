"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";

const CLERK_ENABLED = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

// ─── icons ──────────────────────────────────────────────────────────────────
const Arrow = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const Check = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

const StarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1.5">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

// ─── marquee tiles ───────────────────────────────────────────────────────────
const TILES = [
  { emoji: "🌸", label: "Sakura", views: "4.2M", type: "portrait", color: "#3b82f6" },
  { emoji: "🌊", label: "Luna", views: "11M", type: "landscape", color: "#3b82f6" },
  { emoji: "🔥", label: "Nova", views: "2.8M", type: "portrait", color: "#3b82f6" },
  { emoji: "💜", label: "Mila", views: "7.1M", type: "portrait", color: "#3b82f6" },
  { emoji: "🌿", label: "Eden", views: "3.5M", type: "landscape", color: "#3b82f6" },
  { emoji: "⚡", label: "Zara", views: "9.4M", type: "portrait", color: "#3b82f6" },
  { emoji: "🌙", label: "Aria", views: "5.6M", type: "portrait", color: "#3b82f6" },
  { emoji: "🎀", label: "Bella", views: "6.2M", type: "landscape", color: "#3b82f6" },
];
const MARQUEE_TILES = [...TILES, ...TILES];

// ─── tools ───────────────────────────────────────────────────────────────────
const TOOLS = [
  {
    icon: "✦",
    title: "Magic Canvas",
    tag: "Workflow",
    desc: "Connect nodes together to build multi-step AI pipelines. Generate, edit, and chain images and videos on one infinite canvas.",
    gradient: "#2563eb",
  },
  {
    icon: "🖼",
    title: "Image Studio",
    tag: "AI Images",
    desc: "Generate hyper-realistic images with Flux, Seedream, Nano Banana, and GPT Image. Edit, upscale, and face-swap in seconds.",
    gradient: "#2563eb",
  },
  {
    icon: "🎬",
    title: "Video Studio",
    tag: "AI Video",
    desc: "Turn prompts or images into cinematic short clips with Kling v2, Veo, LTX, Wan, Hailuo, and more. Motion Control included.",
    gradient: "#2563eb",
  },
  {
    icon: "✦",
    title: "AI Influencers",
    tag: "Personas",
    desc: "Build reusable AI characters with @handles. Summon them anywhere with @mention and lock their identity across every generation.",
    gradient: "#2563eb",
  },
];

// ─── features ────────────────────────────────────────────────────────────────
const FEATS = [
  {
    title: "Node-based canvas",
    body: "Connect image nodes to video nodes to audio nodes. Build complex multi-step workflows with a visual drag-and-drop editor.",
  },
  {
    title: "Romy AI assistant",
    body: "Describe what you want in plain English. Romy sees your canvas, critiques your outputs, coaches your prompts, and generates on demand.",
  },
  {
    title: "Claude MCP connector",
    body: "Generate images and videos directly from Claude, Cursor, or any MCP-compatible AI tool — no switching apps.",
  },
  {
    title: "One-click enhance",
    body: "The Enhance button rewrites your rough prompt into a production-ready shot description using Magic Mint's house style.",
  },
];

// ─── FAQ ─────────────────────────────────────────────────────────────────────
const FAQS = [
  { q: "What is Magic Mint?", a: "Magic Mint is an AI influencer content platform. You create AI personas (@handles) and use our canvas, image studio, and video studio to generate content for them at scale." },
  { q: "What AI models do you use?", a: "We support Flux, Seedream, Nano Banana, GPT Image (images), and Kling v2, Veo, LTX, Wan, Hailuo, MiniMax (video). New models are added as they release." },
  { q: "What is the Magic Canvas?", a: "The Magic Canvas is a node-based workflow editor. You drag image, video, text, and audio nodes onto the canvas, connect them, and run entire creative pipelines in one place." },
  { q: "Can I use Magic Mint from Claude or Cursor?", a: "Yes. The MCP connector lets you generate images and videos directly from any MCP-compatible tool — just paste the connector URL and start prompting." },
  { q: "Do you offer a free plan?", a: "You can sign up and explore the canvas for free. Generating AI media requires a paid plan to cover model costs." },
];

// ─── styles ──────────────────────────────────────────────────────────────────
const css = `
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
  @font-face {
    font-family: "SF Pro Display"; font-style: normal; font-weight: 900;
    font-display: swap; src: url("/fonts/SF-Pro-Display-Heavy.woff2") format("woff2");
  }

  .mm-page { background:#000; color:#fff; min-height:100vh; font-family:"SF Pro Display","SF Pro Text",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; letter-spacing:-0.01em; -webkit-font-smoothing:antialiased; overflow-x:hidden; }
  .mm-page * { box-sizing:border-box; }

  /* nav */
  .mm-nav-wrap { position:fixed; top:0; left:0; right:0; z-index:50; padding:14px 24px 0; }
  .mm-nav { max-width:1240px; margin:0 auto; height:62px; background:rgba(10,10,10,0.72); backdrop-filter:blur(20px) saturate(180%); -webkit-backdrop-filter:blur(20px) saturate(180%); border:1px solid rgba(255,255,255,.14); border-radius:18px; box-shadow:0 6px 30px rgba(0,0,0,.4); display:flex; align-items:center; gap:20px; padding:0 18px; }
  .mm-brand { display:flex; align-items:center; gap:10px; text-decoration:none; color:inherit; }
  .mm-logo { width:34px; height:34px; border-radius:9px; background:#2563eb; display:grid; place-items:center; color:#fff; font-weight:900; font-size:17px; }
  .mm-brand-name { font-size:18px; font-weight:800; color:#fff; }
  .mm-nav-links { display:flex; gap:28px; margin:0 auto; }
  .mm-nav-links a { color:#9a9a9a; text-decoration:none; font-size:15px; font-weight:500; transition:color .15s; }
  .mm-nav-links a:hover { color:#fff; }
  .mm-nav-right { display:flex; align-items:center; gap:14px; flex-shrink:0; }
  .mm-sign-in { color:#9a9a9a; text-decoration:none; font-size:15px; font-weight:500; }
  .mm-btn { display:inline-flex; align-items:center; gap:8px; font-weight:700; font-size:15px; border:none; cursor:pointer; text-decoration:none; padding:10px 20px; border-radius:999px; background:#2563eb; color:#fff; transition:background .15s, transform .12s; white-space:nowrap; }
  .mm-btn:hover { background:#1d4ed8; transform:translateY(-1px); }
  .mm-btn svg { transition:transform .12s; }
  .mm-btn:hover svg { transform:translateX(3px); }
  .mm-btn-lg { padding:15px 32px; font-size:17px; border-radius:14px; }
  .mm-btn-ghost { background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.16); color:#fff; }
  .mm-btn-ghost:hover { background:rgba(255,255,255,.14); }
  .mm-btn-white { background:#fff; color:#000; }
  .mm-btn-white:hover { background:#e5e5e5; }

  /* badge */
  .mm-badge { display:inline-flex; align-items:center; gap:8px; padding:8px 16px; border-radius:999px; font-size:13px; font-weight:700; letter-spacing:.04em; text-transform:uppercase; background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.18); color:#fff; }
  .mm-badge-dot { width:6px; height:6px; border-radius:50%; background:#3b82f6; box-shadow:0 0 6px #3b82f6; }

  /* hero */
  .mm-hero { position:relative; text-align:center; padding:150px 24px 60px; overflow:hidden; }
  .mm-hero-glow { position:absolute; inset:0; pointer-events:none; background:radial-gradient(ellipse 900px 500px at 50% 10%, rgba(37,99,235,.22) 0%, transparent 70%); }
  .mm-hero-glow2 { position:absolute; inset:0; pointer-events:none; background:radial-gradient(ellipse 600px 400px at 80% 60%, rgba(37,99,235,.1) 0%, transparent 65%); }
  .mm-h1 { font-size:clamp(40px,5.5vw,72px); line-height:1.08; letter-spacing:-0.02em; font-weight:700; margin:24px auto 0; max-width:1100px; color:#fff; }
  .mm-grad { color:#fff; }
  .mm-sub { color:#9a9a9a; font-size:clamp(16px,2vw,20px); max-width:580px; margin:22px auto 0; line-height:1.6; }
  .mm-hero-cta { margin-top:38px; display:flex; justify-content:center; align-items:center; gap:16px; flex-wrap:wrap; }
  .mm-proof { margin-top:28px; display:flex; align-items:center; justify-content:center; gap:12px; color:#7a7a7a; font-size:14px; font-weight:500; }
  .mm-proof-stars { display:flex; gap:3px; }
  .mm-proof-dot { width:3px; height:3px; border-radius:50%; background:#4a4a4a; }

  /* marquee */
  .mm-marquee { margin-top:20px; width:100%; overflow:hidden; -webkit-mask:linear-gradient(90deg,transparent,#000 7%,#000 93%,transparent); mask:linear-gradient(90deg,transparent,#000 7%,#000 93%,transparent); }
  .mm-marquee-track { display:flex; gap:14px; width:max-content; padding-top:44px; animation:mmmarquee 70s linear infinite; }
  .mm-marquee:hover .mm-marquee-track { animation-play-state:paused; }
  @keyframes mmmarquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
  .mm-tile-wrap { position:relative; flex:0 0 auto; height:280px; }
  .mm-tile { width:100%; height:100%; border-radius:16px; overflow:hidden; transform:translateZ(0); position:relative; border:1px solid rgba(255,255,255,.1); }
  .mm-tile-portrait { width:158px; }
  .mm-tile-landscape { width:498px; }
  .mm-tile-bg { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:64px; background:#0a0a0a; }
  .mm-tile-cap { position:absolute; inset:0; bottom:0; padding:50px 12px 12px; background:linear-gradient(transparent,rgba(0,0,0,.9)); display:flex; flex-direction:column; justify-content:flex-end; }
  .mm-tile-creator { display:flex; align-items:center; gap:7px; margin-bottom:4px; }
  .mm-tile-avatar { width:24px; height:24px; border-radius:50%; display:grid; place-items:center; font-size:12px; }
  .mm-tile-name { font-size:13px; font-weight:700; color:#fff; }
  .mm-tile-title { font-size:12px; color:rgba(255,255,255,.7); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .mm-views { position:absolute; top:-30px; left:50%; transform:translateX(-50%); white-space:nowrap; background:#2563eb; color:#fff; font-size:11px; font-weight:800; padding:4px 11px; border-radius:8px; box-shadow:0 4px 14px rgba(37,99,235,.5); }

  /* section */
  .mm-section { max-width:1240px; margin:0 auto; padding:100px 24px; }
  .mm-center { text-align:center; }
  .mm-h2 { font-size:clamp(28px,4vw,48px); font-weight:900; letter-spacing:-0.03em; margin:18px 0 0; color:#fff; }
  .mm-lead { color:#9a9a9a; font-size:17px; max-width:580px; margin:16px auto 0; line-height:1.55; }
  .mm-divider { width:100%; height:1px; background:linear-gradient(90deg,transparent,rgba(255,255,255,.14),transparent); margin:0 auto; }

  /* tools grid */
  .mm-tools { display:grid; grid-template-columns:repeat(2,1fr); gap:20px; margin-top:56px; }
  .mm-tool-card { border-radius:22px; padding:2px; background:rgba(255,255,255,.1); transition:background .2s; }
  .mm-tool-card:hover { background:rgba(37,99,235,.5); }
  .mm-tool-inner { background:#0a0a0a; border-radius:20px; padding:28px; height:100%; display:flex; flex-direction:column; }
  .mm-tool-icon { width:48px; height:48px; border-radius:13px; display:grid; place-items:center; font-size:22px; margin-bottom:16px; flex-shrink:0; background:#2563eb; }
  .mm-tool-head { display:flex; align-items:center; gap:10px; margin-bottom:10px; }
  .mm-tool-title { font-size:20px; font-weight:800; color:#fff; }
  .mm-tool-tag { font-size:11px; font-weight:700; color:#fff; background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.18); padding:3px 9px; border-radius:999px; }
  .mm-tool-desc { color:#8a8a8a; font-size:15px; line-height:1.6; flex:1; }

  /* features */
  .mm-feat-grid { display:grid; grid-template-columns:1fr 1fr; gap:60px; align-items:center; margin-top:0; }
  .mm-feat-list { display:flex; flex-direction:column; gap:4px; }
  .mm-feat-item { padding:20px 22px; border-left:3px solid transparent; border-radius:0 12px 12px 0; cursor:default; transition:background .15s; }
  .mm-feat-item:hover { background:rgba(37,99,235,.06); }
  .mm-feat-active { border-left-color:#3b82f6; background:rgba(37,99,235,.1); }
  .mm-feat-h { font-size:20px; font-weight:800; color:#fff; }
  .mm-feat-active .mm-feat-h { color:#fff; }
  .mm-feat-p { color:#8a8a8a; font-size:15px; line-height:1.55; margin-top:6px; }
  .mm-feat-art { aspect-ratio:16/9; border-radius:22px; background:#0a0a0a; border:1.5px solid rgba(37,99,235,.35); box-shadow:0 0 60px rgba(37,99,235,.15), 0 0 0 4px rgba(37,99,235,.08); display:grid; place-items:center; overflow:hidden; position:relative; }
  .mm-feat-art-inner { font-size:80px; opacity:.7; color:#3b82f6; }

  /* stats */
  .mm-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:1px; background:rgba(255,255,255,.1); border:1px solid rgba(255,255,255,.1); border-radius:22px; overflow:hidden; margin-top:56px; }
  .mm-stat { background:#0a0a0a; padding:36px 24px; text-align:center; }
  .mm-stat-num { font-size:clamp(32px,4vw,52px); font-weight:900; letter-spacing:-0.03em; color:#fff; }
  .mm-stat-label { color:#8a8a8a; font-size:14px; font-weight:600; margin-top:6px; }

  /* MCP */
  .mm-mcp-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; margin-top:52px; }
  .mm-mcp-step { background:#0a0a0a; border:1px solid rgba(255,255,255,.12); border-radius:20px; padding:28px; }
  .mm-mcp-num { width:32px; height:32px; border-radius:50%; background:#2563eb; display:grid; place-items:center; font-weight:800; font-size:14px; color:#fff; margin-bottom:16px; }
  .mm-mcp-title { font-size:18px; font-weight:800; margin:0 0 8px; color:#fff; }
  .mm-mcp-body { color:#8a8a8a; font-size:14.5px; line-height:1.55; margin:0; }
  .mm-mcp-url { display:flex; align-items:center; gap:10px; margin-top:14px; background:#000; border:1px solid rgba(255,255,255,.14); border-radius:10px; padding:10px 12px; }
  .mm-mcp-url-text { flex:1; min-width:0; color:#fff; font-family:ui-monospace,"SF Mono",Menlo,monospace; font-size:12px; overflow-x:auto; white-space:nowrap; }
  .mm-mcp-copy { flex:0 0 auto; background:#2563eb; border:1px solid #2563eb; color:#fff; border-radius:7px; padding:5px 10px; font-size:12px; cursor:pointer; font-family:inherit; font-weight:700; }
  .mm-mcp-copy:hover { background:#1d4ed8; }

  /* FAQ */
  .mm-faq { max-width:820px; margin:52px auto 0; display:flex; flex-direction:column; gap:12px; }
  .mm-faq-item { background:#0a0a0a; border:1px solid rgba(255,255,255,.1); border-radius:16px; overflow:hidden; }
  .mm-faq-q { width:100%; text-align:left; cursor:pointer; border:none; background:none; padding:22px 24px; font-size:16px; font-weight:700; color:#fff; display:flex; align-items:center; justify-content:space-between; gap:16px; font-family:inherit; }
  .mm-faq-chevron { transition:transform .2s; flex:0 0 auto; color:#8a8a8a; }
  .mm-faq-open .mm-faq-chevron { transform:rotate(180deg); }
  .mm-faq-a { padding:0 24px; max-height:0; overflow:hidden; transition:max-height .25s ease, padding .25s ease; color:#8a8a8a; font-size:15px; line-height:1.6; }
  .mm-faq-open .mm-faq-a { max-height:200px; padding:0 24px 22px; }

  /* CTA banner */
  .mm-cta { max-width:1200px; margin:20px auto 60px; padding:80px 24px; border-radius:28px; text-align:center; position:relative; overflow:hidden; background:#0a0a0a; border:1px solid rgba(37,99,235,.3); }
  .mm-cta-dots { position:absolute; inset:0; opacity:.12; background-image:radial-gradient(rgba(255,255,255,.8) 1.5px,transparent 1.5px); background-size:24px 24px; pointer-events:none; }
  .mm-cta-glow { position:absolute; top:-60px; left:50%; transform:translateX(-50%); width:600px; height:300px; background:radial-gradient(ellipse,rgba(37,99,235,.35) 0%,transparent 70%); pointer-events:none; }
  .mm-cta-inner { position:relative; z-index:1; }
  .mm-cta-h { font-size:clamp(30px,5vw,56px); font-weight:900; letter-spacing:-0.03em; margin:16px 0 0; color:#fff; }
  .mm-cta-sub { color:rgba(255,255,255,.65); font-size:18px; max-width:520px; margin:18px auto 0; line-height:1.55; }
  .mm-cta-btns { display:flex; justify-content:center; gap:16px; margin-top:36px; flex-wrap:wrap; }

  /* footer */
  .mm-footer { border-top:1px solid rgba(255,255,255,.1); background:#000; }
  .mm-foot-top { max-width:1240px; margin:0 auto; padding:56px 24px; display:grid; grid-template-columns:1.4fr 1fr 1fr 1.2fr; gap:40px; }
  .mm-foot-col h4 { font-size:12px; font-weight:700; letter-spacing:.07em; text-transform:uppercase; color:#5a5a5a; margin:0 0 18px; }
  .mm-foot-col a { display:block; color:#9a9a9a; text-decoration:none; font-size:14.5px; font-weight:500; margin-bottom:12px; transition:color .15s; }
  .mm-foot-col a:hover { color:#fff; }
  .mm-foot-blurb { color:#6a6a6a; font-size:14.5px; line-height:1.6; max-width:300px; margin-top:14px; }
  .mm-foot-bar { border-top:1px solid rgba(255,255,255,.08); text-align:center; padding:22px; color:#5a5a5a; font-size:13px; }

  /* responsive */
  @media (max-width:900px) {
    .mm-nav-links { display:none; }
    .mm-tools { grid-template-columns:1fr; }
    .mm-feat-grid { grid-template-columns:1fr; gap:32px; }
    .mm-feat-art { display:none; }
    .mm-stats { grid-template-columns:repeat(2,1fr); }
    .mm-mcp-grid { grid-template-columns:1fr; }
    .mm-foot-top { grid-template-columns:1fr; gap:32px; }
    .mm-section { padding:72px 24px; }
    .mm-hero { padding:130px 24px 50px; }
  }
`;

export default function LandingPage() {
  const signInHref = CLERK_ENABLED ? "/sign-in" : "/app";
  const signUpHref = CLERK_ENABLED ? "/sign-up" : "/app";

  // FAQ state via DOM to avoid extra useState
  const faqRef = useRef(null);
  const mcpUrlRef = useRef(null);

  useEffect(() => {
    // FAQ accordion
    const faq = faqRef.current;
    if (!faq) return;
    const handler = (e) => {
      const btn = e.target.closest(".mm-faq-q");
      if (!btn) return;
      const item = btn.closest(".mm-faq-item");
      const isOpen = item.classList.contains("mm-faq-open");
      faq.querySelectorAll(".mm-faq-item").forEach((el) => el.classList.remove("mm-faq-open"));
      if (!isOpen) item.classList.add("mm-faq-open");
    };
    faq.addEventListener("click", handler);
    return () => faq.removeEventListener("click", handler);
  }, []);

  const copyMcp = async () => {
    try { await navigator.clipboard.writeText("https://magicmint.pro/api/mcp"); } catch {}
    const el = mcpUrlRef.current;
    if (el) { el.textContent = "Copied!"; setTimeout(() => { el.textContent = "Copy"; }, 1500); }
  };

  // unlock body scroll (globals.css locks it for canvas)
  useEffect(() => {
    const b = document.body, h = document.documentElement;
    const pB = b.style.overflow, pBH = b.style.height, pH = h.style.height;
    b.style.overflow = "auto"; b.style.height = "auto"; h.style.height = "auto";
    return () => { b.style.overflow = pB; b.style.height = pBH; h.style.height = pH; };
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="mm-page">

        {/* ── NAV ── */}
        <div className="mm-nav-wrap">
          <nav className="mm-nav">
            <Link href="/" className="mm-brand">
              <div className="mm-logo">m</div>
              <span className="mm-brand-name">Magic Mint</span>
            </Link>
            <div className="mm-nav-links">
              <a href="#tools">Tools</a>
              <a href="#features">Features</a>
              <Link href="/pricing">Pricing</Link>
              <a href="#mcp">Claude MCP</a>
            </div>
            <div className="mm-nav-right">
              <Link href={signInHref} className="mm-sign-in">Sign in</Link>
              <Link href={signUpHref} className="mm-btn">Start free <Arrow /></Link>
            </div>
          </nav>
        </div>

        {/* ── HERO ── */}
        <header className="mm-hero">
          <div className="mm-hero-glow" />
          <div className="mm-hero-glow2" />
          <div className="mm-badge"><span className="mm-badge-dot" />AI Influencer Platform</div>
          <h1 className="mm-h1">
            Create AI Influencers<br />
            <span className="mm-grad">That Go Viral</span>
          </h1>
          <p className="mm-sub">Generate stunning images, videos, and content for your AI personas on one magical canvas.</p>
          <div className="mm-hero-cta">
            <Link href={signUpHref} className="mm-btn mm-btn-lg">Start Creating Free <Arrow /></Link>
            <Link href="/app" className="mm-btn mm-btn-lg mm-btn-ghost">Open Canvas <Arrow /></Link>
          </div>
          <div className="mm-proof">
            <div className="mm-proof-stars">
              {[0,1,2,3,4].map(i => <StarIcon key={i} />)}
            </div>
            Loved by 10,000+ AI creators
            <span className="mm-proof-dot" />
            No credit card required
          </div>
        </header>

        {/* ── MARQUEE ── */}
        <div className="mm-marquee">
          <div className="mm-marquee-track">
            {MARQUEE_TILES.map((t, i) => (
              <div key={i} className={`mm-tile-wrap`}>
                <div className={`mm-tile mm-tile-${t.type}`}>
                  <div className="mm-tile-bg" style={{ background: "#0a0a0a" }}>
                    {t.emoji}
                  </div>
                  <div className="mm-tile-cap">
                    <div className="mm-tile-creator">
                      <div className="mm-tile-avatar" style={{ background: "rgba(37,99,235,.35)" }}>{t.emoji}</div>
                      <span className="mm-tile-name">@{t.label.toLowerCase()}</span>
                    </div>
                    <div className="mm-tile-title">AI-generated · Magic Mint</div>
                  </div>
                </div>
                <div className="mm-views">{t.views} views</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mm-divider" />

        {/* ── TOOLS ── */}
        <section className="mm-section mm-center" id="tools">
          <div className="mm-badge"><span className="mm-badge-dot" />All-in-one toolkit</div>
          <h2 className="mm-h2">Everything You Need<br />to Build an AI Empire</h2>
          <p className="mm-lead">Images, video, a node canvas, and persona management — all in one place.</p>
          <div className="mm-tools">
            {TOOLS.map((t) => (
              <div key={t.title} className="mm-tool-card">
                <div className="mm-tool-inner">
                  <div className="mm-tool-icon" style={{ background: t.gradient }}>{t.icon}</div>
                  <div className="mm-tool-head">
                    <span className="mm-tool-title">{t.title}</span>
                    <span className="mm-tool-tag">{t.tag}</span>
                  </div>
                  <p className="mm-tool-desc">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="mm-divider" />

        {/* ── STATS ── */}
        <section className="mm-section mm-center" style={{ paddingTop: 0, paddingBottom: 0 }}>
          <div className="mm-stats">
            {[
              { num: "10K+", label: "Active Creators" },
              { num: "50M+", label: "Images Generated" },
              { num: "8M+", label: "Videos Created" },
              { num: "12+", label: "AI Models" },
            ].map((s) => (
              <div key={s.label} className="mm-stat">
                <div className="mm-stat-num">{s.num}</div>
                <div className="mm-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        <div className="mm-divider" style={{ marginTop: 100 }} />

        {/* ── FEATURES ── */}
        <section className="mm-section" id="features">
          <div className="mm-feat-grid">
            <div>
              <div className="mm-badge"><span className="mm-badge-dot" />Features</div>
              <h2 className="mm-h2" style={{ textAlign: "left", marginTop: 18 }}>Built for<br />Serious Creators</h2>
              <div className="mm-feat-list" style={{ marginTop: 36 }}>
                {FEATS.map((f, i) => (
                  <div key={f.title} className={`mm-feat-item${i === 0 ? " mm-feat-active" : ""}`}>
                    <div className="mm-feat-h">{f.title}</div>
                    <div className="mm-feat-p">{f.body}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mm-feat-art">
              <div className="mm-feat-art-inner">✦</div>
              <div style={{ position: "absolute", top: 20, left: 20, background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.18)", borderRadius: 12, padding: "10px 16px", fontSize: 13, fontWeight: 700, color: "#fff" }}>Image Node</div>
              <div style={{ position: "absolute", top: 20, right: 20, background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.18)", borderRadius: 12, padding: "10px 16px", fontSize: 13, fontWeight: 700, color: "#fff" }}>Video Node</div>
              <div style={{ position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)", background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.18)", borderRadius: 12, padding: "10px 20px", fontSize: 13, fontWeight: 700, color: "#fff", whiteSpace: "nowrap" }}>✦ Romy AI</div>
            </div>
          </div>
        </section>

        <div className="mm-divider" />

        {/* ── MCP ── */}
        <section className="mm-section mm-center" id="mcp">
          <div className="mm-badge"><span className="mm-badge-dot" />MCP Connector</div>
          <h2 className="mm-h2">Generate from Claude,<br />Cursor & More</h2>
          <p className="mm-lead">Connect Magic Mint to any MCP-compatible AI tool and generate images and videos without leaving your workflow.</p>
          <div className="mm-mcp-grid">
            <div className="mm-mcp-step">
              <div className="mm-mcp-num">1</div>
              <p className="mm-mcp-title">Open your AI tool settings</p>
              <p className="mm-mcp-body">In Claude, go to <strong style={{ color: "#f1f0ff" }}>Settings → Connectors</strong>. In Cursor, open <strong style={{ color: "#f1f0ff" }}>Settings → MCP</strong>.</p>
            </div>
            <div className="mm-mcp-step">
              <div className="mm-mcp-num">2</div>
              <p className="mm-mcp-title">Add the Magic Mint connector</p>
              <p className="mm-mcp-body">Name it <strong style={{ color: "#f1f0ff" }}>Magic Mint</strong> and paste the URL:</p>
              <div className="mm-mcp-url">
                <span className="mm-mcp-url-text">https://magicmint.pro/api/mcp</span>
                <button className="mm-mcp-copy" onClick={copyMcp} ref={mcpUrlRef}>Copy</button>
              </div>
            </div>
            <div className="mm-mcp-step">
              <div className="mm-mcp-num">3</div>
              <p className="mm-mcp-title">Sign in and start generating</p>
              <p className="mm-mcp-body">Click <strong style={{ color: "#f1f0ff" }}>Add → Connect</strong>, sign in, and ask Claude to generate images or videos — it just works.</p>
            </div>
          </div>
        </section>

        <div className="mm-divider" />

        {/* ── FAQ ── */}
        <section className="mm-section mm-center">
          <div className="mm-badge"><span className="mm-badge-dot" />FAQ</div>
          <h2 className="mm-h2">Questions Answered</h2>
          <div className="mm-faq" ref={faqRef}>
            {FAQS.map((f) => (
              <div key={f.q} className="mm-faq-item">
                <button className="mm-faq-q">
                  {f.q}
                  <svg className="mm-faq-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                <div className="mm-faq-a">{f.a}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <div className="mm-cta">
          <div className="mm-cta-dots" />
          <div className="mm-cta-glow" />
          <div className="mm-cta-inner">
            <div className="mm-badge" style={{ display: "inline-flex", background: "rgba(255,255,255,.1)", borderColor: "rgba(255,255,255,.2)", color: "#fff" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#3b82f6", boxShadow: "0 0 6px #3b82f6" }} />
              Magic Mint
            </div>
            <h2 className="mm-cta-h">Launch Your AI Influencer Today</h2>
            <p className="mm-cta-sub">Join thousands of creators already making viral content with Magic Mint.</p>
            <div className="mm-cta-btns">
              <Link href={signUpHref} className="mm-btn mm-btn-lg mm-btn-white">Start for Free <Arrow /></Link>
              <Link href="/pricing" className="mm-btn mm-btn-lg mm-btn-ghost">See Pricing <Arrow /></Link>
            </div>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <footer className="mm-footer">
          <div className="mm-foot-top">
            <div>
              <Link href="/" className="mm-brand" style={{ display: "inline-flex" }}>
                <div className="mm-logo">m</div>
                <span className="mm-brand-name">Magic Mint</span>
              </Link>
              <p className="mm-foot-blurb">The node-based AI creative canvas. Generate and connect images, video, audio, and text for your AI influencers.</p>
            </div>
            <div className="mm-foot-col">
              <h4>Product</h4>
              <a href="#tools">Tools</a>
              <a href="#features">Features</a>
              <Link href="/pricing">Pricing</Link>
              <a href="#mcp">Claude MCP</a>
            </div>
            <div className="mm-foot-col">
              <h4>App</h4>
              <Link href="/app">Open Canvas</Link>
              <Link href="/image">Image Studio</Link>
              <Link href="/video">Video Studio</Link>
              <Link href="/influencers">Influencers</Link>
            </div>
            <div className="mm-foot-col">
              <h4>Legal &amp; Safety</h4>
              <Link href="/terms">Terms of Service</Link>
              <Link href="/acceptable-use">Acceptable Use Policy</Link>
              <Link href="/content-moderation-policy">Content Moderation Policy</Link>
              <Link href="/content-removal-policy">Content Removal Policy</Link>
              <Link href="/complaints-policy">Complaints Policy</Link>
              <Link href="/content-creator-agreement">Content Creator Agreement</Link>
              <Link href="/third-party-consent">3rd Party Consent</Link>
            </div>
          </div>
          <div className="mm-foot-bar">Magic Mint · All rights reserved · © 2026</div>
        </footer>

      </div>
    </>
  );
}
