// Helper pembangun item kalender Hafalan Harian & Daftar Materi.

import { byMaterial } from '../data'

// Item baku dari sumber materi (id prefiks 'b-', stabil terhadap indeks).
export function buildItems(materialKey) {
  if (!materialKey) return []
  return byMaterial(materialKey).map((e, i) => ({
    id: `b-${e.id}`, num: i + 1, front: e.front,
    reading: e.frontSub || e.reading || '',
    meaning: e.backShort, full: e.backFull, custom: false,
  }))
}

// Gabung item baku dengan item custom (id stabil cc-*, fallback indeks c-*).
export function appendCustom(builtIn, customs) {
  return [
    ...builtIn,
    ...(customs || []).map((e, i) => ({
      id: e.id || `c-${i}`, num: builtIn.length + i + 1, front: e.front,
      reading: e.reading, meaning: e.meaning, full: e.meaning,
      custom: true, customIdx: i,
    })),
  ]
}

// Potongan harian bergilir (rotasi sesuai dayPage) dari daftar item.
export function dailySlice(src, dayPage, count) {
  if (!src.length || count <= 0) return []
  const start = (dayPage * count) % src.length
  const items = []
  for (let i = 0; i < count && i < src.length; i++) items.push(src[(start + i) % src.length])
  return items
}