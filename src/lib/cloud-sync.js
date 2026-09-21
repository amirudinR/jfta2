// Firestore sync — simpan profil & merge progress per user.uid.
// Offline-first: localStorage tetap source of truth, Firestore = mirror.
//
// P5: `syncToCloud`/`loadFromCloud` (jalur lama progress/main) DIHAPUS — sudah
// tidak dipakai sejak live-sync mengambil alih (store progress/main diurus
// live-sync via registry `legacy`). Menyisakannya hanya jadi kode mati + pintu
// masuk read/getDoc yang tak terkontrol.
// P6: `saveExamResult` (tulis koleksi `users/{uid}/exams/{uuid}`) DIHAPUS —
// tidak ada pembaca apa pun (tak ada getDocs/collection/onSnapshot untuk
// `exams`); hasil ujian sudah tersimpan di `hh/exam-history` oleh live-sync.
// Efeknya: satu sesi ujian 2 write → 1 write.
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'

// ── Save user profile on login ──
export async function saveUserProfile(user) {
  if (!user) return
  try {
    const ref = doc(db, 'users', user.uid)
    await setDoc(ref, {
      displayName: user.displayName || '',
      email: user.email || '',
      photoURL: user.photoURL || '',
      lastLogin: serverTimestamp(),
    }, { merge: true })
  } catch (e) {
    console.warn('Profile sync failed:', e.message)
  }
}

// ── Merge strategy: cloud wins if newer, else local wins ──
// Menghormati tombstone (kartu yang dihapus) dan menggabungkan prefs.
export function mergeProgress(local, cloud) {
  if (!cloud) return local
  if (!local) return cloud
  // Compare updated timestamps
  const localTime = local.updated || 0
  const cloudTime = cloud.syncedAt?.toMillis?.() || cloud.updated || 0
  const cloudNewer = cloudTime > localTime

  // Reset menang: jika lokal punya `resetAt` yang lebih baru dari cloud, kartu
  // lama di cloud TIDAK boleh dihidupkan lagi (hormati "Reset semua progres").
  // Bandingkan dengan `cloud.updated` (waktu klien) — konsisten dengan merge
  // lain & tahan terhadap skew `syncedAt` server.
  const cloudLocalTime = cloud.updated || 0
  if (local.resetAt && local.resetAt >= cloudLocalTime) {
    return {
      perMaterial: {},
      prefs: { ...(cloud.prefs || {}), ...(local.prefs || {}) },
      tombstone: { ...(local.tombstone || {}) },
      updated: Math.max(localTime, Date.now()),
      resetAt: local.resetAt,
    }
  }

  // Gabung peta kartu per materi (apa pun sisi yang lebih baru).
  const materials = new Set([
    ...Object.keys(local.perMaterial || {}),
    ...Object.keys(cloud.perMaterial || {}),
  ])
  const perMaterial = {}
  for (const m of materials) {
    perMaterial[m] = { ...(local.perMaterial?.[m] || {}), ...(cloud.perMaterial?.[m] || {}) }
  }

  // Terapkan tombstone dari kedua sisi: kartu yang pernah dihapus tak boleh
  // "muncul lagi" dari snapshot lama.
  const tombstone = { ...(local.tombstone || {}), ...(cloud.tombstone || {}) }
  for (const [m, ids] of Object.entries(tombstone)) {
    for (const id of Object.keys(ids || {})) delete perMaterial[m]?.[id]
  }

  // Gabung prefs; sisi yang lebih baru menang atas nilai bertabrakan.
  const prefs = cloudNewer
    ? { ...(local.prefs || {}), ...(cloud.prefs || {}) }
    : { ...(cloud.prefs || {}), ...(local.prefs || {}) }

  return {
    perMaterial,
    prefs,
    tombstone,
    updated: Math.max(localTime, cloudTime),
  }
}
