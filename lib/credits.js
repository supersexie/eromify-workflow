// Credit cost estimator — shown live on the Generate buttons. These are
// indicative prices (no real billing yet); tuned so heavier models/quality/
// duration/batch cost more. All functions are pure so the UI recomputes on
// every settings change.

const QUALITY_MULT = { "1K": 1, "2K": 2, "4K": 4 };

const IMAGE_BASE = {
  "Flux 2 Pro": 2, "Flux 2 Max": 3, "Nano Banana Pro": 2,
  "Seedream 4.5": 2, "GPT Image 2": 3, "GPT Image 1": 1,
};
export function imageCredits({ model, quality, batch = 1, edit = false } = {}) {
  const base = IMAGE_BASE[model] ?? 2;
  const per = Math.round(base * (QUALITY_MULT[quality] ?? 1)) + (edit ? 1 : 0);
  return Math.max(1, per) * Math.max(1, batch);
}

const VIDEO_BASE = {
  "Kling 3.0": 8, "Kling 2.6": 6, "Kling 2.5 Turbo": 4, "Kling v2": 6,
  "Seedance 2.0": 8, "Seedance 2.0 Fast": 5, "Wan 2.7": 6, "Wan 2.2": 4,
  "MiniMax Hailuo 2.3": 5, "MiniMax Hailuo": 4, "PixVerse v6": 5, "Sora 2": 12,
  "LTX Video": 3, "Veo 3.1": 12, "Veo 3.1 Fast": 6,
};
export function videoCredits({ model, duration = 8, quality = "720p" } = {}) {
  const base = VIDEO_BASE[model] ?? 6;
  const secs = parseInt(duration) || 8;
  const q = quality === "1080p" ? 1.5 : 1;
  return Math.max(1, Math.round(base * (secs / 4) * q));
}

const MOTION_BASE = {
  "Kling 3.0 Motion Control": 10, "Kling 3.0 Motion Control Std": 6,
  "Kling Motion Control Pro": 8, "Kling Motion Control Std": 5,
  "Wan Motion": 6, "Wan 2.2 Animate Move": 6, "Wan 2.2 Animate Replace": 7,
};
export function motionCredits({ model, quality = "720p" } = {}) {
  return Math.max(1, Math.round((MOTION_BASE[model] ?? 8) * (quality === "1080p" ? 1.5 : 1)));
}

const EDIT_BASE = {
  "Kling O1 Video Edit": 8, "Kling O3 Omni Edit": 10, "Kling Motion Control": 8,
};
export function editCredits({ model, quality = "720p" } = {}) {
  return Math.max(1, Math.round((EDIT_BASE[model] ?? 8) * (quality === "1080p" ? 1.5 : 1)));
}

const IMG_UPSCALE_BASE = { "Clarity Upscaler": 2, "Topaz Image": 3, "ESRGAN": 1, "AuraSR (4x)": 2 };
const VID_UPSCALE_BASE = { "Topaz Video": 8, "SeedVR2": 6 };
export function upscaleCredits({ kind, model, scale = "2x" } = {}) {
  const f = (parseInt(scale) || 2) >= 4 ? 2 : 1;
  if (kind === "video") return Math.max(1, (VID_UPSCALE_BASE[model] ?? 6) * f);
  return Math.max(1, (IMG_UPSCALE_BASE[model] ?? 2) * f);
}
