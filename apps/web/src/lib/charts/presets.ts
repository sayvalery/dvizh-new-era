/**
 * Пресеты графиков и каналов
 *
 * Прослойка между данными и движком. Маркетолог и статья НИКОГДА не видят API
 * библиотеки — только эти пресеты. Замена движка = переписать render.ts,
 * не трогая контент. См. docs/analytics-charts/README.md §5
 *
 * Оформление здесь намеренно минимальное: визуальный язык решается отдельным
 * этапом, глядя на реальные данные на стенде /lab/charts.
 */

import type { Channel, Unit } from './types'

/**
 * Параметры канала. Минимальный кегль — проверяемое требование, не рекомендация:
 * читаемость определяется шириной показа, а не размером файла.
 * Обоснование и источники: docs/analytics-charts/design-channels.md
 */
export interface ChannelPreset {
  /** Ширина холста в px. Для web — базовая, SVG остаётся адаптивным. */
  width: number
  height: number
  /** Кегль подписей делений. */
  tickFontSize: number
  /** Минимально допустимый кегль для этого канала. Нарушение — ошибка сборки. */
  minFontSize: number
  /** Толщина линий и осей. JPEG-сжатие в Telegram убивает всё тоньше 2px. */
  strokeWidth: number
  /** Фон. Прозрачный допустим только в web: Telegram теряет альфу, почта инвертирует тему. */
  background: string | null
  /** Максимум подписей по горизонтальной оси, после которого график превращается в кашу. */
  maxCategories: number
}

export const CHANNELS: Record<Channel, ChannelPreset> = {
  web: {
    width: 760,
    height: 400,
    tickFontSize: 14,
    minFontSize: 14,
    strokeWidth: 2,
    background: null,
    maxCategories: 24,
  },
  email: {
    width: 1200,
    height: 600,
    tickFontSize: 26,
    minFontSize: 24,
    strokeWidth: 3,
    background: '#FFFFFF',
    maxCategories: 12,
  },
  social: {
    width: 1280,
    height: 720,
    tickFontSize: 42,
    minFontSize: 40,
    strokeWidth: 4,
    background: '#FBF9F6',
    maxCategories: 6,
  },
}

/**
 * Палитра рядов. Пока минимальная и нейтральная — бренд плюс сдержанные оттенки.
 * Полноценный визуальный язык проектируется отдельно.
 */
export const PALETTE = ['#ff4d00', '#1D1E21', '#858585', '#ffb347', '#5a5a5a']

/** Цвета сетки и текста. Взяты из токенов проекта (tailwind.config.ts). */
export const THEME = {
  foreground: '#1D1E21',
  muted: '#858585',
  grid: '#DCDCDC',
}

/**
 * Шрифты на графиках.
 *
 * Числа и подписи — Styrene A (font-heading), как заголовки на сайте.
 * Стрелка динамики — Inter: в Styrene этот глиф выглядит плохо.
 */
export const FONT_FAMILY = '"Styrene A", Inter, Helvetica, Arial, sans-serif'
export const FONT_ARROW = 'Inter, Helvetica, Arial, sans-serif'

/** Символы стрелок берутся глифами из Inter, а не рисуются путями. */
export const ARROW_GLYPH = { up: '↑', down: '↓' } as const

/**
 * Штриховка разницы между периодами — ДВА СЛОЯ у прироста, один у потери.
 *
 * Прирост лежит ВНУТРИ насыщенной заливки, потеря — на пустом фоне. Это разные
 * условия, поэтому и слоёв разное число: у потери отделять область не от чего,
 * достаточно штриха; у прироста область надо сперва отделить от заливки.
 *
 *  1. Осветляющая подложка на всю область (белый 0,16) — отделяет кусок, который
 *     прибавился, от остальной полосы.
 *  2. ТЁМНЫЙ штрих поверх неё (#a83400 при 0,45) — даёт текстуру и вес.
 *
 * Порядок «светлая подложка + тёмный штрих» подобран рендером и важен именно в
 * такой комбинации. Пройденные тупики:
 *
 *  - тёмный штрих БЕЗ подложки читался чужеродным пятном и был слишком тяжёлым;
 *  - светлый штрих на подложке дал бледную область, потерявшую вес: подложка и
 *    штрих осветляли одно и то же место, и разница переставала выделяться;
 *  - multiply брендовым по брендовому почти не даёт контраста на залитой полосе, а
 *    при усилении уводит оранжевый в красный (зелёный канал у бренда почти на нуле).
 *
 * Фиксированный цвет вместо режима наложения: одинаково выглядит в браузере и в
 * растеризаторе, то есть картинка в статье и в письме совпадут.
 */
