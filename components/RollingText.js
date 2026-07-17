"use client";
import { useState, useEffect } from "react";

const PHRASES = ["AI influencers", "UGC ads", "Brand campaigns", "YouTube videos"];

export default function RollingText({ className }) {
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
    <span className={`rolling-wrap ${className || ""}`}>
      <span className={`rolling-text ${animating ? "rolling-out" : "rolling-in"}`}>
        {PHRASES[index]}
      </span>
    </span>
  );
}
