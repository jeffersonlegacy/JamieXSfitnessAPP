import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  deleteToken,
  getMessaging,
  getToken,
  isSupported,
  onMessage,
} from 'firebase/messaging'
import { app } from '../lib/firebase'
import { firebaseVapidKey, isMessagingConfigured } from '../lib/firebaseConfig'

const PUSH_SERVICE_WORKER_URL = '/push/firebase-messaging-sw.js'
const PUSH_SERVICE_WORKER_SCOPE = '/push/'

export function usePushNotifications({
  saveNotificationToken,
  removeNotificationToken,
  saveSettings,
  user,
}) {
  const [supported, setSupported] = useState(false)
  const [permission, setPermission] = useState(getPermissionState())
  const [loading, setLoading] = useState(false)
  const [token, setToken] = useState('')
  const [lastMessage, setLastMessage] = useState(null)

  const canPrompt =
    typeof window !== 'undefined' &&
    'Notification' in window &&
    permission !== 'denied'

  const ready = supported && isMessagingConfigured && Boolean(user)

  const state = useMemo(
    () => ({
      canPrompt,
      enabled: Boolean(token),
      loading,
      permission,
      ready,
      supported,
      token,
    }),
    [canPrompt, loading, permission, ready, supported, token],
  )

  const registerTokenWithFirebase = useCallback(async () => {
    const registration = await navigator.serviceWorker.register(
      PUSH_SERVICE_WORKER_URL,
      {
        scope: PUSH_SERVICE_WORKER_SCOPE,
      },
    )
    const messaging = getMessaging(app)

    return getToken(messaging, {
      vapidKey: firebaseVapidKey,
      serviceWorkerRegistration: registration,
    })
  }, [])

  const persistToken = useCallback(async (nextToken) => {
    const tokenId = tokenIdFromToken(nextToken)

    await saveNotificationToken?.(tokenId, {
      token: nextToken,
      permission: 'granted',
      platform: 'web',
      scope: PUSH_SERVICE_WORKER_SCOPE,
      userAgent:
        typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      lastSeenAt: new Date().toISOString(),
    })

    await saveSettings?.({
      pushEnabled: true,
      pushPermission: 'granted',
    })
  }, [saveNotificationToken, saveSettings])

  useEffect(() => {
    let active = true

    async function checkSupport() {
      if (!isMessagingConfigured || !app || typeof window === 'undefined') {
        if (active) setSupported(false)
        return
      }

      try {
        const nextSupported =
          'serviceWorker' in navigator && (await isSupported())
        if (active) setSupported(nextSupported)
      } catch (error) {
        console.warn('FCM support check failed.', error)
        if (active) setSupported(false)
      }
    }

    void checkSupport()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!ready || permission !== 'granted') return undefined

    let unsubscribe = null

    async function attachForegroundListener() {
      try {
        const messaging = getMessaging(app)
        unsubscribe = onMessage(messaging, (payload) => {
          setLastMessage({
            body:
              payload.notification?.body ||
              payload.data?.body ||
              'A little reminder is waiting for you.',
            title:
              payload.notification?.title ||
              payload.data?.title ||
              "Jamie's 90-Day Burn",
          })
        })
      } catch (error) {
        console.warn('Could not attach foreground notifications.', error)
      }
    }

    void attachForegroundListener()

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe()
    }
  }, [permission, ready])

  useEffect(() => {
    if (!ready || permission !== 'granted' || token) return undefined

    let cancelled = false

    async function syncExistingToken() {
      try {
        const nextToken = await registerTokenWithFirebase()
        if (!nextToken || cancelled) return
        setToken(nextToken)
        await persistToken(nextToken)
      } catch (error) {
        console.warn('Could not refresh existing push token.', error)
      }
    }

    void syncExistingToken()

    return () => {
      cancelled = true
    }
  }, [permission, persistToken, ready, registerTokenWithFirebase, token])

  async function requestPermission() {
    if (!canPrompt || !ready) return false

    setLoading(true)
    try {
      const nextPermission = await window.Notification.requestPermission()
      setPermission(nextPermission)
      await saveSettings?.({
        pushPermission: nextPermission,
        pushEnabled: nextPermission === 'granted',
      })

      if (nextPermission !== 'granted') {
        return false
      }

      const nextToken = await registerTokenWithFirebase()
      if (!nextToken) return false

      setToken(nextToken)
      await persistToken(nextToken)
      return true
    } finally {
      setLoading(false)
    }
  }

  async function disablePush() {
    if (!ready) return false

    setLoading(true)
    try {
      const messaging = getMessaging(app)
      if (token) {
        await deleteToken(messaging).catch((error) => {
          console.warn('Could not delete FCM token locally.', error)
        })
        await removeNotificationToken?.(tokenIdFromToken(token))
      }

      setToken('')
      await saveSettings?.({
        pushEnabled: false,
      })
      return true
    } finally {
      setLoading(false)
    }
  }

  return {
    ...state,
    disablePush,
    lastMessage,
    requestPermission,
  }
}

function getPermissionState() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported'
  }
  return window.Notification.permission
}

function tokenIdFromToken(token) {
  return btoa(token).replace(/[^a-zA-Z0-9]/g, '').slice(0, 120)
}
