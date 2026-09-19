import { useEffect, useRef, useState } from 'react'

// useExitAnimation — mengelola animasi KELUAR untuk overlay (modal, toast, sheet).
//
// Komponen overlay biasanya di-unmount segera saat ditutup, sehingga animasi
// slide-down/fade tidak sempat tampil. Hook ini menahan elemen tetap ter-mount
// selama `duration` ms saat `open` berubah true → false, lalu memanggil
// `onExited` (biasanya untuk reset state pemilik).
//
// Pemakaian:
//   const { mounted, closing } = useExitAnimation(open, { duration: 220 })
//   if (!mounted) return null
//   <div className={closing ? 'ios-sheet-out' : 'ios-sheet-in'}>…</div>
//
// Aman untuk StrictMode: transisi open→false memakai timer, dan bila `open`
// kembali true di tengah animasi keluar, timer dibatalkan & status closing
// di-reset (tidak ada state "nyangkut").
export function useExitAnimation(open, { duration = 220, onExited } = {}) {
  const [mounted, setMounted] = useState(open)
  const [closing, setClosing] = useState(false)

  const timerRef = useRef(null)
  const mountedRef = useRef(open)
  const onExitedRef = useRef(onExited)
  onExitedRef.current = onExited

  useEffect(() => {
    mountedRef.current = mounted
  }, [mounted])

  useEffect(() => {
    if (open) {
      // Muncul / batalkan animasi keluar.
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      setClosing(false)
      setMounted(true)
      return
    }

    // open === false → mulai animasi keluar bila masih ter-mount.
    if (!mountedRef.current) return

    setClosing(true)
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      setClosing(false)
      setMounted(false)
      onExitedRef.current?.()
    }, duration)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [open, duration])

  // Bersihkan timer saat unmount total.
  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  return { mounted, closing }
}
