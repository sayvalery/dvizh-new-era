#!/usr/bin/env node
/**
 * Висячая пунктуация — fallback для браузеров без CSS `hanging-punctuation`
 * (Chrome / Firefox / Edge). Проставляет классы-маркеры (.hp-quote / .hp-dash /
 * .hp-paren) заголовкам, начинающимся с ведущей пунктуации, чтобы правило
 * `@supports not (hanging-punctuation: first)` в global.css увело её за край
 * первой строки через отрицательный text-indent.
 *
 * Запускается ПОСЛЕ `astro build` по dist/**\/*.html (см. scripts/build-site.sh).
 * В Safari/WebKit fallback неактивен (там нативный hanging-punctuation) — двойного
 * смещения нет. Идемпотентно: повторный прогон ничего не дублирует.
 *
 * Цель — теги h1–h6 и любые элементы с классом text-h1…text-h6.
 *
 * Usage: node scripts/hanging-punctuation.mjs [distDir]
 */
import { readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const DIST = process.argv[2] || 'apps/web/dist'

// Ведущий символ (литерал UTF-8 или HTML-сущность) → класс-маркер.
const RULES = [
  { cls: 'hp-quote', re: /^(?:«|„|“|”|"|‘|’|'|&laquo;|&bdquo;|&ldquo;|&rdquo;|&quot;|&lsquo;|&rsquo;|&#171;|&#34;)/ },
  { cls: 'hp-dash',  re: /^(?:—|–|&mdash;|&ndash;|&#8212;|&#8211;)/ },
  { cls: 'hp-paren', re: /^(?:\(|\[)/ },
]

/** По тексту, идущему сразу после открывающего тега заголовка, определить класс. */
function leadingClass(rest) {
  let s = rest.replace(/^\s+/, '')
  // Пропускаем вложенные открывающие инлайн-теги (<span>, <a> и т.п.) перед текстом.
  let guard = 0
  while (guard++ < 10 && /^<[^/!][^>]*>/.test(s)) {
    s = s.replace(/^<[^/!][^>]*>\s*/, '')
  }
  for (const { cls, re } of RULES) {
    if (re.test(s)) return cls
  }
  return null
}

/** Проставить маркеры в одном HTML-документе. Возвращает [новый html, число правок]. */
function processHtml(html) {
  let edits = 0
  const out = html.replace(/<([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g, (full, tag, attrs, offset, str) => {
    const t = tag.toLowerCase()
    const isHeadingTag = /^h[1-6]$/.test(t)
    const hasTextH = /\btext-h[1-6]\b/.test(attrs)
    if (!isHeadingTag && !hasTextH) return full

    const cls = leadingClass(str.slice(offset + full.length))
    if (!cls) return full
    if (new RegExp(`\\b${cls}\\b`).test(attrs)) return full // уже размечено

    edits++
    if (/\bclass\s*=\s*"/.test(attrs)) {
      return `<${tag}${attrs.replace(/\bclass\s*=\s*"([^"]*)"/, (_m, c) => `class="${c} ${cls}"`)}>`
    }
    return `<${tag}${attrs} class="${cls}">`
  })
  return [out, edits]
}

let files = 0
let totalEdits = 0
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    const st = statSync(p)
    if (st.isDirectory()) walk(p)
    else if (name.endsWith('.html')) {
      const html = readFileSync(p, 'utf8')
      const [out, edits] = processHtml(html)
      if (edits > 0) { writeFileSync(p, out); files++; totalEdits += edits }
    }
  }
}

walk(DIST)
console.log(`[hanging-punctuation] размечено заголовков: ${totalEdits} в ${files} файлах (${DIST})`)
