// Konstanta navigasi & mode aplikasi.

import { QUOTES } from '../data/quotes'
import { lsSet } from './hafalan-storage'

export const LEVEL_KEY = 'ankichou-level'

// Disimpan sebagai JSON (lewat lsGet/lsSet) agar ikut sinkron ke cloud lewat
// live-sync — sebelumnya `localStorage.setItem(lv)` mentah membuat
// `JSON.parse('n3')` gagal di live-sync sehingga level tak pernah ter-push.
// Migrasi: data lama berupa string mentah (tanpa kutip) → baca apa adanya.
export function getSavedLevel() {
  try {
    const raw = localStorage.getItem(LEVEL_KEY)
    if (raw == null) return null
    try {
      return JSON.parse(raw) // format baru (JSON)
    } catch {
      return raw // format lama (mentah) → pakai langsung + naikkan ke JSON
    }
  } catch {
    return null
  }
}

export function saveLevel(lv) {
  lsSet(LEVEL_KEY, lv)
}

export function pickQuote() {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)]
}

// Semua mode yang hidup di bawah tab "Latihan" di BottomNav.
export const LATIHAN_TAB_MODES = [
  'kartu', 'kuis', 'ulangi', 'sprint', // latihan per-materi
  'daftar', 'referensi', 'kemampuan', 'materi', // tools
]

// MaterialBar hanya tampil untuk mode latihan per-materi (bukan tools).
export const PERMATERI_MODES = ['kartu', 'kuis', 'ulangi', 'sprint', 'daftar', 'referensi']

// Mode yang menyembunyikan LevelStrip di atas konten.
export const HIDE_LEVEL_STRIP_MODES = ['profil', 'ujian-baru', 'recall', 'kotoba-n3', 'kotoba-n2', 'kotoba-n1', 'nemonik']

// Mode latihan kartu (Controls + ModeBar aktif).
export const CONTROL_MODES = ['kartu', 'ulangi', 'kuis', 'sprint']

export const KOTOBA_MODES = ['kotoba-n3', 'kotoba-n2', 'kotoba-n1']