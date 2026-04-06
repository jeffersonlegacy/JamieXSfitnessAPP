import { startTransition, useEffect, useState } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  limit,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { PROGRAM_START, USER_NAME } from '../lib/program'

function mapCollection(snapshot) {
  return snapshot.docs
    .map((entry) => ({
      id: entry.id,
      ...entry.data(),
    }))
    .sort((a, b) => a.id.localeCompare(b.id))
}

function mapCollectionOrdered(snapshot) {
  return snapshot.docs.map((entry) => ({
    id: entry.id,
    ...entry.data(),
  }))
}

function mapGoals(snapshot) {
  return mapCollectionOrdered(snapshot)
}

function mapDoc(snapshot) {
  if (!snapshot.exists()) return null
  return {
    id: snapshot.id,
    ...snapshot.data(),
  }
}

function indexById(entries) {
  return entries.reduce((accumulator, entry) => {
    accumulator[entry.id] = entry
    return accumulator
  }, {})
}

export function useJamieDashboard(user) {
  const [workouts, setWorkouts] = useState([])
  const [tracking, setTracking] = useState([])
  const [measurements, setMeasurements] = useState([])
  const [inbodyScans, setInbodyScans] = useState([])
  const [goals, setGoals] = useState([])
  const [wallPosts, setWallPosts] = useState([])
  const [wallComments, setWallComments] = useState([])
  const [settings, setSettings] = useState(null)
  const [reminders, setReminders] = useState([])
  const [videoState, setVideoState] = useState([])
  const [coachMemory, setCoachMemory] = useState([])
  const [coachThreads, setCoachThreads] = useState([])
  const [ready, setReady] = useState({
    workouts: false,
    tracking: false,
    measurements: false,
    inbodyScans: false,
    goals: false,
    wallPosts: false,
    wallComments: false,
    settings: false,
    reminders: false,
    videoState: false,
    coachMemory: false,
    coachThreads: false,
  })
  const [metadata, setMetadata] = useState({
    workouts: { fromCache: false, hasPendingWrites: false },
    tracking: { fromCache: false, hasPendingWrites: false },
    measurements: { fromCache: false, hasPendingWrites: false },
    inbodyScans: { fromCache: false, hasPendingWrites: false },
    goals: { fromCache: false, hasPendingWrites: false },
    wallPosts: { fromCache: false, hasPendingWrites: false },
    wallComments: { fromCache: false, hasPendingWrites: false },
    settings: { fromCache: false, hasPendingWrites: false },
    reminders: { fromCache: false, hasPendingWrites: false },
    videoState: { fromCache: false, hasPendingWrites: false },
    coachMemory: { fromCache: false, hasPendingWrites: false },
    coachThreads: { fromCache: false, hasPendingWrites: false },
  })
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user || !db) return undefined

    const userPath = ['users', user.uid]

    const markReady = (key) => {
      startTransition(() => {
        setReady((current) => ({ ...current, [key]: true }))
      })
    }

    const handleSnapshotError = (key, snapshotError) => {
      startTransition(() => {
        setError(snapshotError)
      })
      markReady(key)
    }

    const updateMetadata = (key, snapshot) => {
      startTransition(() => {
        setMetadata((current) => ({
          ...current,
          [key]: {
            fromCache: snapshot.metadata.fromCache,
            hasPendingWrites: snapshot.metadata.hasPendingWrites,
          },
        }))
      })
    }

    void setDoc(
      doc(db, ...userPath),
      {
        displayName: USER_NAME,
        programStart: PROGRAM_START,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    ).catch((bootstrapError) => {
      startTransition(() => {
        setError(bootstrapError)
      })
    })

    void setDoc(
      doc(db, ...userPath, 'settings', 'main'),
      {
        displayName: USER_NAME,
        programStart: PROGRAM_START,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    ).catch((bootstrapError) => {
      startTransition(() => {
        setError(bootstrapError)
      })
    })

    const subscriptions = [
      onSnapshot(
        collection(db, ...userPath, 'workouts'),
        (snapshot) => {
          startTransition(() => {
            setWorkouts(mapCollection(snapshot))
          })
          updateMetadata('workouts', snapshot)
          markReady('workouts')
        },
        (snapshotError) => handleSnapshotError('workouts', snapshotError),
      ),
      onSnapshot(
        collection(db, ...userPath, 'tracking'),
        (snapshot) => {
          startTransition(() => {
            setTracking(mapCollection(snapshot))
          })
          updateMetadata('tracking', snapshot)
          markReady('tracking')
        },
        (snapshotError) => handleSnapshotError('tracking', snapshotError),
      ),
      onSnapshot(
        collection(db, ...userPath, 'measurements'),
        (snapshot) => {
          startTransition(() => {
            setMeasurements(mapCollection(snapshot))
          })
          updateMetadata('measurements', snapshot)
          markReady('measurements')
        },
        (snapshotError) => handleSnapshotError('measurements', snapshotError),
      ),
      onSnapshot(
        collection(db, ...userPath, 'inbody_scans'),
        (snapshot) => {
          startTransition(() => {
            setInbodyScans(mapCollection(snapshot))
          })
          updateMetadata('inbodyScans', snapshot)
          markReady('inbodyScans')
        },
        (snapshotError) => handleSnapshotError('inbodyScans', snapshotError),
      ),
      onSnapshot(
        query(collection(db, ...userPath, 'goals'), orderBy('createdAt', 'desc')),
        (snapshot) => {
          startTransition(() => {
            setGoals(mapGoals(snapshot))
          })
          updateMetadata('goals', snapshot)
          markReady('goals')
        },
        (snapshotError) => handleSnapshotError('goals', snapshotError),
      ),
      onSnapshot(
        query(collection(db, 'motivation_wall'), orderBy('createdAt', 'desc'), limit(60)),
        (snapshot) => {
          startTransition(() => {
            setWallPosts(mapCollectionOrdered(snapshot))
          })
          updateMetadata('wallPosts', snapshot)
          markReady('wallPosts')
        },
        (snapshotError) => handleSnapshotError('wallPosts', snapshotError),
      ),
      onSnapshot(
        query(
          collection(db, 'motivation_wall_comments'),
          orderBy('createdAt', 'asc'),
          limit(240),
        ),
        (snapshot) => {
          startTransition(() => {
            setWallComments(mapCollectionOrdered(snapshot))
          })
          updateMetadata('wallComments', snapshot)
          markReady('wallComments')
        },
        (snapshotError) => handleSnapshotError('wallComments', snapshotError),
      ),
      onSnapshot(
        doc(db, ...userPath, 'settings', 'main'),
        (snapshot) => {
          startTransition(() => {
            setSettings(mapDoc(snapshot))
          })
          updateMetadata('settings', snapshot)
          markReady('settings')
        },
        (snapshotError) => handleSnapshotError('settings', snapshotError),
      ),
      onSnapshot(
        collection(db, ...userPath, 'reminders'),
        (snapshot) => {
          startTransition(() => {
            setReminders(mapCollection(snapshot))
          })
          updateMetadata('reminders', snapshot)
          markReady('reminders')
        },
        (snapshotError) => handleSnapshotError('reminders', snapshotError),
      ),
      onSnapshot(
        collection(db, ...userPath, 'video_state'),
        (snapshot) => {
          startTransition(() => {
            setVideoState(mapCollection(snapshot))
          })
          updateMetadata('videoState', snapshot)
          markReady('videoState')
        },
        (snapshotError) => handleSnapshotError('videoState', snapshotError),
      ),
      onSnapshot(
        query(
          collection(db, ...userPath, 'coach_memory'),
          orderBy('updatedAt', 'desc'),
          limit(12),
        ),
        (snapshot) => {
          startTransition(() => {
            setCoachMemory(mapCollectionOrdered(snapshot))
          })
          updateMetadata('coachMemory', snapshot)
          markReady('coachMemory')
        },
        (snapshotError) => handleSnapshotError('coachMemory', snapshotError),
      ),
      onSnapshot(
        query(
          collection(db, ...userPath, 'coach_threads'),
          orderBy('createdAt', 'desc'),
          limit(50),
        ),
        (snapshot) => {
          startTransition(() => {
            setCoachThreads(mapCollectionOrdered(snapshot))
          })
          updateMetadata('coachThreads', snapshot)
          markReady('coachThreads')
        },
        (snapshotError) => handleSnapshotError('coachThreads', snapshotError),
      ),
    ]

    return () => {
      subscriptions.forEach((unsubscribe) => unsubscribe())
    }
  }, [user])

  const loading = user
    ? Object.values(ready).some((value) => value === false)
    : false

  async function setWorkoutComplete(dateKey, completed) {
    if (!user || !db) return
    await setDoc(
      doc(db, 'users', user.uid, 'workouts', dateKey),
      {
        completed,
        timestamp: serverTimestamp(),
      },
      { merge: true },
    )
  }

  async function saveTrackingEntry(dateKey, payload) {
    if (!user || !db) return
    await setDoc(
      doc(db, 'users', user.uid, 'tracking', dateKey),
      {
        caloricDeficit: payload.caloricDeficit,
        hydrationTargetMet: payload.hydrationTargetMet,
        mindsetLog: payload.mindsetLog,
        mindsetTitle: payload.mindsetTitle,
        timestamp: serverTimestamp(),
      },
      { merge: true },
    )
  }

  async function saveMeasurement(dateKey, payload) {
    if (!user || !db) return
    await setDoc(
      doc(db, 'users', user.uid, 'measurements', dateKey),
      {
        chest: payload.chest,
        waist: payload.waist,
        hips: payload.hips,
        rThigh: payload.rThigh,
        rBicep: payload.rBicep,
        timestamp: serverTimestamp(),
      },
      { merge: true },
    )
  }

  async function saveInBodyScan(dateKey, payload) {
    if (!user || !db) return
    await setDoc(
      doc(db, 'users', user.uid, 'inbody_scans', dateKey),
      {
        smm: payload.smm,
        pbf: payload.pbf,
        bmr: payload.bmr,
        timestamp: serverTimestamp(),
      },
      { merge: true },
    )
  }

  async function addGoal(text) {
    if (!user || !db || !text.trim()) return
    await addDoc(collection(db, 'users', user.uid, 'goals'), {
      text: text.trim(),
      createdAt: serverTimestamp(),
    })
  }

  async function addWallPost(payload) {
    if (!user || !db || !payload?.text?.trim()) return
    await addDoc(collection(db, 'motivation_wall'), {
      authorName: payload.authorName?.trim?.() || USER_NAME,
      authorUid: user.uid,
      text: payload.text.trim(),
      createdAt: serverTimestamp(),
    })
  }

  async function addWallComment(payload) {
    if (!user || !db || !payload?.text?.trim() || !payload?.postId) return
    await addDoc(collection(db, 'motivation_wall_comments'), {
      authorName: payload.authorName?.trim?.() || USER_NAME,
      authorUid: user.uid,
      postId: String(payload.postId),
      text: payload.text.trim(),
      createdAt: serverTimestamp(),
    })
  }

  async function saveSettings(payload) {
    if (!user || !db) return
    await setDoc(
      doc(db, 'users', user.uid, 'settings', 'main'),
      {
        ...(payload || {}),
        displayName: payload?.displayName?.trim?.() || USER_NAME,
        programStart: payload?.programStart || PROGRAM_START,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )
  }

  async function saveReminderPreference(reminderId, payload) {
    if (!user || !db || !reminderId) return
    await setDoc(
      doc(db, 'users', user.uid, 'reminders', String(reminderId)),
      {
        ...(payload || {}),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )
  }

  async function saveVideoState(stateId, payload) {
    if (!user || !db || !stateId) return
    await setDoc(
      doc(db, 'users', user.uid, 'video_state', String(stateId)),
      {
        ...(payload || {}),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )
  }

  async function saveCoachMemorySummary(memoryId, payload) {
    if (!user || !db || !memoryId) return
    await setDoc(
      doc(db, 'users', user.uid, 'coach_memory', String(memoryId)),
      {
        ...(payload || {}),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )
  }

  async function addCoachThreadMessage(payload) {
    if (!user || !db || !payload?.message?.trim()) return
    await addDoc(collection(db, 'users', user.uid, 'coach_threads'), {
      threadId: payload.threadId || 'main',
      role: payload.role || 'assistant',
      message: payload.message.trim(),
      contextKey: payload.contextKey || null,
      createdAt: serverTimestamp(),
    })
  }

  async function saveNotificationToken(tokenId, payload) {
    if (!user || !db || !tokenId) return
    await setDoc(
      doc(db, 'users', user.uid, 'notification_tokens', String(tokenId)),
      {
        ...(payload || {}),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )
  }

  async function removeNotificationToken(tokenId) {
    if (!user || !db || !tokenId) return
    await deleteDoc(
      doc(db, 'users', user.uid, 'notification_tokens', String(tokenId)),
    )
  }

  const remindersById = indexById(reminders)
  const videoStateById = indexById(videoState)
  const coachMemoryById = indexById(coachMemory)
  const coachThreadsById = indexById(coachThreads)

  return {
    loading,
    error,
    settings,
    reminders,
    remindersById,
    videoState,
    videoStateById,
    coachMemory,
    coachMemoryById,
    coachThreads,
    coachThreadsById,
    workouts,
    tracking,
    measurements,
    inbodyScans,
    goals,
    wallPosts,
    wallComments,
    sync: {
      fromCache: Object.values(metadata).some((entry) => entry.fromCache),
      hasPendingWrites: Object.values(metadata).some(
        (entry) => entry.hasPendingWrites,
      ),
      collections: metadata,
    },
    actions: {
      setWorkoutComplete,
      saveTrackingEntry,
      saveMeasurement,
      saveInBodyScan,
      addGoal,
      addWallPost,
      addWallComment,
      saveSettings,
      saveReminderPreference,
      saveVideoState,
      saveCoachMemorySummary,
      addCoachThreadMessage,
      saveNotificationToken,
      removeNotificationToken,
    },
  }
}
