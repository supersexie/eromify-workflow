"use client";
import { useState } from "react";
import Tabs from "@/components/Tabs";
import UserMenu from "@/components/UserMenu";

// MCP connector URL — served by our Next.js MCP route at /api/[transport].
// When deployed at eromify.pro this resolves to https://eromify.pro/api/mcp.
const MCP_URL = "https://eromify.pro/api/mcp";

const INSTALL_TYPES = [
  { id: "mcp", label: "MCP", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18"/></svg> },
  { id: "cli", label: "CLI", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 17l6-6-6-6M12 19h8"/></svg> },
  { id: "skill", label: "Skill", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 3v18M4 7h4M4 11h4M4 15h4M4 19h4"/></svg> },
];

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
    step2: { title: <>Add the <span className="mcp-brand">Eromify</span> custom connector</>, body: <>Name it <b>Eromify</b> and paste the URL:</>, url: MCP_URL },
    step3: { title: "Connect and sign in", body: <>Click <b>Add → Connect</b>, sign in with your Eromify account — you're all set, now just ask Claude to <b>generate an image</b>.</> },
  },
  cursor: {
    step1: { title: "Open Cursor settings", body: <>Open Cursor → <b>Settings → MCP</b> → Add new MCP server.</>, action: "Settings → MCP" },
    step2: { title: <>Add the <span className="mcp-brand">Eromify</span> MCP server</>, body: <>Name it <b>Eromify</b> and paste the URL:</>, url: MCP_URL },
    step3: { title: "Restart Cursor", body: <>Restart Cursor, then ask the agent to generate images or videos with Eromify.</> },
  },
  openclaw: {
    step1: { title: "Open OpenClaw settings", body: <>Open OpenClaw → <b>Connectors</b>.</>, action: "Settings → Connectors" },
    step2: { title: <>Add the <span className="mcp-brand">Eromify</span> MCP</>, body: <>Name it <b>Eromify</b> and paste the URL:</>, url: MCP_URL },
    step3: { title: "Sign in", body: <>Sign in with your Eromify account and start generating.</> },
  },
  hermes: {
    step1: { title: "Open Hermes settings", body: <>Open Hermes → <b>Plugins</b> → Add MCP.</>, action: "Plugins → Add MCP" },
    step2: { title: <>Add the <span className="mcp-brand">Eromify</span> MCP</>, body: <>Name it <b>Eromify</b> and paste the URL:</>, url: MCP_URL },
    step3: { title: "Connect", body: <>Sign in and start asking Hermes to generate Eromify content.</> },
  },
};

const TOOL_CARDS = [
  { title: "generate_image",      desc: "Text → photoreal image with the Eromify house style." },
  { title: "generate_video",      desc: "Text or image → cinematic short clip via Kling/Veo/LTX." },
  { title: "edit_image",          desc: "Image + prompt → restyled / re-posed variant." },
  { title: "edit_video",          desc: "Source video + prompt → restyled / relit / re-elemented." },
  { title: "motion_control",      desc: "Character image + reference video → animated character." },
  { title: "list_models",         desc: "Returns the catalog of image + video models you have access to." },
];

export default function MCPPage() {
  const [install, setInstall] = useState("mcp");
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
      <div className="dash-topbar">
        <Tabs />
        <UserMenu />
      </div>

      <div className="mcp-body">
        {/* Hero card — gradient brand banner */}
        <div className="mcp-hero">
          <div className="mcp-hero-bg" />
          <div className="mcp-hero-inner">
            <div className="mcp-hero-icons">
              {/* row of brand-toned tiles representing connectors */}
              {["#1e293b", "#7c3aed", "#ec4899", "#f97316", "#0ea5e9", "#10b981"].map((c, i) => (
                <span key={i} className="mcp-hero-icon" style={{ background: c, transform: `translateY(${i % 2 ? 6 : -6}px)` }} />
              ))}
              <span className="mcp-hero-icon mcp-hero-icon-main">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M5 12c0-4 3-7 7-7s7 3 7 7-3 7-7 7"/><path d="M5 19h7"/></svg>
              </span>
            </div>
            <h1 className="mcp-hero-title">EROMIFY MCP FOR ANY AI</h1>
            <p className="mcp-hero-sub">
              Connect Eromify to your workflow and generate cinematic images and videos directly from your prompts.
            </p>
          </div>
        </div>

        {/* Tab row: install type (left) + target app (right) */}
        <div className="mcp-tabs-row">
          <div className="mcp-pillgroup">
            {INSTALL_TYPES.map((t) => (
              <button
                key={t.id}
                className={`mcp-pill ${install === t.id ? "is-active" : ""}`}
                onClick={() => setInstall(t.id)}
              >
                {t.icon}
                <span>{t.label}</span>
              </button>
            ))}
          </div>
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
        {install === "mcp" && (
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

        {install === "cli" && (
          <div className="mcp-cli">
            <div className="mcp-cli-title">One-line install for CLI agents</div>
            <div className="mcp-cli-body">
              For Claude Code, Codex, OpenClaw or Hermes, run this in your project:
            </div>
            <div className="mcp-cli-code">
              <code>npx eromify-mcp install --client {app}</code>
              <button onClick={() => copy(`npx eromify-mcp install --client ${app}`)} title="Copy">
                {copied ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>
                )}
              </button>
            </div>
          </div>
        )}

        {install === "skill" && (
          <div className="mcp-cli">
            <div className="mcp-cli-title">Install as an Anthropic Skill</div>
            <div className="mcp-cli-body">
              Download the Eromify skill bundle and drop it into your <code>~/.claude/skills/</code> directory.
            </div>
            <a className="mcp-cli-code" href="#" onClick={(e) => e.preventDefault()}>
              <code>eromify-skill-v1.zip</code>
              <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6, color: "var(--blue)" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                Download
              </span>
            </a>
          </div>
        )}

        {/* CLI hint banner under the MCP setup */}
        {install === "mcp" && (
          <a
            className="mcp-cli-banner"
            href="#"
            onClick={(e) => { e.preventDefault(); setInstall("cli"); }}
          >
            If you are using Claude Code, Codex, OpenClaw, Hermes, it's better to use the CLI
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17L17 7M7 7h10v10"/></svg>
          </a>
        )}

        {/* Tools showcase */}
        <div className="mcp-tools">
          <h2 className="mcp-tools-title">JUST DESCRIBE IT, EROMIFY BUILDS IT</h2>
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
