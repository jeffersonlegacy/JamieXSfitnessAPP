import { startTransition, useEffect, useState } from 'react'
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth'
import { auth, isFirebaseConfigured } from '../lib/firebase'

const initialState = isFirebaseConfigured
  ? { status: 'loading', user: null, error: null }
  : { status: 'needs-config', user: null, error: null }

export function useFirebaseSession() {
  const [session, setSession] = useState(initialState)

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) return undefined

    let active = true

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!active) return

      if (user) {
        startTransition(() => {
          setSession({ status: 'authenticated', user, error: null })
        })
        return
      }

      try {
        await signInAnonymously(auth)
      } catch (error) {
        startTransition(() => {
          setSession({ status: 'error', user: null, error })
        })
      }
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  return session
}
