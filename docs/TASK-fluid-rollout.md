# Флюидная вёрстка (`.fluid-scale`) — что осталось

Механика: класс `.fluid-scale` вешается на `<html>` через проп `htmlClass` (BaseLayout → SiteLayout).
Внутри `@media (min-width: 1024px)` корневой `font-size: clamp(0.7111rem, 1.1111vw, 1.7778rem)`
(ровно 16px на 1440), вся раскладка задана в rem и масштабируется пропорционально.
Ниже 1024 корень = 16px, мобилка не трогается. Правила — в `apps/web/src/styles/global.css`.

## Сделано

- 12 продуктовых страниц + `index.astro` — на `htmlClass="fluid-scale"`.

## Осталось

### 1. `/otkrytaya-redakciya` — перевести на `.fluid-scale`

Единственная «обычная» страница, оставшаяся на старом `.fluid-page`. Из-за этого она тянет за собой
парные правила `.fluid-page` в `global.css`, которые иначе можно было бы удалить.

Шаги:
1. `htmlClass="fluid-scale"` вместо `bodyClass="fluid-page"` в SiteLayout.
2. Прогнать автодетект «залипших px»: скрытый iframe на 1440 и 2560, обход `body *`,
   сравнить computed `font-size` и `rect.width` — совпало на обеих ширинах, значит значение
   захардкожено и нужен парный оверрайд в rem (должно расти ×1.7778).
3. Новые arbitrary-размеры на lg+ писать сразу в rem — они скейлятся сами, оверрайд не нужен.
4. Проверить `BentoGrid variant="four"` (`lg:h-[29.5rem]`) — под `.fluid-scale` парное правило
   `.fluid-page .lg\:h-\[29\.5rem\]` больше не понадобится.

### 2. Блог и кейсы — перевести на `.fluid-scale`

Отложено пользователем осознанно: там prose-контент из CMS.

- `blog/index.astro` — 2 локальных правила в `<style is:global>` на `.fluid-page`.
- `blog/[slug].astro` — 1 правило.
- `.prose` (`@tailwindcss/typography`) под `.fluid-scale` масштабируется сам (rem в корне + em внутри).
  Риск — только во встроенных px внутри `bodyHtml`, унаследованного из Webflow.
  Проверяется лишь на маке с живой CMS.

### 3. После перевода всех страниц

Удалить блок правил `.fluid-page` из `global.css` и сам класс из `BaseLayout`.
