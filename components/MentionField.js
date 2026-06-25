"use client";
import { useEffect, useRef, useState } from "react";
import { listInfluencers, normHandle } from "@/lib/influencers";

// A text input/textarea that renders @handles (matching saved influencers) as
// pink pills and offers an autocomplete dropdown while typing "@…". The pill is
// drawn by an overlay layer behind a transparent-text field, so the caret and
// wrapping stay perfectly aligned. Shared by Image / Video / Canvas prompts.

function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function buildHtml(value, known) {
  // Escape, then wrap known @handles in a pink tag span. Trailing newline needs
  // a zero-width char so the overlay's last line height matches the textarea.
  const html = esc(value).replace(/@([a-z0-9_]+)/gi, (full, h) =>
    known.has(normHandle(h)) ? `<span class="mf-tag">${esc(full)}</span>` : esc(full)
  );
  return html.replace(/\n$/, "\n​");
}

export default function MentionField({
  value,
  onChange,
  placeholder,
  multiline = false,
  rows = 1,
  disabled = false,
  className = "",
  inputRef,
  onKeyDown,
  onPaste,
  dropUp = false,
  maxHeight = 240,
}) {
  const [influencers, setInfluencers] = useState([]);
  useEffect(() => { setInfluencers(listInfluencers()); }, []);

  const localRef = useRef(null);
  const fieldRef = inputRef || localRef;
  const overlayRef = useRef(null);

  const known = new Set(influencers.map((i) => i.handle));
  const mentionQuery = (value.match(/@([a-z0-9_]*)$/i) || [])[1];
  const suggestions = mentionQuery != null
    ? influencers.filter((inf) => inf.handle.startsWith(normHandle(mentionQuery))).slice(0, 6)
    : [];

  const apply = (inf) => {
    onChange(value.replace(/@[a-z0-9_]*$/i, `@${inf.handle} `));
    // refocus the field after picking
    requestAnimationFrame(() => fieldRef.current?.focus());
  };

  // Auto-grow a multiline field to fit its content (so long prompts are fully
  // visible) up to maxHeight, after which it scrolls. Runs on every value change.
  useEffect(() => {
    if (!multiline) return;
    const el = fieldRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, maxHeight) + "px";
  }, [value, multiline, maxHeight]);

  const syncScroll = () => {
    if (overlayRef.current && fieldRef.current) {
      overlayRef.current.scrollTop = fieldRef.current.scrollTop;
      overlayRef.current.scrollLeft = fieldRef.current.scrollLeft;
    }
  };

  const fieldProps = {
    ref: fieldRef,
    className: `mf-field ${className}`,
    placeholder,
    value,
    disabled,
    onChange: (e) => onChange(e.target.value),
    onScroll: syncScroll,
    onKeyDown,
    onPaste,
    spellCheck: false,
  };

  return (
    <div className={`mf-wrap ${multiline ? "mf-multiline" : ""}`}>
      <div
        ref={overlayRef}
        className="mf-overlay"
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: buildHtml(value, known) }}
      />
      {multiline
        ? <textarea {...fieldProps} rows={rows} />
        : <input {...fieldProps} type="text" />}
      {suggestions.length > 0 && (
        <div className={`mention-pop ${dropUp ? "" : "mention-pop-below"}`}>
          {suggestions.map((inf) => (
            <button key={inf.id} type="button" className="mention-row" onMouseDown={(e) => { e.preventDefault(); apply(inf); }}>
              <img src={inf.image} alt={inf.name} />
              <span className="mention-name">{inf.name}</span>
              <span className="mention-handle">@{inf.handle}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
