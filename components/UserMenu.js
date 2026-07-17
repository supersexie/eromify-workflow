"use client";
import { useSession, signOut } from "next-auth/react";
import { usePlan } from "./PlanProvider";
import { useState, useEffect, useRef } from "react";

export default function UserMenu() {
  const { data: session, status } = useSession();
  const { tier } = usePlan();
  const [open, setOpen] = useState(false);
  const [credits, setCredits] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    if (open) {
      fetch("/api/auth/whop/credits")
        .then((r) => r.json())
        .then(setCredits)
        .catch(() => {});
    }
  }, [open]);

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  if (status !== "authenticated" || !session?.user) return null;

  const name = session.user.name || session.user.email || "Account";
  const image = session.user.image;
  const pct = credits ? Math.round((credits.used / credits.limit) * 100) : 0;

  return (
    <div className="user-menu" ref={ref}>
      <button
        type="button"
        className="user-menu-btn"
        title={name}
        onClick={() => setOpen(!open)}
      >
        {image ? (
          <img src={image} alt="" width={32} height={32} className="user-menu-avatar" />
        ) : (
          <span className="user-menu-fallback">{name.slice(0, 1).toUpperCase()}</span>
        )}
      </button>

      {open && (
        <div className="user-dropdown">
          <div className="user-dropdown-header">
            <span className="user-dropdown-name">{name}</span>
            {tier && <span className="user-dropdown-tier">{tier}</span>}
          </div>

          {credits && credits.limit > 0 && (
            <div className="user-dropdown-credits">
              <div className="user-credits-bar">
                <div className="user-credits-fill" style={{ width: `${Math.min(pct, 100)}%` }} />
              </div>
              <span className="user-credits-text">
                {credits.used.toLocaleString()} / {credits.limit.toLocaleString()} credits
              </span>
            </div>
          )}

          <div className="user-dropdown-actions">
            <a
              href="https://whop.com/magic-mint/"
              target="_blank"
              rel="noopener noreferrer"
              className="user-dropdown-link"
            >
              {tier ? "Manage subscription" : "Subscribe"}
            </a>
            <button
              type="button"
              className="user-dropdown-link"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
