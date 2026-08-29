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
  window.speechSynthesis.addEventListener?.('voiceschanged', () => {
    jaVoice = pickVoice()
  })
}

// Mengucapkan teks Jepang; mengembalikan true jika percobaan dilakukan.
export function speak(text) {
  if (!ttsSupported() || !text) return false
  hookVoices()
  try {
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'ja-JP'
    u.rate = 0.95
    const v = jaVoice || pickVoice()
    if (v) u.voice = v
    window.speechSynthesis.speak(u)
    return true
  } catch (e) {
    return false
  }
}
