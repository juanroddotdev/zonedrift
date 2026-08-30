#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST="$ROOT/dist"
VERSION="$(node -e "console.log(JSON.parse(require('fs').readFileSync('$ROOT/manifest.json','utf8')).version)")"
OUTPUT="$DIST/zonedrift-v${VERSION}.zip"

cd "$ROOT"
mkdir -p "$DIST"
rm -f "$OUTPUT"

zip -r "$OUTPUT" . \
  -x "*.git*" \
  -x "*/.git/*" \
  -x "dist/*" \
  -x "scripts/*" \
  -x "PLAN.md" \
  -x "*.zip" \
  -x ".DS_Store" \
  -x "*/.DS_Store" \
  -x ".env" \
  -x ".env.*" \
  -x "*.pem" \
  -x "*.key" \
  -x "node_modules/*" \
  -x "docs/*" \
  > /dev/null

echo "Built $OUTPUT"
echo "Upload this zip to the Chrome Web Store developer dashboard."
