import { App } from "@modelcontextprotocol/ext-apps";

const root = document.getElementById("root");

function render(url, kind) {
  if (!url) {
    root.innerHTML = `<div class="msg">Rendering… check again in a moment.</div>`;
    return;
  }
  const isVideo = kind === "video" || /\.(mp4|webm|mov)(\?|$)/i.test(url);
  root.innerHTML = isVideo
    ? `<video src="${url}" controls autoplay loop playsinline></video>`
    : `<img src="${url}" alt="" />`;
}

function extract(params) {
  if (!params) return { url: null };
  // The notification params may nest the tool result under `result`.
  const r = params.result || params;
  const sc = r.structuredContent;
  if (sc && sc.url) return { url: sc.url, kind: sc.kind };
  const text = (r.content || []).map((c) => (c && c.text) || "").join(" ");
  const m = text.match(/https?:\/\/\S+\.(mp4|webm|mov|png|jpe?g|webp|gif)(\?\S*)?/i);
  if (m) return { url: m[0], kind: /\.(mp4|webm|mov)/i.test(m[0]) ? "video" : "image" };
  return { url: null };
}

const app = new App({ name: "Geoflix Media", version: "1.0.0" });

app.ontoolresult = (params) => {
  const { url, kind } = extract(params);
  render(url, kind);
};

app
  .connect()
  .catch((e) => {
    root.innerHTML = `<div class="msg">Widget init error: ${e && e.message ? e.message : e}</div>`;
  });
