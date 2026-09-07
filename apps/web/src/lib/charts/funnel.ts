/**
 * Воронка: геометрия и подготовка данных
 *
 * Вертикальная «половинная» воронка: левый край прямой, правый сужается вниз.
 * На одном поле ДВЕ воронки — текущий период сплошной, предыдущий приглушённый
 * пунктиром. Так видно и уровень, и динамику одним объектом.
 *
 * Заменяет прежнюю конструкцию из шести блоков, где четыре нижних повторяли те
 * же проценты, что и верхний график. См. chart-guidelines.md §9.
 *
 * Потеря на шаге считается ОТ ПРЕДЫДУЩЕГО ШАГА, а не в пунктах от исходной базы.
 * В опубликованных дайджестах эти величины были перепутаны: «теряется 21,2%»
 * при фактических 32,0% от дошедших до шага.
 */

import { formatDelta, formatValue, monthShort } from './presets'
import type { Indicator } from './types'

export interface FunnelStage {
  name: string
  /** Значение текущего периода, % от исходной базы. */
  value: number
  /** Значение предыдущего периода, если есть. */
  previous: number | null
  /** Изменение к предыдущему периоду в процентных пунктах. */
  delta: number | null
  /** Доля дошедших с предыдущего шага, %. У первого шага пусто. */
  conversion: number | null
  /** Потеря на шаге от дошедших до предыдущего шага, %. */
  loss: number | null
  /** Готовые подписи. */
  valueLabel: string
  deltaLabel: string | null
  /** Текст для ховера и для скринридера. */
  detail: string
}

export interface FunnelBand {
  path: string
  /** Насыщенность фирменного цвета: сверху разбавленный, снизу полный. */
  opacity: number
  /** Ширина полосы сверху — от неё зависит, влезает ли подпись внутрь. */
  topWidth: number
  /** Текст на тёмной полосе читается белым. */
  onDark: boolean
}

/**
 * Разница между периодами на одном этапе — область между двумя границами воронки.
 *
 * Если этап вырос, область лежит ВНУТРИ текущей заливки: штриховка кладётся
 * поверх цвета. Если упал — область лежит СНАРУЖИ, на пустом фоне: штриховка
 * показывает, сколько потеряно. В обоих случаях это одна и та же фигура, меняется
 * только то, на чём она лежит.
 */
export interface FunnelDiff {
  path: string
  /** Этап вырос к предыдущему периоду. */
  grew: boolean
  /** Область пустая — нечего показывать. */
  isEmpty: boolean
}

export interface FunnelGeometry {
  /** Полосы этапов: у каждой своя насыщенность. */
  bands: FunnelBand[]
  /** Штрихуемая разница по этапам. Пусто, если предыдущего периода нет. */
  diffs: FunnelDiff[] | null
  /** Путь текущей воронки целиком — для обводки. */
  currentPath: string
  /**
   * Правая граница предыдущей воронки — незамкнутая линия под пунктир.
   * Замкнутый контур дублировал бы левый край и низ: они у воронок общие.
   */
  previousEdge: string | null
  /** Вертикальный центр строки каждого этапа. */
  rowCenters: number[]
  /** Верх и высота строки — для прозрачных зон ховера. */
  rowTops: number[]
  rowHeight: number
  width: number
  height: number
  /** Ширина области воронки без колонки подписей. */
  plotWidth: number
  /** Ширины полос предыдущего периода — для позиции подписи месяца. */
  previousWidths: number[] | null
}

export interface FunnelBlock {
  title: string
  stages: FunnelStage[]
  geometry: FunnelGeometry
  currentLabel: string
  previousLabel: string | null
  /** Трёхбуквенные подписи для самого графика. */
  currentLabelShort: string
  previousLabelShort: string | null
  notes: string[]
  source?: string
}

