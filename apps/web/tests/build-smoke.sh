#!/usr/bin/env bash
# Smoke-тесты статической сборки
# Запуск: bash apps/web/tests/build-smoke.sh

set -euo pipefail

DIST_DIR="apps/web/dist"
ERRORS=0

echo "🧪 Smoke-тесты для статической сборки"
echo "======================================="

# 1. Проверка, что dist существует
if [ ! -d "$DIST_DIR" ]; then
  echo "❌ Директория $DIST_DIR не найдена. Сначала запустите pnpm build"
  exit 1
fi

# 2. Проверка основных страниц
check_page() {
  local path="$1"
  local file="$DIST_DIR$path"
  if [ -f "$file" ]; then
    local size=$(wc -c < "$file" | tr -d ' ')
    if [ "$size" -gt 100 ]; then
      echo "  ✅ $path ($size bytes)"
    else
      echo "  ❌ $path — слишком маленький ($size bytes)"
      ERRORS=$((ERRORS + 1))
    fi
  else
    echo "  ❌ $path — файл не найден"
    ERRORS=$((ERRORS + 1))
  fi
}

echo ""
echo "📄 Основные страницы:"
check_page "/index.html"
check_page "/about/index.html"
check_page "/contacts/index.html"
check_page "/blog/index.html"
check_page "/404.html"
check_page "/thanks/index.html"

echo ""
echo "📦 Продуктовые страницы:"
check_page "/elektronnaya-registraciya/index.html"
check_page "/ipoteka/index.html"
check_page "/ipotechnyy-kalkulyator/index.html"
check_page "/qbr/index.html"
check_page "/lichnyy-kabinet/index.html"
check_page "/vitrina/index.html"
check_page "/scoring/index.html"

echo ""
echo "🏢 Страницы решений:"
check_page "/banki/index.html"
check_page "/developers/index.html"
check_page "/agentstva-nedvizhimosti/index.html"

echo ""
echo "📚 Блог и глоссарий:"
check_page "/slovar-developera/index.html"
check_page "/video/index.html"
check_page "/cases/index.html"
check_page "/research/index.html"

# 3. Проверка на внешние плейсхолдеры
echo ""
echo "🔍 Проверка на внешние плейсхолдеры:"
PLACEHOLDER_COUNT=$(grep -rl "placehold.co\|pravatar.cc\|tailwindcss.com/plus-assets" "$DIST_DIR" 2>/dev/null | wc -l || true)
PLACEHOLDER_COUNT=$(echo "$PLACEHOLDER_COUNT" | tr -d '[:space:]')
if [ "$PLACEHOLDER_COUNT" -gt 0 ]; then
  echo "  ❌ Найдено $PLACEHOLDER_COUNT файлов с внешними плейсхолдерами"
  grep -rl "placehold.co\|pravatar.cc\|tailwindcss.com/plus-assets" "$DIST_DIR" | head -5
  ERRORS=$((ERRORS + 1))
else
  echo "  ✅ Внешних плейсхолдеров нет"
fi

# 4. Проверка на localhost в HTML
echo ""
echo "🔍 Проверка на localhost в HTML:"
LOCALHOST_COUNT=$(grep -rl "localhost:3002" "$DIST_DIR" --include="*.html" 2>/dev/null | wc -l || true)
LOCALHOST_COUNT=$(echo "$LOCALHOST_COUNT" | tr -d '[:space:]')
if [ "$LOCALHOST_COUNT" -gt 0 ]; then
  echo "  ⚠️  Найдено $LOCALHOST_COUNT файлов с localhost:3002 (формы используют PUBLIC_CMS_URL)"
  # Это допустимо для форм, если PUBLIC_CMS_URL пустой (same origin через nginx)
else
  echo "  ✅ Ссылок на localhost нет"
fi

# 5. Проверка sitemap
echo ""
echo "🗺️  Sitemap:"
if [ -f "$DIST_DIR/sitemap-index.xml" ]; then
  echo "  ✅ sitemap-index.xml найден"
else
  echo "  ❌ sitemap-index.xml не найден"
  ERRORS=$((ERRORS + 1))
fi

# 6. Общий результат
echo ""
echo "======================================="
if [ "$ERRORS" -gt 0 ]; then
  echo "❌ Найдено ошибок: $ERRORS"
  exit 1
else
  echo "✅ Все тесты пройдены!"
fi
