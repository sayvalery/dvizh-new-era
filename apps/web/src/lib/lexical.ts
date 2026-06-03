/**
 * lexical.ts — сериализация Payload Lexical EditorState в HTML + утилиты для оглавления.
 *
 * Используется:
 *   - RichTextBlock.astro (рендер блока richText)
 *   - lab/article-page.astro и /blog/[slug] (рендер тела + построение TOC из заголовков)
 *
 * Поддерживаемые узлы: paragraph, heading (h1–h6), list (bullet/ordered),
 * listitem, quote, link, horizontalrule, code, upload.
 * Форматирование: bold (1), italic (2), strikethrough (4), underline (8), code (16).
 */

// ─── Slugify (транслитерация кириллицы → латиница) ────────────────
const translitMap: Record<string, string> = {
  а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'e',ж:'zh',з:'z',и:'i',й:'y',
  к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',
  х:'h',ц:'c',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya',
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .split('')
    .map((c) => translitMap[c] ?? c)
    .join('')
    .replace(/<[^>]+>/g, '')
    .replace(/&[a-z]+;/gi, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    || 'section'
}

/**
 * Фабрика генератора уникальных id из текста заголовка.
 * Вызывать в порядке следования заголовков в документе — тогда суффиксы
 * уникальности (`-2`, `-3`) для повторов совпадут между проходами (TOC и рендер).
 */
export function createIdGenerator(): (text: string) => string {
  const used = new Set<string>()
  return (text: string) => {
    const base = slugify(text)
    let id = base
    let n = 2
    while (used.has(id)) id = `${base}-${n++}`
    used.add(id)
    return id
  }
}

// ─── Плоский текст из узла (для slugify заголовков и reading time) ─
export function lexicalNodeText(node: any): string {
  if (!node) return ''
  if (node.type === 'text') return node.text ?? ''
  return (node.children ?? []).map(lexicalNodeText).join('')
}

// ─── Сериализация ─────────────────────────────────────────────────
interface SerializeOptions {
  /** Если передан — на заголовки h2…h6 вешается id из этого генератора */
  makeHeadingId?: (text: string) => string
}

export function serializeLexical(content: any, opts: SerializeOptions = {}): string {
  if (!content?.root?.children) return ''
  return content.root.children.map((n: any) => serializeNode(n, opts)).join('')
}

function serializeNode(node: any, opts: SerializeOptions): string {
  if (node.type === 'text') {
    let text = node.text ?? ''
    if (node.format & 1) text = `<strong>${text}</strong>`
    if (node.format & 2) text = `<em>${text}</em>`
    if (node.format & 4) text = `<s>${text}</s>`
    if (node.format & 8) text = `<u>${text}</u>`
    if (node.format & 16) text = `<code>${text}</code>`
    return text
  }
  if (node.type === 'linebreak') return '<br/>'
  const children = (node.children ?? []).map((c: any) => serializeNode(c, opts)).join('')
  switch (node.type) {
    case 'paragraph': {
      const indent = node.indent ? ` style="padding-left: ${node.indent * 2}rem"` : ''
      return `<p${indent}>${children}</p>`
    }
    case 'heading': {
      // node.tag уже содержит полный тег ('h2', 'h3', …)
      const tag = node.tag || 'h2'
      const idAttr = opts.makeHeadingId ? ` id="${opts.makeHeadingId(lexicalNodeText(node))}"` : ''
      return `<${tag}${idAttr}>${children}</${tag}>`
    }
    case 'list': return node.listType === 'bullet' ? `<ul>${children}</ul>` : `<ol>${children}</ol>`
    case 'listitem': return `<li>${children}</li>`
    case 'quote': return `<blockquote>${children}</blockquote>`
    case 'link': {
      const url = node.fields?.url ?? '#'
      const attrs = [`href="${url}"`]
      const relParts: string[] = []
      if (node.fields?.newTab) {
        attrs.push('target="_blank"')
        relParts.push('noopener', 'noreferrer')
      }
      if (node.fields?.nofollow) relParts.push('nofollow')
      if (relParts.length) attrs.push(`rel="${relParts.join(' ')}"`)
      return `<a ${attrs.join(' ')}>${children}</a>`
    }
    case 'horizontalrule': return '<hr/>'
    case 'code': return `<pre><code>${children || node.text || ''}</code></pre>`
    case 'upload': {
      const url = node.value?.url || ''
      const alt = node.value?.alt || ''
      return url ? `<figure><img src="${url}" alt="${alt}" loading="lazy" /></figure>` : ''
    }
    default: return children
  }
}

/**
 * Строит плоское оглавление (h2/h3) из массива content-блоков.
 * id генерируются тем же способом, что и при рендере (createIdGenerator),
 * проход — в порядке документа, поэтому якоря совпадут.
 */
export function buildTocFromContent(content: any[]): Array<{ id: string; text: string; level: 2 | 3 }> {
  const gen = createIdGenerator()
  const toc: Array<{ id: string; text: string; level: 2 | 3 }> = []
  for (const block of content ?? []) {
    if (block?.blockType !== 'richText') continue
    for (const node of block.content?.root?.children ?? []) {
      if (node.type !== 'heading') continue
      const text = lexicalNodeText(node).replace(/\s+/g, ' ').trim()
      const id = gen(text) // вызываем для КАЖДОГО заголовка, чтобы порядок совпал с рендером
      if (!text) continue
      if (node.tag === 'h2') toc.push({ id, text, level: 2 })
      else if (node.tag === 'h3') toc.push({ id, text, level: 3 })
    }
  }
  return toc
}
