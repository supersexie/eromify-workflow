import Link from "next/link";

// Shared shell for the static legal/policy pages. The <main> is a FULL-WIDTH
// fixed scroll container (so the scrollbar sits at the browser's right edge,
// not mid-screen), and the content is centered inside it at a readable width.
// Own scroll container is needed because the global body{overflow:hidden} for
// the canvas would otherwise clip these pages. Every page shows the DRAFT
// banner — replace with counsel-reviewed text before launch.
export default function LegalPage({ title, updated = "Draft", children }) {
  return (
    <main
      style={{
        position: "fixed",
        inset: 0,
        overflowY: "auto",
        background: "#08080a",
        fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
      }}
    >
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "64px 24px", color: "#e8e8ea", lineHeight: 1.65 }}>
        <Link href="/" style={{ color: "#7aa2ff", fontSize: 14, textDecoration: "none" }}>← Eromify</Link>
        <h1 style={{ fontSize: 32, marginTop: 16, marginBottom: 4 }}>{title}</h1>
        <p style={{ color: "#6b7280", fontSize: 13, margin: "0 0 18px" }}>Last updated: {updated}</p>
        <p
          style={{
            color: "#c9a227",
            background: "rgba(201,162,39,0.1)",
            border: "1px solid rgba(201,162,39,0.3)",
            padding: "10px 14px",
            borderRadius: 8,
            fontSize: 14,
          }}
        >
          ⚠️ Draft placeholder — must be reviewed and finalized by legal counsel before launch.
        </p>
        <div style={{ marginTop: 8 }}>{children}</div>
      </div>
    </main>
  );
}
