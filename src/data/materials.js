export const MATERIALS = [
  { key: 'hiragana', label: 'Hiragana', kanji: 'ひらがな', kind: 'kana' },
  { key: 'katakana', label: 'Katakana', kanji: 'カタカナ', kind: 'kana' },
  { key: 'kotoba', label: 'Kotoba A2', kanji: 'ことば', kind: 'vocab' },
  { key: 'kanji', label: 'Kanji', kanji: '漢字', kind: 'kanji' },
  { key: 'bunpo', label: 'Bunpo', kanji: '文法', kind: 'bunpo' },
]

export const MODES = [
  { key: 'kartu', label: 'Kartu', icon: '🎴' },
  { key: 'kuis', label: 'Kuis', icon: '📝' },
  { key: 'ulangi', label: 'Ulangi', icon: '🔁', badge: 'ulangi' },
  { key: 'sprint', label: 'Sprint', icon: '⚡' },
  { key: 'ujian', label: 'Ujian', icon: '🎯', badge: 'hafal' },
  { key: 'daftar', label: 'Daftar Hafal', icon: '📋', badge: 'hafal' },
  { key: 'referensi', label: 'Daftar Lengkap', icon: '📚' },
]

export const materialOf = (key) => MATERIALS.find((m) => m.key === key)

// Teks hanko kecil di kartu, meniru stamp grup pada desain asli.
export function stampOf(entry, material) {
  const g = String(entry.groupLabel || '')
  if (material === 'kotoba') {
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
