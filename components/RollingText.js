"use client";
import { useState, useEffect } from "react";
import { CanvasText } from "@/components/vyxen/CanvasText";

const PHRASES = ["AI influencers", "UGC ads", "Brand campaigns", "YouTube videos"];

export default function RollingText() {
  const [index, setIndex] = useState(0);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setAnimating(true);
      setTimeout(() => {
        setIndex((i) => (i + 1) % PHRASES.length);
        setAnimating(false);
      }, 500);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="rolling-wrap">
      <span className={`rolling-text-inner ${animating ? "rolling-out" : "rolling-in"}`}>
        <CanvasText
          text={PHRASES[index]}
          backgroundClassName="bg-[#EC4899]"
          colors={["var(--color-pink-300)", "var(--color-rose-200)", "var(--color-pink-200)", "var(--color-pink-400)", "var(--color-rose-300)", "var(--color-pink-100)"]}
          lineGap={6} lineWidth={2} animationDuration={8} curveIntensity={40}
        />
      </span>
    </span>
  );
}
