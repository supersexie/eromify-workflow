"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  ConnectionMode,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  useReactFlow,
} from "@xyflow/react";
import WorkflowNode from "./nodes/WorkflowNode";
import PromptBar from "./PromptBar";
import Assistant from "./Assistant";
import Library from "./Library";
import UserMenu from "./UserMenu";
import Tabs from "./Tabs";
import { getWorkflow, saveWorkflow, renameWorkflow, recordGeneration } from "@/lib/store";
import { generateOutput, generateVideo, combineVideos } from "@/lib/run";
import { nodeDims } from "@/lib/cardSize";
import { resolveMentions, syncInfluencers, IDENTITY_CLAUSE } from "@/lib/influencers";

const NODE_TYPES_META = [
  { kind: "image", label: "Image", sub: "Generate or upload" },
  { kind: "video", label: "Video", sub: "Generate or upload" },
];

const CARD_ICONS = {
  image: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" /></svg>,
  video: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m22 8-6 4 6 4V8Z" /><rect x="2" y="6" width="14" height="12" rx="2" /></svg>,
  text: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 7V5h16v2M9 19h6M12 5v14" /></svg>,
  audio: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M11 5 6 9H2v6h4l5 4V5z"/></svg>,
  motion: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="6 3 20 12 6 21 6 3" fill="currentColor" /></svg>,
};

