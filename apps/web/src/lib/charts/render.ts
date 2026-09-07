/**
 * Рендер графиков в SVG на этапе сборки
 *
 * Единственный файл, который знает про @tanstack/charts. Всё остальное
 * приложение работает через renderIndicator(). Замена движка стоит переписывания
 * этого файла и ничего больше — версия прибита точным пином без `^`,
 * потому что библиотека выпускала ломающие изменения в minor-версиях.
 *
 * Базовый рендер не требует клиентского JS: на выходе строка SVG с настоящими
 * <text>, а не кривыми. См. docs/analytics-charts/README.md §5
 */

import { createChartScene, defineChart, lineY, barY, renderChartSvg } from '@tanstack/charts'
import { scaleLinear } from '@tanstack/charts/scales/linear'
import { scalePoint } from '@tanstack/charts/scales/point'
import { scaleBand } from '@tanstack/charts/scales/band'

import type { Channel, Indicator, Observation } from './types'
import { CHANNELS, FONT_FAMILY, PALETTE, THEME, formatPeriod, formatValue } from './presets'

export interface RenderOptions {
  channel?: Channel
  /** Последний показываемый период `YYYY-MM`. По умолчанию — самый свежий в данных. */
  through?: string
  /** Сколько последних месяцев показывать. По умолчанию 9 — как в текущих дайджестах. */
  months?: number
}

export interface RenderResult {
  svg: string
  /** Готовый alt: вывод с числами, а не название графика. В почте картинки блокируются. */
  alt: string
  width: number
  height: number
  /** Ряды в порядке палитры — для легенды, которую рисует обёртка, а не библиотека. */
  legend: { label: string; color: string }[]
  /** Оговорки к данным: разрывы методологии, малое N. */
  notes: string[]
}

/** Уникальные периоды показателя по возрастанию. */
function periodsOf(indicator: Indicator): string[] {
  return [...new Set(indicator.observations.map(o => o.period))].sort()
}

/** Названия рядов в объявленном порядке, иначе в порядке появления. */
function seriesOf(indicator: Indicator): string[] {
  if (indicator.series?.length) return indicator.series
  const seen = new Set<string>()
  for (const o of indicator.observations) if (o.series) seen.add(o.series)
  return [...seen]
}

/** Окно периодов под опции рендера. */
function windowPeriods(indicator: Indicator, options: RenderOptions): string[] {
  const all = periodsOf(indicator)
  const through = options.through ?? all[all.length - 1]
  const upTo = all.filter(p => p <= through)
  const months = options.months ?? 9
  return upTo.slice(-months)
}

/**
 * Строки для движка: одна на период, значения рядов в колонках.
 * `null` пропускаем — движок не должен рисовать разрыв как ноль.
 */
function toRows(indicator: Indicator, periods: string[], series: string[], short: boolean) {
  const byKey = new Map<string, Observation>()
  for (const o of indicator.observations) byKey.set(`${o.period}|${o.series ?? ''}`, o)

  return periods.map(period => {
    const row: Record<string, string | number | null> = {
      period,
      label: formatPeriod(period, short),
    }
    for (const s of series.length ? series : ['']) {
      row[s || 'value'] = byKey.get(`${period}|${s}`)?.value ?? null
    }
    return row
  })
}

/** Проверки, которые должны падать на сборке, а не всплывать в опубликованной статье. */
function assertReadable(indicator: Indicator, periods: string[], channel: Channel): void {
  const preset = CHANNELS[channel]
  if (periods.length > preset.maxCategories) {
    throw new Error(
      `[charts] «${indicator.title}»: ${periods.length} подписей при лимите ${preset.maxCategories} ` +
        `для канала «${channel}». Сократите окно или выберите другой канал.`
    )
  }
  if (!periods.length) {
    throw new Error(`[charts] «${indicator.title}»: нет данных в выбранном окне периодов.`)
  }
}

