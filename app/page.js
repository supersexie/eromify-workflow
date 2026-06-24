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
  { h: "Generate without leaving chat", p: "Ask Claude for an image, video, voiceover, or script and it runs Genmax for you — no tab-switching." },
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
  { h: "Use in Claude", p: "The Genmax MCP connector lets Claude generate images, video, audio and text through the same backend." },
];

const FAQS = [
  { q: "What is Genmax?", a: "Genmax is a node-based AI creative canvas. You connect Image, Video, Text, and Audio nodes on an infinite canvas to build and run generation workflows visually." },
  { q: "Which models can I use?", a: "Images use FLUX 2 Pro/Max, Nano Banana Pro, and Seedream 4.5. Video uses LTX, Wan 2.2, MiniMax Hailuo, and Kling v2. Text and audio are powered by OpenAI." },
  { q: "Do I need an account?", a: "Yes — sign up free with email or Google to open the app. Once you're in, your workflows save automatically in your browser." },
  { q: "Can I use Genmax inside Claude?", a: "Yes. Genmax ships an MCP connector so Claude can generate media through Genmax directly from chat." },
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
            <b>Genmax</b>
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
          <span className={s.badge}>Viral Videos Made with Genmax</span>
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
          <p className={s.lead}>Connect Genmax to Claude and generate images, video, voiceovers, and scripts right from your conversations.</p>
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
        <p className={s.lead}>Everything you need to know about Genmax.</p>
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
          <div className={s.ctaKicker}>Genmax</div>
          <h2 className={s.h2}>Launch Your Canvas Today!</h2>
          <p className={s.lead}>Join creators turning prompts into finished media with Genmax.</p>
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
              <b>Genmax</b>
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
        <div className={s.footBar}>Genmax. All rights reserved. © 2026</div>
      </footer>
    </div>
  );
}
