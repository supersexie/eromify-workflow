// fal image endpoint maps + picker, shared by the image start route.

export const FAL_IMAGE_MAP = {
  "Flux 2 Pro": "fal-ai/flux-2-pro",
  "Flux 2 Max": "fal-ai/flux-2-max",
  "Nano Banana Pro": "fal-ai/nano-banana-pro",
  "Seedream 4.5": "fal-ai/bytedance/seedream/v4.5/text-to-image",
  // OpenAI's GPT Image series via fal. GPT Image 2 lives under the `openai/`
  // namespace; GPT Image 1 under `fal-ai/`. Single FAL_KEY pays for all of them.
  "GPT Image 2": "openai/gpt-image-2",
  "GPT Image 1": "fal-ai/gpt-image-1/text-to-image",
};

// Image-to-image / edit endpoints (take prompt + image_urls). Note Flux 2 uses
// a dedicated /edit endpoint — the base endpoint ignores image_urls, which is
// why references (e.g. an influencer photo) silently didn't apply before.
export const FAL_EDIT_MAP = {
  "Flux 2 Pro": "fal-ai/flux-2-pro/edit",
  "Flux 2 Max": "fal-ai/flux-2-max/edit",
  "Nano Banana Pro": "fal-ai/nano-banana-pro/edit",
  "Seedream 4.5": "fal-ai/bytedance/seedream/v4.5/edit",
  "GPT Image 2": "openai/gpt-image-2/edit",
  "GPT Image 1": "fal-ai/gpt-image-1/edit-image",
};

export function pickImageEndpoint(model, hasImages) {
  return hasImages
    ? FAL_EDIT_MAP[model] || "fal-ai/nano-banana-pro/edit"
    : FAL_IMAGE_MAP[model] || "fal-ai/flux-2-pro";
}
