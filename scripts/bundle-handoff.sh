#!/usr/bin/env bash
# Bundles the Geoflix source into FRONTEND.md and BACKEND.md for handoff.
# Each file is embedded verbatim under a path header with a 4-backtick fence
# (so any 3-backticks inside source can't break the fence). No secrets are included.
set -euo pipefail
cd "$(dirname "$0")/.."

lang_for() {
  case "$1" in
    *.css) echo css ;;
    *.json) echo json ;;
    *.html) echo html ;;
    *.md) echo markdown ;;
    *) echo js ;;
  esac
}

emit() { # emit <outfile> <file>
  local out="$1" f="$2"
  if [ ! -f "$f" ]; then echo "  (missing: $f)"; return; fi
  {
    echo ""
    echo "### \`$f\`"
    echo ""
    printf '````%s\n' "$(lang_for "$f")"
    cat "$f"
    echo ""
    echo '````'
  } >> "$out"
}

header() { # header <outfile> <title> <blurb>
  : > "$1"
  {
    echo "# $2"
    echo ""
    echo "$3"
    echo ""
    echo "> Generated bundle of the actual Geoflix source. No API keys are included —"
    echo "> all secrets are read from environment variables (see IMPLEMENTATION.md)."
    echo "> Recreate each file at the path shown in its heading."
    echo ""
    echo "---"
  } > "$1"
}

# ---------------- FRONTEND ----------------
FE=FRONTEND.md
header "$FE" "Geoflix — Frontend" "All client-side code: Next.js App Router pages, React components, client libs, theme CSS, and auth middleware."

FE_FILES=(
  app/layout.js
  app/globals.css
  app/page.js
  app/landing.module.css
  app/pricing/page.js
  app/app/page.js
  "app/w/[id]/page.js"
  "app/sign-in/[[...sign-in]]/page.js"
  "app/sign-up/[[...sign-up]]/page.js"
  middleware.js
  components/Canvas.js
  components/nodes/WorkflowNode.js
  components/PromptBar.js
  components/PropertiesPanel.js
  components/Assistant.js
  components/Library.js
  components/Dashboard.js
  components/UserMenu.js
  lib/run.js
  lib/store.js
  lib/cardSize.js
  lib/mockRun.js
)
for f in "${FE_FILES[@]}"; do emit "$FE" "$f"; done

# ---------------- BACKEND ----------------
BE=BACKEND.md
header "$BE" "Geoflix — Backend" "All server-side code: Next.js API route handlers, the MCP server + inline-media widget, server libs, and the standalone stdio MCP package."

BE_FILES=(
  app/api/generate/route.js
  app/api/image/start/route.js
  app/api/image/status/route.js
  app/api/video/start/route.js
  app/api/video/status/route.js
  app/api/video/check/route.js
  app/api/video/file/route.js
  app/api/video/combine/start/route.js
  app/api/video/combine/status/route.js
  app/api/audio/voices/route.js
  app/api/media/route.js
  app/api/generations/route.js
  app/api/assistant/route.js
  "app/api/[transport]/route.js"
  "app/api/[transport]/widget-html.js"
  lib/falImage.js
  lib/genstore.js
  geoflix-widget/widget.html
  geoflix-widget/build.js
  geoflix-widget/src/widget.js
  geoflix-widget/package.json
  geoflix-mcp/index.js
  geoflix-mcp/package.json
  geoflix-mcp/README.md
)
for f in "${BE_FILES[@]}"; do emit "$BE" "$f"; done

echo "FRONTEND.md  $(wc -l < "$FE") lines"
echo "BACKEND.md   $(wc -l < "$BE") lines"
