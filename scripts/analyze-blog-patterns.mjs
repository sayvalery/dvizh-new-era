#!/usr/bin/env node
/**
 * Analyze Webflow patterns in legacy blog bodyHtml content
 */
const CMS_URL = 'http://cms.dvizh-new-era.orb.local:3002'

async function main() {
  let page = 1
  const patternCounts = {}
  let total = 0

  while (true) {
    const res = await fetch(`${CMS_URL}/api/blog-posts?limit=50&page=${page}`)
    const data = await res.json()

    for (const post of data.docs) {
      if (!post.bodyHtml) continue
      total++
      const html = post.bodyHtml

      const checks = [
        ['empty id=""', /id=""/],
        ['data-rt- attributes', /data-rt-/],
        ['data-w- attributes', /data-w-/],
        ['w-embed class', /w-embed/],
        ['w-richtext class', /w-richtext/],
        ['w-inline-block class', /w-inline-block/],
        ['inline styles', /style="/],
        ['iframes', /<iframe/],
        ['tables', /<table/],
        ['blockquotes', /<blockquote/],
        ['figures', /<figure/],
        ['b-article classes', /class="b-article/],
        ['webflow.io links', /dvizh\.webflow\.io/],
        ['www.dvizh.io links', /www\.dvizh\.io/],
      ]

      for (const [name, regex] of checks) {
        if (regex.test(html)) {
          patternCounts[name] = (patternCounts[name] || 0) + 1
        }
      }
    }

    if (!data.hasNextPage) break
    page++
  }

  console.log(`\nAnalyzed ${total} posts with bodyHtml\n`)
  console.log('Pattern                    | Count | % of posts')
  console.log('---------------------------|-------|----------')

  const sorted = Object.entries(patternCounts).sort((a, b) => b[1] - a[1])
  for (const [name, count] of sorted) {
    const pct = ((count / total) * 100).toFixed(0)
    console.log(`${name.padEnd(27)}| ${String(count).padStart(5)} | ${pct}%`)
  }
}

main().catch(console.error)