export const HATCH_LAYERS = {
  grown: {
    wash: '#ffffff',
    washOpacity: 0.16,
    stripe: '#a83400',
    stripeOpacity: 0.45,
  },
  lost: {
    wash: null,
    washOpacity: 0,
    stripe: '#ff4d00',
    stripeOpacity: 0.42,
  },
} as const

/**
 * Тонкая шпация (U+2009) между числом и единицей: «7,0 пп», «3,3 ч».
 *
 * Обычный пробел на мелком кегле разрывает пару «число — единица» визуально,
 * они начинают читаться как два отдельных элемента. Тонкая шпация держит их
 * вместе, но не склеивает.
 *
 * Проверено по cmap шрифтов: U+2009 есть в styrene-a-medium, styrene-a-bold и в
 * Inter. В StyreneAWeb-Regular (обычное начертание) глифа нет, поэтому для него
 * браузер берёт шпацию из следующего шрифта стека — визуально это та же тонкая
 * шпация, но ширина не Styrene'овская. Если понадобится пиксельная точность в
 * экспорте, заменить на отступ у единицы средствами CSS.
 */
const THIN_SPACE = '\u2009'

/**
 * Числовые подписи на самом графике: мельче основного текста, обычного начертания.
 *
 * Мельче — потому что это служебный слой, он не должен конкурировать с самим
 * графиком. Начертание обычное: жирные цифры на мелком кегле утяжеляют график,
 * хотя интуиция подсказывает обратное.
 *
 * 12px ниже минимума из §7 (14px), и это осознанно: тот минимум задан для
 * экспорта в письмо и соцсети, где картинка сжимается. На экране подпись
 * остаётся текстом и читается.
 */
export const CHART_LABEL_CLASS = 'font-heading text-[0.75rem] leading-none tabular-nums'

/**
 * Форматирование значения под единицу измерения. Русская локаль: запятая как разделитель.
 * `withUnit = false` — для подписей у концов линии: в оригинале там «64,0», без знака процента.
 */
export function formatValue(value: number, unit: Unit, withUnit = true): string {
  const digits = unit === 'rub' || unit === 'count' ? 0 : 1
  const number = value.toLocaleString('ru-RU', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
  if (!withUnit) return number
  switch (unit) {
    case 'percent':
      return `${number}%`
    case 'hours':
      return `${number}${THIN_SPACE}ч`
    case 'rub':
      return `${number}${THIN_SPACE}₽`
    case 'count':
      return number
  }
}

/**
 * Единица дельты. Для процентных показателей разница измеряется в процентных
 * пунктах: 64% → 71% это +7 пп, а не +7%.
 *
 * `correct` — действующий вариант. `as-published` оставлен только для сверки с
 * опубликованными дайджестами, где стояло «↑ 7,0%».
 */
export type DeltaUnitStyle = 'correct' | 'as-published'

/** Подпись абсолютного изменения. Знак не печатаем — его несёт стрелка. */
export function formatDelta(delta: number, unit: Unit, style: DeltaUnitStyle = 'correct'): string {
  const magnitude = Math.abs(delta)
  if (unit === 'percent') {
    // «пп» без точек — сокращение процентных пунктов.
    const suffix = style === 'correct' ? `${THIN_SPACE}пп` : '%'
    return `${magnitude.toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}${suffix}`
  }
  return formatValue(magnitude, unit)
}

const MONTHS_SHORT = [
  'янв', 'фев', 'мар', 'апр', 'май', 'июн',
  'июл', 'авг', 'сен', 'окт', 'ноя', 'дек',
]

/** Трёхбуквенное название месяца: подпись на графике должна быть короткой. */
export function monthShort(period: string): string {
  const index = Number(period.split('-')[1]) - 1
  return MONTHS_SHORT[index] ?? period
}

/**
 * Подпись периода `YYYY-MM`. В коротком виде — для узких каналов,
 * где полное название месяца не влезает.
 */
export function formatPeriod(period: string, short = false): string {
  const [year, month] = period.split('-')
  const index = Number(month) - 1
  if (index < 0 || index > 11) return period
  const name = MONTHS_SHORT[index]
  return short ? name : `${name} ${year.slice(2)}`
}
