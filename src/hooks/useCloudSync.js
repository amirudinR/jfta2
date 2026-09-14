// useCloudSync — handle sinkronisasi data ke/dari Firestore.
// Dipisah dari App.jsx agar App hanya jadi routing/layout.

import { useEffect, useState } from 'react'
import { getProgress, saveProgress } from '../lib/storage'
import {
  syncToCloud, loadFromCloud, mergeProgress,
  saveUserProfile,
} from '../lib/cloud-sync'

export function useCloudSync(user, setProgress) {
  const [cloudLoaded, setCloudLoaded] = useState(false)

  // Load dari cloud saat user baru login
  useEffect(() => {
    if (!user || cloudLoaded) return
    loadFromCloud(user.uid).then((cloud) => {
      if (cloud) {
        const local = getProgress()
        const merged = mergeProgress(local, cloud)
        saveProgress(merged)
        setProgress(merged)
      }
      setCloudLoaded(true)
    })
    saveUserProfile(user)
  }, [user, cloudLoaded, setProgress])

  return { cloudLoaded }
}

export function usePushCloud(user, cloudLoaded, progress) {
  useEffect(() => {
    if (!user || !cloudLoaded) return
    syncToCloud(user.uid, {
      perMaterial: progress.perMaterial,
      prefs: progress.prefs,
      tombstone: progress.tombstone,
      updated: progress.updated,
    })
  }, [progress, user, cloudLoaded])
}
