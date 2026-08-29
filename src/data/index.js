import HIRAGANA from './hiragana'
import KATAKANA from './katakana'
import KOTOBA from './kotoba'
import KANJI from './kanji'
import BUNPO from './bunpo'

export const DATA = [
  ...HIRAGANA.map((e) => ({ ...e, material: 'hiragana' })),
  ...KATAKANA.map((e) => ({ ...e, material: 'katakana' })),
  ...KOTOBA.map((e) => ({ ...e, material: 'kotoba' })),
  ...KANJI.map((e) => ({ ...e, material: 'kanji' })),
  ...BUNPO.map((e) => ({ ...e, material: 'bunpo' })),
]

export const byMaterial = (material) => DATA.filter((e) => e.material === material)

export const replicate = (n) => DATA.map((e) => ({ ...e, n }))

export default DATA