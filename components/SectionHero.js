"use client";

// Shared empty-state hero with floating gradient tiles — used by the Image,
// Video (create/edit), and Influencers sections so they all share one look.
const TILES = [
  { hue: "linear-gradient(135deg,#ec4899,#a855f7)", label: "Portrait" },
  { hue: "linear-gradient(135deg,#a855f7,#3b82f6)", label: "Concept" },
  { hue: "linear-gradient(135deg,#f59e0b,#ec4899)", label: "Editorial" },
  { hue: "linear-gradient(135deg,#10b981,#a855f7)", label: "Surreal" },
];

export default function SectionHero({ title, brand, sub, tiles = TILES }) {
  return (
    <div className="ip-hero">
      <div className="ip-hero-tiles">
        {tiles.map((t, i) => (
          <div
            key={i}
            className="ip-hero-tile"
            style={{ background: t.hue, transform: `rotate(${(i - 1.5) * 4}deg) translateY(${i % 2 ? 10 : -10}px)` }}
          >
            <span>{t.label}</span>
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
