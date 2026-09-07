/**
 * Рейтинг с меняющимся составом участников
 *
 * Топ банков: от месяца к месяцу состав меняется — кто-то входит, кто-то выпадает.
 * Поэтому рядом с каждой строкой нужен не только сдвиг значения, но и факт
 * появления или ухода: без этого рейтинг врёт молчанием.
 *
 * Bump chart (линии рангов по месяцам) сознательно НЕ используется: он превращается
 * в спагетти уже на десяти участниках и скрывает величину — видно только порядок.
 * См. chart-guidelines.md §14.
 */

import { formatDelta, formatValue, monthShort } from './presets'
import type { Indicator } from './types'

export interface RankingRow {
  name: string
  value: number
  valueLabel: string
  /** Место в текущем месяце, начиная с 1. */
  rank: number
  previous: number | null
  previousRank: number | null
  delta: number | null
  deltaLabel: string | null
  /** Улучшение с учётом полярности: у скорости «меньше» — это лучше. */
  isGood: boolean | null
  /** Не было в прошлом месяце. */
  isNew: boolean
  /** Сдвиг по месту: +1 значит подъём на одну позицию. */
  rankShift: number | null
  /** Служебная строка «Остальные» — не участник, а остаток. */
  isRest: boolean
}

export interface RankingBlock {
  title: string
  rows: RankingRow[]
  /** Кто выпал из топа по сравнению с прошлым месяцем. */
  dropped: string[]
  currentMonth: string
  previousMonth: string | null
  currentMonthShort: string
  previousMonthShort: string | null
  maxValue: number
  notes: string[]
  source?: string
}

export interface RankingOptions {
  through?: string
  /** Сколько позиций показывать. Соцсети держат шесть подписей, статья — все. */
  limit?: number
}

const MONTHS = [
  'январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
  'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь',
]

const REST = 'Остальные'

export function buildRankingBlock(indicator: Indicator, options: RankingOptions = {}): RankingBlock {
  const periods = [...new Set(indicator.observations.map(o => o.period))].sort()
  const through = options.through ?? periods[periods.length - 1]
  const index = periods.indexOf(through)
  const previous = index > 0 ? periods[index - 1] : null

  const rowsAt = (period: string | null) =>
    period === null
      ? []
      : indicator.observations.filter(o => o.period === period && o.value !== null && o.series)

  const current = rowsAt(through)
  const prev = rowsAt(previous)

  const prevByName = new Map(prev.map(o => [o.series as string, o.value as number]))
  const prevRank = new Map(
    prev.filter(o => o.series !== REST).map((o, i) => [o.series as string, i + 1])
  )

  const ranked = current.filter(o => o.series !== REST)
  const rest = current.find(o => o.series === REST)

  const limited = options.limit ? ranked.slice(0, options.limit) : ranked

  const rows: RankingRow[] = limited.map((o, i) => {
    const name = o.series as string
    const value = o.value as number
    const previousValue = prevByName.get(name) ?? null
    const delta = previousValue === null ? null : value - previousValue
    const isGood =
      delta === null || delta === 0
        ? null
        : indicator.polarity === 'higher-is-better'
          ? delta > 0
          : delta < 0
    const pRank = prevRank.get(name) ?? null

    return {
      name,
      value,
      valueLabel: formatValue(value, indicator.unit),
      rank: i + 1,
      previous: previousValue,
      previousRank: pRank,
      delta,
      deltaLabel: delta === null || delta === 0 ? null : formatDelta(delta, indicator.unit),
      isGood,
      isNew: previousValue === null,
      rankShift: pRank === null ? null : pRank - (i + 1),
      isRest: false,
    }
  })

  if (rest) {
    const value = rest.value as number
    const previousValue = prevByName.get(REST) ?? null
    const delta = previousValue === null ? null : value - previousValue
    rows.push({
      name: REST,
      value,
      valueLabel: formatValue(value, indicator.unit),
      rank: rows.length + 1,
      previous: previousValue,
      previousRank: null,
      delta,
      deltaLabel: delta === null || delta === 0 ? null : formatDelta(delta, indicator.unit),
      isGood: null,
      isNew: false,
      rankShift: null,
      isRest: true,
    })
  }

  const shownNames = new Set(rows.map(r => r.name))
  const dropped = prev
    .map(o => o.series as string)
    .filter(name => name !== REST && !shownNames.has(name))

  const values = rows.map(r => r.value)
  const previousValues = rows.map(r => r.previous).filter((v): v is number => v !== null)

  return {
    title: indicator.title,
    rows,
    dropped,
    currentMonth: MONTHS[Number(through.split('-')[1]) - 1] ?? through,
    previousMonth: previous ? MONTHS[Number(previous.split('-')[1]) - 1] ?? previous : null,
    currentMonthShort: monthShort(through),
    previousMonthShort: previous ? monthShort(previous) : null,
    maxValue: Math.max(...values, ...previousValues),
    notes: indicator.notes ?? [],
    source: indicator.source,
  }
}
