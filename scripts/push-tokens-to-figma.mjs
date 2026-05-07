/**
 * push-tokens-to-figma.mjs
 * Создаёт переменные дизайн-системы ДВИЖ в Figma через Variables API.
 *
 * Запуск: node scripts/push-tokens-to-figma.mjs
 */

const FIGMA_TOKEN = process.env.FIGMA_TOKEN || ''
const FILE_KEY    = process.env.FIGMA_FILE_KEY || 'LXwMNXJaSTZIHYfyjZSy7R'

function hexToRgb(hex) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return r ? { r: parseInt(r[1], 16) / 255, g: parseInt(r[2], 16) / 255, b: parseInt(r[3], 16) / 255, a: 1 } : null
}

let _id = 1
const uid = () => `temp-${_id++}`

async function pushToFigma() {
  const collections = [], modes = [], variables = [], modeValues = []

  // ─── 🎨 COLORS ──────────────────────────────────────────────────────────────
  const colorsCollId = uid(), colorsModeId = uid()

  collections.push({ action: 'CREATE', id: colorsCollId, name: '🎨 Colors', initialModeId: colorsModeId })
  modes.push({ action: 'CREATE', id: colorsModeId, name: 'Default', variableCollectionId: colorsCollId })

  const colors = {
    'brand/50': '#fff5ed', 'brand/100': '#ffe8d5', 'brand/200': '#fecda9',
    'brand/300': '#fda973', 'brand/400': '#fb7a3a', 'brand/500': '#ff4d00',
    'brand/600': '#e64600', 'brand/700': '#be3500', 'brand/800': '#972c07',
    'brand/900': '#7a280c',
    'gray/100': '#f3f4f6', 'gray/200': '#e5e7eb', 'gray/300': '#d1d5db',
    'gray/400': '#9ca3af', 'gray/500': '#6b7280', 'gray/600': '#4b5563',
    'gray/700': '#374151', 'gray/800': '#1f2937', 'gray/900': '#111827',
    'base/white': '#ffffff', 'base/black': '#000000',
    'base/background': '#f9f7f5',
    'base/text-primary': '#1b2226', 'base/text-secondary': '#858585',
  }

  for (const [name, hex] of Object.entries(colors)) {
    const id = uid()
    variables.push({ action: 'CREATE', id, name, variableCollectionId: colorsCollId, resolvedType: 'COLOR' })
    modeValues.push({ variableId: id, modeId: colorsModeId, value: hexToRgb(hex) })
  }

  // ─── 📐 SPACING ─────────────────────────────────────────────────────────────
  const spacingCollId = uid(), spacingModeId = uid()

  collections.push({ action: 'CREATE', id: spacingCollId, name: '📐 Spacing', initialModeId: spacingModeId })
  modes.push({ action: 'CREATE', id: spacingModeId, name: 'Default', variableCollectionId: spacingCollId })

  const spacing = { '1': 4, '2': 8, '3': 12, '4': 16, '5': 20, '6': 24, '8': 32, '10': 40, '12': 48, '16': 64, '20': 80, '24': 96, '32': 128 }

  for (const [name, value] of Object.entries(spacing)) {
    const id = uid()
    variables.push({ action: 'CREATE', id, name: `spacing/${name}`, variableCollectionId: spacingCollId, resolvedType: 'FLOAT' })
    modeValues.push({ variableId: id, modeId: spacingModeId, value })
  }

  // ─── 🔲 BORDER RADIUS ───────────────────────────────────────────────────────
  const radiusCollId = uid(), radiusModeId = uid()

  collections.push({ action: 'CREATE', id: radiusCollId, name: '🔲 Border Radius', initialModeId: radiusModeId })
  modes.push({ action: 'CREATE', id: radiusModeId, name: 'Default', variableCollectionId: radiusCollId })

  const radii = { 'sm': 8, 'md': 12, 'lg': 16, 'xl': 18, '2xl': 24, '3xl': 32, 'full': 9999 }

  for (const [name, value] of Object.entries(radii)) {
    const id = uid()
    variables.push({ action: 'CREATE', id, name: `radius/${name}`, variableCollectionId: radiusCollId, resolvedType: 'FLOAT' })
    modeValues.push({ variableId: id, modeId: radiusModeId, value })
  }

  // ─── 📝 FONT SIZE (с брейкпойнтами как моды) ────────────────────────────────
  const fsCollId = uid()
  const fsXs = uid(), fsSm = uid(), fsMd = uid(), fsLg = uid()

  collections.push({ action: 'CREATE', id: fsCollId, name: '📝 Font Size', initialModeId: fsXs })
  modes.push(
    { action: 'CREATE', id: fsXs, name: 'xs – 480px', variableCollectionId: fsCollId },
    { action: 'CREATE', id: fsSm, name: 'sm – 640px', variableCollectionId: fsCollId },
    { action: 'CREATE', id: fsMd, name: 'md – 768px', variableCollectionId: fsCollId },
    { action: 'CREATE', id: fsLg, name: 'lg – 1024px', variableCollectionId: fsCollId },
  )

  const fontSizes = {
    'h1':        { xs: 28, sm: 42, md: 42, lg: 64 },
    'h1-italic': { xs: 28, sm: 42, md: 42, lg: 64 },
    'h2':        { xs: 24, sm: 24, md: 32, lg: 48 },
    'h3':        { xs: 18, sm: 24, md: 24, lg: 32 },
    'h4':        { xs: 24, sm: 24, md: 24, lg: 24 },
    'h5':        { xs: 18, sm: 18, md: 18, lg: 18 },
    'h6':        { xs: 14, sm: 14, md: 14, lg: 16 },
    'body-lg':   { xs: 16, sm: 18, md: 18, lg: 18 },
    'subhead':   { xs: 14, sm: 14, md: 14, lg: 16 },
    'medium-32': { xs: 18, sm: 24, md: 24, lg: 32 },
    'footnote':  { xs: 14, sm: 14, md: 14, lg: 14 },
    'side-menu': { xs: 12, sm: 12, md: 12, lg: 12 },
  }

  for (const [name, sizes] of Object.entries(fontSizes)) {
    const id = uid()
    variables.push({ action: 'CREATE', id, name, variableCollectionId: fsCollId, resolvedType: 'FLOAT' })
    modeValues.push(
      { variableId: id, modeId: fsXs, value: sizes.xs },
      { variableId: id, modeId: fsSm, value: sizes.sm },
      { variableId: id, modeId: fsMd, value: sizes.md },
      { variableId: id, modeId: fsLg, value: sizes.lg },
    )
  }

  // ─── 🔤 FONT PROPERTIES (fixed) ─────────────────────────────────────────────
  const fpCollId = uid(), fpModeId = uid()

  collections.push({ action: 'CREATE', id: fpCollId, name: '🔤 Font Properties', initialModeId: fpModeId })
  modes.push({ action: 'CREATE', id: fpModeId, name: 'Default', variableCollectionId: fpCollId })

  const fontProps = {
    'family/heading': 'Styrene A',
    'family/sans': 'Inter',
  }

  for (const [name, value] of Object.entries(fontProps)) {
    const id = uid()
    variables.push({ action: 'CREATE', id, name, variableCollectionId: fpCollId, resolvedType: 'STRING' })
    modeValues.push({ variableId: id, modeId: fpModeId, value })
  }

  const fontWeights = { 'weight/regular': 400, 'weight/medium': 500, 'weight/semibold': 600, 'weight/bold': 700 }

  for (const [name, value] of Object.entries(fontWeights)) {
    const id = uid()
    variables.push({ action: 'CREATE', id, name, variableCollectionId: fpCollId, resolvedType: 'FLOAT' })
    modeValues.push({ variableId: id, modeId: fpModeId, value })
  }

  // ─── ОТПРАВКА ────────────────────────────────────────────────────────────────
  console.log(`\n🚀 Отправляю в Figma...`)
  console.log(`   Коллекций: ${collections.length}`)
  console.log(`   Переменных: ${variables.length}`)

  const res = await fetch(`https://api.figma.com/v1/files/${FILE_KEY}/variables`, {
    method: 'POST',
    headers: { 'X-Figma-Token': FIGMA_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ variableCollections: collections, variableModes: modes, variables, variableModeValues: modeValues })
  })

  const json = await res.json()

  if (res.ok) {
    console.log('\n✅ Токены успешно загружены в Figma!')
    console.log(`   Создано переменных: ${variables.length}`)
    console.log(`   Файл: https://www.figma.com/file/${FILE_KEY}`)
  } else {
    console.error('\n❌ Ошибка Figma API:')
    console.error(JSON.stringify(json, null, 2))
  }
}

pushToFigma().catch(console.error)
