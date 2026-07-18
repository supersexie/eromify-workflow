"use client";
import { Suspense } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { usePlan } from "./PlanProvider";
import { canAccessTab } from "@/lib/planGate";

// Motion Control now lives as a sub-tab inside Video — the dedicated /motion
// route is gone. The Motion Control tab routes to /video?sub=motion which the
// Video page reads on mount to select that sub-tab.
const TABS = [
  { id: "canvas", label: "Magic Canvas", path: "/app", match: (p) => p === "/app" || p.startsWith("/w/") },
  { id: "image",  label: "Image",  path: "/image", match: (p) => p.startsWith("/image") },
  { id: "video",  label: "Video",  path: "/video", match: (p, s) => p.startsWith("/video") && s.get("sub") !== "motion" },
  { id: "motion", label: "Motion Control", path: "/video?sub=motion", match: (p, s) => (p.startsWith("/video") && s.get("sub") === "motion") || p.startsWith("/motion") },
  { id: "upscale", label: "Upscale", path: "/upscale", match: (p) => p.startsWith("/upscale") },
  { id: "library", label: "Library", path: "/library", match: (p) => p.startsWith("/library") },
  { id: "influencers", label: "Influencers", path: "/influencers", match: (p) => p.startsWith("/influencers") },
  { id: "mcp",    label: "MCP", path: "/mcp", match: (p) => p.startsWith("/mcp") },
];

// Shared topbar tab strip — used by every product page so the brand pill,
// tab list, and active state stay consistent without copy/paste.
// Wrapped in a Suspense boundary because useSearchParams() (in TabsInner)
// triggers a Next.js build error otherwise — see
// https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout
export default function Tabs({ showBrand = true }) {
  return (
    <Suspense fallback={<div className="mc-tabs">{showBrand && <Link href="/" className="title-pill"><img src="/logo.png" alt="M" className="logo" /><span>Magic Mint</span></Link>}</div>}>
      <TabsInner showBrand={showBrand} />
    </Suspense>
  );
}

function TabsInner({ showBrand = true }) {
  const router = useRouter();
  const pathname = usePathname() || "";
  const search = useSearchParams();
  const { tier, loading } = usePlan();
  return (
    <div className="mc-tabs">
      {showBrand && (
        <Link href="/" className="title-pill">
          <img src="/logo.png" alt="M" className="logo" />
          <span>Magic Mint</span>
        </Link>
      )}
      {TABS.map((t) => {
        const active = t.match(pathname, search);
        const locked = !loading && tier && !canAccessTab(t.id, tier);
        const go = () => {
          if (t.id === "canvas") {
            let dest = "/app";
            try {
              const last = localStorage.getItem("eromify:lastCanvas");
              if (last) dest = `/w/${last}`;
            } catch {}
            router.push(dest);
            return;
          }
          router.push(t.path);
        };
        return (
          <button
            key={t.id}
            className={`mc-tab ${active ? "is-active" : ""} ${locked ? "mc-tab-locked" : ""}`}
            onClick={() => !active && go()}
            disabled={active}
            title={locked ? "Upgrade to unlock" : ""}
          >
            {t.label}
            {locked && <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 4, opacity: 0.5 }}><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM12 17c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM9 8V6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9z"/></svg>}
          </button>
        );
      })}
    </div>
  );
}
