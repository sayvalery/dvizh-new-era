/**
 * Регрессионный тест рендера графиков
 *
 * Страховка от pre-alpha движка: @tanstack/charts выпускал ломающие изменения
 * в minor-версиях, поэтому версия прибита точным пином. Этот тест ловит поломку
 * API до того, как она уедет в статью.
 *
 * Запуск из apps/web:
 *   node_modules/.bin/tsx tests/charts-render.mts
 */

import { renderIndicator } from '../src/lib/charts/render.ts'
import { BENCHMARKS } from '../src/lib/charts/fixtures/benchmarks.ts'
import { CHANNELS } from '../src/lib/charts/presets.ts'
import { buildCardsBlock } from '../src/lib/charts/cards.ts'
import { buildFunnelBlock } from '../src/lib/charts/funnel.ts'
import type { Channel } from '../src/lib/charts/types.ts'

const CHANNEL_MONTHS: Record<Channel, number> = { web: 9, email: 9, social: 6 }

let failures = 0

function check(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`FAIL ${message}`)
    failures++
  }
}

for (const indicator of BENCHMARKS) {
  for (const channel of ['web', 'email', 'social'] as Channel[]) {
    const label = `${indicator.id} [${channel}]`
    try {
      const result = renderIndicator(indicator, {
        channel,
        through: '2026-05',
        months: CHANNEL_MONTHS[channel],
      })

      const texts = [...result.svg.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g)]
      const sizes = [...result.svg.matchAll(/font-size="([\d.]+)"/g)].map(m => Number(m[1]))
      const preset = CHANNELS[channel]

      // Настоящий текст, а не кривые — главное отличие от старых SVG из Figma.
      check(texts.length > 0, `${label}: в SVG нет ни одного <text>`)
      check(/viewBox="/.test(result.svg), `${label}: нет viewBox — сломается адаптивность`)
      check(/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/.test(result.svg), `${label}: нет xmlns`)
      check(sizes.length > 0, `${label}: не найдено ни одного font-size`)
      check(
        sizes.every(s => s >= preset.minFontSize),
        `${label}: кегль меньше минимального ${preset.minFontSize}px`
      )
      // alt должен нести вывод с числами: в почте картинки блокируются.
      check(/\d/.test(result.alt), `${label}: в alt нет чисел`)
      check(result.alt.length <= 150, `${label}: alt длиннее 150 символов`)
      check(!result.alt.includes('__wf_reserved'), `${label}: мусорный alt из Webflow`)

      if (channel !== 'web') {
        check(
          result.svg.includes(`width="${preset.width}"`),
          `${label}: растровый канал без фиксированной ширины`
        )
      }

      console.log(
        `OK   ${label} ${(result.svg.length / 1024).toFixed(1)}KB  <text>=${texts.length}  ` +
          `кегль=${[...new Set(sizes)].join(',')}`
      )
    } catch (error) {
      console.error(`FAIL ${label}: ${(error as Error).message}`)
      failures++
    }
  }
}

/**
 * Сверка карточек с оригинальными картинками майского дайджеста.
 * Значения сняты с исходных SVG: если расходится — значит либо данные не те,
 * либо смысл дизайна воспроизведён неверно.
 */
console.log('\n--- карточки против оригинальных картинок (май 2026)')

const EXPECTED: Record<string, { label: string; first: string; last: string; delta: string; good: boolean; dir: string }[]> = {
  'approval-rate': [{ label: '', first: '56,4', last: '63,8%', delta: '7,4%', good: true, dir: 'up' }],
  'refusal-rate': [{ label: '', first: '28,2', last: '22,9%', delta: '5,3%', good: true, dir: 'down' }],
  'approval-speed': [{ label: '', first: '2,9', last: '3,3\u2009ч', delta: '0,4\u2009ч', good: false, dir: 'up' }],
  'approval-by-region': [
    { label: 'Москва', first: '64,0', last: '71,0%', delta: '7,0%', good: true, dir: 'up' },
    { label: 'Санкт-Петербург', first: '63,0', last: '70,0%', delta: '7,0%', good: true, dir: 'up' },
    { label: 'Регионы', first: '46,0', last: '52,0%', delta: '6,0%', good: true, dir: 'up' },
  ],
  'mortgage-type': [
    { label: 'Стандартная', first: '53,6', last: '56,3%', delta: '2,7%', good: true, dir: 'up' },
    { label: 'Семейная', first: '39,1', last: '38,3%', delta: '0,8%', good: false, dir: 'down' },
    { label: 'IT-ипотека', first: '2,2', last: '2,5%', delta: '0,3%', good: true, dir: 'up' },
    { label: 'Военная', first: '1,8', last: '1,5%', delta: '0,3%', good: false, dir: 'down' },
    { label: 'Дальневосточная', first: '3,0', last: '1,0%', delta: '2,0%', good: false, dir: 'down' },
  ],
}

