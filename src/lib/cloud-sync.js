// Firestore sync — simpan & load progress per user.uid
// Offline-first: localStorage tetap source of truth, Firestore = mirror
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'

const DEBOUNCE_MS = 2000
let timer = null

// ── Save to Firestore (debounced) ──
export function syncToCloud(uid, data) {
  if (!uid) return
  clearTimeout(timer)
  timer = setTimeout(async () => {
    try {
      const ref = doc(db, 'users', uid, 'progress', 'main')
      await setDoc(ref, { ...data, syncedAt: serverTimestamp() }, { merge: true })
    } catch (e) {
      console.warn('Cloud sync failed:', e.message)
    }
  }, DEBOUNCE_MS)
}

// ── Load from Firestore ──
export async function loadFromCloud(uid) {
  if (!uid) return null
  try {
    const ref = doc(db, 'users', uid, 'progress', 'main')
    const snap = await getDoc(ref)
    return snap.exists() ? snap.data() : null
  } catch (e) {
    console.warn('Cloud load failed:', e.message)
    return null
  }
}

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

// ── Save exam result ──
export async function saveExamResult(uid, result) {
  if (!uid) return
  try {
    const id = `${Date.now()}`
    const ref = doc(db, 'users', uid, 'exams', id)
    await setDoc(ref, { ...result, createdAt: serverTimestamp() })
  } catch (e) {
    console.warn('Exam save failed:', e.message)
  }
}

// ── Merge strategy: cloud wins if newer, else local wins ──
export function mergeProgress(local, cloud) {
  if (!cloud) return local
  if (!local) return cloud
  // Compare updated timestamps
  const localTime = local.updated || 0
  const cloudTime = cloud.syncedAt?.toMillis?.() || cloud.updated || 0
  if (cloudTime > localTime) {
    // Cloud is newer — merge perMaterial
    return {
      ...local,
      perMaterial: { ...local.perMaterial, ...cloud.perMaterial },
      updated: cloudTime,
    }
  }
  return local
}
