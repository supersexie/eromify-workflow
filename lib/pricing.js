// Single source of truth for Magic Mint pricing — mirrors Eromify tiers.
// cols order: Builder, Launch, Growth, Creator — 1 = included, 0 = not.

export const FEATURE_ROWS = [
  { label: "Influencer Training", cols: [0, 1, 1, 1] },
  { label: "Image generation", cols: [1, 1, 1, 1] },
  { label: "Video generation", cols: [0, 0, 1, 1] },
  { label: "NSFW generation", cols: [0, 0, 1, 1] },
  { label: "Workflow Canvas", cols: [0, 0, 1, 1] },
  { label: "Motion Control", cols: [0, 0, 0, 1] },
  { label: "Face Swap", cols: [0, 0, 1, 1] },
  { label: "Image Upscale", cols: [0, 0, 1, 1] },
  { label: "Video Upscale", cols: [0, 0, 0, 1] },
  { label: "Claude MCP", tag: "Automation", cols: [0, 0, 1, 1] },
  { label: "AI Agent", tag: "Automation", cols: [0, 0, 0, 1] },
];

export const MODEL_ROWS = [
  { label: "Flux 2 Pro", cols: [1, 1, 1, 1] },
  { label: "Flux LoRA", tag: "Training", cols: [0, 1, 1, 1] },
  { label: "Nano Banana 2", cols: [1, 1, 1, 1] },
  { label: "Z-image Turbo", cols: [1, 1, 1, 1] },
  { label: "Kling Image O3", cols: [0, 0, 1, 1] },
  { label: "GPT Image 2", cols: [0, 0, 1, 1] },
  { label: "Seedream 4.5", cols: [0, 0, 1, 1] },
  { label: "Kling 2.6 Pro", cols: [0, 0, 1, 1] },
  { label: "Kling 3.0 Pro", tag: "4K", cols: [0, 0, 0, 1] },
  { label: "SeedVR Upscale", tag: "4K", cols: [0, 0, 0, 1] },
  { label: "Seedance 2.0", tag: "4K", cols: [0, 0, 0, 1] },
  { label: "Z-image Spicy", cols: [0, 0, 1, 1] },
  { label: "Qwen Image Edit Spicy", cols: [0, 0, 1, 1] },
  { label: "Wan 2.7 Image to Video Spicy", tag: "4K", cols: [0, 0, 0, 1] },
];

export const PLANS = [
  {
    name: "Builder",
    desc: "Start creating AI images in minutes.",
    monthly: 29,
    annual: 2.99,
    save: 312,
    credits: "500",
    cta: "Start creating",
    whop: "https://whop.com/magic-mint/builder-dc/",
  },
  {
    name: "Launch",
    desc: "Train your own AI persona and create on autopilot.",
    monthly: 45,
    annual: 7.99,
    save: 444,
    credits: "1,000",
    cta: "Train my AI",
    whop: "https://whop.com/magic-mint/launch-ee/",
  },
  {
    name: "Growth",
    desc: "Unlock video, face swap, and the full studio.",
    monthly: 79,
    annual: 15.99,
    save: 756,
    credits: "4,000",
    cta: "Unlock video",
    popular: true,
    whop: "https://whop.com/magic-mint/growth-a0/",
  },
  {
    name: "Creator",
    desc: "Every model unlocked. 4K, premium video, unlimited.",
    monthly: 99,
    annual: 23.99,
    save: 900,
    credits: "6,000",
    cta: "Get everything",
    best: true,
    whop: "https://whop.com/magic-mint/creator-da-aa35/",
  },
];