for (const [id, expectedCards] of Object.entries(EXPECTED)) {
  const indicator = BENCHMARKS.find(i => i.id === id)!
  // points: 2 — оригинальные картинки сравнивали ровно с предыдущим месяцем.
  // По умолчанию в системе теперь 3 точки, поэтому здесь задаём явно.
  const block = buildCardsBlock(indicator, { through: '2026-05', points: 2, deltaStyle: 'as-published' })

  check(
    block.cards.length === expectedCards.length,
    `${id}: карточек ${block.cards.length}, ожидалось ${expectedCards.length}`
  )

  expectedCards.forEach((want, i) => {
    const card = block.cards[i]
    if (!card) return
    const label = `${id}/${want.label || 'main'}`
    check(card.label === want.label, `${label}: подпись «${card.label}», ожидалась «${want.label}»`)
    check(card.value === want.last, `${label}: значение ${card.value}, ожидалось ${want.last}`)
    check(card.delta === want.delta, `${label}: дельта ${card.delta}, ожидалась ${want.delta}`)
    check(card.spark.direction === want.dir, `${label}: стрелка ${card.spark.direction}, ожидалась ${want.dir}`)
    check(
      card.spark.isGood === want.good,
      `${label}: цвет ${card.spark.isGood ? 'зелёный' : 'серый'}, ожидался ${want.good ? 'зелёный' : 'серый'}`
    )
    check(
      card.spark.points[0].label === want.first,
      `${label}: начальная точка ${card.spark.points[0].label}, ожидалась ${want.first}`
    )
    // Текста в SVG быть не должно: подписи рисуются HTML-ом (§12).
    check(!card.spark.svg.includes('<text'), `${label}: в SVG спарклайна остался текст`)
    check(card.spark.color === (want.good ? '#04b34a' : '#cacaca'), `${label}: цвет линии ${card.spark.color}`)
  })

  console.log(`OK   ${id}: ${block.cards.length} карточек, дельты ${block.cards.map(c => c.delta).join(' / ')}`)
}

// «Два колена» должны менять дельту: считается от первой точки к последней.
{
  const regions = BENCHMARKS.find(i => i.id === 'approval-by-region')!
  const two = buildCardsBlock(regions, { through: '2026-05', points: 2 })
  const three = buildCardsBlock(regions, { through: '2026-05', points: 3 })
  check(
    two.cards[0].spark.first.period === '2026-04' && three.cards[0].spark.first.period === '2026-03',
    'два колена: окно не сдвинулось на месяц назад'
  )
  console.log(
    `OK   два колена: Москва одно колено ${two.cards[0].delta}, два колена ${three.cards[0].delta}`
  )
}

// По умолчанию три точки — «два колена».
{
  const regions = BENCHMARKS.find(i => i.id === 'approval-by-region')!
  const def = buildCardsBlock(regions, { through: '2026-05' })
  check(
    def.cards[0].spark.first.period === '2026-03',
    `по умолчанию должно быть три точки, а первая точка ${def.cards[0].spark.first.period}`
  )
  // Подписаны только края: середина остаётся без подписи (chart-guidelines.md §2).
  const pts = def.cards[0].spark.points
  const edges = pts.filter(p => p.isEdge)
  check(pts.length === 3, `точек ${pts.length}, должно быть 3`)
  check(edges.length === 2, `крайних точек ${edges.length}, должно быть 2`)
  check(!pts[1].isEdge, 'средняя точка не должна быть помечена как крайняя')
  console.log(
    `OK   три точки по умолчанию, подписаны края ${edges.map(p => p.label).join(' → ')}, ` +
      `середина ${pts[1].label} только по ховеру`
  )
}

