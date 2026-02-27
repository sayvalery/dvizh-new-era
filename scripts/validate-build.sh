#!/usr/bin/env bash
# Validates a built static site before deployment.
# Usage: bash scripts/validate-build.sh <dist-dir> [prev-page-count]
# Exit 0 = valid, Exit 1 = invalid (with details on stderr)

set -euo pipefail

DIST_DIR="${1:?Usage: validate-build.sh <dist-dir> [prev-page-count]}"
PREV_COUNT="${2:-0}"
ERRORS=0

fail() {
  echo "FAIL: $1" >&2
  ERRORS=$((ERRORS + 1))
}

# 1. Root index.html
if [ ! -f "$DIST_DIR/index.html" ]; then
  fail "index.html missing in root"
elif [ "$(wc -c < "$DIST_DIR/index.html" | tr -d ' ')" -lt 500 ]; then
  fail "index.html too small (< 500 bytes)"
fi

# 2. Key sections
REQUIRED_SECTIONS=("about" "blog" "developers" "slovar-developera" "vitrina" "contacts" "404.html")
for section in "${REQUIRED_SECTIONS[@]}"; do
  if [[ "$section" == *.html ]]; then
    target="$DIST_DIR/$section"
  else
    target="$DIST_DIR/$section/index.html"
  fi
  if [ ! -f "$target" ]; then
    fail "$section missing"
  elif [ "$(wc -c < "$target" | tr -d ' ')" -lt 500 ]; then
    fail "$section too small (< 500 bytes)"
  fi
done

# 3. Page count regression
CURRENT_COUNT=$(find "$DIST_DIR" -name "index.html" -type f | wc -l | tr -d ' ')
echo "Pages: $CURRENT_COUNT (previous: $PREV_COUNT)"

if [ "$PREV_COUNT" -gt 0 ]; then
  THRESHOLD=$((PREV_COUNT * 80 / 100))
  if [ "$CURRENT_COUNT" -lt "$THRESHOLD" ]; then
    fail "Page count dropped from $PREV_COUNT to $CURRENT_COUNT (below 80% threshold of $THRESHOLD)"
  fi
fi

# 4. No tiny index.html files (empty template detection)
TINY_FILES=$(find "$DIST_DIR" -name "index.html" -type f -size -500c 2>/dev/null | wc -l | tr -d ' ')
if [ "$TINY_FILES" -gt 2 ]; then
  fail "$TINY_FILES index.html files under 500 bytes (possible empty templates)"
fi

# 5. No external placeholders
PLACEHOLDER_COUNT="$(grep -rl "placehold\.co\|pravatar\.cc\|tailwindcss\.com/plus-assets" "$DIST_DIR" --include="*.html" 2>/dev/null | wc -l | tr -d ' ')" || true
if [ "${PLACEHOLDER_COUNT:-0}" -gt 0 ]; then
  fail "$PLACEHOLDER_COUNT files with external placeholder URLs"
fi

# 6. Sitemap
if [ ! -f "$DIST_DIR/sitemap-index.xml" ]; then
  fail "sitemap-index.xml missing"
elif [ "$(wc -c < "$DIST_DIR/sitemap-index.xml" | tr -d ' ')" -lt 50 ]; then
  fail "sitemap-index.xml is empty"
fi

# 7. Fonts
if [ ! -d "$DIST_DIR/fonts" ]; then
  fail "fonts/ directory missing"
fi

# 8. CSS exists
CSS_COUNT=$(find "$DIST_DIR" -name "*.css" -type f 2>/dev/null | wc -l | tr -d ' ')
if [ "$CSS_COUNT" -eq 0 ]; then
  fail "No CSS files found"
fi

# Result
if [ "$ERRORS" -gt 0 ]; then
  echo "Validation FAILED: $ERRORS errors" >&2
  exit 1
fi

echo "Validation passed: $CURRENT_COUNT pages"
exit 0
