import { defineMiddleware } from 'astro:middleware'

/**
 * Висячая пунктуация — fallback для браузеров без CSS `hanging-punctuation`
 * (Chrome / Firefox / Edge). Размечает заголовки, начинающиеся с ведущей
 * пунктуации, классами .hp-quote / .hp-dash / .hp-paren, чтобы правило
 * `@supports not (hanging-punctuation: first)` в global.css увело знак за край
 * первой строки через отрицательный text-indent.
 *
 * Живёт в middleware (а не в post-build скрипте), поэтому выполняется И на
 * dev-сервере (preview), И при сборке статики — эффект виден везде без
 * клиентского JS. В Safari fallback неактивен (там нативный hanging-punctuation),
 * двойного смещения нет. Идемпотентно. Цель — теги h1–h6 и элементы с .text-h1…h6.
 */

const RULES: { cls: string; re: RegExp }[] = [
  { cls: 'hp-quote', re: /^(?:«|„|“|”|"|‘|’|'|&laquo;|&bdquo;|&ldquo;|&rdquo;|&quot;|&lsquo;|&rsquo;|&#171;|&#34;)/ },
  { cls: 'hp-dash',  re: /^(?:—|–|&mdash;|&ndash;|&#8212;|&#8211;)/ },
  { cls: 'hp-paren', re: /^(?:\(|\[)/ },
]

/** По тексту сразу после открывающего тега заголовка определить класс-маркер. */
function leadingClass(rest: string): string | null {
  let s = rest.replace(/^\s+/, '')
  // Пропускаем вложенные открывающие инлайн-теги (<span>, <a>, …) перед текстом.
  let guard = 0
  while (guard++ < 10 && /^<[^/!][^>]*>/.test(s)) {
    s = s.replace(/^<[^/!][^>]*>\s*/, '')
  }
  for (const { cls, re } of RULES) if (re.test(s)) return cls
  return null
}

/** Проставить маркеры заголовкам в HTML-документе. */
function markHangingPunctuation(html: string): string {
  return html.replace(/<([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g, (full, tag, attrs, offset, str) => {
    const t = String(tag).toLowerCase()
    const isHeadingTag = /^h[1-6]$/.test(t)
    const hasTextH = /\btext-h[1-6]\b/.test(attrs)
    if (!isHeadingTag && !hasTextH) return full

    const cls = leadingClass(String(str).slice(offset + full.length))
    if (!cls) return full
    if (new RegExp(`\\b${cls}\\b`).test(attrs)) return full // уже размечено

    if (/\bclass\s*=\s*"/.test(attrs)) {
      return `<${tag}${attrs.replace(/\bclass\s*=\s*"([^"]*)"/, (_m: string, c: string) => `class="${c} ${cls}"`)}>`
    }
    return `<${tag}${attrs} class="${cls}">`
  })
}

export const onRequest = defineMiddleware(async (_context, next) => {
  const response = await next()
  const ct = response.headers.get('content-type') || ''
  if (!ct.includes('text/html')) return response

  const html = await response.text()
  const out = markHangingPunctuation(html)

  const headers = new Headers(response.headers)
  headers.delete('content-length') // длина изменилась — пусть пересчитается
  return new Response(out, { status: response.status, statusText: response.statusText, headers })
})
