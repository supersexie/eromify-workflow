"use client";
import { Geist, Bricolage_Grotesque } from "next/font/google";
import { useEffect, useState } from "react";
import Link from "next/link";
import "./vyxen-landing.css";
import DotFieldBackground from "@/components/vyxen/DotFieldBackground";
import { CanvasText } from "@/components/vyxen/CanvasText";
import NavDropdown from "@/components/vyxen/NavDropdown";
import { PLANS, FEATURE_ROWS, MODEL_ROWS } from "@/lib/pricing";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

const CLERK_ENABLED = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

const TAG_COLOR = { Automation: "text-[#5b9dff]", Training: "text-[#e08a3c]", "4K": "text-[#EC4899]" };

function MatrixRow({ label, tag, included }) {
  return (
    <div className={`grid grid-cols-[1rem_1fr_auto] gap-x-2 items-center text-[12px] leading-snug ${included ? "text-[#E7E7EA]" : "text-[#4b5563]"}`}>
      <span className={included ? "text-white" : "text-[#4b5563]"}>{included ? "✓" : "—"}</span>
      <span>{label}</span>
      {tag ? <span className={`text-[10px] font-bold tracking-[0.04em] uppercase ${TAG_COLOR[tag] || "text-[#6b7280]"}`}>{tag}</span> : <span />}
    </div>
  );
}

// SHOWCASE MEDIA REMOVED. Every tile below renders as a gradient placeholder
// instead of a real image/video. The layout is unchanged, so dropping media
// back in is just a matter of re-adding a `video`/`img` field here and the
// matching <video>/<img> in the JSX — nothing else has to move.
const G = {
  pink: "linear-gradient(135deg,#ec4899,#a855f7)",
  violet: "linear-gradient(135deg,#7c3aed,#ec4899)",
  blue: "linear-gradient(135deg,#3b82f6,#a855f7)",
  cyan: "linear-gradient(135deg,#06b6d4,#3b82f6)",
  green: "linear-gradient(135deg,#10b981,#ec4899)",
  amber: "linear-gradient(135deg,#f59e0b,#ec4899)",
};

// Bento feature tiles — model showcase
const BENTO_TILES = [
  { label: "Seedream 4.5", cls: "col-span-2", bg: G.pink },
  { label: "Nano Banana Pro", cls: "", bg: G.violet },
  { label: "Seedream 4.0", cls: "row-span-2", bg: G.blue },
  { label: "Seedream 5 Lite", cls: "", bg: G.cyan },
  { label: "Nano Banana 2", cls: "", bg: G.green },
];

// Gallery
const GALLERY_TILES = [
  { cls: "col-span-2", bg: G.pink },
  { cls: "", bg: G.violet },
  { cls: "row-span-2", bg: G.blue },
  { cls: "", bg: G.cyan },
  { cls: "", bg: G.green },
  { cls: "col-span-2", bg: G.amber },
];

// Character gallery
const CHARS = [
  { name: "Sofia", faded: false, bg: G.pink },
  { name: "Aria", faded: false, bg: G.violet },
  { name: "Luna", faded: false, bg: G.blue },
  { name: "Nova", faded: true, bg: G.cyan },
];

