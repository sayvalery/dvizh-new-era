/**
 * Сборка блока карточек показателя
 *
 * Смысловая единица дайджеста — БЛОК: один заголовок и набор карточек, где
 * каждая карточка живёт сама по себе. Читатель ищет свой регион или свою
 * программу и смотрит, что стало с ней, а не сравнивает Москву с Тывой.
 *
 * Здесь готовятся данные карточек; разметку рисует MetricCards.astro, а
 * экспортный SVG будет собирать тот же результат в фиксированную раскладку.
 */

import { formatDelta, formatValue, type DeltaUnitStyle } from './presets'
import { renderSparkline, type SparkPoint, type SparklineResult } from './sparkline'
import type { Indicator } from './types'

export interface CardOptions {
  /** Последний показываемый период `YYYY-MM`. По умолчанию — самый свежий. */
  through?: string
  /**
   * Сколько точек в линии. По умолчанию 3 — «два колена»: динамика читается
   * лучше, чем на одном отрезке, а подписаны всё равно только края
   * (chart-guidelines.md §2).
   */
  points?: 2 | 3 | 4
  /** Как подписывать дельту процентных показателей. */
  deltaStyle?: DeltaUnitStyle
  /** Размеры спарклайна. Полноширинные карточки шире. */
  width?: number
  height?: number
}

export interface Card {
  /** Название ряда: регион, программа. Пусто у показателей с единственным рядом. */
  label: string
  /** Текущее значение. */
  value: string
  /** Подпись изменения без знака — знак несёт стрелка. */
  delta: string
  spark: SparklineResult
  /** Текстовое описание карточки для скринридера. */
  aria: string
}

export interface CardsBlock {
  title: string
  cards: Card[]
  notes: string[]
  source?: string
  /** Период последней точки, для подписи блока. */
  period: string
}

/** Точки одного ряда в пределах окна. */
function seriesPoints(
  indicator: Indicator,
  series: string | undefined,
  through: string,
  count: number
): SparkPoint[] {
  const rows = indicator.observations
    .filter(o => (series ? o.series === series : true))
    .filter(o => o.period <= through)
    .filter(o => o.value !== null)
    .sort((a, b) => a.period.localeCompare(b.period))

  return rows.slice(-count).map(o => ({ period: o.period, value: o.value as number }))
}

export function buildCardsBlock(indicator: Indicator, options: CardOptions = {}): CardsBlock {
  const { points = 3, deltaStyle = 'correct', width, height } = options

  const allPeriods = [...new Set(indicator.observations.map(o => o.period))].sort()
  const through = options.through ?? allPeriods[allPeriods.length - 1]

  const seriesList = indicator.series?.length ? indicator.series : [undefined]

  const cards: Card[] = []
  for (const series of seriesList) {
    const pts = seriesPoints(indicator, series, through, points)
    // Ряд без двух точек показать нечем — например «Господдержка» после закрытия программы.
    if (pts.length < 2) continue

    const spark = renderSparkline(pts, {
      unit: indicator.unit,
      polarity: indicator.polarity,
      idPrefix: `${indicator.id}-${series ?? 'main'}`.replace(/[^a-zA-Z0-9-]/g, '_'),
      width,
      height,
    })

    const arrow = spark.direction === 'up' ? 'вырос' : spark.direction === 'down' ? 'снизился' : 'без изменений'
    const label = series ?? indicator.title

    cards.push({
      label: series ?? '',
      value: formatValue(spark.last.value, indicator.unit),
      delta: formatDelta(spark.delta, indicator.unit, deltaStyle),
      spark,
      aria:
        `${label}: ${formatValue(spark.last.value, indicator.unit)}, ` +
        `${arrow} на ${formatDelta(spark.delta, indicator.unit, 'correct')} ` +
        `с ${formatValue(spark.first.value, indicator.unit)}`,
    })
  }

  return {
    title: indicator.title,
    cards,
    notes: indicator.notes ?? [],
    source: indicator.source,
    period: through,
  }
}
