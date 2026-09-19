// useLiveSync — menghidupkan/mematikan engine live-sync mengikuti status login.
// Gantikan useCloudSync + usePushCloud: pull & push sekarang live + semua store.

import { useEffect, useRef } from 'react'
import { startLiveSync, stopLiveSync } from '../lib/live-sync'
import { saveUserProfile } from '../lib/cloud-sync'
import { onSyncApplied } from '../lib/sync-events'

export function useLiveSync(user, onApplied) {
  const onAppliedRef = useRef(onApplied)
  onAppliedRef.current = onApplied

  useEffect(() => {
    if (!user || user.uid.startsWith('preview')) return
    // Pasang listener LEBIH DULU, lalu start — agar sinyal "store dibersihkan"
    // saat pergantian akun (dispatch di dalam startLiveSync) tidak hilang.
    const off = onSyncApplied((keys) => onAppliedRef.current && onAppliedRef.current(keys))
    startLiveSync(user.uid)
    saveUserProfile(user) // fire-and-forget; aman di dalam try/catch sendiri
    return () => {
      off()
      stopLiveSync()
    }
  }, [user])
}