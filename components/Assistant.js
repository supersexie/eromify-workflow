"use client";
import { useEffect, useRef, useState } from "react";
import { listInfluencers } from "@/lib/influencers";

export default function Assistant({ open, onClose, onCreateAndMaybeRun, onDirector, hasSelectedImage, selectedImageUrl = null, nodes = [] }) {
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState("");
  const [autoRun, setAutoRun] = useState(true);
  // Default model for multi-scene (director) videos — selector removed from UI.
  const videoModel = "LTX Video";
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [history, sending]);

  if (!open) return null;

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);
    setHistory((h) => [...h, { role: "user", content: text }]);
    try {
      // Give the assistant full situational awareness: the user's saved
      // influencers (so it can answer "who is @ash") and a compact summary of
      // every canvas node (so it can explain failures, suggest models, etc.).
      const influencers = listInfluencers().map((i) => ({
        handle: i.handle, name: i.name, description: i.description || "",
      }));
      const isUrl = (u) => typeof u === "string" && /^https?:/i.test(u);
      const canvas = (nodes || []).map((n, i) => ({
        i,
        kind: n.data?.kind,
        model: n.data?.model || null,
        aspect: n.data?.aspect || null,
        status: n.data?.status || (n.data?.output ? "done" : "empty"),
        error: n.data?.error || null,
        prompt: (n.data?.prompt || "").slice(0, 200) || null,
        output: isUrl(n.data?.output) ? n.data.output : null,
      }));
      // ONE image Romy can literally look at (vision critique): the selected
      // image, else the most recent finished image node. Sending two made her
      // hedge across both ("for the first image… for the second image…") when
      // the user said "the image".
      const resultImages = [];
      if (isUrl(selectedImageUrl)) {
        resultImages.push(selectedImageUrl);
      } else {
        for (let i = canvas.length - 1; i >= 0; i--) {
          const c = canvas[i];
          if (c.kind === "image" && c.output) { resultImages.push(c.output); break; }
        }
      }
      const resultImageIsSelected = isUrl(selectedImageUrl);
      // History hygiene: drop degenerate fallback replies (feeding them back
      // makes the model mimic its own junk), and annotate action turns so the
      // model remembers WHAT it created, not just what it said.
      const DEGENERATE = [/^Done\.$/, /^Sorry, I lost my train of thought/, /^⚠/];
      const chatHistory = history
        .filter((m) => !(m.role === "assistant" && DEGENERATE.some((r) => r.test(m.content || ""))))
        .map((m) => ({
          role: m.role,
          content: m.role === "assistant" && m.action
            ? `${m.content} ${m.action.director
                ? `[created a ${m.action.count}-scene director video]`
                : `[created a ${m.action.kind} node${m.action.prompt ? ` with prompt: "${m.action.prompt.slice(0, 100)}"` : ""}]`}`
            : m.content,
        }));
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: text, history: chatHistory, context: { hasSelectedImage: !!hasSelectedImage, influencers, canvas, resultImages, resultImageIsSelected } }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      const isDirector = Array.isArray(data.scenes) && data.scenes.length >= 2;
      setHistory((h) => [
        ...h,
        {
          role: "assistant",
          content: data.message || "Done.",
          action: isDirector
            ? { director: true, count: data.scenes.length }
            : data.kind
              ? { kind: data.kind, prompt: data.prompt }
              : null,
        },
      ]);
      if (isDirector) onDirector({ scenes: data.scenes, character: data.character }, videoModel, data.useSelectedImage);
      else if (data.kind) onCreateAndMaybeRun({ kind: data.kind, prompt: data.prompt }, autoRun, data.useSelectedImage);
    } catch (e) {
      setHistory((h) => [...h, { role: "assistant", content: `⚠ ${e.message}` }]);
    } finally {
      setSending(false);
    }
  };

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="cb-sidepanel">
      <div className="cb-modal">
        <div className="cb-head">
          <div className="cb-head-title">
            <span className="cb-spark">✦</span> Romy
          </div>
          <div className="cb-head-actions">
            {history.length > 0 && (
              <button className="cb-iconbtn" onClick={() => setHistory([])} title="New chat">New chat</button>
            )}
            <button className="cb-iconbtn cb-close" onClick={onClose} title="Close">✕</button>
          </div>
        </div>

        <div className="cb-messages" ref={scrollRef}>
          {history.length === 0 && (
            <div className="cb-welcome">
              <div className="cb-welcome-icon">✦</div>
              <h3>Hey, I'm Romy ✦</h3>
              <p>Tell me what to create and I'll build and run the right node — or ask me anything: who your influencers are, which model fits a task, or why a result looks off. Select an image and I can look at it and tell you exactly how to make it better.</p>
            </div>
          )}

          {history.map((m, i) => (
            <div key={i} className={`cb-msg cb-msg-${m.role}`}>
              <div className="cb-bubble">
                {m.content}
                {m.action && (
                  <div className="cb-chip">
                    {m.action.director
                      ? `✦ Directing ${m.action.count} scenes → generating in parallel & stitching into one video…`
                      : `✦ Created ${m.action.kind} node${m.action.prompt ? ` — "${m.action.prompt.slice(0, 50)}${m.action.prompt.length > 50 ? "…" : ""}"` : ""}`}
                  </div>
                )}
              </div>
            </div>
          ))}

          {sending && (
            <div className="cb-msg cb-msg-assistant">
              <div className="cb-bubble cb-thinking">
                <span className="cb-dot" /><span className="cb-dot" /><span className="cb-dot" />
              </div>
            </div>
          )}
        </div>

        <div className="cb-inputbar">
          <div className="cb-autorun-row">
            <button
              className={`cb-autorun ${autoRun ? "on" : ""}`}
              onClick={() => setAutoRun((v) => !v)}
              title="When on, generated nodes run automatically"
            >
              ⚡ Auto-run {autoRun ? "on" : "off"}
            </button>
          </div>
          <div className="cb-inputrow">
            <textarea
              ref={inputRef}
              className="cb-textarea"
              placeholder="Describe what you want to create…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              rows={1}
            />
            <button className="cb-send" onClick={send} disabled={!input.trim() || sending} title="Send">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
