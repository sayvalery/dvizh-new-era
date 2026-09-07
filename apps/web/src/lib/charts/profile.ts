/**
 * Два периода по категориям-интервалам
 *
 * Данные, где ряды — это интервалы: доход, размер первого взноса, категория
 * платежа. Каждый интервал сравнивается САМ С СОБОЙ месяц к месяцу; величины
 * разных интервалов при этом лежат на общей шкале, потому что измерены в одних
 * единицах.
 *
 * ЛИНИЙ ЗДЕСЬ НЕ БЫВАЕТ. Между «50–99к» и «100–149к» нет промежуточных значений,
 * соединять точки нечем: линия сообщала бы непрерывность, которой нет.
 * Формы подачи — столбики или парные точки. См. chart-guidelines.md §14.
 */

import { formatDelta, formatValue, monthShort } from './presets'
import type { Indicator } from './types'

export interface ProfilePoint {
  name: string
  current: number | null
  previous: number | null
  /** Изменение к предыдущему периоду. */
  delta: number | null
  /** Готовые подписи. */
  currentLabel: string | null
  previousLabel: string | null
  deltaLabel: string | null
  /** Положение в долях от размеров поля. */
  xPercent: number
  yCurrentPercent: number | null
  yPreviousPercent: number | null
}

export interface ProfileBlock {
  title: string
  points: ProfilePoint[]
  currentPeriod: string
  previousPeriod: string | null
  currentMonth: string
  previousMonth: string | null
  /** Трёхбуквенные подписи — то, что ставится на сам график. */
  currentMonthShort: string
  previousMonthShort: string | null
  width: number
  height: number
  /** Верх шкалы — подписывается, чтобы масштаб был виден. */
  maxValue: number
  /** Факт, а не оценка: куда сместилось и на сколько. */
  summary: string
  notes: string[]
  source?: string
}

export interface ProfileOptions {
  through?: string
  width?: number
  height?: number
}

const MONTHS = [
  'январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
  'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь',
]

function monthName(period: string): string {
  return MONTHS[Number(period.split('-')[1]) - 1] ?? period
}

export function buildProfileBlock(indicator: Indicator, options: ProfileOptions = {}): ProfileBlock {
  const { width = 900, height = 300 } = options

  const periods = [...new Set(indicator.observations.map(o => o.period))].sort()
  const through = options.through ?? periods[periods.length - 1]
  const index = periods.indexOf(through)
  const previous = index > 0 ? periods[index - 1] : null

  const order = indicator.series ?? []
  const valueAt = (period: string | null, name: string): number | null => {
    if (!period) return null
    return indicator.observations.find(o => o.period === period && o.series === name)?.value ?? null
  }

  // Интервалы без данных в обоих периодах не показываем вовсе — иначе на графике
  // появится пустое место, которое читается как ноль.
  const names = order.filter(
    name => valueAt(through, name) !== null || valueAt(previous, name) !== null
  )

  const currents = names.map(n => valueAt(through, n))
  const previouses = names.map(n => valueAt(previous, n))

  const all = [...currents, ...previouses].filter((v): v is number => v !== null)
  const maxValue = Math.max(...all)
  // База — ноль: доли и рубли читаются от нуля, иначе форма профиля врёт.
  const scaleY = (v: number) => height - (v / maxValue) * height

  const ysCurrent = currents.map(v => (v === null ? null : scaleY(v)))
  const ysPrevious = previouses.map(v => (v === null ? null : scaleY(v)))

  const points: ProfilePoint[] = names.map((name, i) => {
    const current = currents[i]
    const prev = previouses[i]
    const delta = current !== null && prev !== null ? current - prev : null
    return {
      name,
      current,
      previous: prev,
      delta,
      currentLabel: current === null ? null : formatValue(current, indicator.unit, indicator.unit !== 'rub'),
      previousLabel: prev === null ? null : formatValue(prev, indicator.unit, indicator.unit !== 'rub'),
      deltaLabel: delta === null || delta === 0 ? null : formatDelta(delta, indicator.unit),
      xPercent: names.length > 1 ? (i / (names.length - 1)) * 100 : 50,
      yCurrentPercent: ysCurrent[i] === null ? null : ((ysCurrent[i] as number) / height) * 100,
      yPreviousPercent: ysPrevious[i] === null ? null : ((ysPrevious[i] as number) / height) * 100,
    }
  })

  const movers = points
    .filter(p => p.delta !== null)
    .sort((a, b) => Math.abs(b.delta as number) - Math.abs(a.delta as number))
  const summary = movers.length
    ? movers
        .slice(0, 2)
        .map(
          p =>
            `${p.name}: ${(p.delta as number) > 0 ? 'плюс' : 'минус'} ` +
            `${formatDelta(p.delta as number, indicator.unit)}`
        )
        .join(', ')
    : 'изменений нет'

  return {
    title: indicator.title,
    points,
    currentPeriod: through,
    previousPeriod: previous,
    currentMonth: monthName(through),
    previousMonth: previous ? monthName(previous) : null,
    currentMonthShort: monthShort(through),
    previousMonthShort: previous ? monthShort(previous) : null,
    width,
    height,
    maxValue,
    summary,
    notes: indicator.notes ?? [],
    source: indicator.source,
  }
}
