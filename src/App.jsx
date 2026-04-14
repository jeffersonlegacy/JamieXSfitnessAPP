import { useEffect, useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import {
  Activity,
  BarChart2,
  Brain,
  Calendar as CalendarIcon,
  CheckCircle2,
  Droplets,
  Flame,
  Heart,
  Home,
  Sparkles,
  Target,
  XCircle,
} from 'lucide-react'
import { isFirebaseConfigured, firebaseEnvKeys } from './lib/firebase'
import { useFirebaseSession } from './hooks/useFirebaseSession'
import { useJamieDashboard } from './hooks/useJamieDashboard'
import SwipeTruthCard from './components/SwipeTruthCard'
import WorkoutPlayer from './components/WorkoutPlayer'
import {
  PERSPECTIVE_CARDS,
  PROGRAM_START,
  REST_DAY_OPTIONS,
  TOTAL_DAYS,
  USER_NAME,
  formatCompactDate,
  formatLongDate,
  getLatestByDate,
  getLocalDateKey,
  getOverloadSummary,
  getPhaseForDay,
  getPhaseName,
  getProgramDay,
  getProgramDateForDay,
  getRestOptionById,
  getRestPlan,
  getWeekForDay,
  getWorkoutForDay,
  isInBodyDue,
  isMeasurementDue,
  numberOrNull,
} from './lib/program'

const EMPTY_TRACKING = {
  caloricDeficit: '',
  hydrationTargetMet: null,
  mindsetTitle: '',
  mindsetLog: '',
}

const EMPTY_MEASUREMENTS = {
  chest: '',
  waist: '',
  hips: '',
  rThigh: '',
  rBicep: '',
}

const EMPTY_INBODY = {
  smm: '',
  pbf: '',
  bmr: '',
}

const APP_UPDATE_NOTE = {
  id: '2026-04-12-completion-polish',
  title: 'A few things got easier.',
  body: 'This update is here to make the app feel clearer and calmer when you use it.',
  points: [
    'Recording a workout now feels more obvious right away.',
    'If you edit an older day, the app tells you which day you are recording.',
    'Tabs should open back at the top instead of dropping you mid-scroll.',
  ],
}

export default function App() {
  const actualTodayKey = getLocalDateKey()
  const actualTodayDay = getProgramDay(actualTodayKey) || 1
  const [activeTab, setActiveTab] = useState('workout')
  const [selectedDay, setSelectedDay] = useState(actualTodayDay)
  const [completionShakeClass, setCompletionShakeClass] = useState('')
  const tabScrollRef = useRef(null)
  const [optimisticWorkoutState, setOptimisticWorkoutState] = useState({})
  const [trackingDraft, setTrackingDraft] = useState(EMPTY_TRACKING)
  const [measurementDraft, setMeasurementDraft] = useState(EMPTY_MEASUREMENTS)
  const [inbodyDraft, setInbodyDraft] = useState(EMPTY_INBODY)
  const [playerOpen, setPlayerOpen] = useState(true)
  const [newGoal, setNewGoal] = useState('')
  const [coachDraft, setCoachDraft] = useState('')
  const [coachSending, setCoachSending] = useState(false)
  const [showUpdateNote, setShowUpdateNote] = useState(false)
  const [saving, setSaving] = useState({
    workout: false,
    rest: false,
    reset: false,
    deficit: false,
    hydration: false,
    mindset: false,
    measurement: false,
    inbody: false,
    goal: false,
  })
  const [toast, setToast] = useState('')

  const session = useFirebaseSession()
  const dashboard = useJamieDashboard(session.user)

  const todayDay = selectedDay
  const todayKey = getLocalDateKey(getProgramDateForDay(todayDay))
  const todayWorkout = todayDay ? getWorkoutForDay(todayDay) : null
  const currentWeek = todayDay ? getWeekForDay(todayDay) : 1
  const currentPhase = todayDay ? getPhaseForDay(todayDay) : 1
  const currentPhaseName = getPhaseName(currentPhase)

  const workoutsByDate = indexById(dashboard.workouts)
  const trackingByDate = indexById(dashboard.tracking)
  const measurementsByDate = indexById(dashboard.measurements)
  const scansByDate = indexById(dashboard.inbodyScans)
  const coachMessages = (dashboard.coachMessages || []).map((entry) => ({
    role: entry.role === 'assistant' ? 'assistant' : 'user',
    content: String(entry.content || '').trim(),
  }))
  const truthReactions = dashboard.coachMemory?.truthReactions || {}
  const likedTruths = getTruthsByReaction(truthReactions, 'liked')
  const sensitiveTruths = getTruthsByReaction(truthReactions, 'sensitive')
  const latestHeavyRestRecord = getLatestHeavyRestRecord(dashboard.videoState, todayKey)

  const todayWorkoutEntry = workoutsByDate[todayKey]
  const todayTrackingEntry = trackingByDate[todayKey]
  const todayMeasurementEntry = measurementsByDate[todayKey]
  const todayScanEntry = scansByDate[todayKey]
  const todayVideoState = dashboard.videoStateById?.[todayKey] ?? null
  const todayOptimisticWorkout = optimisticWorkoutState[todayKey] || null
  const workoutSync = dashboard.sync?.collections?.workouts || {
    fromCache: false,
    hasPendingWrites: false,
  }
  const videoStateSync = dashboard.sync?.collections?.videoState || {
    fromCache: false,
    hasPendingWrites: false,
  }
  useEffect(() => {
    setTrackingDraft({
      caloricDeficit:
        todayTrackingEntry?.caloricDeficit === 0 ||
        Number.isFinite(todayTrackingEntry?.caloricDeficit)
          ? String(todayTrackingEntry.caloricDeficit)
          : '',
      hydrationTargetMet:
        typeof todayTrackingEntry?.hydrationTargetMet === 'boolean'
          ? todayTrackingEntry.hydrationTargetMet
          : null,
      mindsetTitle: todayTrackingEntry?.mindsetTitle ?? '',
      mindsetLog: todayTrackingEntry?.mindsetLog ?? '',
    })
  }, [todayTrackingEntry])

  useEffect(() => {
    setMeasurementDraft({
      chest: valueToInput(todayMeasurementEntry?.chest),
      waist: valueToInput(todayMeasurementEntry?.waist),
      hips: valueToInput(todayMeasurementEntry?.hips),
      rThigh: valueToInput(todayMeasurementEntry?.rThigh),
      rBicep: valueToInput(todayMeasurementEntry?.rBicep),
    })
  }, [todayMeasurementEntry])

  useEffect(() => {
    setInbodyDraft({
      smm: valueToInput(todayScanEntry?.smm),
      pbf: valueToInput(todayScanEntry?.pbf),
      bmr: valueToInput(todayScanEntry?.bmr),
    })
  }, [todayScanEntry])

  useEffect(() => {
    if (!todayWorkout?.video) {
      setPlayerOpen(false)
      return
    }

    if (!todayVideoState?.readyConfirmed && !todayWorkoutEntry?.completed) {
      setPlayerOpen(false)
      return
    }

    if (typeof todayVideoState?.expanded === 'boolean') {
      setPlayerOpen(todayVideoState.expanded)
      return
    }

    setPlayerOpen(!todayWorkoutEntry?.completed)
  }, [
    todayVideoState?.expanded,
    todayVideoState?.readyConfirmed,
    todayWorkout?.video,
    todayWorkoutEntry?.completed,
  ])

  useEffect(() => {
    if (!toast) return undefined
    const timeoutId = window.setTimeout(() => setToast(''), 2400)
    return () => window.clearTimeout(timeoutId)
  }, [toast])

  useEffect(() => {
    if (!completionShakeClass) return undefined
    const timeoutId = window.setTimeout(() => setCompletionShakeClass(''), 760)
    return () => window.clearTimeout(timeoutId)
  }, [completionShakeClass])

  useEffect(() => {
    const node = tabScrollRef.current
    if (!node) return
    node.scrollTop = 0
  }, [activeTab])

  useEffect(() => {
    if (!isFirebaseConfigured) return
    if (session.status === 'loading' || dashboard.loading) return
    if (session.status === 'error' || dashboard.error) return

    const storageKey = getUpdateNoticeStorageKey(APP_UPDATE_NOTE.id)
    try {
      const seen = window.localStorage.getItem(storageKey)
      if (!seen) {
        setShowUpdateNote(true)
      }
    } catch {
      setShowUpdateNote(true)
    }
  }, [
    dashboard.error,
    dashboard.loading,
    session.status,
  ])

  const completedWorkouts = dashboard.workouts.filter((entry) => entry.completed)
  const completedWorkoutKeys = completedWorkouts.map((entry) => entry.id)
  const hydrationWins = dashboard.tracking.filter(
    (entry) => entry.hydrationTargetMet === true,
  ).length
  const latestMeasurement = getLatestByDate(dashboard.measurements)
  const latestScan = getLatestByDate(dashboard.inbodyScans)

  const measurementsDue = isMeasurementDue(dashboard.measurements, todayKey)
  const inbodyDue = isInBodyDue(dashboard.inbodyScans, todayKey)

  const workoutComplete = Boolean(todayWorkoutEntry?.completed || todayOptimisticWorkout?.completed)
  const workoutSyncing =
    Boolean(todayOptimisticWorkout?.syncing) ||
    (workoutComplete &&
      Boolean(workoutSync.hasPendingWrites || videoStateSync.hasPendingWrites))
  const workoutRecordedAtLabel = getWorkoutRecordedLabel(
    todayWorkoutEntry?.timestamp,
    todayOptimisticWorkout?.recordedAt,
  )
  const trackingLoggedToday = hasTrackingContent(todayTrackingEntry)
  const adviceChecks = todayVideoState?.adviceChecks || {}
  const workoutReady = Boolean(todayVideoState?.readyConfirmed || workoutComplete)
  const currentGoal = dashboard.goals[0]?.text ?? ''
  const recentMindsetNotes = getRecentMindsetNotes(dashboard.tracking)
  const coachMemorySummary = buildCoachMemorySummary({
    coachMemory: dashboard.coachMemory,
    currentGoal,
    recentMindsetNotes,
  })

  useEffect(() => {
    if (!todayOptimisticWorkout?.completed) return
    if (!todayWorkoutEntry?.completed || !todayVideoState?.completed) return
    if (workoutSync.hasPendingWrites || videoStateSync.hasPendingWrites) return

    setOptimisticWorkoutState((current) => {
      const entry = current[todayKey]
      if (!entry || !entry.syncing) return current
      return {
        ...current,
        [todayKey]: {
          ...entry,
          syncing: false,
        },
      }
    })
  }, [
    todayKey,
    todayOptimisticWorkout?.completed,
    todayVideoState?.completed,
    todayWorkoutEntry?.completed,
    videoStateSync.hasPendingWrites,
    workoutSync.hasPendingWrites,
  ])

  if (!isFirebaseConfigured || session.status === 'needs-config') {
    return <ConfigurationState envKeys={firebaseEnvKeys} />
  }

  if (session.status === 'loading' || dashboard.loading) {
    return <LoadingState />
  }

  if (session.status === 'error' || dashboard.error) {
    return <ErrorState error={session.error || dashboard.error} />
  }

  function handleTabChange(nextTab) {
    setActiveTab(nextTab)
    window.requestAnimationFrame(() => {
      const node = tabScrollRef.current
      if (node) node.scrollTop = 0
    })
  }

  function handleDismissUpdateNote() {
    const storageKey = getUpdateNoticeStorageKey(APP_UPDATE_NOTE.id)
    try {
      window.localStorage.setItem(storageKey, 'seen')
    } catch {
      // Ignore storage failures and still dismiss locally.
    }
    setShowUpdateNote(false)
  }

  async function handleWorkoutComplete() {
    if (!todayDay || workoutComplete) return
    setSaving((current) => ({ ...current, workout: true }))
    setOptimisticWorkoutState((current) => ({
      ...current,
      [todayKey]: {
        completed: true,
        recordedAt: new Date().toISOString(),
        syncing: true,
      },
    }))
    try {
      await dashboard.actions.recordWorkoutDay(todayKey, {
        expanded: playerOpen,
        opened: Boolean(todayVideoState?.opened),
        readyConfirmed: Boolean(todayVideoState?.readyConfirmed),
        restOptionId: todayVideoState?.restOptionId ?? null,
        heavyLiftLog: todayVideoState?.heavyLiftLog ?? null,
        workoutName: todayWorkout?.name ?? null,
      })
      setCompletionShakeClass((current) =>
        current === 'app-shell-quake-a' ? 'app-shell-quake-b' : 'app-shell-quake-a',
      )
      setToast(
        todayWorkout?.type === 'rest'
          ? 'Recovery recorded. Nice work.'
          : 'Workout recorded. That day counts.',
      )
    } catch (error) {
      setOptimisticWorkoutState((current) => {
        const next = { ...current }
        delete next[todayKey]
        return next
      })
      setToast(error.message || 'Could not record today just yet.')
    } finally {
      setSaving((current) => ({ ...current, workout: false }))
    }
  }

  async function handleSaveDeficit() {
    setSaving((current) => ({ ...current, deficit: true }))
    try {
      await dashboard.actions.saveTrackingEntry(todayKey, {
        caloricDeficit: numberOrNull(trackingDraft.caloricDeficit),
        hydrationTargetMet: trackingDraft.hydrationTargetMet,
        mindsetTitle: trackingDraft.mindsetTitle.trim(),
        mindsetLog: trackingDraft.mindsetLog.trim(),
      })
      setToast('Energy balance saved.')
    } catch (error) {
      setToast(error.message || 'Could not save energy balance.')
    } finally {
      setSaving((current) => ({ ...current, deficit: false }))
    }
  }

  async function handleSaveHydration(value) {
    setSaving((current) => ({ ...current, hydration: true }))
    try {
      await dashboard.actions.saveTrackingEntry(todayKey, {
        caloricDeficit: numberOrNull(trackingDraft.caloricDeficit),
        hydrationTargetMet: value,
        mindsetTitle: trackingDraft.mindsetTitle.trim(),
        mindsetLog: trackingDraft.mindsetLog.trim(),
      })
      setTrackingDraft((current) => ({ ...current, hydrationTargetMet: value }))
      setToast(value ? 'Hydration win saved.' : 'Hydration note saved honestly.')
    } catch (error) {
      setToast(error.message || 'Could not save hydration.')
    } finally {
      setSaving((current) => ({ ...current, hydration: false }))
    }
  }

  async function handleSaveMindset() {
    if (!trackingDraft.mindsetTitle.trim() && !trackingDraft.mindsetLog.trim()) {
      setToast('Give the day a title or a few honest lines first.')
      return
    }
    setSaving((current) => ({ ...current, mindset: true }))
    try {
      await dashboard.actions.saveTrackingEntry(todayKey, {
        caloricDeficit: numberOrNull(trackingDraft.caloricDeficit),
        hydrationTargetMet: trackingDraft.hydrationTargetMet,
        mindsetTitle: trackingDraft.mindsetTitle.trim(),
        mindsetLog: trackingDraft.mindsetLog.trim(),
      })
      await dashboard.actions.saveCoachMemory({
        latestMindsetTitle: trackingDraft.mindsetTitle.trim(),
        latestMindsetLog: trackingDraft.mindsetLog.trim(),
        lastSoulEntryDate: todayKey,
        latestGoal: currentGoal || null,
      })
      setToast('Mindset note saved.')
    } catch (error) {
      setToast(error.message || 'Could not save the mindset note.')
    } finally {
      setSaving((current) => ({ ...current, mindset: false }))
    }
  }

  async function handleSaveMeasurements() {
    const payload = {
      chest: numberOrNull(measurementDraft.chest),
      waist: numberOrNull(measurementDraft.waist),
      hips: numberOrNull(measurementDraft.hips),
      rThigh: numberOrNull(measurementDraft.rThigh),
      rBicep: numberOrNull(measurementDraft.rBicep),
    }

    if (!Object.values(payload).some((value) => value !== null)) {
      setToast('Add at least one tape value before saving.')
      return
    }

    setSaving((current) => ({ ...current, measurement: true }))
    try {
      await dashboard.actions.saveMeasurement(todayKey, payload)
      setToast('Tape tracker updated.')
    } catch (error) {
      setToast(error.message || 'Could not save measurements.')
    } finally {
      setSaving((current) => ({ ...current, measurement: false }))
    }
  }

  async function handleSaveInBody() {
    const payload = {
      smm: numberOrNull(inbodyDraft.smm),
      pbf: numberOrNull(inbodyDraft.pbf),
      bmr: numberOrNull(inbodyDraft.bmr),
    }

    if (!Object.values(payload).some((value) => value !== null)) {
      setToast('Add at least one scan metric before saving.')
      return
    }

    setSaving((current) => ({ ...current, inbody: true }))
    try {
      await dashboard.actions.saveInBodyScan(todayKey, payload)
      setToast('InBody scan saved.')
    } catch (error) {
      setToast(error.message || 'Could not save scan data.')
    } finally {
      setSaving((current) => ({ ...current, inbody: false }))
    }
  }

  async function handleAddGoal() {
    if (!newGoal.trim()) return
    setSaving((current) => ({ ...current, goal: true }))
    try {
      const trimmed = newGoal.trim()
      await dashboard.actions.addGoal(trimmed)
      await dashboard.actions.saveCoachMemory({
        latestGoal: trimmed,
      })
      setNewGoal('')
      setToast('Your words are on the wall now.')
    } catch (error) {
      setToast(error.message || 'Could not add that goal.')
    } finally {
      setSaving((current) => ({ ...current, goal: false }))
    }
  }

  async function handlePlayerOpenChange(nextOpen) {
    setPlayerOpen(nextOpen)
    if (!todayWorkout?.video) return

    try {
      await dashboard.actions.saveVideoState(todayKey, {
        expanded: nextOpen,
        workoutName: todayWorkout.name,
        opened: true,
        lastOpenedOn: todayKey,
      })
    } catch (error) {
      console.warn('Could not save video state.', error)
    }
  }

  async function handleAdviceCheck(checkId, checked) {
    if (!todayWorkout?.video) return

    try {
      await dashboard.actions.saveVideoState(todayKey, {
        adviceChecks: {
          ...(todayVideoState?.adviceChecks || {}),
          [checkId]: checked,
        },
        workoutName: todayWorkout.name,
      })
    } catch (error) {
      console.warn('Could not save workout advice state.', error)
    }
  }

  async function handleUnlockWorkout(checklistItems) {
    if (!todayWorkout?.video) return

    const nextChecks = checklistItems.reduce((accumulator, item) => {
      accumulator[item.id] = true
      return accumulator
    }, {})

    setPlayerOpen(true)

    try {
      await dashboard.actions.saveVideoState(todayKey, {
        adviceChecks: nextChecks,
        readyConfirmed: true,
        expanded: true,
        opened: true,
        lastOpenedOn: todayKey,
        workoutName: todayWorkout.name,
      })
      setToast('Your workout is unlocked. Go crush it.')
    } catch (error) {
      setToast(error.message || 'Could not unlock the workout yet.')
    }
  }

  async function handleSelectRestOption(optionId) {
    setSaving((current) => ({ ...current, rest: true }))
    try {
      await dashboard.actions.saveVideoState(todayKey, {
        restOptionId: optionId,
        workoutName: todayWorkout?.name ?? null,
      })
      setToast('Recovery plan saved.')
    } catch (error) {
      setToast(error.message || 'Could not save that recovery choice yet.')
    } finally {
      setSaving((current) => ({ ...current, rest: false }))
    }
  }

  async function handleSaveHeavyLift(log) {
    setSaving((current) => ({ ...current, rest: true }))
    try {
      await dashboard.actions.saveVideoState(todayKey, {
        restOptionId: 'heavy',
        heavyLiftLog: log,
        workoutName: todayWorkout?.name ?? null,
      })
      setToast('Heavy lift note saved.')
    } catch (error) {
      setToast(error.message || 'Could not save the heavy lift note.')
    } finally {
      setSaving((current) => ({ ...current, rest: false }))
    }
  }

  async function handleResetApp() {
    setSaving((current) => ({ ...current, reset: true }))
    try {
      await dashboard.actions.resetAllData()
      setSelectedDay(actualTodayDay)
      setToast('Jamie got a fresh start.')
    } catch (error) {
      setToast(error.message || 'Could not reset the app yet.')
    } finally {
      setSaving((current) => ({ ...current, reset: false }))
    }
  }

  async function handleTruthReaction(card, reaction) {
    const truthId = getPerspectiveCardId(card)
    const nextTruthReactions = {
      ...(dashboard.coachMemory?.truthReactions || {}),
      [truthId]: {
        category: card.category,
        id: truthId,
        reactedOn: todayKey,
        reaction,
        title: card.title,
      },
    }

    try {
      await dashboard.actions.saveCoachMemory({
        latestTruthReaction: reaction,
        latestTruthReactionTitle: card.title,
        truthReactions: nextTruthReactions,
      })
      setToast(
        reaction === 'liked'
          ? 'Coach Kitty saved that one.'
          : 'Okay. Coach Kitty will handle that one gently.',
      )
    } catch (error) {
      setToast(error.message || 'Could not save that truth reaction yet.')
    }
  }

  async function handleSendCoachMessage() {
    const prompt = coachDraft.trim()
    if (!prompt) return
    setCoachDraft('')
    setCoachSending(true)

    try {
      await dashboard.actions.addCoachMessage({
        role: 'user',
        content: prompt,
        source: 'coach-kitty',
      })
      await dashboard.actions.saveCoachMemory({
        latestCoachAnswer: dashboard.coachMemory?.latestCoachQuestion ? prompt : null,
        latestShare: prompt,
      })

      const response = await fetch('/api/coach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...coachMessages, { role: 'user', content: prompt }].slice(-12),
          context: {
            displayName: dashboard.settings?.displayName || USER_NAME,
            day: todayDay,
            workoutName: todayWorkout?.name ?? '',
            phaseName: currentPhaseName,
            nextStep: buildNextStep({
              trackingLoggedToday,
              workout: todayWorkout,
              workoutComplete,
            }),
            workoutComplete,
            trackingLoggedToday,
            measurementsDue,
            inbodyDue,
            goal: currentGoal,
            workoutStreak: completedWorkouts.length,
            hydrationStreak: hydrationWins,
            memorySummary: coachMemorySummary,
            recentGoals: dashboard.goals.slice(0, 4).map((entry) => entry.text),
            recentMindsetNotes,
            likedTruths,
            sensitiveTruths,
            latestMindsetTitle:
              dashboard.coachMemory?.latestMindsetTitle || todayTrackingEntry?.mindsetTitle || '',
            latestMindsetLog:
              dashboard.coachMemory?.latestMindsetLog || todayTrackingEntry?.mindsetLog || '',
          },
        }),
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok || !payload?.reply) {
        throw new Error(payload?.error || 'Coach is not ready yet.')
      }

      await dashboard.actions.addCoachMessage({
        role: 'assistant',
        content: payload.reply,
        source: 'coach-kitty',
      })
      await dashboard.actions.saveCoachMemory({
        latestShare: prompt,
        latestCoachQuestion: extractFollowUpQuestion(payload.reply),
        latestCoachReply: payload.reply,
        latestGoal: currentGoal || dashboard.coachMemory?.latestGoal || null,
      })
    } catch {
      const fallbackReply = buildCoachFallbackReply({
        coachMemorySummary,
        currentGoal,
        inbodyDue,
        measurementsDue,
        prompt,
        trackingLoggedToday,
        workout: todayWorkout,
        workoutComplete,
      })
      await dashboard.actions.addCoachMessage({
        role: 'assistant',
        content: fallbackReply,
        source: 'coach-kitty',
      })
      await dashboard.actions.saveCoachMemory({
        latestShare: prompt,
        latestCoachReply: fallbackReply,
      })
      setToast('Coach answered in backup mode.')
    } finally {
      setCoachSending(false)
    }
  }

  return (
    <div className="relative flex min-h-screen min-h-[100svh] w-full justify-center overflow-hidden">
      <div className={clsx('app-shell', completionShakeClass)}>
        <div className="tab-scroll-area no-scrollbar" ref={tabScrollRef}>
          {activeTab === 'workout' && (
            <WorkoutView
              adviceChecks={adviceChecks}
              actualTodayDay={actualTodayDay}
              completedWorkoutKeys={completedWorkoutKeys}
              currentPhaseName={currentPhaseName}
              latestHeavyRestRecord={latestHeavyRestRecord}
              currentWeek={currentWeek}
              currentVideoState={todayVideoState}
              day={todayDay}
              onAdviceCheck={handleAdviceCheck}
              onEditSelectedDay={() => handleTabChange('tracking')}
              onPlayerOpenChange={handlePlayerOpenChange}
              onResetToToday={() => setSelectedDay(actualTodayDay)}
            onSaveHeavyLift={handleSaveHeavyLift}
            onSelectDay={setSelectedDay}
            onSelectRestOption={handleSelectRestOption}
            onMarkWorkout={handleWorkoutComplete}
            onUnlockWorkout={handleUnlockWorkout}
            playerOpen={playerOpen}
            saving={saving}
            selectedDay={selectedDay}
            todayKey={todayKey}
            workout={todayWorkout}
            workoutComplete={workoutComplete}
            workoutCount={completedWorkouts.length}
            workoutRecordedAtLabel={workoutRecordedAtLabel}
            workoutReady={workoutReady}
            workoutSyncing={workoutSyncing}
            viewingToday={selectedDay === actualTodayDay}
          />
        )}

          {activeTab === 'tracking' && (
            <TrackingView
              inbodyDraft={inbodyDraft}
              inbodyDue={inbodyDue}
              latestMeasurement={latestMeasurement}
              latestScan={latestScan}
              measurementDraft={measurementDraft}
              measurementsDue={measurementsDue}
              onChangeInbody={setInbodyDraft}
              onChangeMeasurements={setMeasurementDraft}
              onChangeTracking={setTrackingDraft}
              onMarkWorkout={handleWorkoutComplete}
              onSaveInbody={handleSaveInBody}
              onSaveMeasurements={handleSaveMeasurements}
              onSaveHydration={handleSaveHydration}
              onSaveDeficit={handleSaveDeficit}
              saving={saving}
              selectedDay={selectedDay}
              trackingDraft={trackingDraft}
              workout={todayWorkout}
              workoutComplete={workoutComplete}
              workoutRecordedAtLabel={workoutRecordedAtLabel}
              workoutSyncing={workoutSyncing}
              viewingToday={selectedDay === actualTodayDay}
            />
          )}

          {activeTab === 'goals' && (
            <MotivationView
              coachDraft={coachDraft}
              coachMessages={coachMessages}
              coachSending={coachSending}
              coachSummary={coachMemorySummary}
              onChangeTracking={setTrackingDraft}
              onCoachDraftChange={setCoachDraft}
              onSaveMindset={handleSaveMindset}
              onSendCoachMessage={handleSendCoachMessage}
              onTruthReact={handleTruthReaction}
              supportSaving={saving}
              currentDay={todayDay}
              trackingDraft={trackingDraft}
              truthReactions={truthReactions}
            />
          )}

          {activeTab === 'data' && (
            <ProgressWallView
              goals={dashboard.goals}
              newGoal={newGoal}
              onAddGoal={handleAddGoal}
              onChangeGoal={setNewGoal}
              onResetApp={handleResetApp}
              saving={saving}
              settings={dashboard.settings}
            />
          )}
        </div>
      </div>

      <div className="floating-dock">
        <NavButton
          icon={<Home size={20} />}
          isActive={activeTab === 'workout'}
          label="Workout"
          onClick={() => handleTabChange('workout')}
        />
        <NavButton
          icon={<Activity size={20} />}
          isActive={activeTab === 'tracking'}
          label="Tracking"
          onClick={() => handleTabChange('tracking')}
        />
        <NavButton
          icon={<Heart size={20} />}
          isActive={activeTab === 'goals'}
          label="Motivation"
          onClick={() => handleTabChange('goals')}
        />
        <NavButton
          icon={<Target size={20} />}
          isActive={activeTab === 'data'}
          label="Wall"
          onClick={() => handleTabChange('data')}
        />
      </div>

      <div
        className={clsx(
          'pointer-events-none fixed left-1/2 top-[max(16px,env(safe-area-inset-top))] z-40 -translate-x-1/2 rounded-full border border-white/8 bg-ink-900/92 px-4 py-2 text-sm font-extrabold text-white shadow-soft transition',
          toast ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0',
        )}
      >
        {toast}
      </div>

      {showUpdateNote ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/48 p-3 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur-sm">
          <div className="w-full max-w-[430px] rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03)),rgba(18,10,20,0.96)] p-5 shadow-[0_28px_70px_rgba(0,0,0,0.38)]">
            <div className="micro-label text-blush-100">Small update</div>
            <h2 className="display-copy mt-3 text-[1.8rem] leading-[0.94] text-white">
              {APP_UPDATE_NOTE.title}
            </h2>
            <p className="mt-3 text-[14px] leading-7 text-white/74">
              {APP_UPDATE_NOTE.body}
            </p>

            <div className="mt-4 grid gap-3">
              {APP_UPDATE_NOTE.points.map((point) => (
                <div
                  className="rounded-[20px] border border-white/8 bg-white/[0.04] px-4 py-3 text-[13px] leading-6 text-white/80"
                  key={point}
                >
                  {point}
                </div>
              ))}
            </div>

            <button className="primary-button mt-5" onClick={handleDismissUpdateNote} type="button">
              Got it
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function WorkoutView({
  adviceChecks,
  actualTodayDay,
  completedWorkoutKeys,
  currentPhaseName,
  latestHeavyRestRecord,
  currentWeek,
  currentVideoState,
  day,
  onAdviceCheck,
  onEditSelectedDay,
  onMarkWorkout,
  onPlayerOpenChange,
  onResetToToday,
  onSaveHeavyLift,
  onSelectDay,
  onSelectRestOption,
  onUnlockWorkout,
  playerOpen,
  saving,
  selectedDay,
  todayKey,
  workout,
  workoutCount,
  workoutComplete,
  workoutRecordedAtLabel,
  workoutReady,
  workoutSyncing,
  viewingToday,
}) {
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [heavyDraftState, setHeavyDraftState] = useState(() => ({
    sourceDayKey: todayKey,
    draft: buildHeavyDraft(currentVideoState?.heavyLiftLog),
  }))
  const completedWorkoutSet = useMemo(
    () => new Set(completedWorkoutKeys || []),
    [completedWorkoutKeys],
  )
  const selectedDayWorkout = getWorkoutForDay(selectedDay)
  const selectedDayDateKey = getLocalDateKey(getProgramDateForDay(selectedDay))
  const selectedRestOption = getRestOptionById(currentVideoState?.restOptionId)
  const heavyDraft =
    heavyDraftState.sourceDayKey === todayKey
      ? heavyDraftState.draft
      : buildHeavyDraft(currentVideoState?.heavyLiftLog)
  const updateHeavyDraft = (updater) => {
    setHeavyDraftState((current) => ({
      sourceDayKey: todayKey,
      draft:
        typeof updater === 'function'
          ? updater(current.sourceDayKey === todayKey ? current.draft : heavyDraft)
          : updater,
    }))
  }
  const calendarCells = useMemo(() => {
    const leadingBlankCount = getProgramDateForDay(1).getDay()
    const blankCells = Array.from({ length: leadingBlankCount }, (_, index) => ({
      id: `blank-${index}`,
      type: 'blank',
    }))
    const dayCells = Array.from({ length: TOTAL_DAYS }, (_, index) => {
      const mapDay = index + 1
      const mapWorkout = getWorkoutForDay(mapDay)
      const mapDateKey = getLocalDateKey(getProgramDateForDay(mapDay))

      return {
        id: `day-${mapDay}`,
        type: 'day',
        day: mapDay,
        isCompleted: completedWorkoutSet.has(mapDateKey),
        isRest: mapWorkout.type === 'rest',
        isSelected: mapDay === selectedDay,
        isToday: mapDay === actualTodayDay,
        workout: mapWorkout,
      }
    })

    return [...blankCells, ...dayCells]
  }, [actualTodayDay, completedWorkoutSet, selectedDay])

  if (!day || !workout) {
    return (
      <section className="surface">
        <div className="micro-label">Almost time</div>
        <h2 className="display-copy mt-3 text-[1.9rem] leading-[0.95] text-white">
          You start on {PROGRAM_START}.
        </h2>
        <p className="section-copy">
          When day one gets here, your workout, your check-ins, and your encouragement
          will all be waiting here for you.
        </p>
      </section>
    )
  }

  const focusRows = getWorkoutFocusRows(workout.type)
  const overloadSummary = getOverloadSummary(getPhaseForDay(day), currentWeek, workout.type)
  const setupCue = getSetupCue(workout, currentWeek)
  const checklistItems = getWorkoutReadyChecklist({
    overloadSummary,
    setupCue,
    type: workout.type,
  })
  const allAdviceChecked = checklistItems.every((item) => adviceChecks?.[item.id])
  const playerSubtitle = buildWorkoutPlayerSubtitle({
    currentVideoState,
    workout,
    workoutComplete,
  })
  const playerStatus = workoutComplete
    ? workoutSyncing
      ? 'Syncing'
      : 'Recorded'
    : currentVideoState?.opened
      ? 'Open'
      : 'Ready'
  const completionTitle = workout?.type === 'rest' ? 'Recovery recorded' : 'Workout recorded'
  const completionCopy = workoutSyncing
    ? 'Hold on a second while your check-in finishes syncing.'
    : workoutRecordedAtLabel
      ? `${completionTitle} ${workoutRecordedAtLabel}.`
      : `${completionTitle}.`

  return (
    <div className="grid gap-4">
      <section className="surface">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="micro-label">For you today</div>
            <h2 className="display-copy mt-3 text-[1.9rem] leading-[0.96] text-white">
              {workout.name}
            </h2>
            <p className="mt-3 text-[14px] leading-7 text-white/72">
              {formatLongDate(todayKey)}.{' '}
              {workout.type === 'rest'
                ? 'No XS video today. Pick a recovery path and let it count.'
                : 'Press play and make the session fit your body.'}
            </p>
          </div>
          <span className="ghost-chip">
            {workoutComplete ? (workoutSyncing ? 'Syncing' : 'Recorded') : 'Ready'}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="ghost-chip">
            {workout.duration === '-' ? 'Recovery' : `${workout.duration} min`}
          </span>
          <span className="ghost-chip">{workout.equipment}</span>
          <span className="ghost-chip">Week {currentWeek}</span>
          <span className="ghost-chip">{currentPhaseName}</span>
          <span className="ghost-chip">
            {workoutCount} / {TOTAL_DAYS} recorded
          </span>
          {!viewingToday ? <span className="ghost-chip">Editing past day</span> : null}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/42">
            {viewingToday ? 'Tap the map to edit any day.' : `Editing Day ${selectedDay} right now.`}
          </span>
          {!viewingToday ? (
            <button
              className="text-[12px] font-extrabold text-blush-100 transition hover:text-white"
              onClick={onResetToToday}
              type="button"
            >
              Back to today
            </button>
          ) : null}
        </div>

        <div className="mt-3">
          <button
            className="secondary-button"
            onClick={() => setCalendarOpen((current) => !current)}
            type="button"
          >
            {calendarOpen ? 'Hide the 90-day map' : 'See the whole 90-day map'}
          </button>
        </div>
      </section>

      {(saving.workout || workoutComplete) ? (
        <section className="surface border-mint-300/16 bg-[linear-gradient(180deg,rgba(105,201,148,0.12),rgba(255,255,255,0.03)),rgba(12,20,17,0.86)]">
          <div className="flex items-start gap-3">
            <div className="rounded-full border border-mint-300/20 bg-mint-300/[0.14] p-2.5 text-mint-300">
              <CheckCircle2 size={18} />
            </div>
            <div className="min-w-0">
              <div className="micro-label text-mint-300">
                {saving.workout ? 'Recording now' : workoutSyncing ? 'Syncing now' : 'Recorded'}
              </div>
              <h3 className="mt-3 text-lg font-extrabold text-white">
                {saving.workout ? 'Locking this day in.' : completionTitle}
              </h3>
              <p className="mt-2 text-[13px] leading-6 text-white/72">
                {saving.workout
                  ? 'Your check-in is being saved right now.'
                  : completionCopy}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {calendarOpen ? (
        <section className="surface">
          <SectionHeader
            copy="Tap any day. The app switches into that day so you can review or fix it fast."
            kicker="The full burn"
            title="All 90 days"
          />

          <div className="mt-5 rounded-[24px] border border-white/8 bg-black/14 p-3">
            <div className="grid grid-cols-7 gap-1.5">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label) => (
                <div
                  className="pb-1 text-center text-[10px] font-extrabold uppercase tracking-[0.16em] text-white/34"
                  key={label}
                >
                  {label}
                </div>
              ))}
              {calendarCells.map((cell) =>
                cell.type === 'blank' ? (
                  <div className="h-[48px] rounded-[16px]" key={cell.id} />
                ) : (
                  <button
                    className={clsx(
                      'calendar-day-chip',
                      cell.isRest && 'calendar-day-rest',
                      cell.isToday && 'calendar-day-today',
                      cell.isSelected && 'calendar-day-selected',
                      cell.isCompleted && 'calendar-day-complete',
                    )}
                    key={cell.id}
                    onClick={() => onSelectDay(cell.day)}
                    style={{ '--crush-tilt': `${((cell.day % 5) - 2) * 1.25}deg` }}
                    type="button"
                  >
                    <span className="calendar-day-number">{cell.day}</span>
                    <span
                      className={clsx(
                        'calendar-day-dot',
                        cell.isRest ? 'calendar-day-dot-rest' : 'calendar-day-dot-work',
                      )}
                    />
                    {cell.isCompleted ? (
                      <CheckCircle2 className="absolute right-1.5 top-1.5 text-mint-300" size={12} />
                    ) : null}
                  </button>
                ),
              )}
            </div>
          </div>

          <div className="mt-4 rounded-[24px] border border-white/8 bg-white/[0.04] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="micro-label">{formatCompactDate(selectedDayDateKey)}</div>
                <h4 className="mt-3 text-lg font-extrabold text-white">
                  Day {selectedDay}: {selectedDayWorkout.name}
                </h4>
                <p className="mt-2 text-[13px] leading-6 text-white/68">
                  {getWorkoutSummary(selectedDayWorkout)}
                </p>
              </div>
              <span className="ghost-chip">
                {selectedDayWorkout.type === 'rest'
                  ? 'Recovery'
                  : selectedDayWorkout.duration === '-'
                    ? 'Recovery'
                    : `${selectedDayWorkout.duration} min`}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="ghost-chip">{selectedDayWorkout.equipment}</span>
              <span className="ghost-chip">
                {getPhaseName(getPhaseForDay(selectedDay))}
              </span>
              {selectedDay === actualTodayDay ? <span className="ghost-chip">Today</span> : null}
              {completedWorkoutSet.has(selectedDayDateKey) ? (
                <span className="ghost-chip">Recorded</span>
              ) : null}
            </div>

            <button
              className="secondary-button mt-4"
              onClick={onEditSelectedDay}
              type="button"
            >
              {selectedDay === actualTodayDay
                ? 'Open today in tracking'
                : `Edit Day ${selectedDay} in tracking`}
            </button>
          </div>
        </section>
      ) : null}

      <section className="surface">
        <SectionHeader
          copy={
            workout.type === 'rest'
              ? 'Pick the recovery path that actually fits today.'
              : workoutReady
                ? 'You unlocked the workout. Keep these cues in mind.'
                : 'Read each point, check it off, then unlock the workout.'
          }
          kicker="Read this first"
          title={workout.type === 'rest' ? "Today's plan" : 'Daily advice'}
        />

        {workout.type === 'rest' ? (
          <div className="mt-5 grid gap-4">
            <div className="grid gap-3">
              {REST_DAY_OPTIONS.map((option) => {
                const selected = selectedRestOption?.id === option.id

                return (
                  <button
                    className={clsx(
                      'rounded-[22px] border p-4 text-left transition',
                      selected
                        ? 'border-blush-300/24 bg-blush-300/[0.12]'
                        : 'border-white/8 bg-white/[0.03]',
                    )}
                    key={option.id}
                    onClick={() => onSelectRestOption(option.id)}
                    type="button"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="micro-label text-blush-100">{option.badge}</div>
                        <div className="mt-2 text-sm font-bold text-white">{option.title}</div>
                        <div className="mt-2 text-[13px] leading-6 text-white/68">
                          {option.summary}
                        </div>
                        <div className="mt-2 text-[12px] leading-6 text-white/52">
                          {option.detail}
                        </div>
                      </div>
                      <span className="ghost-chip">{selected ? 'Picked' : 'Choose'}</span>
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="rounded-[22px] border border-white/8 bg-white/[0.04] p-4">
              <div className="micro-label">Recovery timer</div>
              <h4 className="mt-3 text-lg font-extrabold text-white">
                {selectedRestOption.title}
              </h4>
              <p className="mt-2 text-[13px] leading-6 text-white/68">
                {selectedRestOption.summary}
              </p>

              <RestDayTimer key={selectedRestOption.id} option={selectedRestOption} />

              {selectedRestOption.id === 'heavy' ? (
                <div className="mt-5 grid gap-4">
                  {latestHeavyRestRecord ? (
                    <div className="rounded-[18px] border border-gold-300/14 bg-gold-300/[0.08] p-4 text-[13px] leading-6 text-white/74">
                      Last time: {latestHeavyRestRecord.exercise || 'Lift'} ·{' '}
                      {latestHeavyRestRecord.weight || '—'} lb ·{' '}
                      {latestHeavyRestRecord.sets || '3'} x {latestHeavyRestRecord.reps || '5'}
                    </div>
                  ) : null}

                  <div className="grid grid-cols-2 gap-3">
                    <TextEntryField
                      label="Lift"
                      onChange={(value) =>
                        updateHeavyDraft((current) => ({ ...current, exercise: value }))
                      }
                      placeholder="Squat"
                      value={heavyDraft.exercise}
                    />
                    <TextEntryField
                      label="Partner"
                      onChange={(value) =>
                        updateHeavyDraft((current) => ({ ...current, partner: value }))
                      }
                      placeholder="Mike or Gary"
                      value={heavyDraft.partner}
                    />
                    <TextEntryField
                      label="Weight"
                      onChange={(value) =>
                        updateHeavyDraft((current) => ({ ...current, weight: value }))
                      }
                      placeholder="95"
                      value={heavyDraft.weight}
                    />
                    <TextEntryField
                      label="Sets x Reps"
                      onChange={(value) =>
                        updateHeavyDraft((current) => ({ ...current, scheme: value }))
                      }
                      placeholder="3 x 5"
                      value={heavyDraft.scheme}
                    />
                  </div>

                  <button
                    className="primary-button"
                    disabled={saving.rest}
                    onClick={() => onSaveHeavyLift(normalizeHeavyDraft(heavyDraft))}
                    type="button"
                  >
                    {saving.rest ? 'Saving...' : 'Save heavy lift note'}
                  </button>
                </div>
              ) : null}
            </div>

            <div className="rounded-[22px] border border-white/8 bg-white/[0.04] p-4">
              <div className="micro-label">Still useful today</div>
              <div className="mt-4 space-y-3">
                {focusRows.map((row) => (
                  <FocusRow key={`${row.title}-${row.meta}`} row={row} />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-5 rounded-[22px] border border-white/8 bg-white/[0.04] p-4">
            <div className="micro-label">Check each point before you start</div>
            <div className="mt-4 space-y-3">
              {checklistItems.map((item) => (
                <label
                  className={clsx(
                    'flex gap-3 rounded-[20px] border p-4 transition',
                    adviceChecks?.[item.id]
                      ? 'border-mint-400/18 bg-mint-400/[0.08]'
                      : 'border-white/8 bg-white/[0.03]',
                  )}
                  key={item.id}
                >
                  <input
                    checked={Boolean(adviceChecks?.[item.id])}
                    className="mt-1 h-5 w-5 accent-[#8ef0c2]"
                    onChange={(event) => onAdviceCheck(item.id, event.target.checked)}
                    type="checkbox"
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-white">{item.title}</div>
                    <div className="mt-2 text-[13px] leading-6 text-white/68">
                      {item.detail}
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <button
              className={clsx(
                'mt-4',
                allAdviceChecked ? 'primary-button' : 'warning-button',
              )}
              disabled={!allAdviceChecked}
              onClick={() => onUnlockWorkout(checklistItems)}
              type="button"
            >
              {workoutReady
                ? "I'm ready to crush this workout now!"
                : allAdviceChecked
                  ? "I'm ready to crush this workout now!"
                  : 'Check every point first'}
            </button>
          </div>
        )}

      </section>

      {workout.type !== 'rest' && workoutReady ? (
        <WorkoutPlayer
          badge="Unlocked"
          defaultOpen={true}
          helper="Use the trainer as a guide, not a test."
          isOpen={playerOpen}
          onOpenChange={onPlayerOpenChange}
          status={playerStatus}
          subtitle={playerSubtitle}
          title={workout.name}
          videoUrl={workout.video}
        />
      ) : null}

      <section className="surface">
        <SectionHeader
          copy={
            workoutComplete
              ? workoutSyncing
                ? 'Your day is saved locally and finishing its sync.'
                : 'This day is already locked in.'
              : 'When you finish, record the day here so the app counts it.'
          }
          kicker="Record the day"
          title={workout?.type === 'rest' ? 'Close the recovery day' : 'Close the workout day'}
        />

        <button
          className={clsx('mt-5', workoutComplete ? 'good-button' : 'primary-button')}
          disabled={saving.workout || workoutComplete}
          onClick={onMarkWorkout}
          type="button"
        >
          {saving.workout
            ? 'Recording now...'
            : workoutComplete
              ? workoutSyncing
                ? 'Recorded. Syncing now...'
                : 'Recorded'
              : viewingToday
                ? workout?.type === 'rest'
                  ? 'Record this recovery day'
                  : 'Record this workout day'
                : `Record Day ${selectedDay}`}
        </button>

        {workoutComplete && workoutRecordedAtLabel ? (
          <p className="mt-3 text-center text-[12px] leading-6 text-white/56">
            {completionTitle} {workoutRecordedAtLabel}.
          </p>
        ) : null}
      </section>
    </div>
  )
}

function TrackingView({
  inbodyDraft,
  inbodyDue,
  latestMeasurement,
  latestScan,
  measurementDraft,
  measurementsDue,
  onChangeInbody,
  onChangeMeasurements,
  onChangeTracking,
  onMarkWorkout,
  onSaveInbody,
  onSaveMeasurements,
  onSaveDeficit,
  onSaveHydration,
  selectedDay,
  saving,
  trackingDraft,
  workout,
  workoutComplete,
  workoutRecordedAtLabel,
  workoutSyncing,
  viewingToday,
}) {
  const todayHydration = trackingDraft.hydrationTargetMet

  return (
    <div className="grid gap-4">
      <section className="surface">
        <SectionHeader
          copy={
            viewingToday
              ? 'Log today and move on.'
              : `You are editing Day ${selectedDay}. Make the correction you need and move on.`
          }
          kicker="Your closeout"
          title={viewingToday ? 'Tonight' : `Day ${selectedDay}`}
        />

        <div className="mt-5 grid grid-cols-3 gap-2">
          <MiniStatus
            label="Workout"
            tone={workoutComplete ? 'good' : 'neutral'}
            value={workoutComplete ? (workoutSyncing ? 'Syncing' : 'Recorded') : 'Open'}
          />
          <MiniStatus
            label="Calories"
            tone={
              trackingDraft.caloricDeficit === '' ? 'neutral' : 'good'
            }
            value={trackingDraft.caloricDeficit === '' ? 'Open' : 'Saved'}
          />
          <MiniStatus
            label="Water"
            tone={todayHydration === true ? 'good' : todayHydration === false ? 'warning' : 'neutral'}
            value={
              todayHydration === true ? 'Win' : todayHydration === false ? 'Miss' : 'Not set'
            }
          />
        </div>
      </section>

      <TrackingCard
        accent="from-[#ff8fc8]/16 via-[#8bdcff]/10 to-[#c6b3ff]/10"
        description="Workout, calories, and water. That's it."
        icon={<Sparkles className="text-gold-300" size={18} />}
        title="Your check-in"
      >
        <div className="grid gap-4">
          {(saving.workout || workoutComplete) ? (
            <div className="rounded-[24px] border border-mint-300/16 bg-mint-300/[0.12] p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-full border border-mint-300/20 bg-mint-300/[0.14] p-2.5 text-mint-300">
                  <CheckCircle2 size={18} />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-mint-200">
                    {saving.workout ? 'Recording now' : workoutSyncing ? 'Syncing now' : 'Recorded'}
                  </div>
                  <p className="mt-2 text-[14px] leading-6 text-white/80">
                    {saving.workout
                      ? 'Your day is being recorded right now.'
                      : workout?.type === 'rest'
                        ? 'Recovery recorded.'
                        : 'Workout recorded.'}{' '}
                    {workoutRecordedAtLabel ? workoutRecordedAtLabel : ''}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="rounded-[24px] border border-mint-300/12 bg-mint-300/[0.08] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-mint-200">
                  Record the day
                </div>
                <p className="mt-2 text-[13px] leading-6 text-white/70">
                  {workoutComplete
                    ? 'This day is already locked in.'
                    : workout?.type === 'rest'
                      ? 'Tap this once your recovery work is done.'
                      : 'Tap this once the workout is done.'}
                </p>
              </div>
              <CheckCircle2 className="text-mint-200" size={18} />
            </div>
            <button
              className={clsx('mt-4', workoutComplete ? 'good-button' : 'cream-button')}
              disabled={saving.workout || workoutComplete}
              onClick={onMarkWorkout}
              type="button"
            >
              {workoutComplete
                ? workoutSyncing
                  ? 'Recorded. Syncing now...'
                  : workout?.type === 'rest'
                    ? 'Recovery recorded'
                    : 'Workout recorded'
                : saving.workout
                  ? 'Recording now...'
                  : viewingToday
                    ? workout?.type === 'rest'
                      ? 'Record this recovery day'
                      : 'Record this workout day'
                    : `Record Day ${selectedDay}`}
            </button>
          </div>

          <div className="rounded-[24px] border border-blush-300/12 bg-blush-300/[0.08] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-blush-200">
                  Calories
                </div>
                <p className="mt-2 text-[13px] leading-6 text-white/70">
                  Log the real number. That's enough.
                </p>
              </div>
              <Flame className="text-blush-200" size={18} />
            </div>
            <div className="mt-4 flex gap-3">
              <input
                className="field-shell"
                onChange={(event) =>
                  onChangeTracking((current) => ({
                    ...current,
                    caloricDeficit: event.target.value,
                  }))
                }
                placeholder="Today&apos;s deficit"
                type="number"
                value={trackingDraft.caloricDeficit}
              />
              <button className="primary-button w-auto px-5" onClick={onSaveDeficit} type="button">
                {saving.deficit ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>

          <div className="rounded-[24px] border border-sky-300/12 bg-sky-300/[0.08] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-sky-200">
                  Water
                </div>
                <p className="mt-2 text-[13px] leading-6 text-white/70">
                  Just a yes or no.
                </p>
              </div>
              <Droplets className="text-sky-200" size={18} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                className={clsx(
                  'secondary-button',
                  trackingDraft.hydrationTargetMet === true &&
                    'border-sky-300/24 bg-sky-300/14 text-sky-100',
                )}
                disabled={saving.hydration}
                onClick={() => onSaveHydration(true)}
                type="button"
              >
                Yes
              </button>
              <button
                className={clsx(
                  'secondary-button',
                  trackingDraft.hydrationTargetMet === false &&
                    'border-white/12 bg-white/10 text-white',
                )}
                disabled={saving.hydration}
                onClick={() => onSaveHydration(false)}
                type="button"
              >
                Not today
              </button>
            </div>
          </div>
        </div>
      </TrackingCard>

      <TrackingCard
        accent="from-[#8ef0c2]/14 via-[#ffe08a]/10 to-[#ff9dcc]/10"
        description="Tape and scan live here too."
        icon={<BarChart2 className="text-mint-200" size={18} />}
        title="Measurements"
      >
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-2">
            <MiniStatus
              label="Waist"
              tone={
                latestMeasurement?.waist !== null &&
                typeof latestMeasurement?.waist !== 'undefined'
                  ? 'good'
                  : 'neutral'
              }
              value={formatMetricValue(latestMeasurement?.waist, 'in')}
            />
            <MiniStatus
              label="PBF"
              tone={
                latestScan?.pbf !== null && typeof latestScan?.pbf !== 'undefined'
                  ? 'good'
                  : 'neutral'
              }
              value={formatMetricValue(latestScan?.pbf, '%')}
            />
            <MiniStatus
              label="Measurements"
              tone={measurementsDue ? 'warning' : 'good'}
              value={measurementsDue ? 'Due' : 'Current'}
            />
            <MiniStatus
              label="Scan"
              tone={inbodyDue ? 'warning' : 'good'}
              value={inbodyDue ? 'Due' : 'Current'}
            />
          </div>

          {(measurementsDue || inbodyDue) && (
            <div className="rounded-[22px] border border-white/8 bg-white/[0.04] p-4 text-[13px] leading-6 text-white/64">
              {measurementsDue && 'Your measurements are due again. '}
              {inbodyDue && 'Your scan data is due again. '}
              Add what you have.
            </div>
          )}

          <div className="rounded-[24px] border border-mint-300/12 bg-mint-300/[0.08] p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-mint-200">
                  Measurements
                </div>
                <p className="mt-2 text-[13px] leading-6 text-white/70">
                  Keep the tape honest and simple.
                </p>
              </div>
              <span className="ghost-chip">{measurementsDue ? 'Due now' : 'Current'}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <MeasurementInput
                label="Chest"
                onChange={(value) =>
                  onChangeMeasurements((current) => ({ ...current, chest: value }))
                }
                value={measurementDraft.chest}
              />
              <MeasurementInput
                label="Waist (Navel)"
                onChange={(value) =>
                  onChangeMeasurements((current) => ({ ...current, waist: value }))
                }
                value={measurementDraft.waist}
              />
              <MeasurementInput
                label="Hips (Widest)"
                onChange={(value) =>
                  onChangeMeasurements((current) => ({ ...current, hips: value }))
                }
                value={measurementDraft.hips}
              />
              <MeasurementInput
                label="R. Thigh"
                onChange={(value) =>
                  onChangeMeasurements((current) => ({ ...current, rThigh: value }))
                }
                value={measurementDraft.rThigh}
              />
              <MeasurementInput
                label="R. Bicep"
                onChange={(value) =>
                  onChangeMeasurements((current) => ({ ...current, rBicep: value }))
                }
                value={measurementDraft.rBicep}
              />
            </div>

            <button className="cream-button mt-4" onClick={onSaveMeasurements} type="button">
              {saving.measurement ? 'Saving...' : 'Save measurements'}
            </button>
          </div>

          <div className="rounded-[24px] border border-gold-300/12 bg-gold-300/[0.08] p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-gold-300">
                  InBody scan
                </div>
                <p className="mt-2 text-[13px] leading-6 text-white/70">
                  Let this inform you, not scare you.
                </p>
              </div>
              <span className="ghost-chip">{inbodyDue ? 'Due now' : 'Current'}</span>
            </div>

            <div className="space-y-4">
              <InBodyInput
                hint="The actual weight of your muscle."
                label="Skeletal Muscle Mass (SMM)"
                onChange={(value) =>
                  onChangeInbody((current) => ({ ...current, smm: value }))
                }
                value={inbodyDraft.smm}
              />
              <InBodyInput
                hint="The truest read on your fat-loss trend."
                label="Percent Body Fat (PBF)"
                onChange={(value) =>
                  onChangeInbody((current) => ({ ...current, pbf: value }))
                }
                value={inbodyDraft.pbf}
              />
              <InBodyInput
                hint="Estimated calories burned at rest."
                label="Basal Metabolic Rate (BMR)"
                onChange={(value) =>
                  onChangeInbody((current) => ({ ...current, bmr: value }))
                }
                value={inbodyDraft.bmr}
              />
            </div>

            <button className="primary-button mt-4" onClick={onSaveInbody} type="button">
              {saving.inbody ? 'Saving...' : 'Save scan numbers'}
            </button>
          </div>
        </div>
      </TrackingCard>
    </div>
  )
}

function MotivationView({
  coachDraft,
  coachMessages,
  coachSending,
  coachSummary,
  onChangeTracking,
  onCoachDraftChange,
  onSaveMindset,
  onSendCoachMessage,
  onTruthReact,
  supportSaving,
  currentDay,
  trackingDraft,
  truthReactions,
}) {
  return (
    <div className="grid gap-4">
      <section className="surface overflow-hidden">
        <div className="relative overflow-hidden rounded-[26px] border border-white/10">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/coach-kitty-gym.jpeg')" }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,4,10,0.92),rgba(18,8,18,0.72)_44%,rgba(18,8,22,0.58)),linear-gradient(180deg,rgba(255,78,162,0.2),transparent_56%,rgba(0,0,0,0.22))]" />
          <div className="relative p-5">
            <div className="micro-label text-blush-100">Coach Kitty / Kuromi Squad</div>
            <h3 className="display-copy mt-3 max-w-[12ch] text-[2rem] leading-[0.92] text-white">
              Swipe when your brain starts lying.
            </h3>
            <p className="mt-3 max-w-[18rem] text-[13px] leading-6 text-white/76">
              Press and hold first. Swipe up if it hits. Swipe down if you are not ready
              for that truth yet.
            </p>
          </div>
        </div>

        <div className="no-scrollbar mt-4 grid auto-cols-[88%] grid-flow-col gap-3 overflow-x-auto pb-1">
          <CoachKittyPosterCard />
          {PERSPECTIVE_CARDS.map((card) => (
            <SwipeTruthCard
              card={card}
              key={getPerspectiveCardId(card)}
              onReact={(reaction) => onTruthReact(card, reaction)}
              reaction={truthReactions[getPerspectiveCardId(card)]?.reaction || null}
            />
          ))}
        </div>
      </section>

      <section className="surface">
        <SectionHeader
          copy="Say it straight. She remembers what lands, what stings, and how to meet you without bulldozing you."
          kicker="Coach Kitty"
          title="Gym floor talk"
        />

        <CoachSupportCard
          draft={coachDraft}
          memorySummary={coachSummary}
          messages={coachMessages}
          onDraftChange={onCoachDraftChange}
          onSend={onSendCoachMessage}
          sending={coachSending}
        />
      </section>

      <section className="surface">
        <SectionHeader
          copy="Write it before the night starts lying to you."
          kicker="Mindset note"
          title="The fuller story"
        />

        <div className="mt-5 rounded-[24px] border border-[#ff74b4]/14 bg-[linear-gradient(180deg,rgba(255,87,164,0.08),rgba(255,255,255,0.03)),rgba(15,10,17,0.82)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          <div className="text-sm text-white/48">
            Day {currentDay || 0} of {TOTAL_DAYS}:{' '}
            <input
              className="w-2/3 bg-transparent font-semibold text-white outline-none placeholder:text-white/30"
              onChange={(event) =>
                onChangeTracking((current) => ({
                  ...current,
                  mindsetTitle: event.target.value,
                }))
              }
              placeholder="Name the day"
              type="text"
              value={trackingDraft.mindsetTitle}
            />
          </div>
          <textarea
            className="mt-3 h-24 w-full resize-none bg-transparent text-[14px] leading-7 text-white/84 outline-none placeholder:text-white/30"
            onChange={(event) =>
              onChangeTracking((current) => ({
                ...current,
                mindsetLog: event.target.value,
              }))
            }
            placeholder="What felt hard? What helped? What does tomorrow's Jamie need to remember?"
            value={trackingDraft.mindsetLog}
          />
          <div className="mt-3 flex justify-end">
            <button className="primary-button w-auto px-4" onClick={onSaveMindset} type="button">
              {supportSaving.mindset ? 'Saving...' : 'Save this note'}
            </button>
          </div>
        </div>
      </section>

      <section className="surface-soft border border-white/8 bg-white/[0.035] p-3">
        <CalendarSupportCard calendarUrl="/Jamie_90_Day_Burn_Reminders.ics" />
      </section>
    </div>
  )
}

function ProgressWallView({
  goals,
  newGoal,
  onAddGoal,
  onChangeGoal,
  onResetApp,
  saving,
  settings,
}) {
  const wallName = settings?.displayName || USER_NAME
  const jamiePosts = goals
  const featuredPost = jamiePosts[0] || null
  const archivePosts = jamiePosts.slice(1, 9)

  return (
    <div className="grid gap-4">
      <section className="surface">
        <div className="chalk-frame">
          <div className="chalk-composer">
            <div className="micro-label text-blush-100">Promise wall</div>
            <h3 className="display-copy mt-3 max-w-[12ch] text-[1.9rem] leading-[0.94] text-white">
              Put one line where you can see it.
            </h3>
            <p className="mt-3 max-w-[18rem] text-[13px] leading-6 text-white/70">
              Keep it short. Make it real. Then let the wall hold you to it.
            </p>

            <div className="chalk-input-shell mt-5">
              <input
                className="chalk-input"
                onChange={(event) => onChangeGoal(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') onAddGoal()
                }}
                placeholder="I keep promises to myself."
                type="text"
                value={newGoal}
              />
            </div>

            {newGoal.trim() ? (
              <div className="chalk-preview-card mt-4">
                <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#f7dbe5]/52">
                  Wet chalk
                </div>
                <p className="chalk-writing mt-3 text-[22px] leading-8 text-[#f7fff8]/88">
                  {newGoal}
                </p>
              </div>
            ) : null}

            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="text-[12px] leading-6 text-[#f4dce7]/48">Signed as {wallName}.</div>
              <button className="cream-button w-auto px-4" onClick={onAddGoal} type="button">
                {saving.goal ? 'Sketching...' : 'Sketch it'}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="surface">
        <SectionHeader
          copy="Your newest line goes big. The rest stay underneath like proof you kept showing up."
          kicker="The board"
          title={jamiePosts.length ? 'Your promises in motion' : 'The wall is ready'}
        />

        <div className="chalk-frame mt-5">
          <div className="chalk-board">
            <div className="chalk-board-badge">Chalk squad</div>
            <div className="chalk-tray" />

            {featuredPost ? (
              <div className="relative">
                <div className="chalk-featured-post">
                  <div className="flex items-center gap-3 text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#cfdfd2]/52">
                    <span>{formatGoalDate(featuredPost)}</span>
                    <span className="h-px flex-1 bg-white/8" />
                    <span>{wallName}</span>
                  </div>
                  <p className="chalk-writing mt-4 text-[28px] leading-10 text-[#f3fff5]/92">
                    {featuredPost.text}
                  </p>
                </div>

                {archivePosts.length ? (
                  <div className="mt-5 grid gap-3">
                    {archivePosts.map((post, index) => (
                      <article
                        className="chalk-entry"
                        key={post.id}
                        style={{ transform: `rotate(${getWallEntryTilt(post.id, index)}deg)` }}
                      >
                        <div className="flex items-center gap-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#cfdfd2]/48">
                          <span>{formatGoalDate(post)}</span>
                          <span className="h-px flex-1 bg-white/8" />
                        </div>
                        <p className="chalk-writing mt-2 text-[17px] leading-7 text-[#f3fff5]/84">
                          {post.text}
                        </p>
                      </article>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="chalk-entry">
                <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#cfdfd2]/48">
                  First line
                </div>
                <p className="chalk-writing mt-3 text-[20px] leading-8 text-[#f3fff5]/84">
                  The wall is ready. Add one honest line and today&apos;s date will land with it.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
          <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/42">
            Fresh start
          </div>
          <p className="mt-2 text-[13px] leading-6 text-white/64">
            Clear Jamie&apos;s saved check-ins, notes, wall lines, timers, and coach memory.
          </p>
          <button
            className="secondary-button mt-4"
            disabled={saving.reset}
            onClick={onResetApp}
            type="button"
          >
            {saving.reset ? 'Resetting...' : 'Reset the app'}
          </button>

          <div className="mt-5 border-t border-white/8 pt-4">
            <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/42">
              Tailor a new version
            </div>
            <p className="mt-2 text-[13px] leading-6 text-white/64">
              Use the intake survey to shape one of these apps around someone else.
            </p>
            <a className="secondary-button mt-4" href="/blueprint">
              Open the tailored app survey
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}

function SectionHeader({ copy, kicker, title }) {
  return (
    <div>
      <div className="micro-label">{kicker}</div>
      <h3 className="mt-3 text-xl font-extrabold text-white">{title}</h3>
      <p className="section-copy">{copy}</p>
    </div>
  )
}

function CalendarSupportCard({ calendarUrl }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <CalendarIcon className="text-gold-300" size={16} />
          <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/42">
            Add reminders
          </div>
        </div>
        <p className="mt-1 text-[12px] leading-5 text-white/66">
          One download. Then your calendar takes over.
        </p>
      </div>
      <a
        className="primary-button inline-flex w-auto min-w-[168px] items-center justify-center px-4"
        download="Jamie_90_Day_Burn_Reminders.ics"
        href={calendarUrl}
      >
        Download .ics
      </a>
    </div>
  )
}

function CoachSupportCard({ draft, memorySummary, messages, onDraftChange, onSend, sending }) {
  const visibleMessages = messages.slice(-4)
  const prompts = [
    'The scale got in my head today.',
    'I do not want to start the workout.',
    'I feel behind and weirdly guilty.',
  ]

  return (
    <div className="mt-5 rounded-[24px] border border-[#ff74b4]/14 bg-[linear-gradient(180deg,rgba(255,82,162,0.09),rgba(255,255,255,0.03)),rgba(13,9,16,0.88)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Brain className="text-blush-300" size={16} />
            <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/42">
              Coach Kitty on deck
            </div>
          </div>
          <p className="mt-3 text-[14px] leading-7 text-white/74">
            Cut through the bullshit, remember what is true, and take the next honest step.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        {memorySummary ? (
          <div className="rounded-[18px] border border-[#ffcee5]/10 bg-black/20 px-4 py-3 text-[12px] leading-6 text-white/66">
            I remember this about you: {memorySummary}
          </div>
        ) : null}

        {!visibleMessages.length ? (
          <div className="flex flex-wrap gap-2">
            {prompts.map((prompt) => (
              <button
                className="ghost-chip"
                key={prompt}
                onClick={() => onDraftChange(prompt)}
                type="button"
              >
                {prompt}
              </button>
            ))}
          </div>
        ) : null}

        {visibleMessages.length ? (
          <div className="grid gap-2">
            {visibleMessages.map((message, index) => (
              <div
                className={clsx(
                  'rounded-[18px] border px-4 py-3 text-[13px] leading-6',
                  message.role === 'assistant'
                    ? 'border-[#ff77b8]/16 bg-[#ff77b8]/10 text-white/84'
                    : 'border-white/8 bg-white/[0.04] text-white/74',
                )}
                key={`${message.role}-${index}-${message.content.slice(0, 12)}`}
              >
                {message.content}
              </div>
            ))}
          </div>
        ) : null}

        <div className="grid gap-3">
          <textarea
            className="field-shell min-h-[96px] resize-none"
            onChange={(event) => onDraftChange(event.target.value)}
            placeholder="Coach Kitty, my brain is being weird about..."
            value={draft}
          />
          <button className="primary-button" disabled={sending} onClick={onSend} type="button">
            {sending ? 'Thinking...' : 'Talk it out'}
          </button>
        </div>
      </div>
    </div>
  )
}

function CoachKittyPosterCard() {
  return (
    <article className="relative overflow-hidden rounded-[26px] border border-[#ff9bcc]/16 bg-[linear-gradient(180deg,rgba(10,6,13,0.95),rgba(18,11,21,0.95))] shadow-[0_18px_38px_rgba(0,0,0,0.28)]">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-42"
        style={{ backgroundImage: "url('/coach-kitty-gym.jpeg')" }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.16),rgba(13,7,16,0.88)_62%),radial-gradient(circle_at_20%_10%,rgba(255,88,166,0.22),transparent_28%)]" />
      <div className="relative flex min-h-[350px] flex-col justify-end p-5">
        <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-blush-100/90">
          Sanrio strength gym
        </div>
        <h3 className="display-copy mt-3 max-w-[10ch] text-[2rem] leading-[0.92] text-white">
          Cute. Dangerous. Still doing the work.
        </h3>
        <p className="mt-3 max-w-[16rem] text-[13px] leading-6 text-white/74">
          This is the energy. Strong body. Clear head. No drama about earning your place.
        </p>
      </div>
    </article>
  )
}

function MiniStatus({ label, tone, value }) {
  return (
    <div
      className={clsx(
        'rounded-[18px] border p-3',
        tone === 'good' && 'border-mint-400/16 bg-mint-400/10',
        tone === 'warning' && 'border-gold-300/16 bg-gold-300/10',
        tone === 'neutral' && 'border-white/8 bg-white/[0.04]',
      )}
    >
      <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/42">
        {label}
      </div>
      <div
        className={clsx(
          'mt-2 text-sm font-extrabold',
          tone === 'good' && 'text-mint-300',
          tone === 'warning' && 'text-[#ffe7b2]',
          tone === 'neutral' && 'text-white',
        )}
      >
        {value}
      </div>
    </div>
  )
}

function FocusRow({ row }) {
  return (
    <div className="rounded-[20px] border border-white/8 bg-white/[0.04] p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-bold text-white">{row.title}</div>
          <div className="mt-2 text-[13px] leading-6 text-white/64">{row.support}</div>
        </div>
        <div className="text-right text-xs font-bold uppercase tracking-[0.14em] text-white/42">
          {row.meta}
        </div>
      </div>
    </div>
  )
}

function getWorkoutReadyChecklist({ overloadSummary, setupCue, type }) {
  const formCue =
    type === 'upper'
      ? 'I will keep my shoulders and neck calm instead of forcing the weight.'
      : type === 'lower'
        ? 'I will stay stable through my feet, hips, and core instead of rushing.'
        : 'I will keep clean reps over pace, ego, or trying to match the trainer.'

  return [
    {
      id: 'setup',
      title: 'I set my space up first.',
      detail: setupCue,
    },
    {
      id: 'scale',
      title: 'I will make this workout fit my body today.',
      detail: getModificationCopy(type),
    },
    {
      id: 'form',
      title: 'I will keep my reps clean.',
      detail: formCue,
    },
    {
      id: 'progress',
      title: 'I will only push harder if it still looks controlled.',
      detail: overloadSummary,
    },
  ]
}

function TrackingCard({ accent, children, description, icon, title }) {
  return (
    <section className="surface overflow-hidden">
      <div className={clsx('absolute inset-x-0 top-0 h-24 bg-gradient-to-br opacity-100', accent)} />
      <div className="relative">
        <div className="flex items-center gap-3">
          <div className="rounded-[16px] border border-white/8 bg-white/6 p-2.5">{icon}</div>
          <div>
            <h3 className="text-lg font-extrabold text-white">{title}</h3>
            <p className="mt-1 text-[13px] leading-6 text-white/58">{description}</p>
          </div>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </section>
  )
}

function MeasurementInput({ label, onChange, value }) {
  return (
    <label className="rounded-[18px] border border-white/8 bg-white/[0.04] p-3">
      <div className="text-[12px] font-bold text-white/68">{label}</div>
      <div className="mt-3 flex items-center gap-2">
        <input
          className="field-shell px-3 py-2"
          onChange={(event) => onChange(event.target.value)}
          placeholder="0"
          type="number"
          value={value}
        />
        <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-white/42">
          in
        </span>
      </div>
    </label>
  )
}

function InBodyInput({ hint, label, onChange, value }) {
  return (
    <label className="block rounded-[18px] border border-white/8 bg-white/[0.04] p-4">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-bold text-white">{label}</span>
        <input
          className="field-shell max-w-[86px] px-3 py-2 text-center"
          onChange={(event) => onChange(event.target.value)}
          placeholder="0.0"
          type="number"
          value={value}
        />
      </div>
      <p className="mt-2 text-[12px] leading-6 text-white/48">{hint}</p>
    </label>
  )
}

function TextEntryField({ label, onChange, placeholder, value }) {
  return (
    <label className="rounded-[18px] border border-white/8 bg-white/[0.04] p-3">
      <div className="text-[12px] font-bold text-white/68">{label}</div>
      <input
        className="field-shell mt-3 px-3 py-2"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type="text"
        value={value}
      />
    </label>
  )
}

function RestDayTimer({ option }) {
  const phases = useMemo(() => option?.phases || [], [option])
  const [activePhaseIndex, setActivePhaseIndex] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(phases[0]?.seconds || 0)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!running || secondsLeft <= 0) return undefined

    const timeoutId = window.setTimeout(() => {
      setSecondsLeft((current) => {
        if (current > 1) return current - 1

        const nextPhase = phases[activePhaseIndex + 1]
        if (nextPhase) {
          setActivePhaseIndex((index) => index + 1)
          return nextPhase.seconds
        }

        setRunning(false)
        return 0
      })
    }, 1000)

    return () => window.clearTimeout(timeoutId)
  }, [activePhaseIndex, phases, running, secondsLeft])

  const currentPhase = phases[activePhaseIndex]
  const totalSeconds = phases.reduce((sum, phase) => sum + phase.seconds, 0)
  const completedSeconds =
    phases.slice(0, activePhaseIndex).reduce((sum, phase) => sum + phase.seconds, 0) +
    ((currentPhase?.seconds || 0) - secondsLeft)
  const progress = totalSeconds ? Math.max(0, Math.min(100, (completedSeconds / totalSeconds) * 100)) : 0

  return (
    <div className="mt-4 rounded-[20px] border border-white/8 bg-black/18 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/42">
            {currentPhase?.label || 'Ready'}
          </div>
          <div className="mt-2 text-3xl font-extrabold text-white">
            {formatCountdown(secondsLeft)}
          </div>
        </div>
        <span className="ghost-chip">
          {activePhaseIndex + 1} / {phases.length}
        </span>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/8">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blush-500 to-gold-400 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          className="primary-button"
          onClick={() => setRunning((current) => !current)}
          type="button"
        >
          {running ? 'Pause' : 'Start'}
        </button>
        <button
          className="secondary-button"
          onClick={() => {
            setRunning(false)
            setActivePhaseIndex(0)
            setSecondsLeft(phases[0]?.seconds || 0)
          }}
          type="button"
        >
          Reset
        </button>
      </div>
    </div>
  )
}

function NavButton({ icon, isActive, label, onClick }) {
  return (
    <button
      className={clsx('dock-item', isActive && 'dock-item-active')}
      onClick={onClick}
      type="button"
    >
      <div className={clsx('transition-transform duration-200', isActive ? 'scale-110' : 'scale-100')}>
        {icon}
      </div>
      <span>{label}</span>
    </button>
  )
}

function ConfigurationState({ envKeys }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-5">
      <div className="hero-panel w-full max-w-md">
        <div className="micro-label">Firebase setup needed</div>
        <h1 className="display-copy mt-4 text-[2.1rem] leading-[0.94] text-white">
          Add the Vite Firebase env vars first.
        </h1>
        <p className="mt-4 text-[14px] leading-7 text-white/72">
          The PWA shell is ready, but the client Firebase config is missing. Add these
          in local `.env` and in the Vercel dashboard before testing the live app.
        </p>
        <div className="mt-5 rounded-[24px] border border-white/8 bg-white/6 p-4 text-sm text-white/84">
          {envKeys.map((key) => (
            <div key={key}>{key}</div>
          ))}
        </div>
      </div>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex min-h-screen items-center justify-center px-5">
      <div className="surface w-full max-w-sm text-center">
        <div className="mx-auto flex h-14 w-14 animate-spin items-center justify-center rounded-full border-4 border-white/8 border-t-blush-400" />
        <h1 className="mt-5 text-2xl font-extrabold text-white">Opening Jamie&apos;s app...</h1>
        <p className="mt-3 text-[14px] leading-7 text-white/62">
          Pulling in your workout, check-ins, and wall.
        </p>
      </div>
    </div>
  )
}

function ErrorState({ error }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-5">
      <div className="surface w-full max-w-sm">
        <div className="micro-label text-blush-200">Sync issue</div>
        <h1 className="mt-4 text-2xl font-extrabold text-white">
          The app could not connect cleanly.
        </h1>
        <p className="mt-3 text-[14px] leading-7 text-white/64">
          {error?.message ||
            'Try again after checking Firebase configuration, project permissions, and your deployed env vars.'}
        </p>
      </div>
    </div>
  )
}

function getWorkoutFocusRows(type) {
  if (type === 'rest') {
    return getRestPlan().map((item) => ({
      title: item.title,
      meta: 'Recovery',
      support: item.copy,
    }))
  }

  if (type === 'upper') {
    return [
      {
        title: 'Pull with control',
        meta: 'Main work',
        support: 'If rows feel stronger than presses today, that is normal. Let clean pulling lead instead of rushing to heavier shoulder work.',
      },
      {
        title: 'Press with range you trust',
        meta: 'Main work',
        support: 'Only use the load that lets you stay organized. If the trainer is moving faster or heavier, you do not need to match that today.',
      },
      {
        title: 'Keep shoulders and arms honest',
        meta: 'Support work',
        support: 'Lighter and cleaner still counts. This is where patience usually pays off fastest.',
      },
      {
        title: 'Finish feeling better',
        meta: 'Mobility',
        support: 'Let the session end with your body opening up, not just surviving the reps.',
      },
    ]
  }

  if (type === 'lower') {
    return [
      {
        title: 'Earn the lower-body load',
        meta: 'Main work',
        support: 'Your legs and glutes can usually handle more than you think, but only after your stance and range feel steady.',
      },
      {
        title: 'Hinge without rushing',
        meta: 'Main work',
        support: 'Glutes and hamstrings usually earn heavier load first. Keep the hinge clean before you try to make it impressive.',
      },
      {
        title: 'Choose tension over ego',
        meta: 'Support work',
        support: 'Bands or the kettlebell are a smart move when the next jump in weight would make the set messy.',
      },
      {
        title: 'Leave some juice in the tank',
        meta: 'Mobility',
        support: 'The goal is strong and capable, not trashed for the rest of the day.',
      },
    ]
  }

  return [
    {
      title: 'Start with the big moves',
      meta: 'Main work',
      support: 'The bigger patterns do the most for this session. Let them carry the day instead of chasing intensity everywhere.',
    },
    {
      title: 'Use load that stays clean',
      meta: 'Main work',
      support: 'The kettlebell or Bowflex only help if you can still move well. Clean reps beat wobbly reps every time.',
    },
    {
      title: 'Press without forcing it',
      meta: 'Support work',
      support: 'Stay strong, but let smooth reps win over trying to keep up with the pace on screen.',
    },
    {
      title: 'Pull like you mean it',
      meta: 'Support work',
      support: 'Back work can usually handle more load than shoulders, so let your confidence show up here first.',
    },
  ]
}

function getModificationCopy(type) {
  if (type === 'rest') {
    return 'You do not need to earn rest by doing more. A walk, mobility, water, and recovery still count as doing the program well.'
  }

  if (type === 'upper') {
    return 'You do not need to match the woman in the video rep for rep, pace for pace, or load for load. If your shoulders feel shaky, your range shortens, or your neck starts taking over, lighten it up and make the rep cleaner.'
  }

  if (type === 'lower') {
    return 'Use the version that lets you stay stable through your feet, hips, and core. If the trainer moves deeper or heavier than feels right for you today, shorten the range, slow it down, and own the rep you can actually control.'
  }

  return 'Your best version of this workout is the one you can control. If the trainer is moving faster, heavier, or cleaner than you can today, that is not a sign to force it. It is a sign to scale the rep so your form stays solid and your body stays safe.'
}

function getSetupCue(workout, week) {
  if (!workout) return 'Set the room up first so starting feels smaller than skipping.'

  if (workout.type === 'rest') {
    return 'Pick the easiest version of recovery you can honestly do today: a walk, mobility, water, and a little calm.'
  }

  if (workout.type === 'upper') {
    return week <= 2
      ? 'Band anchored, lighter dumbbells nearby, and your first round only. Let the shoulders warm up before you decide anything heavier.'
      : 'Set bands and pressing weights out before you hit play. If shoulder control slips, that is the sign to stay lighter, not push harder.'
  }

  if (workout.type === 'lower') {
    return week <= 2
      ? 'Bands ready, stance sorted, and one lighter test set first. Let your hips and feet decide the range before load does.'
      : 'Get the kettlebell or Bowflex ready, then earn the heavier option with one clean first round.'
  }

  return week <= 2
    ? 'Set your bands and dumbbells out first. Start a little lighter than your ego wants and let clean reps tell you what is actually there today.'
    : 'Room set, weights ready, first round only. Bigger patterns can lead, but only if the rep still looks like you meant it.'
}

function buildWorkoutPlayerSubtitle({ currentVideoState, workout, workoutComplete }) {
  if (!workout) {
    return 'Your workout will show up here when the program day is live.'
  }

  if (workout.type === 'rest') {
    return workoutComplete
      ? 'Your recovery is already logged. Open this only if you want a calm reset.'
      : 'Open this when you are ready for a calm recovery block. Gentle still counts.'
  }

  if (workoutComplete) {
    return 'Your burn is already done. Reopen it only if you want a refresher.'
  }

  if (currentVideoState?.opened) {
    return 'You already started this today. Pick it back up from where your focus still feels steady.'
  }

  return 'Press play, follow the structure, and keep every rep inside the range that still feels strong and safe.'
}

function indexById(entries) {
  return entries.reduce((accumulator, entry) => {
    accumulator[entry.id] = entry
    return accumulator
  }, {})
}

function valueToInput(value) {
  return value === 0 || Number.isFinite(value) ? String(value) : ''
}

function formatGoalDate(goal) {
  if (!goal?.createdAt?.toDate) return 'Just now'
  return goal.createdAt.toDate().toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

function getUpdateNoticeStorageKey(updateId) {
  return `jamie-update-note:${String(updateId || 'latest')}`
}

function getWorkoutRecordedLabel(timestampValue, optimisticRecordedAt) {
  const sourceDate =
    typeof timestampValue?.toDate === 'function'
      ? timestampValue.toDate()
      : optimisticRecordedAt
        ? new Date(optimisticRecordedAt)
        : null

  if (!sourceDate || Number.isNaN(sourceDate.getTime())) return ''

  return `at ${sourceDate.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })}`
}

function getWallEntryTilt(goalId, index) {
  const source = String(goalId || index || '')
  const total = [...source].reduce((sum, character) => sum + character.charCodeAt(0), 0)
  return (((total % 5) - 2) * 0.45).toFixed(2)
}

function formatMetricValue(value, unit) {
  return value === null || typeof value === 'undefined' ? '—' : `${value}${unit ? ` ${unit}` : ''}`
}

function hasTrackingContent(entry) {
  if (!entry) return false

  return (
    Number.isFinite(entry.caloricDeficit) ||
    typeof entry.hydrationTargetMet === 'boolean' ||
    Boolean(String(entry.mindsetTitle || '').trim()) ||
    Boolean(String(entry.mindsetLog || '').trim())
  )
}

function buildNextStep({ trackingLoggedToday, workout, workoutComplete }) {
  if (workoutComplete) {
    return trackingLoggedToday
      ? 'Close the app and let today count.'
      : 'Log calories and water so today feels closed.'
  }

  if (workout?.type === 'rest') {
    return 'Take the easiest recovery block you can honestly do.'
  }

  return 'Open the video and take the first round only.'
}

function buildCoachFallbackReply({
  coachMemorySummary,
  currentGoal,
  inbodyDue,
  measurementsDue,
  prompt,
  trackingLoggedToday,
  workout,
  workoutComplete,
}) {
  const text = String(prompt || '').toLowerCase()
  const nextStep = buildNextStep({
    trackingLoggedToday,
    workout,
    workoutComplete,
  })

  if (
    ['stuck', 'motivat', 'start', 'behind', 'tired', 'overwhelmed', 'lazy'].some((phrase) =>
      text.includes(phrase),
    )
  ) {
    return workoutComplete
      ? 'I know your brain is still trying to make today not enough, but you already did the hard part. Close the loop gently, drink some water, and let yourself take the damn win.'
      : `Of course this feels bigger in your head than it is in real life. Momentum usually shows up after you start, not before. ${nextStep} What part usually throws you off first?`
  }

  if (
    ['scale', 'weight', 'body', 'bloated', 'puffy', 'mirror', 'fat'].some((phrase) =>
      text.includes(phrase),
    )
  ) {
    return 'Yeah, I get why that got loud in your head. A weird scale or bloated day can come from soreness, sodium, stress, sleep, hormones, or just being a woman with a body, and none of that means you screwed this up. Go back to signal over drama: protein, water, and your next honest session.'
  }

  if (['protein', 'calories', 'cardio', 'food', 'eat'].some((phrase) => text.includes(phrase))) {
    return 'Food noise gets dramatic fast, but the boring truth still wins. Protein, enough movement, enough sleep, and a calorie target you can repeat still beat hacks every damn time. Pick one anchor meal you can trust today and start there.'
  }

  if (['guilty', 'ashamed', 'mad at myself', 'hate', 'disappointed'].some((phrase) => text.includes(phrase))) {
    return 'That self-attack voice is loud because you care, not because it is right. If your best friend said this about herself, you would shut that nonsense down fast. Take one kind useful step right now, then come back to the facts.'
  }

  if (measurementsDue || inbodyDue) {
    return 'The numbers are information, not a verdict. If you have them, log them cleanly and let the trend do the talking. If you do not, keep moving and come back when you do.'
  }

  if (trackingLoggedToday) {
    return 'You already logged the day. That counts. Now let yourself stop spiraling and take the damn win.'
  }

  if (currentGoal) {
    return `Come back to your promise: ${currentGoal} Let that be the thing you trust more than your mood.`
  }

  if (coachMemorySummary) {
    return `What is true right now: ${coachMemorySummary} Start there instead of arguing with yourself.`
  }

  return workout?.type === 'rest'
    ? 'Keep it simple. A calm recovery block still counts and still moves this forward.'
    : 'You do not need a heroic mood. You need one honest start. Press play, take the first round, and let the rest sort itself out after that.'
}

function buildCoachMemorySummary({ coachMemory, currentGoal, recentMindsetNotes }) {
  const pieces = []
  const likedTruths = getTruthsByReaction(coachMemory?.truthReactions, 'liked')
  const sensitiveTruths = getTruthsByReaction(coachMemory?.truthReactions, 'sensitive')

  if (currentGoal) pieces.push(`Your current promise is "${currentGoal}".`)
  if (coachMemory?.latestMindsetTitle) {
    pieces.push(`Your latest note was titled "${coachMemory.latestMindsetTitle}".`)
  }
  if (coachMemory?.latestMindsetLog) {
    pieces.push(shortenText(coachMemory.latestMindsetLog, 120))
  } else if (recentMindsetNotes[0]?.log) {
    pieces.push(shortenText(recentMindsetNotes[0].log, 120))
  }
  if (coachMemory?.latestShare) {
    pieces.push(`You recently said: "${shortenText(coachMemory.latestShare, 110)}".`)
  }
  if (coachMemory?.latestCoachQuestion && coachMemory?.latestCoachAnswer) {
    pieces.push(
      `When Coach Kitty asked "${shortenText(coachMemory.latestCoachQuestion, 70)}" you answered "${shortenText(coachMemory.latestCoachAnswer, 80)}".`,
    )
  }
  if (likedTruths.length) {
    pieces.push(`Truths that landed with you: ${likedTruths.slice(0, 2).join(' | ')}.`)
  }
  if (sensitiveTruths.length) {
    pieces.push(`Go carefully around: ${sensitiveTruths.slice(0, 2).join(' | ')}.`)
  }

  return pieces.join(' ').trim()
}

function getRecentMindsetNotes(trackingEntries) {
  return [...trackingEntries]
    .filter((entry) => entry.mindsetTitle || entry.mindsetLog)
    .sort((a, b) => String(b.id).localeCompare(String(a.id)))
    .slice(0, 4)
    .map((entry) => ({
      date: entry.id,
      title: String(entry.mindsetTitle || '').trim(),
      log: shortenText(String(entry.mindsetLog || '').trim(), 140),
    }))
}

function extractFollowUpQuestion(reply) {
  const match = String(reply || '').match(/[^?]*\?/g)
  if (!match?.length) return ''
  return String(match.at(-1)).trim()
}

function getWorkoutSummary(workout) {
  if (!workout) return ''
  if (workout.type === 'rest') {
    return 'Recovery day. Pick dance, a brisk walk, or one heavy lift if you feel fresh.'
  }
  if (workout.type === 'upper') {
    return `Upper-body day with ${workout.equipment.toLowerCase()}. Keep the reps clean and let the bigger pulls and presses do the work.`
  }
  if (workout.type === 'lower') {
    return `Lower-body day with ${workout.equipment.toLowerCase()}. Stay stable, move with control, and let the legs work without rushing.`
  }
  return `Full-body session with ${workout.equipment.toLowerCase()}. Strong reps over sloppy hustle.`
}

function formatCountdown(totalSeconds) {
  const safeSeconds = Math.max(0, totalSeconds || 0)
  const minutes = String(Math.floor(safeSeconds / 60)).padStart(2, '0')
  const seconds = String(safeSeconds % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
}

function buildHeavyDraft(log) {
  return {
    exercise: log?.exercise || '',
    partner: log?.partner || '',
    weight: log?.weight || '',
    scheme: log?.scheme || '3 x 5',
  }
}

function normalizeHeavyDraft(draft) {
  return {
    exercise: String(draft?.exercise || '').trim(),
    partner: String(draft?.partner || '').trim(),
    weight: String(draft?.weight || '').trim(),
    scheme: String(draft?.scheme || '').trim() || '3 x 5',
  }
}

function getLatestHeavyRestRecord(videoStateEntries, todayKey) {
  return [...(videoStateEntries || [])]
    .filter(
      (entry) =>
        entry?.id !== todayKey &&
        entry?.restOptionId === 'heavy' &&
        entry?.heavyLiftLog &&
        Object.values(entry.heavyLiftLog).some(Boolean),
    )
    .sort((a, b) => String(b.id).localeCompare(String(a.id)))
    .map((entry) => entry.heavyLiftLog)
    .at(0) || null
}

function shortenText(value, maxLength) {
  const text = String(value || '').trim()
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength - 1).trim()}…`
}

function getPerspectiveCardId(card) {
  return String(card?.id || card?.title || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function getTruthsByReaction(truthReactions, reaction) {
  return Object.values(truthReactions || {})
    .filter((entry) => entry?.reaction === reaction && entry?.title)
    .sort((a, b) => String(b.reactedOn || '').localeCompare(String(a.reactedOn || '')))
    .map((entry) => entry.title)
}