export interface FunnelOptions {
  /** Текущий период `YYYY-MM`. По умолчанию самый свежий. */
  through?: string
  width?: number
  /** Доля ширины под саму воронку; остальное — колонка названий и дельт. */
  plotRatio?: number
  rowHeight?: number
}

const MONTHS = [
  'январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
  'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь',
]

function monthName(period: string): string {
  const index = Number(period.split('-')[1]) - 1
  return MONTHS[index] ?? period
}

/**
 * Правая граница воронки — ломаная прямыми отрезками.
 *
 * Раньше здесь были кубические кривые, и силуэт получался волнистым: он читался
 * как декоративное пятно, а не как воронка. Стандартная воронка — трапеции.
 * Готовой воронки в @tanstack/charts нет (в экспортах только sankey), поэтому
 * геометрия своя.
 */
function buildEdge(widths: number[], rowTops: number[], height: number): string {
  const points: [number, number][] = widths.map((w, i) => [w, rowTops[i]])
  points.push([widths[widths.length - 1], height])
  return points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join('')
}

/** Замкнутая фигура: правая граница плюс левый край и низ. */
function buildPath(widths: number[], rowTops: number[], height: number): string {
  return `M0 0L${buildEdge(widths, rowTops, height).slice(1)}L0 ${height}Z`
}

/**
 * Область между границами двух воронок на одном этапе — трапеция, ограниченная
 * сверху и снизу строкой этапа, слева и справа двумя границами.
 */
function buildDiff(
  current: number[],
  previous: number[],
  rowTops: number[],
  height: number,
  index: number
): FunnelDiff {
  const top = rowTops[index]
  const bottom = index + 1 < rowTops.length ? rowTops[index + 1] : height
  const next = (arr: number[]) => (index + 1 < arr.length ? arr[index + 1] : arr[index])

  const curTop = current[index]
  const curBottom = next(current)
  const prevTop = previous[index]
  const prevBottom = next(previous)

  const path =
    `M${curTop.toFixed(1)} ${top.toFixed(1)}L${prevTop.toFixed(1)} ${top.toFixed(1)}` +
    `L${prevBottom.toFixed(1)} ${bottom.toFixed(1)}L${curBottom.toFixed(1)} ${bottom.toFixed(1)}Z`

  /**
   * Направление считается по СУММЕ расхождений сверху и снизу, а не по верхней
   * границе.
   *
   * У первого этапа воронки значение всегда 100%, поэтому сверху границы совпадают
   * и знак по верхней точке получался «рост» даже там, где полоса сужается к низу.
   * Из-за этого верхняя полоса упавшей воронки штриховалась как прирост.
   */
  const drift = curTop - prevTop + (curBottom - prevBottom)

  return {
    path,
    grew: drift >= 0,
    // Разница меньше половины пикселя не видна и только мусорит разметку.
    isEmpty: Math.abs(curTop - prevTop) < 0.5 && Math.abs(curBottom - prevBottom) < 0.5,
  }
}

/**
 * Полоса одного этапа: трапеция от своей ширины к ширине следующего этапа.
 * Полосы рисуются отдельно, чтобы каждая получила свою насыщенность цвета.
 */
function buildBand(
  widths: number[],
  rowTops: number[],
  height: number,
  index: number
): string {
  const top = rowTops[index]
  const bottom = index + 1 < rowTops.length ? rowTops[index + 1] : height
  const wTop = widths[index]
  const wBottom = index + 1 < widths.length ? widths[index + 1] : widths[index]
  return (
    `M0 ${top.toFixed(1)}L${wTop.toFixed(1)} ${top.toFixed(1)}` +
    `L${wBottom.toFixed(1)} ${bottom.toFixed(1)}L0 ${bottom.toFixed(1)}Z`
  )
}

