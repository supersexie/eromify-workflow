"use client";

import { useState, useRef, useEffect } from "react";

export default function NavDropdown({ label, sections }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        className="flex items-center gap-1 text-sm text-[#B8B8B8] hover:text-white transition-colors py-1"
        onClick={() => setOpen((v) => !v)}
      >
        {label}
        <svg
          width="12" height="12" viewBox="0 0 12 12" fill="none"
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 pt-3 z-50">
          <div className="bg-[#111111] border border-white/[0.10] rounded-2xl p-5 shadow-[0_24px_64px_rgba(0,0,0,0.6)] flex gap-6 min-w-[520px]">
            {sections.map((section) => (
              <div key={section.title} className={section.title === "Models" ? "w-52 shrink-0" : "w-44 shrink-0"}>
                <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-[#7A7A7A] mb-3 px-1">
                  {section.title}
                </p>
                <ul className="flex flex-col gap-0.5">
                  {section.items.map((item) => (
                    <li key={item.label} className="w-full">
                      <a
                        href={item.href}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-[#B8B8B8] hover:text-white hover:bg-white/[0.06] transition-all"
                      >
                        {item.icon && (
                          <span className="text-[#EC4899] text-[10px] leading-none">◆</span>
                        )}
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
