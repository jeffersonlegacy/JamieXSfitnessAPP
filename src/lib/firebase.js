import { initializeApp } from 'firebase/app'
import {
  browserLocalPersistence,
  getAuth,
  inMemoryPersistence,
  indexedDBLocalPersistence,
  initializeAuth,
} from 'firebase/auth'
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'
import {
  firebaseConfig,
  firebaseEnvKeys,
  isFirebaseConfigured,
} from './firebaseConfig'

let app = null
let auth = null
let db = null
export const firebaseRuntime = {
  authPersistence: 'uninitialized',
  firestoreCache: 'uninitialized',
}

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig)

  try {
    auth = initializeAuth(app, {
      persistence: [
        indexedDBLocalPersistence,
        browserLocalPersistence,
        inMemoryPersistence,
      ],
    })
    firebaseRuntime.authPersistence = 'persistent'
  } catch (error) {
    console.warn('Firebase Auth persistence fell back to default mode.', error)
    auth = getAuth(app)
    firebaseRuntime.authPersistence = 'fallback'
  }

  try {
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    })
    firebaseRuntime.firestoreCache = 'persistent'
  } catch (error) {
    console.warn('Firestore local cache fell back to default mode.', error)
    db = getFirestore(app)
    firebaseRuntime.firestoreCache = 'fallback'
  }
}

export { app, auth, db, firebaseConfig, firebaseEnvKeys, isFirebaseConfigured }
