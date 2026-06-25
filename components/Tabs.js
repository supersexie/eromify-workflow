"use client";
import { Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

// Motion Control now lives as a sub-tab inside Video — the dedicated /motion
// route is gone. The Motion Control tab routes to /video?sub=motion which the
// Video page reads on mount to select that sub-tab.
const TABS = [
  { id: "canvas", label: "Canvas", path: "/app", match: (p) => p === "/app" || p.startsWith("/w/") },
  { id: "image",  label: "Image",  path: "/image", match: (p) => p.startsWith("/image") },
  { id: "video",  label: "Video",  path: "/video", match: (p, s) => p.startsWith("/video") && s.get("sub") !== "motion" },
  { id: "motion", label: "Motion Control", path: "/video?sub=motion", match: (p, s) => (p.startsWith("/video") && s.get("sub") === "motion") || p.startsWith("/motion") },
  { id: "upscale", label: "Upscale", path: "/upscale", match: (p) => p.startsWith("/upscale") },
  { id: "mcp",    label: "MCP & CLI", path: "/mcp", match: (p) => p.startsWith("/mcp") },
];

// Shared topbar tab strip — used by every product page so the brand pill,
// tab list, and active state stay consistent without copy/paste.
// Wrapped in a Suspense boundary because useSearchParams() (in TabsInner)
// triggers a Next.js build error otherwise — see
// https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout
export default function Tabs() {
  return (
    <Suspense fallback={<div className="mc-tabs"><div className="title-pill"><div className="logo">e</div><span>Eromify</span></div></div>}>
      <TabsInner />
    </Suspense>
  );
}

function TabsInner() {
  const router = useRouter();
  const pathname = usePathname() || "";
  const search = useSearchParams();
  return (
    <div className="mc-tabs">
      <div className="title-pill">
        <div className="logo">e</div>
        <span>Eromify</span>
      </div>
      {TABS.map((t) => {
        const active = t.match(pathname, search);
        return (
          <button
            key={t.id}
            className={`mc-tab ${active ? "is-active" : ""}`}
            onClick={() => !active && router.push(t.path)}
            disabled={active}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
