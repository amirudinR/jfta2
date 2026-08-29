// Persistensi progres SRS + preferensi ke localStorage, dengan migrasi dari v1.

const KEY = 'hafalan-jft-a2-progress-v2'
const KEY_V1 = 'hafalan-jft-a2-progress-v1'

const DEFAULT_PREFS = { darkMode: false, showRomaji: false, direction: 'jp2id' }

const emptyState = () => ({ perMaterial: {}, prefs: { ...DEFAULT_PREFS }, updated: Date.now() })

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
      return state
    }
    const migrated = migrateV1()
    if (migrated) {
      localStorage.setItem(KEY, JSON.stringify(migrated))
      return migrated
    }
  } catch (e) {
    /* abaikan: storage penuh / private mode */
  }
  return emptyState()
}

let cache = null

export function getProgress() {
  if (!cache) cache = load()
  return cache
}

export function saveProgress(state) {
  state.updated = Date.now()
  cache = state
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch (e) {
    /* abaikan */
  }
  return state
}

export function getPrefs() {
  return { ...getProgress().prefs }
}

export function savePrefs(partial) {
  const state = getProgress()
  state.prefs = { ...state.prefs, ...partial }
  return saveProgress(state)
}

export function getMaterialCards(material) {
  return getProgress().perMaterial[material] || {}
}

export function storeGrade(material, id, card) {
  const state = getProgress()
  if (!state.perMaterial[material]) state.perMaterial[material] = {}
  state.perMaterial[material][String(id)] = card
  return saveProgress(state)
}

export function setCard(material, id, card) {
  return storeGrade(material, id, card)
}

export function clearCard(material, id) {
  const state = getProgress()
  if (state.perMaterial[material]) {
    delete state.perMaterial[material][String(id)]
    return saveProgress(state)
  }
  return state
}

export function resetProgress() {
  cache = emptyState()
  try {
    localStorage.removeItem(KEY)
    localStorage.removeItem(KEY_V1)
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
