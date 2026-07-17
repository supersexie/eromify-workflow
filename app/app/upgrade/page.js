"use client";
import { useState, useEffect } from "react";
import TopBar from "@/components/TopBar";
import UserMenu from "@/components/UserMenu";
import { usePlan } from "@/components/PlanProvider";
import { PLANS, FEATURE_ROWS, MODEL_ROWS } from "@/lib/pricing";

function Check({ yes }) {
  return yes ? (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
  ) : (
    <span style={{ width: 14, height: 14, display: "inline-block", borderBottom: "2px solid rgba(255,255,255,0.15)" }} />
  );
}

export default function UpgradePage() {
  const [annual, setAnnual] = useState(false);
  const { tier } = usePlan();

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevBodyOverflow = body.style.overflow;
    const prevBodyHeight = body.style.height;
    const prevHtmlHeight = html.style.height;
    body.style.overflow = "auto";
    body.style.height = "auto";
    html.style.height = "auto";
    return () => {
      body.style.overflow = prevBodyOverflow;
      body.style.height = prevBodyHeight;
      html.style.height = prevHtmlHeight;
    };
  }, []);

  return (
    <>
      <TopBar right={<UserMenu />} />
      <div style={{ padding: "80px 24px 60px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "#ec4899", marginBottom: 12 }}>
            {tier ? `Current plan: ${tier}` : "Choose a plan"}
          </p>
          <h1 style={{ fontSize: 36, fontWeight: 700, color: "var(--ink)", marginBottom: 8 }}>Upgrade your plan</h1>
          <p style={{ fontSize: 15, color: "var(--muted)" }}>Unlock more features and credits. Cancel anytime.</p>
        </div>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
          <div style={{ display: "flex", padding: 4, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 9999 }}>
            <button onClick={() => setAnnual(false)} style={{ padding: "8px 20px", borderRadius: 9999, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", background: !annual ? "rgba(236,72,153,0.12)" : "transparent", color: !annual ? "#ec4899" : "var(--muted)", fontFamily: "inherit" }}>Monthly</button>
            <button onClick={() => setAnnual(true)} style={{ padding: "8px 20px", borderRadius: 9999, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", background: annual ? "rgba(236,72,153,0.12)" : "transparent", color: annual ? "#ec4899" : "var(--muted)", fontFamily: "inherit" }}>Annual <span style={{ fontSize: 11, color: "#ec4899" }}>save</span></button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
          {PLANS.map((plan, i) => {
            const isCurrent = tier === plan.name.toLowerCase();
            return (
              <div key={plan.name} style={{
                position: "relative", display: "flex", flexDirection: "column", padding: 20, borderRadius: 20,
                border: plan.popular || plan.best ? "1px solid rgba(236,72,153,0.4)" : "1px solid var(--line)",
                boxShadow: plan.popular || plan.best ? "0 0 40px rgba(236,72,153,0.08)" : "none",
                opacity: isCurrent ? 0.5 : 1,
              }}>
                {plan.popular && <span style={{ position: "absolute", top: -12, left: 20, background: "#ec4899", color: "#000", fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 9999 }}>Most popular</span>}
                {plan.best && <span style={{ position: "absolute", top: -12, left: 20, background: "#ec4899", color: "#000", fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 9999 }}>Best value</span>}
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)", marginBottom: 4 }}>{plan.name}</h3>
                <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12, minHeight: "2.4em" }}>{plan.desc}</p>
                <div style={{ marginBottom: 4 }}>
                  <span style={{ fontSize: 36, fontWeight: 700, color: plan.popular || plan.best ? "#ec4899" : "var(--ink)" }}>${annual ? plan.annual : plan.monthly}</span>
                  <span style={{ fontSize: 13, color: "var(--muted)" }}>/mo</span>
                </div>
                <p style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>{annual ? "billed for 12 months" : "billed monthly"}</p>
                {annual && plan.save ? <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#ec4899", marginBottom: 12 }}>Save ${plan.save}/year</p> : <div style={{ marginBottom: 12 }} />}
                <a
                  href={isCurrent ? undefined : (annual ? plan.whopAnnual : plan.whop)}
                  target={isCurrent ? undefined : "_blank"}
                  rel="noopener noreferrer"
                  style={{
                    display: "block", textAlign: "center", padding: "10px 0", borderRadius: 9999, fontSize: 13, fontWeight: 600, textDecoration: "none", marginBottom: 12,
                    background: isCurrent ? "var(--surface-2)" : (plan.popular || plan.best ? "#ec4899" : "transparent"),
                    color: isCurrent ? "var(--muted)" : (plan.popular || plan.best ? "#000" : "var(--ink)"),
                    border: plan.popular || plan.best || isCurrent ? "none" : "1px solid var(--line)",
                    cursor: isCurrent ? "default" : "pointer",
                  }}
                >
                  {isCurrent ? "Current plan" : plan.cta}
                </a>
                <p style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ color: "#ec4899" }}>✦</span> {plan.credits} credits/mo
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {FEATURE_ROWS.map((row) => (
                    <div key={row.label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: row.cols[i] ? "var(--ink)" : "var(--muted)" }}>
                      <Check yes={!!row.cols[i]} /> {row.label}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
