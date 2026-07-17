"use client";
import { usePlan } from "./PlanProvider";
import { canAccess, requiredTier } from "@/lib/planGate";

export default function GatedPage({ feature, children }) {
  const { tier, loading } = usePlan();

  if (loading) return children;
  if (!tier || canAccess(feature, tier)) return children;

  const needed = requiredTier(feature);

  return (
    <div style={{ position: "relative", minHeight: "60vh" }}>
      <div className="upgrade-gate-overlay" style={{ position: "fixed", inset: 0, zIndex: 50 }}>
        <div className="upgrade-gate-card">
          <span className="upgrade-gate-icon">✦</span>
          <h3>{feature}</h3>
          <p>This feature requires the <strong>{needed}</strong> plan or higher.</p>
          <a
            href="/app/upgrade"
            className="upgrade-gate-btn"
          >
            Upgrade now
          </a>
        </div>
      </div>
      <div style={{ filter: "blur(6px)", pointerEvents: "none" }}>{children}</div>
    </div>
  );
}
