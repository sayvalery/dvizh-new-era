#!/usr/bin/env bash
# Machine checklist for the dvizh-new-era codebase.
# Mirrors the project guard-rails from CLAUDE.md as automated checks.
#
# Usage:
#   bash scripts/audit.sh [<dist-dir>]
#     <dist-dir>  optional path to a built static site (apps/web/dist).
#                 When given, dev-only leak checks (b) also run, so audit.sh
#                 can be called from build-site.sh right after the build.
#
# Exit codes:
#   0  clean (warnings allowed, they do NOT fail the run)
#   1  one or more hard violations (FAIL) found
#
# --- Enabling as a git pre-push hook (NOT activated automatically) ---
# A ready-made hook lives at .githooks/pre-push. To turn it on, run once:
#     git config core.hooksPath .githooks
#     chmod +x .githooks/pre-push
# After that every `git push` runs `bash scripts/audit.sh` and aborts the
# push on exit 1. To disable: `git config --unset core.hooksPath`.
# (This script does NOT configure git or activate the hook itself.)

set -uo pipefail

# Resolve repo root from this script's location so it works from any cwd.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
WEB_SRC="$ROOT_DIR/apps/web/src"

DIST_DIR="${1:-}"

ERRORS=0
WARNINGS=0

fail() {
  echo "FAIL: $1" >&2
  ERRORS=$((ERRORS + 1))
}

warn() {
  echo "WARN: $1" >&2
  WARNINGS=$((WARNINGS + 1))
}

ok() {
  echo "OK: $1"
}

echo "=== audit.sh — machine checklist ==="
echo "Repo: $ROOT_DIR"

# ---------------------------------------------------------------------------
# (a) Forbidden imports in apps/web/src (FAIL)
# ---------------------------------------------------------------------------
# Запрещённые зависимости: React, Vue, Svelte и анимационные/UI библиотеки.
# Самописный vanilla-WebGL фон (FlutedGlassBg) — согласованное исключение,
# он НЕ тянет внешних библиотек, поэтому под эти паттерны не попадает.
FORBIDDEN=(react vue svelte preact jquery gsap framer-motion @paper-design lottie styled-components @emotion)

# Build an alternation pattern for import/require statements only, to avoid
# false positives on prose or unrelated identifiers.
PATTERN=""
for pkg in "${FORBIDDEN[@]}"; do
  esc="${pkg//\//\\/}"
  esc="${esc//./\\.}"
  esc="${esc//-/\\-}"
  PATTERN="${PATTERN:+$PATTERN|}$esc"
done

# Match `from '<pkg>'`, `import '<pkg>'`, `require('<pkg>')`.
IMPORT_RE="(from|import|require\\()[[:space:]]*\\(?[\"'](${PATTERN})(/[^\"']*)?[\"']"

if [ -d "$WEB_SRC" ]; then
  HITS="$(grep -rnE "$IMPORT_RE" "$WEB_SRC" \
    --include="*.astro" --include="*.ts" --include="*.tsx" \
    --include="*.js" --include="*.jsx" --include="*.mjs" 2>/dev/null)" || true
  if [ -n "$HITS" ]; then
    fail "forbidden import(s) found in apps/web/src:"
    echo "$HITS" | sed 's/^/    /' >&2
  else
    ok "(a) no forbidden imports (react/vue/svelte/gsap/lottie/etc.)"
  fi
else
  warn "(a) skipped — $WEB_SRC not found"
fi

# ---------------------------------------------------------------------------
# (b) Dev-only directories must not leak into the prod build (FAIL)
# ---------------------------------------------------------------------------
if [ -n "$DIST_DIR" ]; then
  if [ ! -d "$DIST_DIR" ]; then
    fail "(b) dist dir '$DIST_DIR' does not exist"
  else
    for devdir in lab sales ui-kit; do
      if [ -e "$DIST_DIR/$devdir" ]; then
        fail "(b) dev-only directory '$devdir' present in dist (must be excluded from prod build)"
      fi
    done

    SITEMAP_LEAK="$(grep -rl "/lab/\|/sales\|/ui-kit" "$DIST_DIR"/sitemap*.xml 2>/dev/null | wc -l | tr -d ' ')" || true
    if [ "${SITEMAP_LEAK:-0}" -gt 0 ]; then
      fail "(b) sitemap references dev-only paths (/lab, /sales or /ui-kit)"
    fi

    if [ "$ERRORS" -eq 0 ]; then
      ok "(b) no dev-only leaks in dist ($DIST_DIR)"
    fi
  fi
