// lib/firebase/firebase.ts

// Import Firebase core functionality (initialization)
import { initializeApp, getApps, getApp } from 'firebase/app'

// Firebase modules for specific services
import { getAuth, signInAnonymously } from 'firebase/auth' // Handles auth & anonymous login
import { getFirestore } from 'firebase/firestore'          // For storing notes, countdowns, etc.
import { getStorage } from 'firebase/storage'              // For uploading images, videos, files

// Firebase project configuration (from Firebase Console)
const firebaseConfig = {
  apiKey: "AIzaSyCfHu8f4-8nxDi7XZ4Km5yCDkZj_aC_760",
  authDomain: "quik-f17d5.firebaseapp.com",
  projectId: "quik-f17d5",
  storageBucket: "quik-f17d5.firebasestorage.app",
  messagingSenderId: "636886921351",
  appId: "1:636886921351:web:1f5589252b36184b1d8822",
  measurementId: "G-RQWLPHEG36"
}

// Avoid re-initializing the app if already initialized (important for Next.js hot reloads)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig)

// Initialize and export each Firebase service we'll use in this app
const auth = getAuth(app)
const db = getFirestore(app)
const storage = getStorage(app)

// Automatically sign in anonymously if no user exists
if (!auth.currentUser) {
  signInAnonymously(auth)
    .then(() => {
      console.log('✅ Signed in anonymously')
    })
    .catch((error) => {
      console.error('❌ Anonymous sign-in failed:', error)
    })
}

// Export so other parts of the app can use them
export { app, auth, db, storage }
