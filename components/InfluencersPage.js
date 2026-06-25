"use client";
import { useEffect, useState } from "react";
import TopBar from "@/components/TopBar";
import UserMenu from "@/components/UserMenu";
import SectionHero from "@/components/SectionHero";
import { listInfluencers, syncInfluencers, saveInfluencerRemote, deleteInfluencerRemote, normHandle } from "@/lib/influencers";

// Downscale an uploaded image to a small JPEG data URL so it uploads fast and
// fits comfortably in storage. Long side capped.
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

const BLANK = { id: null, handle: "", description: "", image: null };

export default function InfluencersPage() {
  const [items, setItems] = useState(null); // null = still loading
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);

  // Render the local cache instantly (loading only if there's no cache), then
  // reconcile with the server. A fail-safe timeout guarantees we never sit on
  // the spinner forever if the network/sync stalls.
  useEffect(() => {
    let alive = true;
    const cached = listInfluencers();
    setItems(cached.length ? cached : null);
    let settled = false;
    syncInfluencers()
      .then((list) => { settled = true; if (alive && Array.isArray(list)) setItems(list); })
      .catch(() => { settled = true; if (alive) setItems(cached); });
    const t = setTimeout(() => { if (alive && !settled) setItems(cached); }, 4000);
    return () => { alive = false; clearTimeout(t); };
  }, []);

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

  const onSave = async () => {
    const handle = normHandle(editing.handle);
    if (!handle || !editing.image) return;
    const id = editing.id || `inf_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setEditing(null);
    await saveInfluencerRemote({
      id, handle, name: handle, description: editing.description || "",
      image: editing.image, ts: editing.ts || Date.now(),
    });
    setItems(await syncInfluencers());
  };

  const onDelete = async (id, e) => {
    e?.stopPropagation();
    if (!confirm("Delete this influencer?")) return;
    await deleteInfluencerRemote(id);
    setItems(await syncInfluencers());
  };

  const canSave = editing && !!editing.image && !!normHandle(editing.handle);
  const list = items || [];

  return (
    <div className="ip-page">
      <TopBar right={<>
        <button className="primary-btn" onClick={openNew}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
          New influencer
        </button>
        <UserMenu />
      </>} />

      <div className="inf-scroll">
      <SectionHero
        title="Build your"
        brand="Influencers"
        sub="Create a character once, then summon her anywhere with @handle — type “@ash on a beach” in any Image, Video, or Canvas prompt and her likeness is used automatically."
        tiles={[
          { hue: "linear-gradient(135deg,#ec4899,#a855f7)", label: "Face" },
          { hue: "linear-gradient(135deg,#a855f7,#3b82f6)", label: "Style" },
          { hue: "linear-gradient(135deg,#f59e0b,#ec4899)", label: "Persona" },
          { hue: "linear-gradient(135deg,#10b981,#0ea5e9)", label: "@handle" },
        ]}
      />

      <div className="inf-body">
        <div className="inf-head">
          <h1 className="inf-h1">Your influencers</h1>
          <p className="inf-headsub">Summon them anywhere with <b>@handle</b> — e.g. type <b>“@ash on a beach”</b> in any Image, Video, or Canvas prompt.</p>
        </div>

        {items === null ? (
          <div className="inf-loading">
            <span className="inf-spinner" /> Loading your influencers…
          </div>
        ) : (
          <div className="inf-grid">
            <button className="inf-card inf-card-new" onClick={openNew}>
              <div className="inf-card-new-plus">+</div>
              <div>New influencer</div>
            </button>
            {list.map((inf) => (
              <div key={inf.id} className="inf-card" onClick={() => openEdit(inf)}>
                <div className="inf-card-photo">
                  <img
                    src={inf.image}
                    alt={inf.handle}
                    loading="lazy"
                    onError={(e) => { const p = e.currentTarget.closest(".inf-card-photo"); if (p) p.classList.add("is-broken"); }}
                  />
                  <span className="inf-card-broken">⟳ Re-upload photo</span>
                </div>
                <div className="inf-card-meta">
                  <div className="inf-card-name">@{inf.handle}</div>
                </div>
                <button className="inf-card-del" onClick={(e) => onDelete(inf.id, e)} title="Delete">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>

      {editing && (
        <div className="nw-backdrop" onClick={() => setEditing(null)}>
          <div className="nw-modal inf-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="nw-title">{editing.id ? "Edit influencer" : "New influencer"}</h3>
            <p className="nw-sub">A user_name and one clear reference photo (face + body visible works best).</p>

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
                <label className="inf-label">user_name</label>
                <div className="inf-handle-input">
                  <span>@</span>
                  <input
                    autoFocus
                    placeholder="katrina"
                    value={editing.handle}
                    onChange={(e) => setEditing((x) => ({ ...x, handle: normHandle(e.target.value) }))}
                  />
                </div>
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
