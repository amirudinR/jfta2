// Konstanta navigasi & mode aplikasi.

import { QUOTES } from '../data/quotes'

export const LEVEL_KEY = 'ankichou-level'

export function getSavedLevel() {
  try { return localStorage.getItem(LEVEL_KEY) } catch { return null }
}

export function saveLevel(lv) {
  try { localStorage.setItem(LEVEL_KEY, lv) } catch {}
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
export const HIDE_LEVEL_STRIP_MODES = ['profil', 'ujian-baru', 'recall', 'kotoba-n3', 'kotoba-n2', 'kotoba-n1']

// Mode latihan kartu (Controls + ModeBar aktif).
export const CONTROL_MODES = ['kartu', 'ulangi', 'kuis', 'sprint']

export const KOTOBA_MODES = ['kotoba-n3', 'kotoba-n2', 'kotoba-n1']