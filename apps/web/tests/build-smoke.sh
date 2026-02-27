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

# 5. Проверка sitemap и RSS
echo ""
echo "🗺️  Sitemap & RSS:"
if [ -f "$DIST_DIR/sitemap-index.xml" ]; then
  echo "  ✅ sitemap-index.xml найден"
else
  echo "  ❌ sitemap-index.xml не найден"
  ERRORS=$((ERRORS + 1))
fi
if [ -f "$DIST_DIR/rss.xml" ]; then
  echo "  ✅ rss.xml найден"
else
  echo "  ❌ rss.xml не найден"
  ERRORS=$((ERRORS + 1))
fi

# 5b. Проверка OG-изображения
if [ -f "$DIST_DIR/og-default.jpg" ]; then
  echo "  ✅ og-default.jpg найден"
else
  echo "  ❌ og-default.jpg не найден"
  ERRORS=$((ERRORS + 1))
fi

# 6. Проверка шрифтов
echo ""
echo "🔤 Шрифты:"
FONTS=("styrene-a-bold.woff2" "styrene-a-medium.woff2" "inter-variable.woff2")
for font in "${FONTS[@]}"; do
  if [ -f "$DIST_DIR/fonts/$font" ]; then
    local_size=$(wc -c < "$DIST_DIR/fonts/$font" | tr -d ' ')
    echo "  ✅ $font ($local_size bytes)"
  else
    echo "  ❌ $font не найден"
    ERRORS=$((ERRORS + 1))
  fi
done

# 7. Проверка CSS на наличие font-face
echo ""
echo "🎨 CSS:"
CSS_FILES=$(find "$DIST_DIR" -name "*.css" -type f 2>/dev/null)
if [ -n "$CSS_FILES" ]; then
  FONT_FACE_COUNT=$(grep -l "font-face" $CSS_FILES 2>/dev/null | wc -l | tr -d ' ')
  if [ "$FONT_FACE_COUNT" -gt 0 ]; then
    echo "  ✅ @font-face найден в CSS ($FONT_FACE_COUNT файлов)"
  else
    echo "  ❌ @font-face не найден в CSS"
    ERRORS=$((ERRORS + 1))
  fi
else
  echo "  ❌ CSS файлы не найдены"
  ERRORS=$((ERRORS + 1))
fi

# 8. Проверка на hardcoded hex colors (должны использоваться Tailwind brand tokens)
echo ""
echo "🎨 Hardcoded hex colors в HTML:"
# Проверяем только основные продуктовые и компонентные страницы, не CMS контент
HARDCODED_HEX=$(grep -rl 'text-\[#ff4d00\]\|bg-\[#ff4d00\]\|text-\[#e64600\]\|bg-\[#e64600\]' "$DIST_DIR" --include="*.html" 2>/dev/null | wc -l || true)
HARDCODED_HEX=$(echo "$HARDCODED_HEX" | tr -d '[:space:]')
if [ "$HARDCODED_HEX" -gt 0 ]; then
  echo "  ⚠️  $HARDCODED_HEX файлов с hardcoded hex brand colors (предпочтительно Tailwind brand tokens)"
else
  echo "  ✅ Hardcoded hex brand colors не найдены"
fi

# 9. Проверка количества страниц
echo ""
echo "📊 Общая статистика:"
TOTAL_PAGES=$(find "$DIST_DIR" -name "index.html" -type f | wc -l | tr -d ' ')
echo "  📄 Всего страниц: $TOTAL_PAGES"
TOTAL_BLOG=$(find "$DIST_DIR/blog" -name "index.html" -type f 2>/dev/null | wc -l | tr -d ' ')
echo "  📝 Блог: $TOTAL_BLOG страниц"
TOTAL_GLOSSARY=$(find "$DIST_DIR/slovar-developera" -name "index.html" -type f 2>/dev/null | wc -l | tr -d ' ')
echo "  📖 Глоссарий: $TOTAL_GLOSSARY страниц"

# 10. Проверка внутренних ссылок (не ведут на 404)
echo ""
echo "🔗 Проверка ключевых ссылок:"
check_link() {
  local href="$1"
  local target_file="$DIST_DIR${href}index.html"
  if [ -f "$target_file" ]; then
    echo "  ✅ $href"
  else
    echo "  ❌ $href → файл не найден"
    ERRORS=$((ERRORS + 1))
  fi
}
check_link "/blog/"
check_link "/about/"
check_link "/contacts/"
check_link "/slovar-developera/"
check_link "/elektronnaya-registraciya/"
check_link "/ipoteka/"
check_link "/banki/"
check_link "/developers/"
check_link "/agentstva-nedvizhimosti/"

# 11. Общий результат
echo ""
echo "======================================="
if [ "$ERRORS" -gt 0 ]; then
  echo "❌ Найдено ошибок: $ERRORS"
  exit 1
else
  echo "✅ Все тесты пройдены!"
fi
