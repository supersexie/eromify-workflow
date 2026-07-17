"use client";
import { useState } from "react";
import TopBar from "@/components/TopBar";
import UserMenu from "@/components/UserMenu";

// MCP connector URL — served by our Next.js MCP route at /api/[transport].
// When deployed at magicmint.pro this resolves to https://magicmint.pro/api/mcp.
const MCP_URL = "https://magicmint.pro/api/mcp";

const APPS = [
  { id: "claude",  label: "Claude",   ic: <svg width="14" height="14" viewBox="0 0 24 24" fill="#ec4899"><circle cx="12" cy="12" r="10"/></svg> },
  { id: "cursor",  label: "Cursor",   ic: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="6 3 20 12 6 21 6 3"/></svg> },
  { id: "openclaw",label: "OpenClaw", ic: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M8 12h8M12 8v8"/></svg> },
  { id: "hermes",  label: "Hermes",   ic: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 22 12 12 22 2 12 12 2"/></svg> },
];

// Per-app step text. Each entry is the 3-step row shown beneath the tabs.
const APP_STEPS = {
  claude: {
    step1: { title: "Open Claude settings", body: <>Launch the app or open <b>claude.ai</b> and go to</>, action: "Settings → Connectors" },
    step2: { title: <>Add the <span className="mcp-brand">Magic Mint</span> custom connector</>, body: <>Name it <b>Magic Mint</b> and paste the URL:</>, url: MCP_URL },
    step3: { title: "Connect and sign in", body: <>Click <b>Add → Connect</b>, sign in with your Magic Mint account — you're all set, now just ask Claude to <b>generate an image</b>.</> },
  },
  cursor: {
    step1: { title: "Open Cursor settings", body: <>Open Cursor → <b>Settings → MCP</b> → Add new MCP server.</>, action: "Settings → MCP" },
    step2: { title: <>Add the <span className="mcp-brand">Magic Mint</span> MCP server</>, body: <>Name it <b>Magic Mint</b> and paste the URL:</>, url: MCP_URL },
    step3: { title: "Restart Cursor", body: <>Restart Cursor, then ask the agent to generate images or videos with Magic Mint.</> },
  },
  openclaw: {
    step1: { title: "Open OpenClaw settings", body: <>Open OpenClaw → <b>Connectors</b>.</>, action: "Settings → Connectors" },
    step2: { title: <>Add the <span className="mcp-brand">Magic Mint</span> MCP</>, body: <>Name it <b>Magic Mint</b> and paste the URL:</>, url: MCP_URL },
    step3: { title: "Sign in", body: <>Sign in with your Magic Mint account and start generating.</> },
  },
  hermes: {
    step1: { title: "Open Hermes settings", body: <>Open Hermes → <b>Plugins</b> → Add MCP.</>, action: "Plugins → Add MCP" },
    step2: { title: <>Add the <span className="mcp-brand">Magic Mint</span> MCP</>, body: <>Name it <b>Magic Mint</b> and paste the URL:</>, url: MCP_URL },
    step3: { title: "Connect", body: <>Sign in and start asking Hermes to generate Magic Mint content.</> },
  },
};

const TOOL_CARDS = [
  { title: "generate_image",      desc: "Text → photoreal image with the Magic Mint house style." },
  { title: "generate_video",      desc: "Text or image → cinematic short clip via Kling/Veo/LTX." },
  { title: "edit_image",          desc: "Image + prompt → restyled / re-posed variant." },
  { title: "edit_video",          desc: "Source video + prompt → restyled / relit / re-elemented." },
  { title: "motion_control",      desc: "Character image + reference video → animated character." },
  { title: "list_models",         desc: "Returns the catalog of image + video models you have access to." },
];

export default function MCPPage() {
  const [app, setApp] = useState("claude");
  const [copied, setCopied] = useState(false);

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const steps = APP_STEPS[app];

  return (
    <div className="mcp-page">
      <TopBar right={<UserMenu />} />

      <div className="mcp-body">
        {/* Hero card — gradient brand banner */}
        <div className="mcp-hero">
          <div className="mcp-hero-bg" />
          <div className="mcp-hero-inner">
            <h1 className="mcp-hero-title">
              MAGIC MINT MCP FOR{" "}
              <img src="/claude-mark.png" alt="Claude" className="mcp-claude-mark" />{" "}
              CLAUDE
            </h1>
            <p className="mcp-hero-sub">
              Connect Magic Mint to your workflow and generate cinematic images and videos directly from your prompts.
            </p>
          </div>
        </div>

        {/* Connector demo — chat mockup (left) + feature cards (right) */}
        <div className="mcp-demo">
          <div className="mcp-chat">
            <div className="mcp-chat-head">
              <span className="mcp-chat-dot" /><span className="mcp-chat-dot" /><span className="mcp-chat-dot" />
              <span className="mcp-chat-title">CLAUDE · MAGIC MINT CONNECTOR</span>
            </div>
            <div className="mcp-chat-body">
              <div className="mcp-bubble mcp-bubble-you">
                Generate 4 IG-ready photos of <span className="mcp-mention">@lily</span> for this week — vary the outfits, moods, and lighting. Mix indoor and outdoor. 4:5 portrait.
              </div>
              <div className="mcp-bubble mcp-bubble-ai">
                <span className="mcp-ai-spark">✦</span>
                <div>
                  On it. Generating 4 portraits of Lily — mixing café, rooftop, and golden-hour outdoor scenes.
                  <div className="mcp-chat-grid">
                    {["/chars/bento-1.jpg", "/chars/bento-2.jpg", "/chars/bento-3.jpg", "/chars/bento-4.jpg"].map((src) => (
                      <span key={src} className="mcp-chat-thumb"><img src={src} alt="" /></span>
                    ))}
                  </div>
                  <div className="mcp-chat-meta">4 IMAGES · 30 CREDITS · ~20S</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mcp-demo-features">
            {[
              { n: "01", h: "Talk to your avatars by name", d: "Lily, Aria, Maya — Claude knows which influencer to use and never breaks character." },
              { n: "02", h: "Batch generate 12 at a time", d: "One prompt. One coffee. A week of content rendered while you focus on shipping." },
              { n: "03", h: "Spin up videos without leaving the chat", d: "Bring stills to life with Kling, Veo, and Sora — Claude routes the right model automatically." },
            ].map((f) => (
              <div key={f.n} className="mcp-feature">
                <div className="mcp-feature-n">{f.n}</div>
                <div className="mcp-feature-h">{f.h}</div>
                <div className="mcp-feature-d">{f.d}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tab row: target app selector */}
        <div className="mcp-tabs-row">
          <div className="mcp-pillgroup">
            {APPS.map((a) => (
              <button
                key={a.id}
                className={`mcp-pill ${app === a.id ? "is-active" : ""}`}
                onClick={() => setApp(a.id)}
              >
                {a.ic}
                <span>{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 3-step card row */}
        {(
          <div className="mcp-steps">
            <div className="mcp-step">
              <div className="mcp-step-num">1</div>
              <div className="mcp-step-title">{steps.step1.title}</div>
              <div className="mcp-step-body">{steps.step1.body}</div>
              {steps.step1.action && (
                <button className="mcp-step-action">
                  {steps.step1.action}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17L17 7M7 7h10v10"/></svg>
                </button>
              )}
            </div>
            <div className="mcp-step">
              <div className="mcp-step-num">2</div>
              <div className="mcp-step-title">{steps.step2.title}</div>
              <div className="mcp-step-body">{steps.step2.body}</div>
              {steps.step2.url && (
                <div className="mcp-step-url">
                  <code>{steps.step2.url}</code>
                  <button onClick={() => copy(steps.step2.url)} title="Copy URL">
                    {copied ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>
                    )}
                  </button>
                </div>
              )}
            </div>
            <div className="mcp-step">
              <div className="mcp-step-num">3</div>
              <div className="mcp-step-title">{steps.step3.title}</div>
              <div className="mcp-step-body">{steps.step3.body}</div>
            </div>
          </div>
        )}

        {/* Tools showcase */}
        <div className="mcp-tools">
          <h2 className="mcp-tools-title">JUST DESCRIBE IT, MAGIC MINT BUILDS IT</h2>
          <p className="mcp-tools-sub">A look at the tools your agent can call, and what each one returns when you ask.</p>
          <div className="mcp-tools-grid">
            {TOOL_CARDS.map((t) => (
              <div key={t.title} className="mcp-tool">
                <div className="mcp-tool-name">
                  <span className="mcp-tool-dot" />
                  {t.title}
                </div>
                <div className="mcp-tool-desc">{t.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
