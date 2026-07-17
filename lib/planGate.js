import { FEATURE_ROWS } from "./pricing";

const TIER_INDEX = { builder: 0, launch: 1, growth: 2, creator: 3 };

export function tierIndex(tier) {
  return TIER_INDEX[tier] ?? -1;
}

export function canAccess(feature, tier) {
  const idx = tierIndex(tier);
  if (idx < 0) return false;
  const row = FEATURE_ROWS.find((r) => r.label === feature);
  if (!row) return true;
  return !!row.cols[idx];
}

export const TAB_FEATURES = {
  canvas: "Workflow Canvas",
  image: null,
  video: "Video generation",
  motion: "Motion Control",
  upscale: "Image Upscale",
  library: null,
  influencers: "Influencer Training",
  builder: "Influencer Training",
  mcp: "Claude MCP",
};

export function canAccessTab(tabId, tier) {
  const feature = TAB_FEATURES[tabId];
  if (!feature) return true;
  return canAccess(feature, tier);
}

export function requiredTier(feature) {
  const row = FEATURE_ROWS.find((r) => r.label === feature);
  if (!row) return "builder";
  const idx = row.cols.indexOf(1);
  return ["builder", "launch", "growth", "creator"][idx] || "creator";
}
