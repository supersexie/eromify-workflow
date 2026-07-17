"use client";

// Shared empty-state hero with floating tiles — used by the Image,
// Video (create/edit), and Influencers sections so they all share one look.
// Default tiles are gradient placeholders (used by Video pages).
const TILES = [
  { hue: "linear-gradient(135deg,#ec4899,#a855f7)", label: "Portrait" },
  { hue: "linear-gradient(135deg,#a855f7,#3b82f6)", label: "Concept" },
  { hue: "linear-gradient(135deg,#f59e0b,#ec4899)", label: "Editorial" },
  { hue: "linear-gradient(135deg,#10b981,#a855f7)", label: "Surreal" },
];

export const IMAGE_TILES = [
  { img: "/chars/sofia-1.jpg", label: "Portrait" },
  { img: "/chars/aria-3.jpg", label: "Concept" },
  { img: "/chars/luna-2.jpg", label: "Editorial" },
  { img: "/chars/sofia-4.jpg", label: "Surreal" },
];

export const INFLUENCER_TILES = [
  { img: "/chars/luna-1.jpg", label: "Portrait" },
  { img: "/chars/sofia-3.jpg", label: "Concept" },
  { img: "/chars/aria-5.jpg", label: "Editorial" },
  { img: "/chars/luna-6.jpg", label: "Surreal" },
];

export default function SectionHero({ title, brand, sub, tiles = TILES }) {
  return (
    <div className="ip-hero">
      <div className="ip-hero-tiles">
        {tiles.map((t, i) => (
          <div
            key={i}
            className="ip-hero-tile"
            style={{ background: t.hue || "#111", transform: `rotate(${(i - 1.5) * 4}deg) translateY(${i % 2 ? 10 : -10}px)` }}
          >
            {t.video ? (
              <video src={t.video} muted loop autoPlay playsInline preload="metadata" onError={(e) => { e.currentTarget.style.display = "none"; }} />
            ) : t.img ? (
              <img src={t.img} alt={t.label || ""} onError={(e) => { e.currentTarget.style.display = "none"; }} />
            ) : (
              <span>{t.label}</span>
            )}
          </div>
        ))}
      </div>
      <h1 className="ip-hero-title">
        {title} {brand && <span className="ip-hero-brand">{brand}</span>}
      </h1>
      {sub && <p className="ip-hero-sub">{sub}</p>}
    </div>
  );
}
