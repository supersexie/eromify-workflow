# Fix: Edit Video source-block collapses on upload

**Commit:** `a707cfb`
**Area:** Video studio → Edit Video (Kling O1 Video Edit)
**File:** `app/globals.css`

## Symptom

In the Edit Video sub-tab, uploading a clip into the **source video** box made the
block disappear instead of showing the video preview.

## Cause

The filled source-video box used `height: auto` on its `<video>` together with
`min-height: 0` on the container. A freshly-selected clip has no known intrinsic
dimensions for a brief moment, so the video element's auto height resolved to ~0 and the
zero-min-height container collapsed to nothing — the block visually vanished.

## Fix

Give the filled source-video preview a **stable height** so it can't collapse while the
clip's metadata is still loading, and let the video fit inside it:

```css
.vp-edit-vid.is-filled { min-height: 0; height: 220px; padding: 0; background: #000; }
.vp-edit-vid.is-filled video { width: 100%; height: 100%; max-height: none; object-fit: contain; }
```

(`object-fit: contain` keeps the whole frame visible without cropping; `max-height: none`
overrides the generic `.vp-media video` cap so the 220px box governs.)

## Result

The source-video block stays in place the instant a clip is added and shows the preview
with native playback controls and the ✕ remove button. Verified by uploading a real
clip — the box holds at 220px and the video renders.