export default function Home() {
  const [annual, setAnnual] = useState(false);
  const signInHref = CLERK_ENABLED ? "/sign-in" : "/app";
  const signUpHref = CLERK_ENABLED ? "/sign-up" : "/app";

  // globals.css locks body overflow for the canvas editor — release it here so this page scrolls.
  useEffect(() => {
    const b = document.body, h = document.documentElement;
    const pB = b.style.overflow, pBH = b.style.height, pH = h.style.height;
    b.style.overflow = "auto"; b.style.height = "auto"; h.style.height = "auto";
    return () => { b.style.overflow = pB; b.style.height = pBH; h.style.height = pH; };
  }, []);

  return (
    <div className={`${geistSans.variable} ${bricolage.variable} min-h-screen bg-[#0A0A0A] text-[#B8B8B8]`} style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
      <DotFieldBackground />

      <div className="relative z-10 flex flex-col min-h-screen">

        {/* Nav */}
        <nav className="sticky top-0 z-50 h-[72px] bg-[#0A0A0A]/70 backdrop-blur-xl border-b border-white/[0.06]">
          <div className="max-w-[1440px] mx-auto h-full flex items-center justify-between px-6 md:px-16">
            <Link href="/" className="flex items-center gap-3">
              <span className="font-heading text-2xl font-bold tracking-tight text-white">
                <CanvasText
                  text="Magic Mint"
                  backgroundClassName="bg-[#EC4899]"
                  colors={["var(--color-pink-300)", "var(--color-rose-200)", "var(--color-pink-200)", "var(--color-pink-400)", "var(--color-rose-300)", "var(--color-pink-100)"]}
                  lineGap={4} lineWidth={1.5} animationDuration={8} curveIntensity={30}
                />
              </span>
            </Link>
            <ul className="hidden md:flex items-center gap-7">
              <li>
                <NavDropdown label="Images" sections={[
                  { title: "Features", items: [
                    { label: "Image Generation", href: "/image", icon: "✦" },
                    { label: "Upscale", href: "/upscale", icon: "◈" },
                    { label: "Image Edit", href: "/image", icon: "◎" },
                  ]},
                  { title: "Models", items: [
                    { label: "GPT Image 2", href: "/image", icon: "◆" },
                    { label: "GPT Image 1", href: "/image", icon: "◆" },
                    { label: "Flux 2 Pro", href: "/image", icon: "◆" },
                    { label: "Flux 2 Max", href: "/image", icon: "◆" },
                    { label: "Nano Banana Pro", href: "/image", icon: "◆" },
                    { label: "Seedream 4.5", href: "/image", icon: "◆" },
                  ]},
                ]} />
              </li>
              <li>
                <NavDropdown label="Videos" sections={[
                  { title: "Features", items: [
                    { label: "Video Generation", href: "/video", icon: "▶" },
                    { label: "Motion Control", href: "/video", icon: "⊹" },
                    { label: "Face Swap", href: "/image", icon: "◉" },
                  ]},
                  { title: "Models", items: [
                    { label: "Veo", href: "/video", icon: "◆" },
                    { label: "Kling v2", href: "/video", icon: "◆" },
                    { label: "LTX Video", href: "/video", icon: "◆" },
                    { label: "Wan", href: "/video", icon: "◆" },
                    { label: "Hailuo", href: "/video", icon: "◆" },
                    { label: "MiniMax", href: "/video", icon: "◆" },
                  ]},
                ]} />
              </li>
              <li><a href="#characters" className="text-sm text-[#B8B8B8] hover:text-white transition-colors">Characters</a></li>
              <li><a href="#pricing" className="text-sm text-[#B8B8B8] hover:text-white transition-colors">Pricing</a></li>
            </ul>
            <div className="flex items-center gap-4">
              <Link href={signInHref} className="text-sm text-[#B8B8B8] hover:text-white transition-colors font-medium">Log in</Link>
              <Link href={signUpHref} className="inline-flex items-center gap-2 text-sm font-semibold px-7 py-3.5 rounded-full bg-[#EC4899] text-white hover:brightness-110 transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]">
                Get started →
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero. The ambient pink glow lives on this full-width wrapper, NOT on
            the max-w-[1440px] section below — inside the capped section it got
            hard-clipped at the section's edge, leaving a visible vertical seam
            on screens wider than 1440. overflow-hidden keeps it from ever
            widening the page. */}
        <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_65%_40%,rgba(236,72,153,0.22)_0%,rgba(236,72,153,0.07)_35%,transparent_70%)]" />
        <section className="relative max-w-[1440px] mx-auto w-full px-6 md:px-16 pt-24 pb-24 flex flex-col md:flex-row items-center gap-12 md:gap-16">
          <div className="relative max-w-[680px] flex-1">
            <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#EC4899] mb-4">Generative media platform</p>
            <h1 className="font-heading text-[44px] md:text-[72px] leading-[1.05] font-bold tracking-[-0.03em] text-white mb-6">
              Generate{" "}
              <CanvasText
                text="AI influencers"
                backgroundClassName="bg-[#EC4899]"
                colors={["var(--color-pink-300)", "var(--color-rose-200)", "var(--color-pink-200)", "var(--color-pink-400)", "var(--color-rose-300)", "var(--color-pink-100)"]}
                lineGap={6} lineWidth={2} animationDuration={8} curveIntensity={40}
              />
            </h1>
            <p className="text-lg leading-[1.55] text-[#B8B8B8] max-w-[520px] mb-9">
              Magic Mint brings every leading image, video, and audio model into one fast, unified workspace — built for people who make things.
            </p>
            <div className="flex items-center gap-8">
              <Link href={signUpHref} className="inline-flex items-center gap-2 text-[15px] font-semibold px-8 py-4 rounded-full bg-[#EC4899] text-white hover:brightness-110 transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]">
                Start creating →
              </Link>
              <a href="#gallery" className="text-sm font-medium text-white hover:text-[#EC4899] transition-colors flex items-center gap-1.5">
                Browse the gallery →
              </a>
            </div>
          </div>
          <div className="hidden md:grid grid-cols-3 gap-3 flex-none w-[420px]">
            {[
              "linear-gradient(135deg,#581c87,#831843)",
              "linear-gradient(135deg,#701a75,#581c87)",
              "linear-gradient(135deg,#831843,#701a75)",
              "linear-gradient(135deg,#581c87,#701a75)",
              "linear-gradient(135deg,#701a75,#831843)",
              "linear-gradient(135deg,#831843,#581c87)",
              "linear-gradient(135deg,#701a75,#581c87)",
              "linear-gradient(135deg,#581c87,#831843)",
              "linear-gradient(135deg,#831843,#701a75)",
            ].map((bg, i) => (
              <div key={i} className="aspect-square rounded-2xl" style={{ background: bg }} />
            ))}
          </div>
        </section>
        </div>

        {/* Claude MCP */}
        <section id="mcp" className="max-w-[1100px] mx-auto w-full px-6 md:px-10 py-24">
          <div className="flex flex-col items-center text-center mb-12 md:mb-14">
            <span className="inline-flex text-[10px] font-semibold tracking-[0.14em] uppercase text-[#EC4899] border border-[rgba(236,72,153,0.45)] px-3.5 py-1.5 rounded-full mb-6">
              MCP Connector — Growth &amp; Creator
            </span>
            <h2 className="font-heading text-[32px] md:text-[48px] leading-[1.1] font-bold tracking-[-0.02em] text-white uppercase max-w-[820px] mb-5">
              Turn{" "}
              <span className="inline-flex align-middle mx-1.5 w-9 h-9 md:w-11 md:h-11 rounded-[10px] bg-[#D4A574] items-center justify-center shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 2l1.2 6.3L19.5 7l-4.2 4.8L21 15.5l-6.5-.2L12 22l-2.5-6.7L3 15.5l5.7-3.7L4.5 7l6.3 1.3L12 2z" fill="white" />
                </svg>
              </span>{" "}
              Claude into your creative engine
            </h2>
            <p className="text-[15px] md:text-lg leading-[1.55] text-[#9CA3AF] max-w-[560px]">
              Connect Magic Mint to Claude and generate avatar images, videos, and full campaigns right from your conversations.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-5 md:gap-6 items-stretch">
            {/* Chat mockup */}
            <div className="rounded-[20px] border border-white/[0.08] bg-[#111114] overflow-hidden flex flex-col min-h-[420px]">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
                </div>
                <span className="text-[10px] font-semibold tracking-[0.14em] uppercase text-[#6B7280]">Claude × Magic Mint Connector</span>
              </div>
              <div className="flex-1 p-5 md:p-6 flex flex-col gap-5">
                <div className="self-start max-w-[92%] rounded-2xl bg-[#1a1a1f] border border-white/[0.06] px-4 py-3.5 text-[13px] md:text-[14px] leading-[1.55] text-[#E7E7EA]">
                  Generate 8 IG-ready photos of Lily for this week — vary the outfits, moods, and lighting. Mix indoor and outdoor. 4:5 portrait.
                </div>
                <div className="flex gap-3 items-start">
                  <span className="flex-none mt-0.5 w-7 h-7 rounded-lg bg-[#D4A574] flex items-center justify-center">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M12 2l1.2 6.3L19.5 7l-4.2 4.8L21 15.5l-6.5-.2L12 22l-2.5-6.7L3 15.5l5.7-3.7L4.5 7l6.3 1.3L12 2z" fill="white" />
                    </svg>
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] md:text-[14px] leading-[1.55] text-[#E7E7EA] mb-4">
                      On it. Generating 8 portraits of Lily — mixing café, rooftop, and golden-hour outdoor scenes.
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {[G.pink, G.violet, G.blue, G.amber].map((bg, i) => (
                        <div key={i} className="aspect-[4/5] rounded-xl overflow-hidden bg-[#0a0a0c] border border-white/[0.06]">
                          <div className="w-full h-full opacity-40" style={{ background: bg }} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature cards */}
            <div className="flex flex-col gap-5 md:gap-6">
              <div className="flex-1 rounded-[20px] border border-white/[0.08] bg-[#0c0c0e] p-6 md:p-7 flex flex-col justify-center">
                <span className="text-[13px] font-semibold tracking-[0.08em] text-[#EC4899] mb-3">01</span>
                <h3 className="text-[18px] md:text-[20px] font-semibold text-white mb-2.5 tracking-[-0.01em]">Talk to your avatars by name</h3>
                <p className="text-[14px] leading-[1.55] text-[#9CA3AF]">
                  Lily, Aria, Maya — Claude knows which trained LoRA to use and never breaks character.
                </p>
              </div>
              <div className="flex-1 rounded-[20px] border border-white/[0.08] bg-[#0c0c0e] p-6 md:p-7 flex flex-col justify-center">
                <span className="text-[13px] font-semibold tracking-[0.08em] text-[#EC4899] mb-3">02</span>
                <h3 className="text-[18px] md:text-[20px] font-semibold text-white mb-2.5 tracking-[-0.01em]">Batch generate 12 at a time</h3>
                <p className="text-[14px] leading-[1.55] text-[#9CA3AF]">
                  One prompt. One coffee. A week of content rendered while you focus on shipping.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Bento feature */}
        <section id="features" className="max-w-[1440px] mx-auto w-full px-6 md:px-16 py-24 grid grid-cols-1 md:grid-cols-[1fr_1.4fr] gap-10 md:gap-16 items-center">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#EC4899] mb-4">◆ Unified workspace</p>
            <h2 className="font-heading text-[36px] leading-[1.2] font-semibold tracking-[-0.01em] text-white mb-6">One prompt.<br />Every model.</h2>
            <p className="text-lg leading-[1.55] text-[#B8B8B8] max-w-[440px] mb-7">
              Stop juggling tabs and subscriptions. Switch between the world&apos;s best generative models on one Canvas, compare outputs side by side, and pick the one that&apos;s right for the shot.
            </p>
            <Link href="/app" className="inline-flex items-center gap-2 text-sm font-semibold px-7 py-3.5 rounded-full border border-white/10 text-white hover:border-[rgba(236,72,153,0.4)] transition-all">
              See how it works →
            </Link>
          </div>
          <div className="grid grid-cols-2 grid-rows-[repeat(3,120px)] md:grid-rows-[repeat(3,156px)] gap-4">
            {BENTO_TILES.map((t) => (
              <div key={t.label} className={`relative rounded-[20px] border border-white/[0.06] overflow-hidden hover:border-[rgba(236,72,153,0.4)] hover:scale-[1.01] transition-all duration-[250ms] bg-[#0f0a10] ${t.cls}`}>
                <div className="absolute inset-0 opacity-25" style={{ background: t.bg }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <span className="absolute top-3 right-3 text-[11px] text-white bg-[#0A0A0A]/60 backdrop-blur-sm px-2.5 py-1 rounded-[10px]">{t.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Prompt Assist demo */}
        <section className="max-w-[1440px] mx-auto w-full px-6 md:px-16 py-24 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
          <div className="rounded-[28px] p-8 border border-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]" style={{ background: "linear-gradient(180deg,rgba(255,255,255,0.02) 0%,rgba(255,255,255,0) 100%),#0A0A0A" }}>
            <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[#7A7A7A] mb-3">Your Prompt</p>
            <div className="text-sm text-[#B8B8B8] leading-relaxed px-4 py-3.5 bg-white/[0.03] border border-white/[0.06] rounded-[14px] mb-4">
              a cinematic portrait of a woman at golden hour, soft bokeh, film grain, editorial style
            </div>
            <div className="bg-[#080808] border border-[rgba(236,72,153,0.40)] rounded-[14px] p-4 shadow-[0_0_24px_rgba(236,72,153,0.08)]">
              <div className="flex gap-2 mb-3.5 flex-wrap">
                {["GPT Image 2", "16:9", "4K"].map((tag) => (
                  <span key={tag} className="text-xs font-medium text-[#EC4899] bg-[rgba(236,72,153,0.10)] border border-[rgba(236,72,153,0.25)] px-3 py-1.5 rounded-[10px]">{tag}</span>
                ))}
              </div>
              <p className="text-sm text-[#B8B8B8] leading-[1.55] mb-4">
                A luminous editorial portrait bathed in amber light — shallow depth of field draws the eye while organic film grain adds tactile authenticity.
              </p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-0.5 rounded-full bg-gradient-to-r from-[#EC4899] to-[rgba(236,72,153,0.2)]" />
                <span className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[#EC4899]">Enhanced</span>
              </div>
            </div>
          </div>
          <div>
            <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#EC4899] mb-4">Enhance</p>
            <h2 className="font-heading text-[36px] md:text-[56px] leading-[1.1] font-bold tracking-[-0.02em] text-white mb-2">Your idea,<br />perfected.</h2>
            <p className="text-lg leading-[1.55] text-[#B8B8B8] max-w-[420px] mb-8">
              Magic Mint&apos;s Enhance rewrites your rough prompt into a production-ready shot description — in the house style, in seconds.
            </p>
            <ul className="flex flex-col gap-5 mb-8">
              {["Automatically enriches your prompt for photorealistic results", "Preserves your intent while sharpening technical parameters", "Works across image, video, and the Canvas"].map((item) => (
                <li key={item} className="flex items-start gap-3 text-[15px] text-[#B8B8B8]">
                  <span className="mt-[7px] flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[#EC4899]" />
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/image" className="inline-flex items-center gap-2 text-sm font-semibold px-7 py-3.5 rounded-full text-white border border-[rgba(236,72,153,0.40)] transition-all" style={{ background: "linear-gradient(180deg,#1A1A1A 0%,#0A0A0A 100%)", boxShadow: "inset 0 1px 0 rgba(236,72,153,0.20)" }}>
              Try Enhance →
            </Link>
          </div>
        </section>

        {/* Character gallery */}
        <section id="characters" className="w-full flex flex-col md:flex-row items-center pl-6 md:pl-16 py-24 overflow-hidden">
          <div className="flex-none w-full md:w-[300px] pr-6 md:pr-16 mb-8 md:mb-0">
            <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#EC4899] mb-4">AI Characters</p>
            <h2 className="font-heading text-[36px] md:text-[56px] leading-[1.1] font-bold tracking-[-0.02em] text-white mb-4">Build your<br />own AI<br />influencer.</h2>
            <p className="text-[15px] leading-[1.55] text-[#B8B8B8] mb-8">
              Use the guided Influencer Builder to create a persistent AI identity — no prompt-writing needed. Generate hundreds of consistent images, in any setting, any style — always recognizably yours.
            </p>
            <Link href="/influencers" className="inline-flex items-center gap-2 text-sm font-semibold px-7 py-3.5 rounded-full border border-white/10 text-white hover:border-[rgba(236,72,153,0.4)] transition-all">
              Explore characters →
            </Link>
          </div>
          <div className="flex gap-6 overflow-x-auto md:overflow-hidden flex-1 pr-6">
            {CHARS.map((char) => (
              <div key={char.name} className={`flex flex-col items-center flex-none transition-opacity ${char.faded ? "opacity-40" : ""}`}>
                <p className="text-base font-medium text-white mb-4">{char.name}</p>
                <div className="grid grid-cols-2 gap-2" style={{ width: 328 }}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="w-40 h-40 rounded-[14px] overflow-hidden bg-[#111]">
                      <div className="w-full h-full opacity-25" style={{ background: char.bg }} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="max-w-[1280px] mx-auto w-full px-6 md:px-10 py-24">
          <div className="text-center mb-10">
            <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#EC4899] mb-4">Save on annual plans</p>
            <h2 className="font-heading text-[32px] md:text-[44px] leading-[1.15] font-bold tracking-[-0.02em] text-white mb-3">Simple pricing.<br />Serious power.</h2>
            <p className="text-lg text-[#B8B8B8]">Generate without limits. Cancel any time.</p>
          </div>
          <div className="flex justify-center mb-12">
            <div className="flex p-1 bg-white/[0.04] border border-white/[0.08] rounded-full">
              <button onClick={() => setAnnual(false)} className={`px-6 py-2.5 rounded-full text-sm font-medium transition-colors ${!annual ? "bg-[rgba(236,72,153,0.12)] text-[#EC4899]" : "text-[#B8B8B8]"}`}>Monthly</button>
              <button onClick={() => setAnnual(true)} className={`px-6 py-2.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${annual ? "bg-[rgba(236,72,153,0.12)] text-[#EC4899]" : "text-[#B8B8B8]"}`}>Annual <span className="text-[11px] text-[#EC4899]">save</span></button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 items-start">
            {PLANS.map((plan, i) => (
              <div key={plan.name} className={`relative flex flex-col rounded-[24px] p-6 border ${plan.popular || plan.best ? "border-[rgba(236,72,153,0.40)] shadow-[0_0_40px_rgba(236,72,153,0.10),inset_0_1px_0_rgba(236,72,153,0.12)]" : "border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"}`}>
                {plan.popular && <span className="absolute -top-3.5 left-6 bg-[#EC4899] text-black text-[11px] font-semibold px-3 py-1 rounded-full">Most popular</span>}
                {plan.best && <span className="absolute -top-3.5 left-6 bg-[#EC4899] text-black text-[11px] font-semibold px-3 py-1 rounded-full">Best value</span>}
                <h3 className="text-xl font-semibold text-white mb-2">{plan.name}</h3>
                <p className="text-[13px] text-[#B8B8B8] leading-snug mb-4 min-h-[2.6em]">{plan.desc}</p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className={`text-[44px] leading-none font-bold tracking-[-0.02em] ${plan.popular || plan.best ? "text-[#EC4899]" : "text-white"}`}>${annual ? plan.annual : plan.monthly}</span>
                  <span className="text-sm text-[#7A7A7A]">/mo</span>
                </div>
                <p className="text-[12px] text-[#7A7A7A] mb-1">{annual ? "billed for 12 months" : "billed monthly"}</p>
                {annual ? <p className="text-[11px] font-bold tracking-[0.06em] uppercase text-[#EC4899] mb-4">Save ${plan.save}/year</p> : <p className="mb-4 min-h-[1em]" />}
                <Link href={signUpHref} className={`w-full text-center text-sm font-semibold py-3 rounded-full transition-all mb-4 ${plan.popular || plan.best ? "bg-[#EC4899] text-black hover:brightness-110" : "border border-white/10 text-white hover:border-[rgba(236,72,153,0.4)]"}`}>
                  {plan.cta}
                </Link>
                <p className="text-[13px] font-semibold text-white mb-4 flex items-center gap-1.5">
                  <span className="text-[#EC4899]">✦</span> {plan.credits} credits per month
                </p>
                <div className="flex flex-col gap-2 mb-5">
                  {FEATURE_ROWS.map((row) => (
                    <MatrixRow key={row.label} label={row.label} tag={row.tag} included={!!row.cols[i]} />
                  ))}
                </div>
                <p className="text-[10px] font-bold tracking-[0.08em] uppercase text-[#6b7280] pt-4 border-t border-white/10 mb-3">Unlimited access</p>
                <div className="flex flex-col gap-2">
                  {MODEL_ROWS.map((row) => (
                    <MatrixRow key={row.label} label={row.label} tag={row.tag} included={!!row.cols[i]} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Gallery */}
        <section id="gallery" className="max-w-[1440px] mx-auto w-full px-6 md:px-16 py-24">
          <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#EC4899] mb-4 text-center">Generated with Magic Mint</p>
          <h2 className="font-heading text-[36px] leading-[1.2] font-semibold tracking-[-0.01em] text-white mb-12 text-center">All in one place.</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 grid-rows-[repeat(4,160px)] md:grid-rows-[repeat(3,220px)] gap-4 mb-12">
            {GALLERY_TILES.map((t, i) => (
              <div key={i} className={`relative rounded-[20px] border border-white/[0.06] overflow-hidden hover:border-[rgba(236,72,153,0.4)] hover:scale-[1.01] transition-all duration-[250ms] bg-[#0f0a10] ${t.cls}`}>
                <div className="absolute inset-0 opacity-25" style={{ background: t.bg }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </div>
            ))}
          </div>
          <div className="flex justify-center">
            <Link href={signUpHref} className="inline-flex items-center gap-2 text-[15px] font-semibold px-8 py-4 rounded-full bg-[#EC4899] text-black hover:brightness-110 transition-all">
              Start creating →
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="max-w-[1440px] mx-auto w-full px-6 md:px-16 py-12 border-t border-white/[0.06]">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
            <Link href="/" className="flex items-center gap-3">
              <span className="font-heading text-2xl font-bold tracking-tight text-white">
                <CanvasText
                  text="Magic Mint"
                  backgroundClassName="bg-[#EC4899]"
                  colors={["var(--color-pink-300)", "var(--color-rose-200)", "var(--color-pink-200)", "var(--color-pink-400)", "var(--color-rose-300)", "var(--color-pink-100)"]}
                  lineGap={4} lineWidth={1.5} animationDuration={8} curveIntensity={30}
                />
              </span>
            </Link>
            <ul className="flex flex-wrap gap-6 md:gap-8">
              <li><a href="#features" className="text-sm text-[#B8B8B8] hover:text-white transition-colors">Features</a></li>
              <li><a href="#characters" className="text-sm text-[#B8B8B8] hover:text-white transition-colors">Characters</a></li>
              <li><a href="#pricing" className="text-sm text-[#B8B8B8] hover:text-white transition-colors">Pricing</a></li>
              <li><Link href="/mcp" className="text-sm text-[#B8B8B8] hover:text-white transition-colors">Claude MCP</Link></li>
              <li><Link href="/app" className="text-sm text-[#B8B8B8] hover:text-white transition-colors">Open App</Link></li>
            </ul>
          </div>
          <div className="flex flex-col md:flex-row justify-between gap-2 text-[13px] text-[#7A7A7A]">
            <span>© 2026 Magic Mint. All rights reserved.</span>
            <span>Made for creators.</span>
          </div>
        </footer>

      </div>
    </div>
  );
}
