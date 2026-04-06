import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getMessaging } from 'firebase-admin/messaging'

function requiredEnv(name) {
  const value = globalThis.process?.env?.[name]
  if (!value) {
    throw new Error(`Missing required Firebase admin env var: ${name}`)
  }
  return value
}

function normalizePrivateKey(value) {
  return value.replace(/\\n/g, '\n')
}

let adminApp = null

export function getFirebaseAdminApp() {
  if (adminApp) return adminApp

  if (getApps().length) {
    adminApp = getApps()[0]
    return adminApp
  }

  adminApp = initializeApp({
    credential: cert({
      projectId:
        globalThis.process?.env?.FIREBASE_ADMIN_PROJECT_ID ||
        globalThis.process?.env?.FIREBASE_PROJECT_ID ||
        requiredEnv('VITE_FIREBASE_PROJECT_ID'),
      clientEmail: requiredEnv('FIREBASE_ADMIN_CLIENT_EMAIL'),
      privateKey: normalizePrivateKey(requiredEnv('FIREBASE_ADMIN_PRIVATE_KEY')),
    }),
  })

  return adminApp
}

export function getFirebaseAdminMessaging() {
  return getMessaging(getFirebaseAdminApp())
}
