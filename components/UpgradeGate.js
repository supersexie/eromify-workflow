"use client";
import { usePlan } from "./PlanProvider";
import { canAccess, requiredTier } from "@/lib/planGate";

export default function UpgradeGate({ feature, children }) {
  const { tier, loading } = usePlan();

  if (loading) return children;
  if (!tier || canAccess(feature, tier)) return children;

  const needed = requiredTier(feature);

  return (
    <div className="upgrade-gate">
      <div className="upgrade-gate-overlay">
        <div className="upgrade-gate-card">
          <span className="upgrade-gate-icon">✦</span>
          <h3>{feature}</h3>
          <p>This feature requires the <strong>{needed}</strong> plan or higher.</p>
          <a
            href={`https://whop.com/magic-mint/`}
            target="_blank"
            rel="noopener noreferrer"
            className="upgrade-gate-btn"
          >
            Upgrade now
          </a>
        </div>
      </div>
      <div style={{ filter: "blur(4px)", pointerEvents: "none" }}>{children}</div>
    </div>
  );
}
