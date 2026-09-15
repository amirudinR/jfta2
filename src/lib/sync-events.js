// sync-events — pub/sub ringan untuk memberi sinyal perubahan data.
// Dipisah dari live-sync agar penulis data (hafalan-storage, storage, history,
// exam-history, nav) bisa publish TANPA membuat circular import.

export const SYNC_APPLIED_EVENT = 'hh:sync-applied'

const localListeners = new Set()

// Dipanggil setiap kali data localStorage berubah (dari sisi aplikasi).
export function publishStoreChange(key) {
  localListeners.forEach((fn) => { try { fn(key) } catch {} })
}

// Engine sync mendaftarkan handler perubahan lokal di sini.
export function onStoreChanged(fn) {
  localListeners.add(fn)
  return () => localListeners.delete(fn)
}

// Dikirim setelah engine menerapkan merge cloud → localStorage.
export function dispatchSyncApplied(keys) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(SYNC_APPLIED_EVENT, { detail: { keys } }))
}

// Komponen/hook subscribe: dipanggil sesudah data lokal diperbarui dari cloud.
export function onSyncApplied(fn) {
  if (typeof window === 'undefined') return () => {}
  const handler = (e) => fn((e && e.detail && e.detail.keys) || [], e)
  window.addEventListener(SYNC_APPLIED_EVENT, handler)
  return () => window.removeEventListener(SYNC_APPLIED_EVENT, handler)
}