// Picsart-style "Transformation" operations. Not wired to a backend yet, so
// these render as disabled "Soon" rows to match the reference layout honestly.
const XFORM_META = [
  { key: "upscale", label: "Upscale", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3M11 8v6M8 11h6"/></svg> },
  { key: "enhance", label: "Enhance", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15l-1.9-4.1L5.5 9l4.6-1.4L12 3zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z"/></svg> },
  { key: "removebg", label: "Remove Background", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="3 3"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg> },
  { key: "animate", label: "Animate", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none"/></svg> },
  { key: "extract", label: "Extract Frames", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 9h4M3 15h4M17 9h4M17 15h4M9 5v14"/></svg> },
];

const RAIL_ICONS = {
  cursor: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z" /></svg>,
  plus: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>,
  frame: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" /><path d="M3 12h2M19 12h2M12 3v2M12 19v2"/></svg>,
  grid: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>,
  chat: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" /></svg>,
  folder: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h6l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" /></svg>,
  undo: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-15-6.7L3 13"/></svg>,
  redo: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 15-6.7L21 13"/></svg>,
};

const SIZE = { image: 304, video: 525, text: 213, audio: 304, motion: 304 };
const HEIGHT = { image: 340, video: 320, text: 340, audio: 340, motion: 340 };

let idCounter = 0;
const nextId = () => `n_${++idCounter}_${Math.random().toString(36).slice(2, 6)}`;

function CanvasInner({ workflowId }) {
  const router = useRouter();
  const { screenToFlowPosition, fitView, setCenter, getZoom } = useReactFlow();
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [name, setName] = useState("Untitled Canvas");
  const [loaded, setLoaded] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [runningIds, setRunningIds] = useState(() => new Set());
  const [savedAt, setSavedAt] = useState(null);
  const [picker, setPicker] = useState(null); // { x, y, flowPos, sourceId }
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);
  const saveTimer = useRef(null);
  const histTimer = useRef(null);
  const connectingRef = useRef(null);
  const skipNextHistRef = useRef(false);
  const lastSnapshotRef = useRef(null);
  const loadedIdRef = useRef(null);
  const nodesRef = useRef(nodes);
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);

  // Snapshot helpers
  const snapshot = useCallback(() => ({
    nodes: nodes.map((n) => ({ ...n, data: { ...n.data } })),
    edges: edges.map((e) => ({ ...e })),
  }), [nodes, edges]);

  const restore = useCallback((snap) => {
    skipNextHistRef.current = true;
    setNodes(snap.nodes);
    setEdges(snap.edges);
  }, []);

  const undo = useCallback(() => {
    setPast((p) => {
      if (!p.length) return p;
      const prev = p[p.length - 1];
      setFuture((f) => [snapshot(), ...f].slice(0, 50));
      restore(prev);
      return p.slice(0, -1);
    });
  }, [snapshot, restore]);

  const redo = useCallback(() => {
    setFuture((f) => {
      if (!f.length) return f;
      const next = f[0];
      setPast((p) => [...p, snapshot()].slice(-50));
      restore(next);
      return f.slice(1);
    });
  }, [snapshot, restore]);

  useEffect(() => {
    if (!workflowId) return;
    // Load each workflow's nodes from storage ONCE. Without this guard a stray
    // re-run (e.g. a changed router ref) would overwrite the live in-memory
    // nodes with the stored copy — making freshly-added nodes vanish.
    if (loadedIdRef.current === workflowId) return;
    const wf = getWorkflow(workflowId);
    if (!wf) { router.replace("/app"); return; }
    loadedIdRef.current = workflowId;
    setNodes(wf.nodes || []);
    setEdges(wf.edges || []);
    setName(wf.name || "Untitled Canvas");
    setLoaded(true);
    // Remember the open canvas so the Canvas nav tab returns here (instead of
    // the all-canvases dashboard) when you come back from another section.
    try { localStorage.setItem("eromify:lastCanvas", workflowId); } catch {}
  }, [workflowId, router]);

  // Hydrate the influencer cache from the server so @mentions resolve here too.
  useEffect(() => { syncInfluencers(); }, []);

  useEffect(() => {
    if (!loaded || !workflowId) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveWorkflow({ id: workflowId, name, nodes, edges });
      setSavedAt(Date.now());
    }, 500);
    return () => clearTimeout(saveTimer.current);
  }, [nodes, edges, name, workflowId, loaded]);

  // History snapshot (debounced) — captures the PREVIOUS state before the change settled
  useEffect(() => {
    if (!loaded) return;
    if (skipNextHistRef.current) {
      skipNextHistRef.current = false;
      lastSnapshotRef.current = { nodes, edges };
      return;
    }
    clearTimeout(histTimer.current);
    histTimer.current = setTimeout(() => {
      const prev = lastSnapshotRef.current;
      if (prev) {
        setPast((p) => [...p, prev].slice(-50));
        setFuture([]);
      }
      lastSnapshotRef.current = {
        nodes: nodes.map((n) => ({ ...n, data: { ...n.data } })),
        edges: edges.map((e) => ({ ...e })),
      };
    }, 500);
    return () => clearTimeout(histTimer.current);
  }, [nodes, edges, loaded]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || e.target?.isContentEditable) return;
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
      } else if (mod && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  // Propagate upstream output → downstream sourceThumb
  const sourcesByNode = useMemo(() => {
    const map = {};
    for (const e of edges) {
      const src = nodes.find((n) => n.id === e.source);
      if (!src) continue;
      const out = src.data?.output;
      if (!out || typeof out !== "string") continue;
      const isUrl = out.startsWith("http") || out.startsWith("data:") || out.startsWith("/api/");
      const isText = src.data.kind === "text";
      if (!isUrl && !isText) continue;
      (map[e.target] ||= []).push({
        id: src.id,
        kind: src.data.kind,
        url: isUrl ? out : null,
        text: isText ? out : null,
      });
    }
    return map;
  }, [nodes, edges]);

  // Sync sourceThumb into each node's data (so the node renders it)
  useEffect(() => {
    setNodes((ns) => {
      let changed = false;
      const next = ns.map((n) => {
        const wanted = (sourcesByNode[n.id] || []).find((x) => x.url)?.url || null;
        if ((n.data?.sourceThumb || null) === wanted) return n;
        changed = true;
        return { ...n, data: { ...n.data, sourceThumb: wanted } };
      });
      return changed ? next : ns;
    });
  }, [sourcesByNode]);

  const nodeTypes = useMemo(() => ({ workflow: WorkflowNode }), []);

  const onNodesChange = useCallback((c) => setNodes((n) => applyNodeChanges(c, n)), []);
  const onEdgesChange = useCallback((c) => setEdges((e) => applyEdgeChanges(c, e)), []);
  const onConnect = useCallback((p) => setEdges((e) => addEdge({ ...p, animated: true }, e)), []);

  const updateNodeData = useCallback((id, newData) => {
    setNodes((ns) => ns.map((n) => {
      if (n.id !== id) return n;
      const next = { ...n, data: newData };
      // Keep React Flow's stored size in sync so the card reshapes with the
      // chosen aspect ratio (handles/edges follow). Null for text/audio.
      const d = nodeDims(newData.kind, newData.aspect);
      if (d) { next.width = d.width; next.height = d.height; }
      return next;
    }));
  }, []);

  const addNode = (kind, options = {}) => {
    const d = nodeDims(kind, options.aspect);
    const W = d ? d.width : (SIZE[kind] || 304);
    const H = d ? d.height : (HEIGHT[kind] || 340);
    let pos = options.position;
    if (!pos) {
      pos = {
        x: 200 + (nodes.length % 3) * (W + 60),
        y: 80 + Math.floor(nodes.length / 3) * (H + 60),
      };
    }
    const id = nextId();
    const data = { kind, prompt: options.prompt || "" };
    if (options.model) data.model = options.model;
    else if (kind === "video") data.model = "Kling 2.6";
    if (options.aspect) data.aspect = options.aspect;
    const node = { id, type: "workflow", position: pos, data, width: W, height: H };
    setNodes((n) => [...n, node]);
    if (options.connectFrom) {
      setEdges((e) => addEdge({ source: options.connectFrom, target: id, animated: true }, e));
    }
    // connectTo: the new node feeds INTO an existing node (left-handle drag).
    if (options.connectTo) {
      setEdges((e) => addEdge({ source: id, target: options.connectTo, animated: true }, e));
    }
    setSelectedId(id);
    setAddMenuOpen(false);
    // Pan/zoom the viewport to the new card so the user lands on it instead of
    // hunting for it (preserve their zoom, but don't stay zoomed too far out).
    const cx = pos.x + W / 2, cy = pos.y + H / 2;
    requestAnimationFrame(() => setCenter(cx, cy, { zoom: Math.max(getZoom(), 0.7), duration: 450 }));
    return id;
  };

  const onSelectionChange = useCallback(({ nodes: selNodes }) => {
    setSelectedId(selNodes?.[0]?.id || null);
  }, []);

  const onTitleChange = (v) => {
    setName(v);
    if (workflowId) renameWorkflow(workflowId, v);
  };

  // Run a single node by id. Reads its sources via sourcesByNode (which the
  // outer effect keeps in sync with `nodes`/`edges`), so this works for newly
  // spawned batch clones too once their state lands.
  const runSingleNode = async (id) => {
    const node = nodesRef.current.find((n) => n.id === id);
    if (!node) return;
    setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, data: { ...n.data, status: "running", output: null, error: null } } : n)));
    try {
      let output;
      const srcs = sourcesByNode[id] || [];
      const textPrompt = srcs.find((s) => s.kind === "text" && s.text)?.text;
      const typed = (node.data.prompt || "").trim();
      const rawPrompt = typed || textPrompt || "";
      // Resolve @handles → swap to the character's name and surface her photo so
      // it can be attached as a likeness reference (image start image / image-to-image).
      const { prompt: resolvedPrompt, characters } = resolveMentions(rawPrompt);
      const charImage = characters[0]?.image || null;
      // Lock identity to the reference when a character is used (Nano Banana Pro
      // otherwise renders a stranger).
      const prompt = charImage ? `${resolvedPrompt} ${IDENTITY_CLAUSE}` : resolvedPrompt;
      if (node.data.kind === "video") {
        // Aspect + quality are stored as separate fields now. Fall back to the
        // legacy "16:9 · 720p" combined string for older nodes.
        const rawAspect = node.data.aspect || "";
        const [legacyRatio, legacyRes] = rawAspect.includes("·")
          ? rawAspect.split("·").map((s) => s.trim())
          : [rawAspect, null];
        const aspectRatio = legacyRatio || "16:9";
        const resolution = node.data.quality || legacyRes || "720p";
        const dur = parseInt(node.data.duration) || 8;
        output = await generateVideo({
          prompt,
          model: node.data.model || "LTX Video",
          image: node.data.sourceThumb || charImage || null,
          aspect: aspectRatio,
          resolution,
          duration: dur,
        });
      } else {
        const images = node.data.kind === "image"
          ? srcs.filter((s) => s.kind === "image" && s.url).map((s) => s.url)
          : [];
        // Attach a mentioned influencer's photo as a likeness reference.
        if (node.data.kind === "image" && charImage && !images.includes(charImage)) images.push(charImage);
        // Forward aspect + quality (image kind only) so fal renders at the
        // chip-selected ratio/resolution instead of defaulting to square.
        // Legacy "16:9 · 720p" strings still parse — we split for back-compat.
        const opts = { voice: node.data.voice };
        if (node.data.kind === "image") {
          const rawAspect = node.data.aspect || "";
          const [legacyRatio, legacyRes] = rawAspect.includes("·")
            ? rawAspect.split("·").map((s) => s.trim())
            : [rawAspect, null];
          opts.aspect = legacyRatio || "1:1";
          opts.quality = node.data.quality || legacyRes || "1K";
        }
        output = await generateOutput(node.data.kind, prompt, node.data.model, images, opts);
      }
      // Record into the persistent library BEFORE updating the node, so a prior
      // output that this regeneration replaces is kept in the Library.
      recordGeneration({
        url: output,
        kind: node.data.kind,
        prompt,
        workflowId,
        workflowName: name,
        nodeId: id,
      });
      setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, data: { ...n.data, status: "done", output } } : n)));
    } catch (e) {
      setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, data: { ...n.data, status: "error", error: e.message } } : n)));
    }
  };

  const runNode = async (id) => {
    if (runningIds.has(id)) return;
    const node = nodesRef.current.find((n) => n.id === id);
    if (!node) return;
    const batch = Math.max(1, Math.min(4, parseInt(node.data.runCount) || 1));

    // Single run — fast path, no cloning.
    if (batch <= 1) {
      setRunningIds((s) => new Set(s).add(id));
      try {
        await runSingleNode(id);
      } finally {
        setRunningIds((s) => { const n = new Set(s); n.delete(id); return n; });
      }
      return;
    }

    // Batch run — spawn N-1 clones to the right of the original, copy the
    // incoming edges so they inherit the same source(s), then run all N
    // generations in parallel. Each clone has runCount reset to 1 so the
    // user doesn't get a runaway recursion if they later hit Run on a clone.
    const W = node.width || SIZE[node.data.kind] || 304;
    const GAP = 40;
    const incomingEdges = edges.filter((e) => e.target === id);
    const cloneIds = [];
    const cloneNodes = [];
    for (let i = 1; i < batch; i++) {
      const cid = nextId();
      cloneIds.push(cid);
      cloneNodes.push({
        ...node,
        id: cid,
        selected: false,
        position: { x: node.position.x + i * (W + GAP), y: node.position.y },
        data: { ...node.data, runCount: 1, status: undefined, output: null, error: null, sourceThumb: node.data.sourceThumb || null },
      });
    }
    const newEdges = cloneIds.flatMap((cid) =>
      incomingEdges.map((ie) => ({
        id: `e_${ie.source}_${cid}_${Math.random().toString(36).slice(2, 6)}`,
        source: ie.source,
        target: cid,
        targetHandle: ie.targetHandle,
        animated: true,
      }))
    );
    setNodes((ns) => [...ns, ...cloneNodes]);
    setEdges((es) => [...es, ...newEdges]);

    // Give React a tick so sourcesByNode picks up the new edges before we run.
    await new Promise((r) => setTimeout(r, 60));

    const allIds = [id, ...cloneIds];
    setRunningIds((s) => { const n = new Set(s); allIds.forEach((x) => n.add(x)); return n; });
    await Promise.all(
      allIds.map((rid) =>
        runSingleNode(rid).finally(() => {
          setRunningIds((s) => { const n = new Set(s); n.delete(rid); return n; });
        })
      )
    );
  };

  const setNodeData = (id, patch) =>
    setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...patch } } : n)));

  const addEdgeBetween = (source, target) =>
    setEdges((es) => [...es, { id: `e_${source}_${target}`, source, target, animated: true }]);

  // Director mode (character-consistent): one reference image → per-scene
  // staged image (image-to-image) → image-to-video → stitch into one video.
  const runDirector = async ({ scenes, character, seedImage }, model = "LTX Video") => {
    const list = (scenes || []).slice(0, 6);
    if (list.length < 2) return;
    const IMG_MODEL = "Flux 2 Pro"; // reliable for text-to-image + image-to-image
    const colX = { ref: 40, img: 420, vid: 900, out: 1480 };
    const gapY = 330;
    const midY = 80 + ((list.length - 1) * gapY) / 2;

    // 1) Reference image (shared seed for every scene). Use the selected image
    //    if provided ("turn this image into a video"), else generate one.
    let refUrl = seedImage || null;
    let refId = null;
    if (!refUrl && character) {
      refId = addNode("image", { prompt: character, model: IMG_MODEL, aspect: "16:9 · 1080p", position: { x: colX.ref, y: midY } });
      setNodeData(refId, { status: "running", output: null, error: null });
      try {
        refUrl = await generateOutput("image", character, IMG_MODEL);
        setNodeData(refId, { status: "done", output: refUrl });
      } catch (e) {
        setNodeData(refId, { status: "error", error: e.message });
      }
    }

    // 2) Per scene: stage the character into the scene (image-to-image), then
    //    animate that staged image (image-to-video). Runs in parallel.
    const combineId = addNode("video", { prompt: "Combined video", aspect: "16:9 · 720p", position: { x: colX.out, y: midY } });
    setNodeData(combineId, { status: "running" });

    const vidIds = [];
    const results = await Promise.all(
      list.map(async (scene, i) => {
        const y = 80 + i * gapY;
        const vidId = addNode("video", { prompt: scene, model, aspect: "16:9 · 720p", position: { x: colX.vid, y } });
        vidIds.push(vidId);
        // Staged scene image (only if we have a reference to seed from).
        let seed = null;
        if (refUrl) {
          const imgId = addNode("image", { prompt: scene, model: IMG_MODEL, aspect: "16:9 · 1080p", position: { x: colX.img, y } });
          if (refId) addEdgeBetween(refId, imgId);
          addEdgeBetween(imgId, vidId);
          setNodeData(imgId, { status: "running" });
          try {
            seed = await generateOutput("image", scene, IMG_MODEL, [refUrl]);
            setNodeData(imgId, { status: "done", output: seed });
          } catch (e) {
            setNodeData(imgId, { status: "error", error: e.message });
          }
        }
        addEdgeBetween(vidId, combineId);
        setNodeData(vidId, { status: "running" });
        try {
          const clip = await generateVideo({ prompt: scene, model, image: seed || null, aspect: "16:9", resolution: "720p", duration: 6 });
          setNodeData(vidId, { status: "done", output: clip });
          return clip;
        } catch (e) {
          setNodeData(vidId, { status: "error", error: e.message });
          return null;
        }
      })
    );

    // 3) Stitch the finished clips into one video.
    const urls = results.filter(Boolean);
    if (urls.length < 2) {
      setNodeData(combineId, { status: "error", error: "Not enough scenes generated to combine" });
      return;
    }
    try {
      const finalUrl = await combineVideos(urls, urls.map(() => 5));
      setNodeData(combineId, { status: "done", output: finalUrl });
      fitView({ padding: 0.2, duration: 400 });
    } catch (e) {
      setNodeData(combineId, { status: "error", error: e.message });
    }
  };

  // Drop-to-create wiring
  const onConnectStart = useCallback((_, params) => {
    connectingRef.current = params; // { nodeId, handleId, handleType }
  }, []);

  const onConnectEnd = useCallback((event) => {
    const conn = connectingRef.current;
    connectingRef.current = null;
    if (!conn) return;
    const targetIsPane = event.target.classList?.contains("react-flow__pane");
    if (!targetIsPane) return;

    const clientX = "touches" in event ? event.changedTouches[0].clientX : event.clientX;
    const clientY = "touches" in event ? event.changedTouches[0].clientY : event.clientY;
    const flowPos = screenToFlowPosition({ x: clientX, y: clientY });
    // handleType "source" → drag right, new node is downstream (fed BY this one).
    // handleType "target" → drag left, new node is upstream (FEEDS this one).
    setPicker({ x: clientX, y: clientY, flowPos, nodeId: conn.nodeId, handleType: conn.handleType });
  }, [screenToFlowPosition]);

  const pickType = (kind) => {
    if (!picker) return;
    const W = SIZE[kind] || 304;
    const H = HEIGHT[kind] || 340;
    const upstream = picker.handleType === "target";
    addNode(kind, {
      // Place an upstream node so its right edge sits near the drop point.
      position: { x: upstream ? picker.flowPos.x - W : picker.flowPos.x, y: picker.flowPos.y - H / 2 },
      ...(upstream ? { connectTo: picker.nodeId } : { connectFrom: picker.nodeId }),
    });
    setPicker(null);
  };

  const selectedNode = nodes.find((n) => n.id === selectedId);
  const selectedSources = selectedId ? (sourcesByNode[selectedId] || []) : [];
  const selectedImageUrl =
    selectedNode?.data?.kind === "image" &&
    typeof selectedNode.data.output === "string" &&
    /^(https?:|data:|\/api\/)/.test(selectedNode.data.output)
      ? selectedNode.data.output
      : null;

  if (!loaded) return <div style={{ color: "#5b6472", padding: 32 }}>Loading…</div>;

  return (
    <>
      <div className="topbar">
        <div className="title-pill">
          <button className="back-btn" onClick={() => router.push("/app")} title="Back">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <div className="logo">e</div>
          <input value={name} onChange={(e) => onTitleChange(e.target.value)} />
          <span className="dot" />
        </div>
        <div className="topbar-nav">
          <Tabs showBrand={false} />
        </div>
        <div className="topbar-right">
          {savedAt && <span className="save-indicator">Saved</span>}
          <button className="assistant-open-btn" onClick={() => setAssistantOpen(true)} title="Open AI Assistant">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2 6h6l-5 4 2 7-7-4-7 4 2-7-5-4h6z"/></svg>
            Assistant
          </button>
          <UserMenu />
        </div>
      </div>

      <div className="rail">
        <button title="Select">{RAIL_ICONS.cursor}</button>
        <button title="Add node" onClick={() => setAddMenuOpen((v) => !v)}>{RAIL_ICONS.plus}</button>
        <button title="Fit view" onClick={() => fitView({ padding: 0.3, duration: 300 })}>{RAIL_ICONS.frame}</button>
        <button title="Library" onClick={() => setLibraryOpen(true)}>{RAIL_ICONS.folder}</button>
        <div className="divider" />
        <button title="Undo (Ctrl+Z)" onClick={undo} disabled={!past.length} style={!past.length ? { opacity: .3, cursor: "not-allowed" } : null}>{RAIL_ICONS.undo}</button>
        <button title="Redo (Ctrl+Shift+Z)" onClick={redo} disabled={!future.length} style={!future.length ? { opacity: .3, cursor: "not-allowed" } : null}>{RAIL_ICONS.redo}</button>
      </div>

      {addMenuOpen && (
        <>
          <div className="add-menu-backdrop" onClick={() => setAddMenuOpen(false)} />
          <div className="add-menu">
            <div className="add-menu-header">Content</div>
            {NODE_TYPES_META.map((t) => (
              <button key={t.kind} onClick={() => addNode(t.kind)}>
                <span className="ic">{CARD_ICONS[t.kind]}</span>
                {t.label}
              </button>
            ))}
            <div className="add-menu-sep" />
            <div className="add-menu-header">Transformation</div>
            {XFORM_META.map((x) => (
              <button key={x.key} className="add-menu-soon" disabled title="Coming soon">
                <span className="ic">{x.icon}</span>
                {x.label}
                <span className="add-menu-tag">Soon</span>
              </button>
            ))}
          </div>
        </>
      )}

      <div style={{ width: "100vw", height: "100vh" }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          connectionMode={ConnectionMode.Loose}
          onConnect={onConnect}
          onConnectStart={onConnectStart}
          onConnectEnd={onConnectEnd}
          onSelectionChange={onSelectionChange}
          onPaneClick={() => { setSelectedId(null); setAddMenuOpen(false); }}
          deleteKeyCode={["Backspace", "Delete"]}
          fitView={nodes.length > 0}
          fitViewOptions={{ padding: 0.3, maxZoom: 0.85 }}
          defaultViewport={{ x: 0, y: 0, zoom: 0.7 }}
          proOptions={{ hideAttribution: true }}
          minZoom={0.2}
          maxZoom={2}
        >
          <Background variant={BackgroundVariant.Dots} gap={22} size={1.5} color="#2a2a30" />
        </ReactFlow>
      </div>

      {nodes.length === 0 && (
        <div className="empty">
          <h1>Add your first node to the canvas</h1>
          <p>Each node is a creative step in your canvas.</p>
          <div className="node-cards">
            {NODE_TYPES_META.map((t) => (
              <div key={t.kind} className="node-card" onClick={() => addNode(t.kind)}>
                <div className="ic">{CARD_ICONS[t.kind]}</div>
                <div className="label">
                  {t.label}
                  {t.isNew && <span className="badge-new">New</span>}
                </div>
                <div className="sub">{t.sub}</div>
              </div>
            ))}
            <div className="node-card" onClick={() => setLibraryOpen(true)}>
              <div className="ic">{RAIL_ICONS.folder}</div>
              <div className="label">Library</div>
              <div className="sub">All your generations</div>
            </div>
          </div>
        </div>
      )}

      <div className="zoom-pill"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="6"/></svg></div>

      {picker && (
        <>
          <div className="dd-backdrop" onClick={() => setPicker(null)} />
          <div className="type-picker" style={{ left: picker.x + 8, top: picker.y + 8 }}>
            <div className="type-picker-header">Add connected node</div>
            {NODE_TYPES_META.map((t) => (
              <button key={t.kind} onClick={() => pickType(t.kind)}>
                <span className="ic">{CARD_ICONS[t.kind]}</span>
                {t.label}
              </button>
            ))}
          </div>
        </>
      )}

      {selectedNode && (
        <PromptBar
          node={selectedNode}
          sources={selectedSources}
          onChange={updateNodeData}
          onRun={() => runNode(selectedNode.id)}
          running={runningIds.has(selectedNode.id)}
        />
      )}

      {!assistantOpen && (
        <button className="assistant-fab" onClick={() => setAssistantOpen(true)} title="Open Assistant">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2 6h6l-5 4 2 7-7-4-7 4 2-7-5-4h6z"/></svg>
        </button>
      )}

      <Library open={libraryOpen} onClose={() => setLibraryOpen(false)} />

      <Assistant
        open={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        hasSelectedImage={!!selectedImageUrl}
        onCreateAndMaybeRun={({ kind, prompt }, autoRun, useSelected) => {
          // "turn this image into a video" → seed a video node from the selected image
          if (kind === "video" && useSelected && selectedImageUrl && selectedId) {
            const id = addNode("video", { prompt, aspect: "16:9 · 720p", connectFrom: selectedId });
            if (autoRun) setTimeout(() => runNode(id), 50);
            return;
          }
          const id = addNode(kind, { prompt });
          if (autoRun) setTimeout(() => runNode(id), 50);
        }}
        onDirector={(payload, model, useSelected) =>
          runDirector({ ...payload, seedImage: useSelected ? selectedImageUrl : null }, model)
        }
      />
    </>
  );
}

export default function Canvas(props) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  );
}
