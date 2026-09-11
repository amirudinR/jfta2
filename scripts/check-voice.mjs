import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataDir = join(__dirname, '..', 'src', 'data')

const FILES = {
  hiragana: join(dataDir, 'hiragana.js'),
  katakana: join(dataDir, 'katakana.js'),
  kotoba: join(dataDir, 'kotoba.js'),
  'kotoba-n3': join(dataDir, 'kotoba-n3.js'),
  'kotoba-n2': join(dataDir, 'kotoba-n2.js'),
  'kotoba-n1': join(dataDir, 'kotoba-n1.js'),
  kanji: join(dataDir, 'kanji.js'),
  bunpo: join(dataDir, 'bunpo.js'),
}

const KANJI_RE = /[一-龯]/
const KANA_ONLY_RE = /^[ぁ-んァ-ヶー・〜～／/　\s0-9０-９\-\.\'\u002b＋★☆？！。、（）()]+$/

// Parse E(...) calls, handling multi-line and nested quotes
function parseEntries(src) {
  const out = []
  const re = /E\s*\(/g
  let m
  while ((m = re.exec(src))) {
    const start = re.lastIndex
    let depth = 1
    let i = start
    let inStr = null
    for (; i < src.length && depth > 0; i++) {
      const c = src[i]
      if (inStr) {
        if (c === '\\') { i++; continue }
        if (c === inStr) inStr = null
        continue
      }
      if (c === "'" || c === '"' || c === '`') { inStr = c; continue }
      if (c === '(') depth++
      else if (c === ')') depth--
    }
    const args = src.slice(start, i - 1)
    // split top-level commas (outside quotes)
    const parts = []
    let cur = ''
    let q = null
    for (let j = 0; j < args.length; j++) {
      const c = args[j]
      if (q) {
        cur += c
        if (c === '\\') { cur += args[j + 1]; j++; continue }
        if (c === q) q = null
        continue
      }
      if (c === "'" || c === '"' || c === '`') { q = c; cur += c; continue }
      if (c === ',') { parts.push(cur.trim()); cur = ''; continue }
      cur += c
    }
    parts.push(cur.trim())
    const clean = (s) => {
      s = s.trim()
      if ((s.startsWith("'") && s.endsWith("'")) || (s.startsWith('"') && s.endsWith('"'))) {
        s = s.slice(1, -1)
        s = s.replace(/\\(['"])/g, '$1')
      }
      return s
    }
    const id = parts[0].trim()
    out.push({
      id: clean(id),
      front: clean(parts[1] || ''),
      sub: clean(parts[2] || ''),
      back: clean(parts[3] || ''),
      full: clean(parts[4] || ''),
      group: clean(parts[5] || ''),
    })
  }
  return out
}

let totalIssues = 0
for (const [mat, path] of Object.entries(FILES)) {
  const src = readFileSync(path, 'utf8')
  const entries = parseEntries(src)
  const issues = []
  for (const e of entries) {
    const pron = mat === 'kanji' ? e.sub : e.sub // all use sub for reading except hiragana/katakana
    if (mat === 'hiragana' || mat === 'katakana') continue // front is kana itself, no reading col
    if (!pron) {
      issues.push(`  [${e.id}] front=${e.front} — TANPA BACAN`)
      continue
    }
    if (KANJI_RE.test(pron)) {
      issues.push(`  [${e.id}] front=${e.front} — BACAN KANJI: "${pron}"`)
    } else if (!KANA_ONLY_RE.test(pron)) {
      issues.push(`  [${e.id}] front=${e.front} — BACAN MENYIMPANG: "${pron}"`)
    }
  }
  if (issues.length) {
    totalIssues += issues.length
    console.log(`\n== ${mat} (${entries.length}) — ${issues.length} masalah ==`)
    console.log(issues.join('\n'))
  } else {
    console.log(`\n== ${mat} (${entries.length}) — OK semua bacaan kana`)
  }
}
console.log(`\nTOTAL: ${totalIssues} masalah`)