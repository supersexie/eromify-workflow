"use client";

import DotField from "./DotField";

export default function DotFieldBackground() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
        pointerEvents: "none",
      }}
    >
      <DotField
        dotRadius={1.5}
        dotSpacing={14}
        cursorRadius={500}
        cursorForce={0.1}
        bulgeOnly
        bulgeStrength={67}
        glowRadius={160}
        sparkle={false}
        waveAmplitude={0}
        gradientFrom="rgba(236, 72, 153, 0.30)"
        gradientTo="rgba(244, 114, 182, 0.18)"
        glowColor="#170810"
        style={{ pointerEvents: "none" }}
      />
    </div>
  );
}
