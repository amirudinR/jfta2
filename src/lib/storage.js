// Persistensi progres SRS ke localStorage, dengan migrasi dari v1.

const KEY = 'hafalan-jft-a2-progress-v2'
const KEY_V1 = 'hafalan-jft-a2-progress-v1'

// v1 (HTML asli): { masteredSets: {material: [ids]}, reviewSets: {material: [ids]} }
function migrateV1() {
  try {
    const raw = localStorage.getItem(KEY_V1)
    if (!raw) return null
    const old = JSON.parse(raw)
    const result = { perMaterial: {}, updated: Date.now() }
    const apply = (id, label) => {
      const m = String(id).split('-')[0]
      const key = { h: 'hiragana', k: 'katakana', kot: 'kotoba', kan: 'kanji', bun: 'bunpo' }[m] || m
      if (!result.perMaterial[key]) result.perMaterial[key] = {}
      result.perMaterial[key][id] = defaultCardFor(label)
    }
    const defaultCardFor = () => {
      const d = new Date(Date.now() + 21 * 24 * 3600 * 1000)
      return { reps: 3, ease: 2.5, interval: 21, due: d.getTime(), lapses: 0 }
    }
    for (const [mat, ids = []] of Object.entries(old.masteredSets || {})) ids.forEach((id) => apply(id, 'mastered'))
    for (const [mat, ids = []] of Object.entries(old.reviewSets || {})) ids.forEach((id) => apply(id, 'relearning'))
    return result
  } catch (e) {
    return null
  }
}

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
    const migrated = migrateV1()
    if (migrated) {
      localStorage.setItem(KEY, JSON.stringify(migrated))
      return migrated
    }
  } catch (e) {
    /* ignore */
  }
  return { perMaterial: {}, updated: Date.now() }
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
    /* ignore */
  }
}

export function resetProgress() {
  cache = { perMaterial: {}, updated: Date.now() }
  try {
    localStorage.removeItem(KEY)
    localStorage.removeItem(KEY_V1)
  } catch (e) {
    /* ignore */
  }
  return cache
}

export function storeGrade(material, id, card) {
  const state = getProgress()
  if (!state.perMaterial[material]) state.perMaterial[material] = {}
  state.perMaterial[material][id] = card
  saveProgress(state)
  return state
}

export function clearMaterialCards(material) {
  const state = getProgress()
  state.perMaterial[material] = {}
  saveProgress(state)
  return state
}

export function getMaterialCards(material) {
  const state = getProgress()
  return state.perMaterial[material] || {}
}