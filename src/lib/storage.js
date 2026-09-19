// Persistensi progres SRS + preferensi ke localStorage, dengan migrasi dari v1.

import { publishStoreChange } from './sync-events'

const KEY = 'hafalan-jft-a2-progress-v2'
const KEY_V1 = 'hafalan-jft-a2-progress-v1'

const DEFAULT_PREFS = { darkMode: false, showRomaji: false, direction: 'jp2id', font: 'maru' }

const emptyState = () => ({
  perMaterial: {},
  prefs: { ...DEFAULT_PREFS },
  tombstone: {}, // { material: { id: timestampMs } } — kartu yang dihapus
  updated: Date.now(),
})

// v1 (HTML asli): { reviewSets: {mat: [id]}, masteredSets: {mat: [id]}, showRomaji, darkMode }
// id di v1 = indeks numerik per materi → disimpan sebagai String(id) di v2.
function migrateV1() {
  try {
    const raw = localStorage.getItem(KEY_V1)
    if (!raw) return null
    const old = JSON.parse(raw)
    const result = emptyState()
    const masteredCard = () => ({
      reps: 3,
      ease: 2.5,
      interval: 21,
      due: Date.now() + 21 * 24 * 3600 * 1000,
      lapses: 0,
    })
    const reviewCard = () => ({ reps: 1, ease: 2.5, interval: 0, due: 0, lapses: 1 })
    const apply = (mat, ids, card) => {
      if (!result.perMaterial[mat]) result.perMaterial[mat] = {}
      for (const id of ids || []) result.perMaterial[mat][String(id)] = card()
    }
    for (const [mat, ids] of Object.entries(old.masteredSets || {})) apply(mat, ids, masteredCard)
    for (const [mat, ids] of Object.entries(old.reviewSets || {})) apply(mat, ids, reviewCard)
    result.prefs = {
      ...DEFAULT_PREFS,
      showRomaji: !!old.showRomaji,
      darkMode: !!old.darkMode,
    }
    return result
  } catch (e) {
    return null
  }
}

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const state = JSON.parse(raw)
      state.perMaterial = state.perMaterial || {}
      state.prefs = { ...DEFAULT_PREFS, ...(state.prefs || {}) }
      state.tombstone = state.tombstone || {}
      return state
    }
    const migrated = migrateV1()
    if (migrated) {
      localStorage.setItem(KEY, JSON.stringify(migrated))
      return migrated
    }
  } catch (e) {
    /* abaikan: storage penuh / private mode */
    console.warn('[storage] Gagal load localStorage, mulai dari state kosong.', e)
  }
  return emptyState()
}

let cache = null

export function getProgress() {
  if (!cache) cache = load()
  return cache
}

// Invalidasi cache module-level (dipakai saat ganti akun / data lokal dibersihkan
// langsung) agar `getProgress()` membaca ulang dari localStorage.
export function invalidateProgressCache() {
  cache = null
}

export function saveProgress(state) {
  state.updated = Date.now()
  cache = state
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch (e) {
    console.warn('[storage] Gagal menyimpan ke localStorage (penuh / private mode?).', e)
  }
  publishStoreChange(KEY)
}

export function getPrefs() {
  return { ...getProgress().prefs }
}

export function savePrefs(partial) {
  const state = getProgress()
  state.prefs = { ...state.prefs, ...partial }
  return saveProgress(state)
}

export function storeGrade(material, id, card) {
  const state = getProgress()
  if (!state.perMaterial[material]) state.perMaterial[material] = {}
  state.perMaterial[material][String(id)] = card
  // Kartu dihafalkan/ulang lagi → batal tombstone-nya.
  if (state.tombstone[material]) delete state.tombstone[material][String(id)]
  return saveProgress(state)
}

export function setCard(material, id, card) {
  return storeGrade(material, id, card)
}

export function clearCard(material, id) {
  const state = getProgress()
  if (state.perMaterial[material]) {
    const sid = String(id)
    delete state.perMaterial[material][sid]
    // Tombstone: hindari kartu "muncul lagi" dari snapshot cloud yang lebih lama.
    state.tombstone[material] = state.tombstone[material] || {}
    state.tombstone[material][sid] = Date.now()
    return saveProgress(state)
  }
  return state
}

export function resetProgress() {
  // Pertahankan prefs (tema/bahasa) tapi kosongkan kartu. `resetAt` = penanda
  // agar merge cloud TIDAK menghidupkan lagi kartu lama (lihat mergeProgress).
  const prefs = { ...(cache?.prefs || DEFAULT_PREFS) }
  cache = { perMaterial: {}, prefs, tombstone: {}, updated: Date.now(), resetAt: Date.now() }
  saveProgress(cache) // publish → live-sync push state kosong ke cloud
  try {
    localStorage.removeItem(KEY_V1) // data lama v1 tak perlu lagi
  } catch (e) {
    /* abaikan */
  }
  return cache
}

// Deteksi ketersediaan localStorage (private mode / blocked).
export function storageAvailable() {
  try {
    const k = '__annki_test__'
    localStorage.setItem(k, '1')
    localStorage.removeItem(k)
    return true
  } catch (e) {
    return false
  }
}
