/**
 * Спарклайн для карточки показателя
 *
 * Своя геометрия, без движка графиков: здесь 2–4 точки, нет осей и нет сетки,
 * зато нужен точный контроль над градиентной заливкой и положением подписей.
 * @tanstack/charts остаётся для того, где он реально нужен — рейтинги и
 * распределения.
 *
 * ВАЖНО: в SVG нет текста. Подписи значений возвращаются координатами в долях
 * и рисуются HTML-ом поверх графика. Иначе они масштабируются вместе с viewBox
 * и на узкой карточке становятся мелкими, не подчиняясь шкале шрифтов сайта.
 *
 * Смысл дизайна восстановлен из оригинальных картинок дайджеста, см.
 * docs/analytics-charts/chart-guidelines.md:
 *
 * 1. Шкала у каждой карточки СВОЯ (§6).
 * 2. Цвет означает «хорошо/плохо», а не «вверх/вниз» (§5).
 * 3. Наклон отражает относительное изменение с ограничением сверху (§6).
 * 4. Подписаны только крайние точки; середина показывается по ховеру (§2, §3).
 */

import type { Polarity, Unit } from './types'
import { formatValue } from './presets'

/** «Хорошо» — из оригинального дайджеста, снято пипеткой с исходных SVG. */
export const SPARK_COLORS = {
  good: '#04b34a',
  /** Ухудшение показывается серым, а не красным — так было в оригинале. */
  bad: '#cacaca',
}

/**
 * Относительное изменение, при котором наклон достигает максимума.
 *
 * В оригинальных картинках единого правила НЕ БЫЛО: «Военная» падала на 17% и
 * нарисована плоской, а «Стандартная» росла на 5% и нарисована заметнее — линии
 * рисовались на глаз в Figma. Здесь правило одно для всех, поэтому наклон
 * действительно что-то значит.
 */
const RELATIVE_CAP = 0.12

/** Максимальная амплитуда линии в долях высоты. */
const MAX_AMPLITUDE = 0.48

/** Вертикальный центр линии в долях высоты: линия живёт в верхней части карточки. */
const MID = 0.46

/** Свободное место сверху под подписи значений, в долях высоты. */
const HEAD_ROOM = 0.16

export interface SparkPoint {
  period: string
  value: number
}

/** Точка с готовой подписью и положением в долях — для HTML-подписей поверх SVG. */
export interface SparkPointLayout extends SparkPoint {
  label: string
  xPercent: number
  yPercent: number
  /** Крайние точки подписаны всегда, промежуточные — только по ховеру. */
  isEdge: boolean
  isFirst: boolean
  isLast: boolean
}

export interface SparklineOptions {
  width?: number
  height?: number
  unit: Unit
  polarity: Polarity
  /** Префикс идентификаторов градиента — обязателен при нескольких SVG на странице. */
  idPrefix: string
}

export interface SparklineResult {
  /** Только заливка, линия и точка. Без текста. */
  svg: string
  points: SparkPointLayout[]
  /** Абсолютное изменение: последняя точка минус первая. */
  delta: number
  /** Улучшение это или ухудшение — с учётом полярности показателя. */
  isGood: boolean
  direction: 'up' | 'down' | 'flat'
  color: string
  first: SparkPoint
  last: SparkPoint
}

/** Вертикальная раскладка: линейно по окну значений, амплитуда — по относительному изменению. */
function layoutY(values: number[], height: number): number[] {
  const first = values[0]
  const last = values[values.length - 1]
  const min = Math.min(...values)
  const max = Math.max(...values)

  const base = Math.abs(first) > 0 ? Math.abs(first) : 1
  const relative = Math.abs(last - first) / base
  const amplitude = Math.min(relative / RELATIVE_CAP, 1) * MAX_AMPLITUDE * height

  const mid = MID * height
  if (max === min) return values.map(() => mid)

  // Больше значение — выше на экране (меньше y).
  return values.map(v => mid + amplitude / 2 - ((v - min) / (max - min)) * amplitude)
}

export function renderSparkline(points: SparkPoint[], options: SparklineOptions): SparklineResult {
  const { width = 480, height = 150, unit, polarity, idPrefix } = options

  if (points.length < 2) {
    throw new Error('[sparkline] нужно минимум две точки — иначе динамику показывать нечем')
  }

  const first = points[0]
  const last = points[points.length - 1]
  const delta = last.value - first.value

  const direction: SparklineResult['direction'] = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat'
  const improved = polarity === 'higher-is-better' ? delta > 0 : delta < 0
  const isGood = delta === 0 ? true : improved
  const color = isGood ? SPARK_COLORS.good : SPARK_COLORS.bad

  const headRoom = HEAD_ROOM * height
  const ys = layoutY(points.map(p => p.value), height - headRoom).map(y => y + headRoom)

  const inset = 2
  const step = (width - inset * 2) / (points.length - 1)
  const xs = points.map((_, i) => inset + i * step)

  const line = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${ys[i].toFixed(1)}`).join('')
  const area = `${line}L${xs[xs.length - 1].toFixed(1)} ${height}L${xs[0].toFixed(1)} ${height}Z`

  const gradientId = `${idPrefix}-fade`

  const svg =
    // Масштабирование строго пропорциональное, но текста внутри нет — подписи
    // рисуются HTML-ом, поэтому мелкими они не станут.
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" ` +
    `style="display:block;width:100%;height:auto;overflow:visible" aria-hidden="true">` +
    `<defs><linearGradient id="${gradientId}" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="${color}" stop-opacity="0.34"/>` +
    `<stop offset="1" stop-color="${color}" stop-opacity="0"/>` +
    `</linearGradient></defs>` +
    `<path d="${area}" fill="url(#${gradientId})"/>` +
    `<path d="${line}" fill="none" stroke="${color}" stroke-width="3" ` +
    `stroke-linecap="round" stroke-linejoin="round"/>` +
    `<circle cx="${xs[xs.length - 1].toFixed(1)}" cy="${ys[ys.length - 1].toFixed(1)}" r="4.5" fill="${color}"/>` +
    `</svg>`

  const layout: SparkPointLayout[] = points.map((point, i) => ({
    ...point,
    label: formatValue(point.value, unit, false),
    xPercent: (xs[i] / width) * 100,
    yPercent: (ys[i] / height) * 100,
    isEdge: i === 0 || i === points.length - 1,
    isFirst: i === 0,
    isLast: i === points.length - 1,
  }))

  return { svg, points: layout, delta, isGood, direction, color, first, last }
}
