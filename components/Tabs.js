"use client";
import { useRouter, usePathname } from "next/navigation";

const TABS = [
  { id: "canvas", label: "Canvas", path: "/app", match: (p) => p === "/app" || p.startsWith("/w/") },
  { id: "image", label: "Image", path: "/image", match: (p) => p.startsWith("/image") },
  { id: "video", label: "Video", path: "/video", match: (p) => p.startsWith("/video") },
  { id: "motion", label: "Motion Control", path: "/motion", match: (p) => p.startsWith("/motion") },
  { id: "mcp", label: "MCP & CLI", path: "/mcp", match: (p) => p.startsWith("/mcp") },
];

// Shared topbar tab strip — used by every product page so the brand pill,
// tab list, and active state stay consistent without copy/paste.
export default function Tabs() {
  const router = useRouter();
  const pathname = usePathname() || "";
  return (
    <div className="mc-tabs">
      <div className="title-pill">
        <div className="logo">e</div>
        <span>Eromify</span>
      </div>
      {TABS.map((t) => {
        const active = t.match(pathname);
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
