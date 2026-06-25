"use client";
import { useEffect, useState } from "react";
import TopBar from "@/components/TopBar";
import UserMenu from "@/components/UserMenu";
import { listInfluencers, upsertInfluencer, deleteInfluencer, normHandle } from "@/lib/influencers";

// Downscale an uploaded image to a small JPEG data URL so it fits comfortably
// in localStorage and uploads fast as a generation reference. Long side capped.
function downscale(file, max = 1024) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const c = document.createElement("canvas");
        c.width = w; c.height = h;
        c.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(c.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = () => reject(new Error("Could not read image"));
      img.src = r.result;
    };
    r.onerror = () => reject(r.error || new Error("File read failed"));
    r.readAsDataURL(file);
  });
}

const BLANK = { id: null, handle: "", name: "", description: "", image: null };

export default function InfluencersPage() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null); // draft object or null
  const [busy, setBusy] = useState(false);

  useEffect(() => { setItems(listInfluencers()); }, []);

  const openNew = () => setEditing({ ...BLANK });
  const openEdit = (inf) => setEditing({ ...inf });

  const onImage = async (file) => {
    if (!file) return;
    setBusy(true);
    try {
      const image = await downscale(file);
      setEditing((e) => ({ ...e, image }));
    } catch {} finally { setBusy(false); }
  };

  const onSave = () => {
    const handle = normHandle(editing.handle || editing.name);
    const name = (editing.name || "").trim() || handle;
    if (!handle || !editing.image) return;
    const id = editing.id || `inf_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const next = upsertInfluencer({
      id,
      handle,
      name,
      description: (editing.description || "").trim(),
      image: editing.image,
      ts: editing.ts || Date.now(),
    });
    setItems(next);
    setEditing(null);
  };

  const onDelete = (id, e) => {
    e?.stopPropagation();
    if (!confirm("Delete this influencer?")) return;
    setItems(deleteInfluencer(id));
  };

  const canSave = editing && !!editing.image && !!normHandle(editing.handle || editing.name);

  return (
    <div className="ip-page">
      <TopBar right={<>
        <button className="primary-btn" onClick={openNew}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
          New influencer
        </button>
        <UserMenu />
      </>} />

      <div className="dash-body">
        <h1 className="dash-h1">Your influencers</h1>
        <p className="dash-sub">Create a character once, then summon her anywhere with <b>@handle</b> — e.g. type <b>“@sofie in a pool”</b> in the Image, Video, or Canvas prompt and her likeness is used automatically.</p>

        {items.length === 0 ? (
          <div className="dash-empty">
            <div className="dash-empty-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>
            </div>
            <h2>No influencers yet</h2>
            <p>Build your first character to use across the app.</p>
            <button className="primary-btn" onClick={openNew}>Create influencer</button>
          </div>
        ) : (
          <div className="inf-grid">
            <div className="inf-card inf-card-new" onClick={openNew}>
              <div className="inf-card-new-plus">+</div>
              <div>New influencer</div>
            </div>
            {items.map((inf) => (
              <div key={inf.id} className="inf-card" onClick={() => openEdit(inf)}>
                <div className="inf-card-photo" style={{ backgroundImage: `url(${inf.image})` }} />
                <div className="inf-card-meta">
                  <div className="inf-card-name">{inf.name}</div>
                  <div className="inf-card-handle">@{inf.handle}</div>
                  {inf.description && <div className="inf-card-desc">{inf.description}</div>}
                </div>
                <button className="inf-card-del" onClick={(e) => onDelete(inf.id, e)} title="Delete">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {editing && (
        <div className="nw-backdrop" onClick={() => setEditing(null)}>
          <div className="nw-modal inf-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="nw-title">{editing.id ? "Edit influencer" : "New influencer"}</h3>
            <p className="nw-sub">A name, a handle, and one clear reference photo (face + body visible works best).</p>

            <div className="inf-form">
              <label className="inf-photo-pick">
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { onImage(e.target.files?.[0]); e.target.value = ""; }} />
                {editing.image ? (
                  <img src={editing.image} alt="reference" />
                ) : (
                  <span className="inf-photo-empty">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg>
                    {busy ? "Processing…" : "Upload photo"}
                  </span>
                )}
              </label>

              <div className="inf-fields">
                <label className="inf-label">Name</label>
                <input
                  className="nw-input"
                  autoFocus
                  placeholder="Sofie"
                  value={editing.name}
                  onChange={(e) => setEditing((x) => ({ ...x, name: e.target.value }))}
                />
                <label className="inf-label">Handle</label>
                <div className="inf-handle-input">
                  <span>@</span>
                  <input
                    placeholder={normHandle(editing.name) || "sofie"}
                    value={editing.handle}
                    onChange={(e) => setEditing((x) => ({ ...x, handle: normHandle(e.target.value) }))}
                  />
                </div>
                <label className="inf-label">Description <span className="inf-opt">(optional)</span></label>
                <textarea
                  className="nw-input inf-textarea"
                  placeholder="22, sun-kissed blonde, athletic, warm smile…"
                  value={editing.description}
                  onChange={(e) => setEditing((x) => ({ ...x, description: e.target.value }))}
                  rows={2}
                />
              </div>
            </div>

            <div className="nw-actions">
              {editing.id && <button className="nw-cancel" onClick={(e) => onDelete(editing.id, e)} style={{ marginRight: "auto" }}>Delete</button>}
              <button className="nw-cancel" onClick={() => setEditing(null)}>Cancel</button>
              <button className="primary-btn" onClick={onSave} disabled={!canSave}>Save influencer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
