const MOCKS = {
  image: () => "https://picsum.photos/seed/" + Math.floor(Math.random() * 9999) + "/300/200",
  video: () => "Generated 6s video clip (mock)",
  text: (prompt) => `Generated text for: "${prompt || "no prompt"}" — Lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
  audio: () => "Generated 12s audio track (mock)",
  motion: () => "Generated motion graphics scene (mock)",
};

export function mockOutput(kind, prompt) {
  return (MOCKS[kind] || (() => "mock output"))(prompt);
}

export function topoOrder(nodes, edges) {
  const incoming = new Map(nodes.map((n) => [n.id, 0]));
  const adj = new Map(nodes.map((n) => [n.id, []]));
  for (const e of edges) {
    if (!incoming.has(e.target) || !incoming.has(e.source)) continue;
    incoming.set(e.target, incoming.get(e.target) + 1);
    adj.get(e.source).push(e.target);
  }
  const queue = nodes.filter((n) => incoming.get(n.id) === 0).map((n) => n.id);
  const out = [];
  while (queue.length) {
    const id = queue.shift();
    out.push(id);
    for (const next of adj.get(id) || []) {
      incoming.set(next, incoming.get(next) - 1);
      if (incoming.get(next) === 0) queue.push(next);
    }
  }
  if (out.length !== nodes.length) return nodes.map((n) => n.id);
  return out;
}
