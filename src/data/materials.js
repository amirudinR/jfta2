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

export const MODES = [
  { key: 'harian', label: 'Hafalan Harian', icon: '📅' },
  { key: 'materi', label: 'Daftar Materi', icon: '📖' },
  { key: 'kartu', label: 'Kartu', icon: '🎴' },
  { key: 'kuis', label: 'Kuis', icon: '📝' },
  { key: 'ulangi', label: 'Ulangi', icon: '🔁', badge: 'ulangi' },
  { key: 'sprint', label: 'Sprint', icon: '⚡' },
  { key: 'ujian', label: 'Ujian', icon: '🎯', badge: 'hafal' },
  { key: 'ujian-baru', label: 'Ujian Baru', icon: '🧪' },
  { key: 'daftar', label: 'Daftar Hafal', icon: '📋', badge: 'hafal' },
  { key: 'kemampuan', label: 'Kemampuan', icon: '📊' },
  { key: 'referensi', label: 'Daftar Lengkap', icon: '📚' },
  { key: 'kotoba-n3', label: 'Kotoba N3', icon: 'N3' },
  { key: 'kotoba-n2', label: 'Kotoba N2', icon: 'N2' },
  { key: 'kotoba-n1', label: 'Kotoba N1', icon: 'N1' },
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
