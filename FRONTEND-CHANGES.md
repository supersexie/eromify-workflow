# Eromify — Frontend / UI Changelog

UI, layout, visual, and responsiveness work. Functional/product changes live in
[PRODUCT-CHANGES.md](PRODUCT-CHANGES.md).

---

## Navigation & shell

- **Section nav tabs** (Canvas / Image / Video / Motion Control / Upscale / Library /
  Influencers / MCP) shared across pages via a centered floating pill.
- **Canvas top bar** sizing aligned to the other sections — matched the nav-pill tab
  padding and vertically centered the pill so it no longer drifts down on the canvas.
- **Removed** the non-functional zoom chip and chat/share icon buttons from the canvas
  top bar; removed the Templates and Comments buttons from the canvas tool rail.

## Image studio

- **Three modes:** Generate / Edit / Face Swap segmented control.
- **Prompt bar layout** de-cluttered: the prompt textarea spans its own full-width row;
  controls sit below it. The GPT (enhance-model) picker sits in line with the model chip
  and directly under the Enhance button; Aspect + Resolution + Batch share one row.
  Rows are grouped explicitly so the layout is identical across screen widths.
- **Enhance button** relabeled "Enhance prompt" and width-matched to the GPT picker
  (without widening the GPT button).
- Removed the dead "+" add-reference button.
- Prompt textarea height capped so long prompts scroll instead of pushing the bar around.
- Gallery: uniform square tiles → click opens a lightbox at the original ratio with
  download/delete; hover captions.

## Video studio

- Create / Edit / Motion Control sub-tabs in a left sidebar; results grid on the right
  that replaces the hero showcase once you generate.
- **Motion Control** library: removed the per-card play buttons and the "Start by copying
  motion from library" heading and the cosmetic History / Motion library tabs; library
  cards are 9:16.
- Media pickers show the uploaded image/video at its natural shape (no crop); the picker
  icon reflects the upload kind (image vs video icon).

## Upscale

- Source picker shows an image icon in Image mode and a video icon in Video mode.

## Influencers

- Dedicated page with a section hero, a scroll container (hero + cards scroll within the
  fixed-height page), instant-from-cache render, a loading state, and a fail-safe so it
  never hangs on "Loading…". Broken photos show a "Re-upload photo" affordance.
- Simplified create form to a single `user_name` (handle) + one photo.

## @mention field

- Pink inline pill tokens for `@handles` with an autocomplete dropdown (overlay
  technique: transparent textarea + highlight layer sharing padding for caret alignment).
- Dropdown opens **upward** when the field is anchored to a bottom bar.

## Canvas

- Higgsfield-style dashboard hero (connector lines + selection frame + floating tiles).
- Per-node prompt bar; auto-center on a newly added node.
- Node download button styling (hover-revealed).

## Section heroes & showcase media

- Reusable `SectionHero` with floating tiles supporting gradients, **images**, and
  **videos**.
- **Canvas dashboard hero** — 4 showcase images (left/right pairs).
- **Image hero** — 4 showcase images.
- **Video Create hero** — 5 showcase videos; **Edit hero** — 4 videos; **Motion Control**
  — 3 hero tiles + 4 library cards (9:16).
- **Influencers hero** — 4 showcase images.
- **Upscale hero** — 4 images in Image mode, 4 videos in Video mode (swaps with the
  Image/Video toggle).
- All media tiles clip to rounded cards (`object-fit: cover`) with a gradient fallback if
  a file is missing. (iPhone HEVC `.mov` uploads were transcoded to H.264 MP4 for browser
  playback.)

## Claude MCP page

- Hero banner reads **"EROMIFY MCP FOR [logo] CLAUDE"** with an inline starburst Claude
  mark (SVG, scales with the title).
- Nav tab renamed **MCP & CLI → MCP**.
- **Connector demo** added under the hero: a "CLAUDE · EROMIFY CONNECTOR" chat mockup
  (prompt → AI reply → 4-photo grid → credits line) on the left, and three numbered
  feature cards on the right.
- Removed the CLI / Skill install tabs from the page UI.

## Mobile (Phase 1)

- Added an explicit mobile **viewport** (`width=device-width`, `viewport-fit=cover`).
- **Responsive nav:** below 760px the centered tab pill becomes a full-width horizontal
  scroll strip (brand + actions stay on the top row).
- **Video** two-column layout stacks into one scrollable column.
- **Image** bottom bar + chips reflow into clean rows; gallery goes 2-up on phones.
- **Canvas** is usable on phones (touch pan/pinch/tap): the per-node editor becomes a
  full-width bottom sheet, the tool rail a slim left dock with larger touch targets.
- Library / Influencers / Upscale grids and headers tightened; touch targets enlarged.

## Errors

- Generation errors show as a top-center toast that slides in and auto-dismisses after
  5s (click to close), instead of a persistent inline block.

## Landing

- A marketing landing page was built and then removed; `/` redirects to `/app`
  (workflow-first).
