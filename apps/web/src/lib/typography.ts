/**
 * typography.ts — русская типографика для CMS-контента (применяется при сборке).
 *
 * Правила (порт scripts/typo-fix.py, идемпотентные):
 *   1. ё → е, Ё → Е
 *   2. NBSP после коротких предлогов/союзов (в, на, по, с, для…)
 *   3. NBSP между цифрой и кириллицей («5 минут»)
 *   4. NBSP между разрядами числа («1 700»)
 *   5. NBSP между числом и %, ₽, €, $
 *   6. NBSP перед — (em dash)
 *   7. Дубликаты NBSP схлопываются
 *
 * Где применяется (см. payload.ts):
 *   - typograf()      — плоские текстовые поля (title, excerpt, текст блоков, цитаты)
 *                       и текст-узлы Lexical — через typografDoc() в fetchFromCMS.
 *   - typografHtml()  — HTML-контент (bodyHtml, сериализованный Lexical): только
 *                       текстовые узлы, теги/атрибуты не трогаются.
 *
 * Источник в CMS не меняется — нормализация только на выходе при рендере/сборке.
 */

const NBSP = ' '

// Короткие предлоги/союзы — после них пробел становится неразрывным.
const PREPS = [
  'в', 'к', 'с', 'у', 'о', 'я', 'и', 'а',
  'на', 'не', 'ни', 'же', 'по', 'от', 'до', 'из', 'за', 'со', 'во', 'об', 'ко',
  'для', 'при', 'над', 'под', 'без', 'или', 'что', 'так', 'еще', 'как',
]

const PREPS_RE = new RegExp(
  '(?<![А-Яа-яA-Za-z])(' + PREPS.join('|') + ') +(?=\\S)',
  'giu',
)
const DIGIT_CYR_RE = /(\d) +(?=[а-яА-Я])/g
const DIGIT_GROUP_RE = /(\d) +(?=\d{3}\b)/g
const DIGIT_UNIT_RE = /(\d) +([₽%€$])/g
const DASH_RE = / +—/g
const NBSP_DEDUPE_RE = new RegExp(NBSP + '{2,}', 'g')

/** Применить все типографические правила к голому тексту (НЕ HTML). Идемпотентно. */
export function typograf(text: string): string {
  if (!text) return text
  // 1) ё → е
  let out = text.replace(/ё/g, 'е').replace(/Ё/g, 'Е')
  // 2) NBSP после предлогов — в цикле для цепочек «в и на …»
  for (let i = 0; i < 3; i++) {
    const next = out.replace(PREPS_RE, '$1' + NBSP)
    if (next === out) break
    out = next
  }
  // 3) цифра + кириллица
  out = out.replace(DIGIT_CYR_RE, '$1' + NBSP)
  // 4) разряды числа
  out = out.replace(DIGIT_GROUP_RE, '$1' + NBSP)
  // 5) число + единица
  out = out.replace(DIGIT_UNIT_RE, '$1' + NBSP + '$2')
  // 6) перед em dash
  out = out.replace(DASH_RE, NBSP + '—')
  // 7) дубликаты NBSP
  out = out.replace(NBSP_DEDUPE_RE, NBSP)
  return out
}

const QUOTES = new Set(['"', "'", '`'])

/** s[i] === '<'. Индекс ПОСЛЕ закрывающего '>', с учётом кавычек в атрибутах. */
function scanTag(s: string, i: number): number {
  const n = s.length
  let quote: string | null = null
  i += 1
  while (i < n) {
    const c = s[i]
    if (quote) {
      if (c === quote) quote = null
    } else if (QUOTES.has(c)) {
      quote = c
    } else if (c === '>') {
      return i + 1
    }
    i += 1
  }
  return n
}

/**
 * Применить типографику ТОЛЬКО к текстовым узлам HTML.
 * Теги (с атрибутами), <script>/<style> и комментарии не трогаются.
 */
export function typografHtml(html: string | null | undefined): string | null {
  if (!html) return html ?? null
  const n = html.length
  let i = 0
  let out = ''
  while (i < n) {
    const c = html[i]
    if (c === '<') {
      let j: number
      if (html.startsWith('<!--', i)) {
        const k = html.indexOf('-->', i + 4)
        j = k === -1 ? n : k + 3
      } else {
        const m = /^<(script|style)\b/i.exec(html.slice(i))
        if (m) {
          const close = new RegExp('</' + m[1] + '\\s*>', 'i').exec(html.slice(i))
          j = close ? i + close.index + close[0].length : n
        } else {
          j = scanTag(html, i)
        }
      }
      out += html.slice(i, j)
      i = j
    } else {
      let j = html.indexOf('<', i)
      if (j === -1) j = n
      out += typograf(html.slice(i, j))
      i = j
    }
  }
  return out
}

// Ключи, значения которых НЕ типографим (идентификаторы, URL, технические поля).
// author / company — имена собственные в постах и цитатах (строковые значения).
const SKIP_KEYS = new Set([
  'slug', 'url', 'href', 'src', 'link', 'id', 'blockType', '_status',
  'filename', 'mimeType', 'hash', 'prefix', 'thumbnailURL',
  'createdAt', 'updatedAt', 'publishedAt', 'value',
  'author', 'company',
])

// Признак объекта-сущности (person / company) — у них `name` это имя собственное,
// которое типографить не нужно (напр. не превращать «Фёдоров» → «Федоров»).
// Глоссарий тоже имеет поле `name`, но это термин — у него этих маркеров нет.
function isNamedEntity(obj: Record<string, unknown>): boolean {
  return 'jobTitle' in obj || 'linkText' in obj || 'logo' in obj
}

/**
 * Глубоко обойти документ из CMS и применить typograf() к человекочитаемым
 * строковым полям (title, excerpt, текст блоков, текст-узлы Lexical и т.д.).
 * Пропускает: ключи из SKIP_KEYS, поля-идентификаторы (*Id/*URL), строки с HTML
 * (bodyHtml — он типографится отдельно в sanitizeBodyHtml), Lexical-блоки кода.
 * Мутирует объект на месте (данные приходят из fetch — копия безопасна).
 */
export function typografDoc<T>(node: T, key = ''): T {
  if (typeof node === 'string') {
    if (SKIP_KEYS.has(key) || key.endsWith('Id') || key.endsWith('URL')) return node as T
    if (node.includes('<')) return node as T // HTML — не трогаем здесь
    return typograf(node) as unknown as T
  }
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) node[i] = typografDoc(node[i], key)
    return node
  }
  if (node && typeof node === 'object') {
    // Lexical code-блок — не типографим содержимое
    if ((node as any).type === 'code') return node
    const skipName = isNamedEntity(node as Record<string, unknown>)
    for (const k of Object.keys(node as Record<string, unknown>)) {
      if (skipName && k === 'name') continue // имя person/company — не трогаем
      ;(node as any)[k] = typografDoc((node as any)[k], k)
    }
    return node
  }
  return node
}
