#!/usr/bin/env node
/**
 * CMS data cleanup script
 * - Trims whitespace in category titles and person names
 * - Sets category order
 * - Marks "Mega menu" tag description as system
 */

const CMS_URL = 'http://cms.dvizh-new-era.orb.local:3002'

async function fetchJSON(path) {
  const res = await fetch(`${CMS_URL}${path}`)
  return res.json()
}

async function patchDoc(collection, id, data) {
  const res = await fetch(`${CMS_URL}/api/${collection}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (res.ok) {
    console.log(`  ✅ ${collection}/${id} updated`)
  } else {
    console.log(`  ❌ ${collection}/${id} failed:`, json.errors || json.message)
  }
  return json
}

async function main() {
  console.log('🧹 CMS Data Cleanup')
  console.log('='.repeat(40))

  // 1. Fix category whitespace and set order
  console.log('\n📁 Categories:')
  const { docs: categories } = await fetchJSON('/api/categories?limit=20')

  const categoryOrder = {
    'insights': 1,
    'cases': 2,
    'statistika': 3,
    'marketing-prodazhi': 4,
    'tactic': 5,
    'pravila-developera': 6,
    'pro-dvizh': 7,
    'podcasts': 8,
  }

  for (const cat of categories) {
    const trimmed = cat.title.trim().replace(/\u00a0/g, '\u00a0') // keep nbsp within text
    const order = categoryOrder[cat.slug] || 0
    const needsUpdate = cat.title !== trimmed || cat.order !== order

    if (needsUpdate) {
      console.log(`  Fixing: "${cat.title}" → "${trimmed}", order: ${cat.order} → ${order}`)
      await patchDoc('categories', cat.id, { title: trimmed, order })
    } else {
      console.log(`  ✓ "${cat.title}" (order: ${cat.order}) — OK`)
    }
  }

  // 2. Fix person whitespace
  console.log('\n👤 Persons:')
  const { docs: persons } = await fetchJSON('/api/persons?limit=100')
  let personFixes = 0
  for (const p of persons) {
    const trimmed = p.name.trim()
    if (p.name !== trimmed) {
      console.log(`  Fixing: "${p.name}" → "${trimmed}"`)
      await patchDoc('persons', p.id, { name: trimmed })
      personFixes++
    }
  }
  if (personFixes === 0) console.log('  ✓ All person names clean')

  // 3. Mark "Mega menu" tag as system
  console.log('\n🏷️ Tags:')
  const { docs: tags } = await fetchJSON('/api/tags?limit=20')
  const megaMenu = tags.find(t => t.slug === 'mega-menu')
  if (megaMenu) {
    if (!megaMenu.description?.includes('[system]')) {
      console.log(`  Marking "Mega menu" as system tag`)
      await patchDoc('tags', megaMenu.id, { description: '[system] Системный тег для мега-меню навигации' })
    } else {
      console.log('  ✓ "Mega menu" already marked as system')
    }
  }

  console.log('\n' + '='.repeat(40))
  console.log('✅ Cleanup complete!')
}

main().catch(console.error)
