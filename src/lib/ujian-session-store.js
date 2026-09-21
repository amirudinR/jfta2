// ujian-session-store.js — simpan sesi ujian yang sedang berjalan supaya
// refresh (F5) TIDAK menghilangkan progres dan user tetap di halaman ujian.
//
// SENGAJA lokal-only (bukan cloud-sync): kunci ini TIDAK terdaftar di
// sync-registry.js, jadi live-sync mengabaikannya. Sesi ujian bersifat
// per-perangkat — pindah device jangan tiba-tiba membuka ujian orang lain.
//
// Bentuk snapshot (versi `v` untuk migrasi ke depan):
// {
//   v: 1,
//   level, category, difficulty, scope, selectedDates,
//   phase,                       // 'scene' (setup/summary tak disimpan)
//   order: ['material|id', ...], // urutan soal — dibangun ulang dari pool
//   q, choice, score, streak, bestStreak,
//   startedAt,                   // epoch ms → elapsed dihitung ulang saat resume
//   wrong: [ {question, reading, userAnswer, correctAnswer, explanation} ],
//   savedAt,
// }

import { lsGet, lsSet } from './hafalan-storage'

const KEY = 'ankichou-ujian-session'
const VERSION = 1

export function loadUjianSession() {
  const s = lsGet(KEY, null)
  if (!s || typeof s !== 'object') return null
  if (s.v !== VERSION) return null // versi tak dikenal → anggap tak ada
  if (s.phase !== 'scene') return null // hanya fase ujian yang bisa di-resume
  if (!Array.isArray(s.order) || s.order.length === 0) return null
  if (typeof s.q !== 'number' || s.q < 0 || s.q >= s.order.length) return null
  return s
}

export function saveUjianSession(snapshot) {
  if (!snapshot || snapshot.phase !== 'scene') return
  lsSet(KEY, { ...snapshot, v: VERSION, savedAt: Date.now() })
}

export function clearUjianSession() {
  // Timpa dengan nilai kosong (jangan removeItem) agar konsisten dgn pola
  // reset app & tidak ambigu di masa depan.
  lsSet(KEY, null)
}

// ── Kodek order ──
// Simpan sebagai 'material|id' (id unik hanya per-material, jadi material wajib
// disertakan). Ringkas & tahan terhadap perubahan urutan data.
export const encodeOrder = (entries) => entries.map((e) => `${e.material}|${e.id}`)

// Bangun ulang array entry dari `order` + kandidat pool (Map 'material|id' → entry).
// Mengembalikan null bila ada kode yang tak ditemukan di pool (data berubah /
// level berganti) → pemanggil memutuskan membatalkan resume.
export function decodeOrder(codes, pool) {
  const byKey = new Map(pool.map((e) => [`${e.material}|${e.id}`, e]))
  const out = []
  for (const code of codes) {
    const e = byKey.get(code)
    if (!e) return null
    out.push(e)
  }
  return out
}
