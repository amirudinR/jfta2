// Firebase — inisialisasi app + auth + firestore
import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyDltxKDRcTLXlffvIWT5sNTbuQ8UcVVEUA",
  authDomain: "jpnamir-nihon.firebaseapp.com",
  projectId: "jpnamir-nihon",
  storageBucket: "jpnamir-nihon.firebasestorage.app",
  messagingSenderId: "640598277204",
  appId: "1:640598277204:web:8fe45a4e17f48ffc03c1c1",
  measurementId: "G-BX7EKP0D0M",
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)

// P1 — offline persistence (IndexedDB, multi-tab). Tanpa ini Firestore hanya
// pakai cache memori: tiap reload/refresh listener attach & getDoc membaca ulang
// dari server → boros read. Dengan persistentLocalCache, snapshot yang sudah
// ada di cache lokal dilayani dari IndexedDB (tidak dihitung sebagai read server)
// sampai data benar-benar berubah. `persistentMultipleTabManager` agar aman saat
// app dibuka di beberapa tab (dua tab berbagi cache yang sama).
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
})
export const googleProvider = new GoogleAuthProvider()
