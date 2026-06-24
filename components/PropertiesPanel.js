"use client";

const PROMPT_KINDS = new Set(["image", "video", "text", "audio", "motion"]);

export default function PropertiesPanel({ node, onChange, onClose }) {
  if (!node) return null;
  const data = node.data || {};

  const set = (patch) => onChange(node.id, { ...data, ...patch });

  return (
    <div className="props">
      <h3>
        Properties
        <button className="props-close" onClick={onClose}>×</button>
      </h3>
      <div className="props-kind">{data.kind} node</div>

      <label>Label</label>
      <input
        value={data.label || ""}
        onChange={(e) => set({ label: e.target.value })}
      />

      {PROMPT_KINDS.has(data.kind) && (
        <>
          <label>Prompt</label>
          <textarea
            placeholder={`Describe the ${data.kind} you want to generate...`}
            value={data.prompt || ""}
            onChange={(e) => set({ prompt: e.target.value })}
          />
        </>
      )}

      {data.output && (
        <>
          <div className="props-output-label">Last output</div>
          {data.kind === "image" && data.output.startsWith("http") ? (
            <img src={data.output} alt="output" style={{ width: "100%", borderRadius: 6, border: "1px solid #1f1f1f" }} />
          ) : (
            <div className="props-output">{data.output}</div>
          )}
        </>
      )}
    </div>
  );
}
