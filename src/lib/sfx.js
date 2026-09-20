// sfx.js — Efek suara sintetis (Web Audio API), tanpa file aset.
//
// Dipakai untuk feedback jawaban benar/salah. Bunyi dibangkitkan on-the-fly
// via oscillator + gain envelope sehingga nol unduhan & ringan.
//
// Aktif/nonaktif mengikuti preferensi `prefs.soundEffects` (toggle di Profil).
// Modul menyimpan status terakhir agar pemanggil tak perlu meneruskan pref
// tiap kali; App memanggil `setSfxEnabled(prefs.soundEffects)` saat pref berubah.

let enabled = true
let ctx = null

// Hormati preferensi OS "kurangi gerak". (Bukan gerak, tapi kesan "tenang".)
function prefersReduced() {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches } catch { return false }
}

export function setSfxEnabled(on) {
  enabled = !!on
}

export function isSfxEnabled() {
  return enabled
}

function getCtx() {
  if (ctx) return ctx
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return null
  try {
    ctx = new AC()
  } catch {
    ctx = null
  }
  return ctx
}

// Beberapa browser men-suspend AudioContext sampai interaksi user. Resume
// tanpa menunggu (fire-and-forget) saat kita benar-benar mau membunyikan suara.
function ensureRunning(ac) {
  if (ac && ac.state === 'suspended') {
    ac.resume().catch(() => {})
  }
}

// Putar satu nada (nada dasar, durasi, tipe gelombang, waktu mulai relatif).
function tone(ac, { freq, start, dur, type = 'sine', gain = 0.18 }) {
  const osc = ac.createOscillator()
  const g = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, ac.currentTime + start)
  // Envelope: attack cepat → decay halus (hindari klik).
  const t0 = ac.currentTime + start
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(g)
  g.connect(ac.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.02)
}

// Jawaban BENAR — arpeggio naik ceria (C6–E6–G6) ala "ding!".
export function playCorrect() {
  if (!enabled || prefersReduced()) return
  const ac = getCtx()
  if (!ac) return
  ensureRunning(ac)
  const base = 1046.5 // C6
  tone(ac, { freq: base, start: 0, dur: 0.12, type: 'triangle', gain: 0.16 })
  tone(ac, { freq: base * 1.26, start: 0.075, dur: 0.12, type: 'triangle', gain: 0.16 })
  tone(ac, { freq: base * 1.5, start: 0.15, dur: 0.22, type: 'triangle', gain: 0.18 })
}

// Jawaban SALAH — dua nada turun pendek & lembut (tidak menyakitkan).
export function playWrong() {
  if (!enabled || prefersReduced()) return
  const ac = getCtx()
  if (!ac) return
  ensureRunning(ac)
  tone(ac, { freq: 311.1, start: 0, dur: 0.16, type: 'sawtooth', gain: 0.1 })
  tone(ac, { freq: 207.7, start: 0.12, dur: 0.26, type: 'sawtooth', gain: 0.1 })
}

// Mainkan sesuai hasil (helper untuk pemanggil).
export function playResult(isCorrect) {
  if (isCorrect) playCorrect()
  else playWrong()
}