/** Строка alt с выводом и числами — вместо названия графика. */
function buildAlt(indicator: Indicator, periods: string[], series: string[], rows: ReturnType<typeof toRows>): string {
  const last = rows[rows.length - 1]
  const first = rows[0]
  const parts: string[] = []

  for (const s of series.length ? series : ['']) {
    const key = s || 'value'
    const to = last[key]
    const from = first[key]
    if (typeof to !== 'number') continue
    const name = s ? `${s}: ` : ''
    const delta =
      typeof from === 'number' ? ` (было ${formatValue(from, indicator.unit)})` : ''
    parts.push(`${name}${formatValue(to, indicator.unit)}${delta}`)
  }

  const range = `${formatPeriod(periods[0])} — ${formatPeriod(periods[periods.length - 1])}`
  const alt = `${indicator.title}, ${range}. ${parts.join('; ')}`
  return alt.length > 150 ? `${alt.slice(0, 147)}…` : alt
}

/**
 * Рендер показателя в SVG.
 *
 * Тип графика выбирается по форме данных, а не по желанию автора статьи —
 * именно это не даёт повторить «плохо выбранный вид графика».
 */
export function renderIndicator(indicator: Indicator, options: RenderOptions = {}): RenderResult {
  const channel = options.channel ?? 'web'
  const preset = CHANNELS[channel]
  const short = channel !== 'web'
  const periods = windowPeriods(indicator, options)

  assertReadable(indicator, periods, channel)

  const series = seriesOf(indicator)
  const rows = toRows(indicator, periods, series, short)
  const keys = series.length ? series : ['value']

  const tickLabels = {
    fontSize: preset.tickFontSize,
    fontWeight: 400,
    // Библиотека молча прореживает подписи при крупном кегле — потерянный месяц
    // выглядит как отсутствие данных. Прореживание запрещено везде.
    thin: false,
  }

  const isBar = indicator.form === 'distribution' || keys.length === 1 && indicator.form === 'timeseries-single'

  const marks = keys.map((key, i) =>
    isBar
      ? barY(rows, { id: key, x: 'label', y: key, fill: PALETTE[i % PALETTE.length] })
      : lineY(rows, {
          id: key,
          x: 'label',
          y: key,
          points: true,
          stroke: PALETTE[i % PALETTE.length],
          strokeWidth: preset.strokeWidth,
        })
  )

  const definition = defineChart({
    marks,
    // Заголовки осей библиотека рисует жёстко кеглем 11 и переопределить нельзя,
    // поэтому подписи осей и заголовок рисует обёртка, а не движок.
    x: isBar
      ? { scale: () => scaleBand().padding(0.25), axis: { tickLabels } }
      : { scale: () => scalePoint().padding(0.2), axis: { tickLabels } },
    y: { scale: scaleLinear, nice: true, grid: true, axis: { tickLabels } },
    theme: {
      background: preset.background ?? 'transparent',
      foreground: THEME.foreground,
      muted: THEME.muted,
      grid: THEME.grid,
      palette: PALETTE,
    },
  })

  const scene = createChartScene(
    definition,
    { width: preset.width, height: preset.height },
    { typography: { fontFamily: FONT_FAMILY, locale: 'ru' } }
  )

  const alt = buildAlt(indicator, periods, series, rows)

  let svg = renderChartSvg(scene, {
    ariaLabel: alt,
    idPrefix: `${indicator.id}-${channel}`,
    tabIndex: -1,
  })

  svg = svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ')

  // Web остаётся адаптивным (width=100% + viewBox), растровые каналы получают
  // фиксированный холст — иначе экспорт в PNG не знает своего размера.
  if (channel !== 'web') {
    svg = svg.replace('width="100%" height="100%"', `width="${preset.width}" height="${preset.height}"`)
  }

  assertFontSizes(svg, indicator, channel)

  return {
    svg,
    alt,
    width: preset.width,
    height: preset.height,
    legend: keys
      .filter(k => k !== 'value')
      .map((label, i) => ({ label, color: PALETTE[i % PALETTE.length] })),
    notes: indicator.notes ?? [],
  }
}

/** Минимальный кегль — требование канала, проверяем по факту в готовом SVG. */
function assertFontSizes(svg: string, indicator: Indicator, channel: Channel): void {
  const preset = CHANNELS[channel]
  const sizes = [...svg.matchAll(/font-size="(\d+(?:\.\d+)?)"/g)].map(m => Number(m[1]))
  const tooSmall = sizes.filter(s => s < preset.minFontSize)
  if (tooSmall.length) {
    throw new Error(
      `[charts] «${indicator.title}» (${channel}): кегль ${[...new Set(tooSmall)].join(', ')} ` +
        `меньше минимального ${preset.minFontSize}px для этого канала.`
    )
  }
}
