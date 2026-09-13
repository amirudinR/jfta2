// Firebase — inisialisasi app + auth + firestore
import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

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
export const db = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()
