export const MATERIALS = [
  { key: 'hiragana', label: 'Hiragana', kanji: 'ひらがな', kind: 'kana' },
  { key: 'katakana', label: 'Katakana', kanji: 'カタカナ', kind: 'kana' },
  { key: 'kotoba', label: 'Kotoba A2', kanji: 'ことば', kind: 'vocab' },
  { key: 'kotoba-n3', label: 'Kotoba N3', kanji: 'N3語彙', kind: 'vocab', standalone: true },
  { key: 'kotoba-n2', label: 'Kotoba N2', kanji: 'N2語彙', kind: 'vocab', standalone: true },
  { key: 'kotoba-n1', label: 'Kotoba N1', kanji: 'N1語彙', kind: 'vocab', standalone: true },
  { key: 'kanji', label: 'Kanji', kanji: '漢字', kind: 'kanji' },
  { key: 'bunpo', label: 'Bunpo', kanji: '文法', kind: 'bunpo' },
]

// ModeBar dalam tab Latihan — 2 group:
//   'latihan' = butuh MaterialBar (per-materi)
//   'tools'   = halaman penuh, tidak butuh MaterialBar
export const MODES = [
  // group: latihan (pakai MaterialBar)
  { key: 'kartu',    label: 'Kartu',    group: 'latihan', badge: null },
  { key: 'kuis',     label: 'Kuis',     group: 'latihan', badge: null },
  { key: 'ulangi',   label: 'Ulangi',   group: 'latihan', badge: 'ulangi' },
  { key: 'sprint',   label: 'Sprint',   group: 'latihan', badge: null },
  // group: tools (halaman penuh)
  { key: 'daftar',   label: 'Hafal',    group: 'tools',   badge: 'hafal' },
  { key: 'referensi',label: 'Referensi',group: 'tools',   badge: null },
  { key: 'kemampuan',label: 'Kemampuan',group: 'tools',   badge: null },
  { key: 'materi',   label: 'Materi',   group: 'tools',   badge: null },
]

export const materialOf = (key) => MATERIALS.find((m) => m.key === key)

// Teks hanko kecil di kartu, meniru stamp grup pada desain asli.
export function stampOf(entry, material) {
  const g = String(entry.groupLabel || '')
  if (material === 'kotoba' || material === 'kotoba-n3' || material === 'kotoba-n2' || material === 'kotoba-n1') {
    const m = g.match(/(\d+)/)
    return m ? `第${m[1]}課` : g || '語彙'
  }
  if (material === 'kanji') return g ? `No.${g}` : '漢字'
  if (material === 'bunpo') return g ? `§${g}` : '文法'
  if (/半濁|handakuten/i.test(g)) return '半濁点'
  if (/濁|dakuten/i.test(g)) return '濁点'
  if (/拗|yōon|yoon/i.test(g)) return '拗音'
  if (/行|清|vokal/i.test(g)) return '清音'
  return '追加'
}
