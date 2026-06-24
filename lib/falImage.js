// fal image endpoint maps + picker, shared by the image start route.

export const FAL_IMAGE_MAP = {
  "Flux 2 Pro": "fal-ai/flux-2-pro",
  "Flux 2 Max": "fal-ai/flux-2-max",
  "Nano Banana Pro": "fal-ai/nano-banana-pro",
  "Seedream 4.5": "fal-ai/bytedance/seedream/v4.5/text-to-image",
  // GPT Image 2 routed through fal's async queue — direct OpenAI calls can
  // exceed Vercel Hobby's 60s function cap on this model.
  "GPT Image 2": "fal-ai/openai/gpt-image-2/text-to-image",
};

// Image-to-image / edit endpoints (take prompt + image_urls).
export const FAL_EDIT_MAP = {
  "Flux 2 Pro": "fal-ai/flux-2-pro",
  "Flux 2 Max": "fal-ai/flux-2-max",
  "Nano Banana Pro": "fal-ai/nano-banana-pro/edit",
  "Seedream 4.5": "fal-ai/bytedance/seedream/v4.5/edit",
  "GPT Image 2": "fal-ai/openai/gpt-image-2/edit-image",
};

export function pickImageEndpoint(model, hasImages) {
  return hasImages
    ? FAL_EDIT_MAP[model] || "fal-ai/nano-banana-pro/edit"
    : FAL_IMAGE_MAP[model] || "fal-ai/flux-2-pro";
}
