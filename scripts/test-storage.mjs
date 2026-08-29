// Uji migrasi v1 → v2 + operasi dasar storage (mock localStorage).

const store = new Map()
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
}

// Seed data v1 gaya HTML asli (id numerik per materi).
store.set(
  'hafalan-jft-a2-progress-v1',
  JSON.stringify({
    reviewSets: { hiragana: [0, 1] },
    masteredSets: { kotoba: [0, 1, 2] },
    showRomaji: true,
    darkMode: true,
  }),
)

const { getProgress, storeGrade, clearCard, resetProgress, getPrefs, savePrefs } = await import(
  '../src/lib/storage.js'
)

let fail = 0
const assert = (cond, msg) => {
  if (!cond) {
    fail++
    console.log('FAIL:', msg)
  }
}

const p = getProgress()
assert(p.perMaterial.hiragana['0'], 'migrasi: review hiragana id 0 → kartu learning')
assert(p.perMaterial.hiragana['0'].lapses === 1, 'migrasi: review card lapses=1')
assert(p.perMaterial.kotoba['2']?.interval === 21, 'migrasi: mastered kotoba id 2 → interval 21')
assert(getPrefs().showRomaji === true, 'migrasi: prefs.showRomaji=true')
assert(getPrefs().darkMode === true, 'migrasi: prefs.darkMode=true')

storeGrade('kanji', '5', { reps: 1, ease: 2.5, interval: 1, due: 1, lapses: 0 })
assert(getProgress().perMaterial.kanji['5'].interval === 1, 'storeGrade menyimpan kartu')
clearCard('kanji', '5')
assert(!getProgress().perMaterial.kanji['5'], 'clearCard menghapus kartu')

savePrefs({ direction: 'id2jp' })
assert(getPrefs().direction === 'id2jp' && getPrefs().darkMode === true, 'savePrefs merge parsial')

resetProgress()
assert(Object.keys(getProgress().perMaterial).length === 0, 'reset mengosongkan progres')

console.log(fail === 0 ? 'OK — storage & migrasi v1 lolos' : `${fail} assertion gagal`)
process.exit(fail === 0 ? 0 : 1)
