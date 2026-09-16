// Helper pembangun item kalender Hafalan Harian & Daftar Materi.

import { byMaterial } from '../data'
import { diffDays } from './hafalan-storage'

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
  const len = src.length
  // Modulo positif — dayPage boleh negatif (lihat kemarin).
  const start = (((dayPage * count) % len) + len) % len
  const items = []
  for (let i = 0; i < count && i < len; i++) items.push(src[(start + i) % len])
  return items
}

// Potongan untuk satu tanggal spesifik. `anchorDate` = tanggal halaman 0
// (hari pertama ada riwayat). Offset bisa negatif (kemarin) / positif (besok).
export function dailySliceForDate(src, anchorDate, targetDate, count) {
  if (!src.length || count <= 0) return []
  if (!anchorDate || !targetDate) return dailySlice(src, 0, count)
  return dailySlice(src, diffDays(anchorDate, targetDate), count)
}