export function buildFunnelBlock(indicator: Indicator, options: FunnelOptions = {}): FunnelBlock {
  const { width = 720, plotRatio = 0.58, rowHeight = 76 } = options

  const periods = [...new Set(indicator.observations.map(o => o.period))].sort()
  const through = options.through ?? periods[periods.length - 1]
  const currentIndex = periods.indexOf(through)
  const previous = currentIndex > 0 ? periods[currentIndex - 1] : null

  const order = indicator.series ?? []
  const valueAt = (period: string | null, stage: string): number | null => {
    if (!period) return null
    const row = indicator.observations.find(o => o.period === period && o.series === stage)
    return row?.value ?? null
  }

  const stages: FunnelStage[] = []
  order.forEach((name, i) => {
    const value = valueAt(through, name)
    if (value === null) return

    const prev = valueAt(previous, name)
    const delta = prev === null ? null : value - prev

    const upstream = i > 0 ? valueAt(through, order[i - 1]) : null
    const conversion = upstream && upstream > 0 ? (value / upstream) * 100 : null
    const loss = conversion === null ? null : 100 - conversion

    const parts = [`${formatValue(value, indicator.unit)} от созданных`]
    if (conversion !== null) {
      parts.push(`дошло ${formatValue(conversion, 'percent')} с предыдущего шага`)
      parts.push(`потеряно ${formatValue(loss as number, 'percent')}`)
    }
    if (prev !== null && delta !== null) {
      parts.push(
        `${monthName(previous as string)}: ${formatValue(prev, indicator.unit)} ` +
          `(${delta >= 0 ? '+' : '−'}${formatDelta(delta, indicator.unit, 'correct')})`
      )
    }

    stages.push({
      name,
      value,
      previous: prev,
      delta,
      conversion,
      loss,
      valueLabel: formatValue(value, indicator.unit),
      deltaLabel: delta === null || delta === 0 ? null : formatDelta(delta, indicator.unit),
      detail: `${name}: ${parts.join('; ')}`,
    })
  })

  const plotWidth = Math.round(width * plotRatio)
  const height = rowHeight * stages.length
  const rowTops = stages.map((_, i) => i * rowHeight)
  const rowCenters = rowTops.map(top => top + rowHeight / 2)

  const scale = (value: number) => Math.max((value / 100) * plotWidth, 6)
  const widths = stages.map(s => scale(s.value))

  /**
   * Насыщенность фирменного цвета растёт вниз: наверху разбавленный, у последнего
   * этапа полный. Ступени различаются сами по себе, без обводок и разделителей.
   */
  const MIN_OPACITY = 0.22
  const opacityAt = (i: number) =>
    stages.length < 2
      ? 1
      : MIN_OPACITY + (1 - MIN_OPACITY) * (i / (stages.length - 1))

  const geometry: FunnelGeometry = {
    bands: stages.map((_, i) => {
      const opacity = opacityAt(i)
      return {
        path: buildBand(widths, rowTops, height, i),
        opacity,
        topWidth: widths[i],
        onDark: opacity >= 0.62,
      }
    }),
    currentPath: buildPath(widths, rowTops, height),
    previousEdge: stages.every(s => s.previous !== null)
      ? buildEdge(stages.map(s => scale(s.previous as number)), rowTops, height)
      : null,
    diffs: stages.every(s => s.previous !== null)
      ? stages.map((_, i) =>
          buildDiff(widths, stages.map(s => scale(s.previous as number)), rowTops, height, i)
        )
      : null,
    previousWidths: stages.every(s => s.previous !== null)
      ? stages.map(s => scale(s.previous as number))
      : null,
    rowCenters,
    rowTops,
    rowHeight,
    width,
    height,
    plotWidth,
  }

  return {
    title: indicator.title,
    stages,
    geometry,
    currentLabel: monthName(through),
    previousLabel: previous ? monthName(previous) : null,
    currentLabelShort: monthShort(through),
    previousLabelShort: previous ? monthShort(previous) : null,
    notes: indicator.notes ?? [],
    source: indicator.source,
  }
}
