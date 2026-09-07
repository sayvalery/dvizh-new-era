/**
 * Шорткоды графиков в bodyHtml
 *
 * Все статьи блога живут в legacy-поле `bodyHtml` (перенос из Webflow), а не в
 * блоках Payload. Поэтому график попадает в статью шорткодом:
 *
 *   <figure data-chart="approval-by-region"></figure>
 *
 * Период в шорткоде НЕ указывается — он берётся из выпуска, привязанного к
 * статье. Благодаря этому тело прошлого дайджеста копируется целиком в новый,
 * и все графики сами становятся графиками нового месяца.
 *
 * Статья не склеивается из HTML-строк: тело РАЗБИВАЕТСЯ на фрагменты, и вместо
 * шорткода страница рендерит настоящий компонент. Иначе разметку карточек
 * пришлось бы дублировать строками, и она бы разошлась с MetricCards.astro.
 *
 * ВАЖНО: разбивать ПОСЛЕ sanitizeBodyHtml() — санитайзер срезает `style=`,
 * который есть в корне SVG, а typografHtml полез бы внутрь разметки графика.
 * См. docs/analytics-charts/README.md §7
 */

/** `<figure data-chart="id">` с любыми атрибутами и любым содержимым. */
const SHORTCODE = /<figure\b[^>]*\bdata-chart="([a-z0-9-]+)"[^>]*>[\s\S]*?<\/figure>/gi

export type BodySegment =
  | { type: 'html'; html: string }
  | { type: 'chart'; id: string }

export interface SplitResult {
  segments: BodySegment[]
  /** Идентификаторы графиков в порядке появления. */
  chartIds: string[]
}

/**
 * Разбивает тело статьи на фрагменты HTML и места под графики.
 * Порядок сохраняется, остальной HTML не меняется.
 */
export function splitByShortcodes(html: string): SplitResult {
  const segments: BodySegment[] = []
  const chartIds: string[] = []

  let cursor = 0
  SHORTCODE.lastIndex = 0

  for (let match = SHORTCODE.exec(html); match !== null; match = SHORTCODE.exec(html)) {
    if (match.index > cursor) {
      segments.push({ type: 'html', html: html.slice(cursor, match.index) })
    }
    segments.push({ type: 'chart', id: match[1] })
    chartIds.push(match[1])
    cursor = match.index + match[0].length
  }

  if (cursor < html.length) {
    segments.push({ type: 'html', html: html.slice(cursor) })
  }

  return { segments, chartIds }
}

/**
 * Проверка, что все шорткоды статьи имеют показатель. Вызывать на сборке:
 * лучше упасть, чем опубликовать статью с дырой на месте графика.
 */
export function assertChartsAvailable(chartIds: string[], availableIds: string[]): void {
  const available = new Set(availableIds)
  const missing = [...new Set(chartIds)].filter(id => !available.has(id))
  if (missing.length) {
    throw new Error(
      `[charts] шорткоды без показателя: ${missing.join(', ')}. ` +
        `Доступны: ${availableIds.join(', ')}`
    )
  }
}
