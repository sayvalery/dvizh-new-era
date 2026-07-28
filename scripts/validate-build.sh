#!/usr/bin/env bash
# Validates a built static site before deployment.
# Usage: bash scripts/validate-build.sh <dist-dir> [baseline-page-count] [min-pages-floor]
#   baseline-page-count — число страниц последнего УСПЕШНО задеплоенного билда
#                         (build-site.sh хранит его в logs/last-good-pages.txt).
#                         НЕ «сколько сейчас в dist»: иначе плохой билд понижает
#                         порог и следующий такой же плохой билд проходит.
#   min-pages-floor     — абсолютный минимум страниц; работает и когда эталона ещё нет.
# Exit 0 = valid, Exit 1 = invalid (with details on stderr)

set -euo pipefail

DIST_DIR="${1:?Usage: validate-build.sh <dist-dir> [baseline-page-count] [min-pages-floor]}"
# Нормализуем к числу: мусор/пустая строка не должны ронять арифметику под set -e
BASELINE_COUNT="$(printf '%s' "${2:-0}" | tr -cd '0-9')"; BASELINE_COUNT="${BASELINE_COUNT:-0}"
MIN_PAGES_FLOOR="$(printf '%s' "${3:-0}" | tr -cd '0-9')"; MIN_PAGES_FLOOR="${MIN_PAGES_FLOOR:-0}"
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

# 3. Page count regression — две независимые проверки:
#    (а) относительная: не ниже 80% от последнего успешного деплоя;
#    (б) абсолютная: не ниже жёсткого минимума (страховка, если эталона ещё нет).
CURRENT_COUNT=$(find "$DIST_DIR" -name "index.html" -type f | wc -l | tr -d ' ')
echo "Pages: $CURRENT_COUNT (last good deploy: $BASELINE_COUNT, absolute floor: $MIN_PAGES_FLOOR)"

if [ "$BASELINE_COUNT" -gt 0 ]; then
  THRESHOLD=$((BASELINE_COUNT * 80 / 100))
  if [ "$CURRENT_COUNT" -lt "$THRESHOLD" ]; then
    fail "Page count dropped from $BASELINE_COUNT (last good deploy) to $CURRENT_COUNT (below 80% threshold of $THRESHOLD)"
  fi
fi

if [ "$MIN_PAGES_FLOOR" -gt 0 ] && [ "$CURRENT_COUNT" -lt "$MIN_PAGES_FLOOR" ]; then
  fail "Page count $CURRENT_COUNT is below the absolute floor of $MIN_PAGES_FLOOR pages"
fi

if [ "$BASELINE_COUNT" -eq 0 ] && [ "$MIN_PAGES_FLOOR" -eq 0 ]; then
  echo "WARN: page-count regression check is DISABLED (no baseline and no floor passed)" >&2
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

# 9. Dev-only directories must NOT leak into prod build
for devdir in lab sales ui-kit; do
  if [ -e "$DIST_DIR/$devdir" ]; then
    fail "dev-only directory '$devdir' present in dist (must be excluded from prod build)"
  fi
done

# 10. Sitemap must not reference dev-only paths
SITEMAP_LEAK="$(grep -rl "/lab/\|/sales\|/ui-kit" "$DIST_DIR"/sitemap*.xml 2>/dev/null | wc -l | tr -d ' ')" || true
if [ "${SITEMAP_LEAK:-0}" -gt 0 ]; then
  fail "sitemap references dev-only paths (/lab, /sales or /ui-kit)"
fi

# Result
if [ "$ERRORS" -gt 0 ]; then
  echo "Validation FAILED: $ERRORS errors" >&2
  exit 1
fi

echo "Validation passed: $CURRENT_COUNT pages"
exit 0
