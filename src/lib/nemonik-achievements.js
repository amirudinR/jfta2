// Nemonik Kanji — achievement, XP & level.
// Store: hh2-nemonik-achievements { xp, unlocked: { [id]: ts } }
// Prefix `hh2-` agar ikut cloud-sync & "Reset semua progres".

import { lsGet, lsSet, STORAGE_PREFIX } from './hafalan-storage'

export const NEMONIK_ACH_KEY = `${STORAGE_PREFIX}-nemonik-achievements`

// XP per aksi.
export const XP_TABLE = {
  review: 2,       // tiap kartu dinilai
  sessionDone: 10, // menyelesaikan satu sesi
  quizCorrect: 3,  // jawaban kuis benar
}

// Definisi badge. `check(ctx)` menerima konteks statistik & mengembalikan boolean.
// ctx: { hafal, total, streak, sessions, totalCards, avgAcc, reviewedToday }
export const BADGES = [
  { id: 'first-step', label: 'Langkah Pertama', desc: 'Selesaikan 1 sesi', icon: '👣',
    check: (c) => c.sessions >= 1 },
  { id: 'kanji-10', label: 'Pemula', desc: 'Hafal 10 kanji', icon: '🌱',
    check: (c) => c.hafal >= 10 },
  { id: 'kanji-50', label: 'Rajin', desc: 'Hafal 50 kanji', icon: '🌿',
    check: (c) => c.hafal >= 50 },
  { id: 'kanji-100', label: 'Serius', desc: 'Hafal 100 kanji', icon: '🌳',
    check: (c) => c.hafal >= 100 },
  { id: 'kanji-250', label: 'Master', desc: 'Hafal 250 kanji', icon: '🏆',
    check: (c) => c.hafal >= 250 },
  { id: 'kanji-all', label: 'Kolektor Lengkap', desc: 'Hafal semua kanji', icon: '👑',
    check: (c) => c.total > 0 && c.hafal >= c.total },
  { id: 'streak-7', label: 'Sepekan', desc: 'Streak 7 hari', icon: '📅',
    check: (c) => c.streak >= 7 },
  { id: 'streak-30', label: 'Sebulan', desc: 'Streak 30 hari', icon: '🔥',
    check: (c) => c.streak >= 30 },
  { id: 'sessions-10', label: 'Tekun', desc: 'Selesaikan 10 sesi', icon: '💪',
    check: (c) => c.sessions >= 10 },
  { id: 'sessions-50', label: 'Dedikasi', desc: 'Selesaikan 50 sesi', icon: '🎯',
    check: (c) => c.sessions >= 50 },
  { id: 'cards-500', label: '500 Kartu', desc: 'Review 500 kartu total', icon: '📚',
    check: (c) => c.totalCards >= 500 },
  { id: 'acc-90', label: 'Akurat', desc: 'Akurasi rata-rata ≥ 90%', icon: '🎖️',
    check: (c) => c.sessions >= 3 && c.avgAcc >= 90 },
]

// Level dari total XP. Tiap level butuh 100 XP (naik linear sederhana).
const XP_PER_LEVEL = 100

// Selalu kembalikan bentuk valid (tahan localStorage korup: null/non-objek).
export const getAchievements = () => {
  const v = lsGet(NEMONIK_ACH_KEY, { xp: 0, unlocked: {} })
  if (!v || typeof v !== 'object' || Array.isArray(v)) return { xp: 0, unlocked: {} }
  return { xp: Number(v.xp) || 0, unlocked: (v.unlocked && typeof v.unlocked === 'object') ? v.unlocked : {} }
}

export function levelInfo(xp) {
  const level = Math.floor(xp / XP_PER_LEVEL) + 1
  const intoLevel = xp % XP_PER_LEVEL
  return { level, intoLevel, needed: XP_PER_LEVEL, pct: Math.round((intoLevel / XP_PER_LEVEL) * 100) }
}

// Tambah XP; mengembalikan state terbaru.
export function addXp(amount) {
  const st = getAchievements()
  st.xp = (st.xp || 0) + Math.max(0, amount | 0)
  lsSet(NEMONIK_ACH_KEY, st)
  return st
}

// Evaluasi badge terhadap konteks statistik. Mengembalikan { state, newly }
// di mana `newly` = daftar badge yang BARU terbuka (untuk notifikasi).
export function evaluateBadges(ctx) {
  const st = getAchievements()
  const unlocked = { ...(st.unlocked || {}) }
  const newly = []
  for (const b of BADGES) {
    if (!unlocked[b.id]) {
      let ok = false
      try { ok = !!b.check(ctx) } catch { ok = false }
      if (ok) {
        unlocked[b.id] = Date.now()
        newly.push(b)
      }
    }
  }
  if (newly.length > 0) {
    st.unlocked = unlocked
    lsSet(NEMONIK_ACH_KEY, st)
  }
  return { state: st, newly }
}