// Воронка: одна сущность, потери от предыдущего шага.
{
  const funnel = BENCHMARKS.find(i => i.id === 'application-funnel')!
  const block = buildFunnelBlock(funnel, { through: '2026-05' })

  check(block.stages.length === 5, `этапов ${block.stages.length}, ожидалось 5`)
  check(block.currentLabel === 'май', `текущий период «${block.currentLabel}»`)
  check(block.previousLabel === 'апрель', `предыдущий период «${block.previousLabel}»`)
  check(block.geometry.previousEdge !== null, 'нет второй воронки за предыдущий период')
  check(block.geometry.bands.length === 5, `полос ${block.geometry.bands.length}, ожидалось 5`)
  // Насыщенность растёт вниз: наверху разбавленный цвет, у последнего этапа полный.
  const ops = block.geometry.bands.map(b => b.opacity)
  check(
    ops.every((o, i) => i === 0 || o > ops[i - 1]),
    `насыщенность полос не растёт вниз: ${ops.map(o => o.toFixed(2)).join(', ')}`
  )
  check(ops[ops.length - 1] === 1, `последняя полоса должна быть полного цвета, а она ${ops[ops.length - 1]}`)
  // Стандартная воронка — прямые отрезки, без кривых Безье.
  check(
    !block.geometry.currentPath.includes('C'),
    'воронка содержит кривые Безье — должна быть стандартной, из прямых'
  )

  const expected = [
    { name: 'Создана', value: 100, delta: null },
    { name: 'Заполнение анкеты', value: 87.9, delta: 3.7 },
    { name: 'Анкета валидирована', value: 73.9, delta: 6.7 },
    { name: 'Отправлена в банк', value: 66.3, delta: 9.9 },
    { name: 'Одобрена', value: 45.1, delta: 10.7 },
  ]
  expected.forEach((want, i) => {
    const stage = block.stages[i]
    check(stage.name === want.name, `этап ${i}: «${stage.name}», ожидался «${want.name}»`)
    check(stage.value === want.value, `${want.name}: значение ${stage.value}, ожидалось ${want.value}`)
    if (want.delta === null) {
      check(stage.deltaLabel === null, `${want.name}: дельта должна отсутствовать`)
    } else {
      check(
        Math.abs((stage.delta ?? 0) - want.delta) < 0.05,
        `${want.name}: дельта ${stage.delta}, ожидалась ${want.delta}`
      )
    }
  })

  // Ключевая правка смысла: потеря считается от дошедших до предыдущего шага.
  // В опубликованной статье стояло 21,2% (пункты от базы) вместо 32,0%.
  const approved = block.stages[4]
  check(
    Math.abs((approved.loss ?? 0) - 32.0) < 0.1,
    `потеря на последнем шаге ${approved.loss?.toFixed(1)}%, ожидалось 32,0%`
  )
  check(
    Math.abs((approved.conversion ?? 0) - 68.0) < 0.1,
    `конверсия последнего шага ${approved.conversion?.toFixed(1)}%, ожидалось 68,0%`
  )

  console.log(
    `OK   воронка: 5 этапов, дельты ${block.stages.map(s => s.deltaLabel ?? '—').join(' / ')}`
  )
  console.log(
    `OK   потеря на «Одобрена» ${approved.loss?.toFixed(1)}% от дошедших ` +
      `(в статье было 21,2% — это пункты от базы)`
  )
}

// Ряд без двух точек не должен превращаться в карточку с нулём.
{
  const types = BENCHMARKS.find(i => i.id === 'mortgage-type')!
  check(
    !types.series?.includes('Господдержка') || buildCardsBlock(types).cards.every(c => c.label !== 'Господдержка'),
    'закрытая программа «Господдержка» не должна давать карточку'
  )
  console.log('OK   закрытые ряды карточек не дают')
}

// Ограничение по числу подписей должно именно падать, а не молча прореживать.
try {
  const wide = BENCHMARKS.find(i => i.id === 'approval-rate')!
  renderIndicator(wide, { channel: 'social', months: 9 })
  console.error('FAIL лимит подписей для social не сработал (ожидалось исключение)')
  failures++
} catch {
  console.log('OK   лимит подписей для social срабатывает')
}

console.log(failures ? `\nПровалено проверок: ${failures}` : '\nВсе проверки пройдены')
process.exit(failures ? 1 : 0)
