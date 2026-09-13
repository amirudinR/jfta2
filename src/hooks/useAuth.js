// useAuth — React hook for Firebase Authentication
import { useState, useEffect, useCallback } from 'react'
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'
import { auth, googleProvider } from '../lib/firebase'

export function useAuth() {
  const [user, setUser] = useState(undefined) // undefined = loading, null = logged out
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return unsub
  }, [])

  const loginGoogle = useCallback(async () => {
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (e) {
      // User closed popup or error
      console.error('Login error:', e.code)
    }
  }, [])

  const logout = useCallback(async () => {
    await signOut(auth)
  }, [])

  return { user, loading, loginGoogle, logout }
}
