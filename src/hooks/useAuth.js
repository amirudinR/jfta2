// useAuth — React hook for Firebase Authentication
import { useState, useEffect, useCallback } from 'react'
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'
import { auth, googleProvider } from '../lib/firebase'

export function useAuth() {
  const [user, setUser] = useState(undefined) // undefined = loading, null = logged out
  const [loading, setLoading] = useState(true)
  const [loginError, setLoginError] = useState(null)

  useEffect(() => {
    // DEV-only preview: ?preview=1 melewati login untuk QA/screenshot.
    // import.meta.env.DEV === false di build produksi → cabang ini dihapus.
    if (import.meta.env.DEV && window.location.search.includes('preview=1')) {
      setUser({ uid: 'preview-user', displayName: 'Preview User', email: 'preview@local', photoURL: '' })
      setLoading(false)
      return undefined
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return unsub
  }, [])

  const loginGoogle = useCallback(async () => {
    setLoginError(null)
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (e) {
      // User closed popup or error
      console.error('Login error:', e.code)
      if (e?.code === 'auth/popup-closed-by-user') {
        setLoginError('Login dibatalkan. Coba lagi.')
      } else if (e?.code === 'auth/popup-blocked') {
        setLoginError('Popup login diblokir browser. Izinkan popup lalu coba lagi.')
      } else {
        setLoginError('Gagal masuk. Periksa koneksi lalu coba lagi.')
      }
    }
  }, [])

  const logout = useCallback(async () => {
    await signOut(auth)
  }, [])

  return { user, loading, loginGoogle, logout, loginError }
}
