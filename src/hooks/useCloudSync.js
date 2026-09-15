// useCloudSync — handle sinkronisasi data ke/dari Firestore.
// Dipisah dari App.jsx agar App hanya jadi routing/layout.

import { useEffect, useRef, useState } from 'react'
import { getProgress, saveProgress } from '../lib/storage'
import {
  syncToCloud, loadFromCloud, mergeProgress,
  saveUserProfile,
} from '../lib/cloud-sync'

export function useCloudSync(user, setProgress) {
  const [cloudLoaded, setCloudLoaded] = useState(false)

  useEffect(() => {
    if (!user || cloudLoaded) return

    // C2 fix: saveUserProfile setelah load selesai, bukan paralel
    loadFromCloud(user.uid)
      .then((cloud) => {
        if (cloud) {
          const local = getProgress()
          const merged = mergeProgress(local, cloud)
          saveProgress(merged)
          setProgress(merged)
        }
        saveUserProfile(user)
        setCloudLoaded(true)
      })
      .catch(() => {
        // C1 fix: jika Firestore gagal, tetap set cloudLoaded agar push tidak diblok selamanya
        console.warn('[useCloudSync] Gagal load dari cloud, lanjut dengan data lokal.')
        setCloudLoaded(true)
      })
  }, [user, cloudLoaded, setProgress])

  return { cloudLoaded }
}

export function usePushCloud(user, cloudLoaded, progress) {
  // C3 fix: debounce 3 detik agar sesi latihan intensif tidak spam Firestore write
  const timerRef = useRef(null)

  useEffect(() => {
    if (!user || !cloudLoaded) return

    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      syncToCloud(user.uid, {
        perMaterial: progress.perMaterial,
        prefs: progress.prefs,
        tombstone: progress.tombstone,
        updated: progress.updated,
      })
    }, 3000)

    return () => clearTimeout(timerRef.current)
  }, [progress, user, cloudLoaded])
}