else
  echo "SKIP: (b) dist checks — no <dist-dir> argument given"
fi

# ---------------------------------------------------------------------------
# (c) WARN — hardcoded hex equal to design tokens (extend list as needed)
# ---------------------------------------------------------------------------
# Hex-значения, для которых уже есть Tailwind-токен. Хардкодить их не нужно.
# Список расширяемый — добавляй сюда новые «токенизированные» цвета.
TOKEN_HEX=(
  "#858585"   # gray-500
  "#fecda9"   # brand light tint
  "#fbf9f6"   # gray-100 (cream bg)
  "#f9f7f5"   # background-secondary
  "#1d1e21"   # gray-900 (dark text)
  "#a8a8a8"   # gray-400 (muted)
  "#ff4d00"   # brand
)

if [ -d "$WEB_SRC" ]; then
  HEX_HITS=""
  for hex in "${TOKEN_HEX[@]}"; do
    # Case-insensitive; ignore the centralized config where tokens are defined.
    found="$(grep -rinE "${hex}" "$WEB_SRC" \
      --include="*.astro" --include="*.css" 2>/dev/null)" || true
    if [ -n "$found" ]; then
      HEX_HITS="${HEX_HITS}${found}"$'\n'
    fi
  done
  if [ -n "$HEX_HITS" ]; then
    warn "(c) hardcoded hex equal to design tokens (use Tailwind tokens):"
    printf '%s' "$HEX_HITS" | grep -v '^$' | sed 's/^/    /' >&2
  else
    ok "(c) no tokenized hex hardcoded in .astro/.css"
  fi

  # (c2) .url used without normalizeMediaUrl in .astro
  URL_HITS="$(grep -rnE "\.url\b" "$WEB_SRC" --include="*.astro" 2>/dev/null \
    | grep -v "normalizeMediaUrl" \
    | grep -viE "Astro\.url|new URL|import\.meta" )" || true
  if [ -n "$URL_HITS" ]; then
    warn "(c) possible \`.url\` without normalizeMediaUrl() in .astro:"
    echo "$URL_HITS" | sed 's/^/    /' >&2
  else
    ok "(c) all .astro .url usages appear wrapped or unrelated"
  fi
else
  warn "(c) skipped — $WEB_SRC not found"
fi

# ---------------------------------------------------------------------------
# (d) WARN — internal href="/..." in .astro with no matching page
# ---------------------------------------------------------------------------
# Грубая эвристика: берём первый сегмент пути из href="/segment..." и проверяем,
# что под apps/web/src/pages есть <segment>.astro, <segment>/ или <segment>.* .
# Хэши, mailto, tel, внешние ссылки и динамика [..slug] не проверяются.
PAGES_DIR="$WEB_SRC/pages"
if [ -d "$PAGES_DIR" ]; then
  # Collect distinct first path-segments referenced via href.
  SEGMENTS="$(grep -rhoE 'href="/[a-z0-9][a-z0-9_-]*' "$WEB_SRC" --include="*.astro" 2>/dev/null \
    | sed -E 's/^href="\///' \
    | sort -u)" || true

  MISSING=""
  while IFS= read -r seg; do
    [ -z "$seg" ] && continue
    # Skip known asset/api roots.
    case "$seg" in
      api|media|fonts|images|assets|rss*) continue ;;
    esac
    if [ -f "$PAGES_DIR/$seg.astro" ] \
      || [ -d "$PAGES_DIR/$seg" ] \
      || ls "$PAGES_DIR/$seg".* >/dev/null 2>&1 \
      || [ -e "$ROOT_DIR/apps/web/public/$seg" ]; then
      continue
    fi
    MISSING="${MISSING}${seg}"$'\n'
  done <<< "$SEGMENTS"

  MISSING="$(printf '%s' "$MISSING" | grep -v '^$' || true)"
  if [ -n "$MISSING" ]; then
    warn "(d) internal href to path(s) with no matching page (verify these):"
    printf '%s\n' "$MISSING" | sed 's/^/    \/&/' >&2
  else
    ok "(d) all internal hrefs resolve to a page/file"
  fi
else
  warn "(d) skipped — $PAGES_DIR not found"
fi

# ---------------------------------------------------------------------------
# Result
# ---------------------------------------------------------------------------
echo "==================================="
echo "Warnings: $WARNINGS"
if [ "$ERRORS" -gt 0 ]; then
  echo "Audit FAILED: $ERRORS hard violation(s)" >&2
  exit 1
fi
echo "Audit passed (no hard violations)."
exit 0
