import HIRAGANA from './hiragana'
import KATAKANA from './katakana'
import KOTOBA from './kotoba'
import KANJI from './kanji'
import BUNPO from './bunpo'

// Normalisasi: id → string (sesuai skema data asli yang ber-id numerik),
// field wajib selalu ada agar komponen tidak perlu guard.
const norm = (e, material) => ({
  frontSub: '',
  reading: '',
  group: '',
  groupLabel: '',
  ...e,
  id: String(e.id),
  material,
})

export const DATA = [
  ...HIRAGANA.map((e) => norm(e, 'hiragana')),
  ...KATAKANA.map((e) => norm(e, 'katakana')),
  ...KOTOBA.map((e) => norm(e, 'kotoba')),
  ...KANJI.map((e) => norm(e, 'kanji')),
  ...BUNPO.map((e) => norm(e, 'bunpo')),
]

export const byMaterial = (material) => DATA.filter((e) => e.material === material)

// Daftar grup unik sesuai urutan kemunculan (untuk chip filter pelajaran).
export function groupListOf(entries) {
  const seen = []
  for (const e of entries) {
    const g = e.groupLabel || ''
    if (g && !seen.includes(g)) seen.push(g)
  }
  return seen
}

export default DATA
