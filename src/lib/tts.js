// Text-to-speech bahasa Jepang via Web Speech API.

export function ttsSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

let jaVoice = null
let voicesHooked = false

function pickVoice() {
  if (!ttsSupported()) return null
  const voices = window.speechSynthesis.getVoices()
  return voices.find((v) => (v.lang || '').toLowerCase().startsWith('ja')) || null
}

function hookVoices() {
  if (!ttsSupported() || voicesHooked) return
  voicesHooked = true
  jaVoice = pickVoice()
  // Simpan referensi listener agar bisa dilepas (hindari kebocoran).
  try {
    window.speechSynthesis.addEventListener?.('voiceschanged', onVoicesChanged)
  } catch { /* abaikan */ }
}

function onVoicesChanged() {
  jaVoice = pickVoice()
}

// Inisialisasi lebih awal (saat modul dimuat) agar voice Jepang tersedia
// sebelum ucapan pertama — voices sering dimuat asinkron oleh browser.
if (typeof window !== 'undefined') hookVoices()

// Mengucapkan teks Jepang; mengembalikan true jika percobaan dilakukan.
export function speak(text) {
  if (!ttsSupported() || !text) return false
  hookVoices()
  try {
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'ja-JP'
    u.rate = 0.95
    // Pilih ulang bila belum ada (voices baru tiba) agar tak pakai suara default.
    const v = jaVoice || pickVoice()
    if (v) u.voice = v
    window.speechSynthesis.speak(u)
    return true
  } catch (e) {
    return false
  }
}
