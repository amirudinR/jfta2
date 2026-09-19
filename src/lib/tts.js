// Text-to-speech bahasa Jepang via Web Speech API.
// Menyimpan preferensi voice + kecepatan (rate) per-device (prefix `hh1-`,
// sengaja TIDAK ikut cloud-sync karena daftar voice berbeda per perangkat).

export function ttsSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

// ── Preferensi voice (per-device, non-sync) ──────────────────────────────
const VOICE_KEY = 'hh1-tts-voice'   // nama voice (string) atau '' = otomatis
const RATE_KEY = 'hh1-tts-rate'     // kecepatan (number)

export function getVoicePref() {
  if (typeof localStorage === 'undefined') return { voice: '', rate: 0.95 }
  let voice = ''
  let rate = 0.95
  try { voice = localStorage.getItem(VOICE_KEY) || '' } catch { /* abaikan */ }
  try {
    const r = parseFloat(localStorage.getItem(RATE_KEY))
    if (Number.isFinite(r) && r >= 0.5 && r <= 1.5) rate = r
  } catch { /* abaikan */ }
  return { voice, rate }
}

export function setVoicePref({ voice, rate } = {}) {
  if (typeof localStorage === 'undefined') return
  try {
    if (voice !== undefined) {
      if (voice) localStorage.setItem(VOICE_KEY, voice)
      else localStorage.removeItem(VOICE_KEY)
    }
    if (rate !== undefined) localStorage.setItem(RATE_KEY, String(rate))
  } catch { /* abaikan */ }
}

// ── Daftar voice Jepang ──────────────────────────────────────────────────
// Kembalikan semua voice berbahasa Jepang (lang diawali 'ja').
export function listJapaneseVoices() {
  if (!ttsSupported()) return []
  return window.speechSynthesis.getVoices().filter((v) => (v.lang || '').toLowerCase().startsWith('ja'))
}

// Label ramah untuk voice populer. Kalau tak dikenali, pakai nama apa adanya.
const FRIENDLY = [
  { match: /kyoko/i, label: 'Kyoko (Apple)' },
  { match: /o-?ren/i, label: 'O-ren (Apple)' },
  { match: /nanami/i, label: 'Nanami (Microsoft)' },
  { match: /keita/i, label: 'Keita (Microsoft)' },
  { match: /google/i, label: 'Google 日本語' },
  { match: /mizuki/i, label: 'Mizuki (Android)' },
  { match: /haruka/i, label: 'Haruka (Apple/iOS)' },
  { match: /ayumi/i, label: 'Ayumi (Apple/iOS)' },
]

export function voiceLabel(v) {
  if (!v) return 'Otomatis'
  const found = FRIENDLY.find((f) => f.match.test(v.name))
  return found ? found.label : v.name
}

// ── Pemilihan & pengucapan ───────────────────────────────────────────────
let jaVoice = null
let voicesHooked = false

function pickVoice() {
  if (!ttsSupported()) return null
  const { voice: wanted } = getVoicePref()
  const voices = listJapaneseVoices()
  if (wanted) {
    const exact = voices.find((v) => v.name === wanted)
    if (exact) return exact
  }
  // Prioritas default: voice yang dikenal bagus (Google > Apple > Microsoft).
  const preferred = voices.find((v) => /google/i.test(v.name))
    || voices.find((v) => /kyoko|hatsune|haruka|ayumi/i.test(v.name))
    || voices.find((v) => /nanami|keita/i.test(v.name))
    || voices[0]
  return preferred || null
}

function hookVoices() {
  if (!ttsSupported() || voicesHooked) return
  voicesHooked = true
  jaVoice = pickVoice()
  try {
    window.speechSynthesis.addEventListener?.('voiceschanged', onVoicesChanged)
  } catch { /* abaikan */ }
}

function onVoicesChanged() {
  jaVoice = pickVoice()
}

// Berlangganan event `voiceschanged` (voices dimuat asinkron oleh browser).
// Mengembalikan fungsi unsubscribe. Langsung panggil cb bila sudah tersedia.
export function onVoicesReady(cb) {
  if (!ttsSupported()) return () => {}
  if (listJapaneseVoices().length > 0) { cb(); return () => {} }
  const handler = () => cb()
  try {
    window.speechSynthesis.addEventListener('voiceschanged', handler)
  } catch { return () => {} }
  return () => {
    try { window.speechSynthesis.removeEventListener('voiceschanged', handler) } catch { /* abaikan */ }
  }
}

if (typeof window !== 'undefined') hookVoices()

// Panggil ulang saat user mengganti voice dari Pengaturan.
export function refreshVoice() {
  jaVoice = pickVoice()
  return jaVoice
}

// Mengucapkan teks Jepang; mengembalikan true jika percobaan dilakukan.
// `opts.rate` menimpa kecepatan tersimpan (mis. untuk preview).
export function speak(text, opts = {}) {
  if (!ttsSupported() || !text) return false
  hookVoices()
  try {
    window.speechSynthesis.cancel()
    const { rate: savedRate } = getVoicePref()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'ja-JP'
    u.rate = opts.rate ?? savedRate
    const v = jaVoice || pickVoice()
    if (v) u.voice = v
    window.speechSynthesis.speak(u)
    return true
  } catch (e) {
    return false
  }
}
