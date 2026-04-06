import { useEffect, useState } from 'react'
import clsx from 'clsx'
import {
  Activity,
  BarChart2,
  Bell,
  Brain,
  Calendar as CalendarIcon,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Droplets,
  Flame,
  Heart,
  Home,
  PieChart,
  Plus,
  Send,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  XCircle,
  Zap,
} from 'lucide-react'
import { isFirebaseConfigured, firebaseEnvKeys } from './lib/firebase'
import { isMessagingConfigured } from './lib/firebaseConfig'
import { useFirebaseSession } from './hooks/useFirebaseSession'
import { useJamieDashboard } from './hooks/useJamieDashboard'
import { usePushNotifications } from './hooks/usePushNotifications'
import WorkoutCoachPanel from './components/WorkoutCoachPanel'
import WorkoutPlayer from './components/WorkoutPlayer'
import {
  HELLO_LINES,
  KUROMI_LINES,
  PERSPECTIVE_CARDS,
  PROGRAM_START,
  TOTAL_DAYS,
  USER_NAME,
  buildProgramWeeks,
  difference,
  formatLongDate,
  getCurrentStreak,
  getLatestByDate,
  getLocalDateKey,
  getOverloadSummary,
  getOverloadTips,
  getPhaseForDay,
  getPhaseName,
  getProgramDateForDay,
  getProgramDay,
  getRestPlan,
  getWeekForDay,
  getWeekRange,
  getWorkoutForDay,
  isInBodyDue,
  isMeasurementDue,
  numberOrNull,
  pickMotivationLine,
  shiftDateKey,
} from './lib/program'

const PROGRAM_WEEKS = buildProgramWeeks()

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

export default function App() {
  const [activeTab, setActiveTab] = useState('workout')
  const [showRoadmap, setShowRoadmap] = useState(false)
  const [trackingDraft, setTrackingDraft] = useState(EMPTY_TRACKING)
  const [measurementDraft, setMeasurementDraft] = useState(EMPTY_MEASUREMENTS)
  const [inbodyDraft, setInbodyDraft] = useState(EMPTY_INBODY)
  const [reminderDraft, setReminderDraft] = useState({
    dailyEnabled: true,
    dailyTime: '09:00',
    closeoutEnabled: true,
    closeoutTime: '19:30',
  })
  const [coachDraft, setCoachDraft] = useState('')
  const [playerOpen, setPlayerOpen] = useState(true)
  const [newGoal, setNewGoal] = useState('')
  const [saving, setSaving] = useState({
    workout: false,
    deficit: false,
    hydration: false,
    mindset: false,
    measurement: false,
    inbody: false,
    goal: false,
    reminders: false,
    coach: false,
    pushTest: false,
  })
  const [toast, setToast] = useState('')

  const session = useFirebaseSession()
  const dashboard = useJamieDashboard(session.user)
  const push = usePushNotifications({
    user: session.user,
    saveNotificationToken: dashboard.actions?.saveNotificationToken,
    removeNotificationToken: dashboard.actions?.removeNotificationToken,
    saveSettings: dashboard.actions?.saveSettings,
  })

  const todayKey = getLocalDateKey()
  const todayDay = getProgramDay(todayKey)
  const todayWorkout = todayDay ? getWorkoutForDay(todayDay) : null
  const currentWeek = todayDay ? getWeekForDay(todayDay) : 1
  const currentPhase = todayDay ? getPhaseForDay(todayDay) : 1
  const currentPhaseName = getPhaseName(currentPhase)
  const weekRange = getWeekRange(currentWeek)

  const workoutsByDate = indexById(dashboard.workouts)
  const trackingByDate = indexById(dashboard.tracking)
  const measurementsByDate = indexById(dashboard.measurements)
  const scansByDate = indexById(dashboard.inbodyScans)

  const todayWorkoutEntry = workoutsByDate[todayKey]
  const todayTrackingEntry = trackingByDate[todayKey]
  const todayMeasurementEntry = measurementsByDate[todayKey]
  const todayScanEntry = scansByDate[todayKey]
  const reminderEntriesById = dashboard.remindersById ?? {}
  const dailyReminder = reminderEntriesById.daily ?? null
  const closeoutReminder = reminderEntriesById.closeout ?? null
  const todayVideoState = dashboard.videoStateById?.[todayKey] ?? null
  const currentCoachMemory =
    dashboard.coachMemoryById?.main ?? dashboard.coachMemory?.[0] ?? null
  const coachThread = (dashboard.coachThreads ?? [])
    .filter((entry) => (entry.threadId ?? 'main') === 'main')
    .slice()
    .reverse()

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
    setReminderDraft({
      dailyEnabled: dailyReminder?.enabled ?? true,
      dailyTime: dailyReminder?.time ?? '09:00',
      closeoutEnabled: closeoutReminder?.enabled ?? true,
      closeoutTime: closeoutReminder?.time ?? '19:30',
    })
  }, [closeoutReminder, dailyReminder])

  useEffect(() => {
    if (!todayWorkout?.video) {
      setPlayerOpen(false)
      return
    }

    if (typeof todayVideoState?.expanded === 'boolean') {
      setPlayerOpen(todayVideoState.expanded)
      return
    }

    setPlayerOpen(!todayWorkoutEntry?.completed)
  }, [todayVideoState?.expanded, todayWorkout?.video, todayWorkoutEntry?.completed])

  useEffect(() => {
    if (!toast) return undefined
    const timeoutId = window.setTimeout(() => setToast(''), 2400)
    return () => window.clearTimeout(timeoutId)
  }, [toast])

  useEffect(() => {
    if (!push.lastMessage) return
    setToast(push.lastMessage.title)
  }, [push.lastMessage])

  if (!isFirebaseConfigured || session.status === 'needs-config') {
    return <ConfigurationState envKeys={firebaseEnvKeys} />
  }

  if (session.status === 'loading' || dashboard.loading) {
    return <LoadingState />
  }

  if (session.status === 'error' || dashboard.error) {
    return <ErrorState error={session.error || dashboard.error} />
  }

  const completedWorkouts = dashboard.workouts.filter((entry) => entry.completed)
  const completedWorkoutDates = completedWorkouts.map((entry) => entry.id)
  const hydrationWins = dashboard.tracking.filter(
    (entry) => entry.hydrationTargetMet === true,
  ).length
  const mindsetEntries = dashboard.tracking.filter((entry) =>
    Boolean(entry.mindsetLog?.trim()),
  ).length
  const trackingDaysLogged = dashboard.tracking.filter(hasTrackingEntry).length
  const workoutStreak = getCurrentStreak(completedWorkoutDates)
  const hydrationStreak = getHydrationStreak(dashboard.tracking, todayKey)

  const latestMeasurement = getLatestByDate(dashboard.measurements)
  const previousMeasurement = getPreviousEntry(dashboard.measurements)
  const earliestMeasurement = dashboard.measurements[0] ?? null

  const latestScan = getLatestByDate(dashboard.inbodyScans)
  const previousScan = getPreviousEntry(dashboard.inbodyScans)
  const earliestScan = dashboard.inbodyScans[0] ?? null

  const measurementsDue = isMeasurementDue(dashboard.measurements, todayKey)
  const inbodyDue = isInBodyDue(dashboard.inbodyScans, todayKey)

  const elapsedDays = todayDay || 0
  const currentWeekKeys = getDateKeysForDayRange(weekRange.start, weekRange.end)
  const currentWeekDayCount = currentWeekKeys.filter(
    (dateKey) => getProgramDay(dateKey) <= elapsedDays,
  ).length || currentWeekKeys.length

  const workoutsThisWeek = completedWorkouts.filter((entry) =>
    currentWeekKeys.includes(entry.id),
  ).length
  const hydrationThisWeek = dashboard.tracking.filter(
    (entry) => currentWeekKeys.includes(entry.id) && entry.hydrationTargetMet,
  ).length
  const mindsetThisWeek = dashboard.tracking.filter(
    (entry) => currentWeekKeys.includes(entry.id) && entry.mindsetLog?.trim(),
  ).length
  const weekDeficit = dashboard.tracking
    .filter((entry) => currentWeekKeys.includes(entry.id))
    .reduce((sum, entry) => sum + (Number(entry.caloricDeficit) || 0), 0)

  const currentWeekAdherence = currentWeekDayCount
    ? Math.round(
        ((workoutsThisWeek + hydrationThisWeek + mindsetThisWeek) /
          (currentWeekDayCount * 3)) *
          100,
      )
    : 0

  const previousWeekRange = currentWeek > 1 ? getWeekRange(currentWeek - 1) : null
  const previousWeekKeys = previousWeekRange
    ? getDateKeysForDayRange(previousWeekRange.start, previousWeekRange.end)
    : []
  const previousWeekDayCount = previousWeekKeys.filter(
    (dateKey) => getProgramDay(dateKey) <= elapsedDays,
  ).length
  const previousWeekAdherence = previousWeekDayCount
    ? Math.round(
        ((completedWorkouts.filter((entry) => previousWeekKeys.includes(entry.id))
          .length +
          dashboard.tracking.filter(
            (entry) => previousWeekKeys.includes(entry.id) && entry.hydrationTargetMet,
          ).length +
          dashboard.tracking.filter(
            (entry) =>
              previousWeekKeys.includes(entry.id) && entry.mindsetLog?.trim(),
          ).length) /
          (previousWeekDayCount * 3)) *
          100,
      )
    : 0

  const adherencePercent = elapsedDays
    ? Math.round(
        ((completedWorkouts.length + hydrationWins + mindsetEntries) /
          (elapsedDays * 3)) *
          100,
      )
    : 0
  const adherenceDelta = currentWeekAdherence - previousWeekAdherence
  const cumulativeDeficit = dashboard.tracking.reduce(
    (sum, entry) => sum + (Number(entry.caloricDeficit) || 0),
    0,
  )

  const workoutComplete = Boolean(todayWorkoutEntry?.completed)
  const trackingLoggedToday = hasTrackingEntry(todayTrackingEntry)
  const helloLine = pickMotivationLine(
    HELLO_LINES,
    completedWorkouts.length + currentWeek,
  )
  const kuromiLine = pickMotivationLine(
    KUROMI_LINES,
    hydrationWins + (todayDay || 1),
  )

  const heroCopy = buildHeroCopy({
    day: todayDay,
    workout: todayWorkout,
    workoutComplete,
    trackingLoggedToday,
    measurementsDue,
    inbodyDue,
  })
  const recommendedAction = buildRecommendedAction({
    day: todayDay,
    workout: todayWorkout,
    workoutComplete,
    trackingLoggedToday,
    measurementsDue,
    inbodyDue,
  })
  const weeklyReset = buildWeeklyReset({
    workoutsThisWeek,
    hydrationThisWeek,
    mindsetThisWeek,
    weekDeficit,
    measurementsDue,
    inbodyDue,
    latestScan,
    previousScan,
  })
  const coachSummary = buildCoachSummary({
    day: todayDay,
    workout: todayWorkout,
    workoutComplete,
    trackingLoggedToday,
    measurementsDue,
    inbodyDue,
    workoutStreak,
    hydrationStreak,
  })
  const coachSuggestions = buildCoachSuggestions({
    day: todayDay,
    workout: todayWorkout,
    workoutComplete,
    trackingLoggedToday,
    measurementsDue,
    inbodyDue,
  })

  async function handleWorkoutComplete() {
    if (!todayDay) return
    setSaving((current) => ({ ...current, workout: true }))
    try {
      await dashboard.actions.setWorkoutComplete(todayKey, true)
      await dashboard.actions.saveVideoState(todayKey, {
        completed: true,
        expanded: playerOpen,
        workoutName: todayWorkout?.name ?? null,
      })
      setToast(todayWorkout?.type === 'rest' ? 'Recovery day logged.' : 'Burn completion logged.')
    } catch (error) {
      setToast(error.message || 'Could not log today just yet.')
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
      await dashboard.actions.addGoal(newGoal)
      setNewGoal('')
      setToast('Goal added to the wall.')
    } catch (error) {
      setToast(error.message || 'Could not add that goal.')
    } finally {
      setSaving((current) => ({ ...current, goal: false }))
    }
  }

  async function handleSaveReminder(reminderId, changes) {
    const nextEnabled =
      typeof changes.enabled === 'boolean'
        ? changes.enabled
        : reminderId === 'daily'
          ? reminderDraft.dailyEnabled
          : reminderDraft.closeoutEnabled
    const nextTime =
      changes.time ??
      (reminderId === 'daily'
        ? reminderDraft.dailyTime
        : reminderDraft.closeoutTime)
    const nextDraft = {
      dailyEnabled:
        reminderId === 'daily'
          ? nextEnabled
          : reminderDraft.dailyEnabled,
      dailyTime:
        reminderId === 'daily'
          ? nextTime
          : reminderDraft.dailyTime,
      closeoutEnabled:
        reminderId === 'closeout'
          ? nextEnabled
          : reminderDraft.closeoutEnabled,
      closeoutTime:
        reminderId === 'closeout'
          ? nextTime
          : reminderDraft.closeoutTime,
    }

    setReminderDraft(nextDraft)
    setSaving((current) => ({ ...current, reminders: true }))

    try {
      await dashboard.actions.saveReminderPreference(reminderId, {
        enabled: nextEnabled,
        time: nextTime,
        kind: reminderId,
        label: reminderId === 'daily' ? 'Daily nudge' : 'Evening closeout',
      })
      if (nextEnabled && !push.enabled) {
        setToast('Reminder saved. Turn on push when you are ready.')
      } else {
        setToast(
          reminderId === 'daily'
            ? 'Daily nudge updated.'
            : 'Evening closeout updated.',
        )
      }
    } catch (error) {
      setToast(error.message || 'Could not save that support setting.')
    } finally {
      setSaving((current) => ({ ...current, reminders: false }))
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

  async function handleCoachSend(messageOverride) {
    const message = String(messageOverride ?? coachDraft).trim()
    if (!message) return

    setSaving((current) => ({ ...current, coach: true }))

    try {
      await dashboard.actions.addCoachThreadMessage({
        threadId: 'main',
        role: 'user',
        message,
        contextKey: todayKey,
      })

      const aiReply = await requestCoachReply({
        coachMemory: currentCoachMemory,
        coachSummary,
        day: todayDay,
        goal: dashboard.goals?.[0]?.text ?? '',
        hydrationStreak,
        inbodyDue,
        measurementsDue,
        message,
        phaseName: currentPhaseName,
        recentMessages: coachThread.slice(-6).map((entry) => ({
          role: entry.role,
          message: entry.message,
        })),
        trackingLoggedToday,
        workout: todayWorkout,
        workoutComplete,
        workoutStreak,
      })

      const reply =
        aiReply?.reply ||
        buildCoachReply({
          message,
          summary: coachSummary,
          inbodyDue,
          measurementsDue,
          trackingLoggedToday,
          workout: todayWorkout,
          workoutComplete,
        })

      await dashboard.actions.addCoachThreadMessage({
        threadId: 'main',
        role: 'assistant',
        message: reply,
        contextKey: todayKey,
      })
      await dashboard.actions.saveCoachMemorySummary('main', {
        contextKey: todayKey,
        focus: coachSummary.title,
        latestPrompt: message,
        latestReply: reply,
        memorySummary:
          aiReply?.memorySummary ||
          currentCoachMemory?.memorySummary ||
          coachSummary.body,
      })
      setCoachDraft('')
      setToast('Coach space updated.')
    } catch (error) {
      setToast(error.message || 'Coach space could not save that note yet.')
    } finally {
      setSaving((current) => ({ ...current, coach: false }))
    }
  }

  async function handleSendTestReminder() {
    if (!push.token) {
      setToast('Turn on push first on this device.')
      return
    }

    setSaving((current) => ({ ...current, pushTest: true }))
    try {
      const response = await fetch('/api/reminders/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: push.token,
          title: 'Jamie, your app is ready',
          body: 'This is your test nudge. If this felt gentle and clear, the support path is working.',
          kind: 'test',
          link: '/',
        }),
      })

      const payload = await response.json()
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || 'Could not send a test reminder.')
      }

      setToast('Test nudge sent.')
    } catch (error) {
      setToast(error.message || 'Could not send a test reminder.')
    } finally {
      setSaving((current) => ({ ...current, pushTest: false }))
    }
  }

  return (
    <div className="relative flex min-h-screen justify-center">
      <div className="app-shell">
        {activeTab === 'workout' && (
          <>
            <AppHero
              currentPhaseName={currentPhaseName}
              currentWeek={currentWeek}
              heroCopy={heroCopy}
              hydrationStreak={hydrationStreak}
              progressPercent={elapsedDays ? Math.round((elapsedDays / TOTAL_DAYS) * 100) : 0}
              sync={dashboard.sync}
              todayDay={todayDay}
              workoutStreak={workoutStreak}
            />
            <WorkoutView
              currentPhaseName={currentPhaseName}
              currentWeek={currentWeek}
              currentVideoState={todayVideoState}
              day={todayDay}
              helloLine={helloLine}
              inbodyDue={inbodyDue}
              measurementsDue={measurementsDue}
              onComplete={handleWorkoutComplete}
              onPlayerOpenChange={handlePlayerOpenChange}
              onToggleRoadmap={() => setShowRoadmap((current) => !current)}
              playerOpen={playerOpen}
              recommendedAction={recommendedAction}
              saving={saving.workout}
              showRoadmap={showRoadmap}
              trackingLoggedToday={trackingLoggedToday}
              todayKey={todayKey}
              workout={todayWorkout}
              workoutComplete={workoutComplete}
              kuromiLine={kuromiLine}
            />
          </>
        )}

        {activeTab === 'tracking' && (
          <TrackingView
            bodyCheckinsDue={measurementsDue || inbodyDue}
            closeoutHistory={buildTimelineHistory(elapsedDays, 'tracking', trackingByDate)}
            currentDay={todayDay}
            onChangeTracking={setTrackingDraft}
            onSaveDeficit={handleSaveDeficit}
            onSaveHydration={handleSaveHydration}
            onSaveMindset={handleSaveMindset}
            onOpenProof={() => setActiveTab('data')}
            saving={saving}
            workoutComplete={workoutComplete}
            trackingDraft={trackingDraft}
            workoutHistory={buildTimelineHistory(elapsedDays, 'workout', workoutsByDate)}
          />
        )}

        {activeTab === 'data' && (
          <DataView
            adherenceDelta={adherenceDelta}
            adherencePercent={adherencePercent}
            completedWorkouts={completedWorkouts.length}
            cumulativeDeficit={cumulativeDeficit}
            currentDay={todayDay}
            currentWeekAdherence={currentWeekAdherence}
            deficitBars={buildWeeklyDeficitBars(todayDay, trackingByDate)}
            earliestMeasurement={earliestMeasurement}
            earliestScan={earliestScan}
            hydrationStreak={hydrationStreak}
            inbodyDraft={inbodyDraft}
            measurementDraft={measurementDraft}
            latestMeasurement={latestMeasurement}
            latestScan={latestScan}
            measurementsDue={measurementsDue}
            mindsetEntries={mindsetEntries}
            onChangeInbody={setInbodyDraft}
            onChangeMeasurements={setMeasurementDraft}
            onSaveInbody={handleSaveInBody}
            onSaveMeasurements={handleSaveMeasurements}
            previousMeasurement={previousMeasurement}
            previousScan={previousScan}
            saving={saving}
            trackingDaysLogged={trackingDaysLogged}
            weeklyReset={weeklyReset}
            weekDeficit={weekDeficit}
            workoutsThisWeek={workoutsThisWeek}
            hydrationThisWeek={hydrationThisWeek}
            inbodyDue={inbodyDue}
            mindsetThisWeek={mindsetThisWeek}
          />
        )}

        {activeTab === 'goals' && (
          <GoalsView
            coachDraft={coachDraft}
            coachSuggestions={coachSuggestions}
            coachSummary={coachSummary}
            coachThread={coachThread}
            goals={dashboard.goals}
            newGoal={newGoal}
            onAddGoal={handleAddGoal}
            onChangeCoachDraft={setCoachDraft}
            onChangeGoal={setNewGoal}
            onCoachSend={handleCoachSend}
            onSendTestReminder={handleSendTestReminder}
            onSaveReminder={handleSaveReminder}
            onDisablePush={push.disablePush}
            onEnablePush={push.requestPermission}
            push={push}
            reminderDraft={reminderDraft}
            saving={saving.goal}
            settings={dashboard.settings}
            supportSaving={saving}
          />
        )}
      </div>

      <div className="floating-dock">
        <NavButton
          icon={<Home size={20} />}
          isActive={activeTab === 'workout'}
          label="Workout"
          onClick={() => setActiveTab('workout')}
        />
        <NavButton
          icon={<Activity size={20} />}
          isActive={activeTab === 'tracking'}
          label="Check-in"
          onClick={() => setActiveTab('tracking')}
        />
        <NavButton
          icon={<BarChart2 size={20} />}
          isActive={activeTab === 'data'}
          label="Progress"
          onClick={() => setActiveTab('data')}
        />
        <NavButton
          icon={<Target size={20} />}
          isActive={activeTab === 'goals'}
          label="Goals"
          onClick={() => setActiveTab('goals')}
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
    </div>
  )
}

function AppHero({
  currentPhaseName,
  currentWeek,
  heroCopy,
  hydrationStreak,
  progressPercent,
  sync,
  todayDay,
  workoutStreak,
}) {
  const syncLabel = sync?.hasPendingWrites
    ? 'Saving your changes'
    : sync?.fromCache
      ? 'Works offline'
      : 'Everything saved'

  return (
    <section className="hero-panel">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="micro-label">For Jamie • soft strength • steady follow-through</div>
          <h1 className="display-copy mt-4 text-[2.2rem] leading-[0.92] text-white">
            Jamie&apos;s 90-Day Burn
          </h1>
          <p className="mt-4 max-w-[28rem] text-[14px] leading-7 text-white/76">
            {heroCopy}
          </p>
          <div className="mt-3 text-[11px] font-bold uppercase tracking-[0.16em] text-white/42">
            {syncLabel}
          </div>
        </div>
        <div className="rounded-full border border-white/10 bg-white/6 p-3 text-gold-300">
          <Sparkles size={20} />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <span className="ghost-chip">{todayDay ? `Day ${todayDay}` : 'Starts soon'}</span>
        <span className="ghost-chip">Week {currentWeek}</span>
        <span className="ghost-chip">{currentPhaseName}</span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <QuickStat label="Streak" value={workoutStreak} />
        <QuickStat label="Hydration" value={hydrationStreak} />
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/46">
          <span>Your progress</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-white/8">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blush-500 via-gold-400 to-plum-400"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </section>
  )
}

function WorkoutView({
  currentPhaseName,
  currentWeek,
  currentVideoState,
  day,
  helloLine,
  inbodyDue,
  measurementsDue,
  onComplete,
  onPlayerOpenChange,
  onToggleRoadmap,
  playerOpen,
  recommendedAction,
  saving,
  showRoadmap,
  trackingLoggedToday,
  todayKey,
  workout,
  workoutComplete,
  kuromiLine,
}) {
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
  const overloadTips = getOverloadTips(currentWeek, workout.type)
  const roadmapWeeks = getRoadmapSlice(currentWeek)
  const dailyProofLabel = inbodyDue
    ? 'Scan due'
    : measurementsDue
      ? 'Measurements due'
      : 'Current'
  const setupCue = getSetupCue(workout, currentWeek)
  const modificationCue = getModificationCopy(workout.type)
  const playerSubtitle = buildWorkoutPlayerSubtitle({
    currentVideoState,
    trackingLoggedToday,
    workout,
    workoutComplete,
  })
  const playerStatus = currentVideoState?.opened
    ? workoutComplete
      ? 'Logged today'
      : 'Opened today'
    : workoutComplete
      ? 'Done'
      : 'Ready'

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
              {formatLongDate(todayKey)}. Keep it simple, friend. One honest rep of the
              plan is enough for today.
            </p>
          </div>
          <div className="rounded-full border border-white/10 bg-white/6 p-3 text-gold-300">
            <Sparkles size={18} />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="ghost-chip">
            {workout.duration === '-' ? 'Recovery' : `${workout.duration} min`}
          </span>
          <span className="ghost-chip">{workout.equipment}</span>
          <span className="ghost-chip">Week {currentWeek}</span>
          <span className="ghost-chip">{currentPhaseName}</span>
        </div>

        <div className="mt-4 rounded-[22px] border border-white/8 bg-white/6 p-4">
          <div className="micro-label">What matters most today</div>
          <p className="mt-2 text-[14px] leading-7 text-white/84">{recommendedAction}</p>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <MiniStatus
            label="Workout"
            tone={workoutComplete ? 'good' : 'neutral'}
            value={
              workoutComplete
                ? 'Logged'
                : workout.type === 'rest'
                  ? 'Recovery open'
                  : currentVideoState?.opened
                    ? 'Started'
                    : 'Still open'
            }
          />
          <MiniStatus
            label="Tonight"
            tone={trackingLoggedToday ? 'good' : 'neutral'}
            value={trackingLoggedToday ? 'Logged' : 'Still open'}
          />
          <MiniStatus
            label="Progress"
            tone={inbodyDue || measurementsDue ? 'warning' : 'good'}
            value={dailyProofLabel}
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2">
          <button
            className={clsx(workoutComplete ? 'good-button' : 'secondary-button')}
            disabled={saving || workoutComplete}
            onClick={onComplete}
            type="button"
          >
            {workoutComplete
              ? workout.type === 'rest'
                ? 'I finished recovery'
                : 'I finished today&apos;s workout'
              : saving
                ? 'Saving...'
                : workout.type === 'rest'
                  ? 'Mark recovery done'
                  : 'Mark workout done'}
          </button>
        </div>
      </section>

      <WorkoutPlayer
        badge={workout.type === 'rest' ? 'Recovery flow' : 'Your player'}
        defaultOpen={!workoutComplete}
        helper={
          workout.type === 'rest'
            ? 'Keep the pace gentle and stop while you still feel better than when you began.'
            : 'Use the trainer as a guide, not a test. Pause, shorten, or lighten anything that asks for more than clean control today.'
        }
        isOpen={playerOpen}
        onOpenChange={onPlayerOpenChange}
        status={playerStatus}
        subtitle={playerSubtitle}
        title={workout.name}
        videoUrl={workout.video}
      />

      <section className="surface">
        <div className="rounded-[22px] border border-white/8 bg-white/[0.04] p-4">
          <div className="micro-label">
            {workout.type === 'rest'
              ? 'What recovery looks like today'
              : 'What counts as enough today'}
          </div>
          <div className="mt-4 space-y-3">
            {focusRows.map((row) => (
              <FocusRow key={`${row.title}-${row.meta}`} row={row} />
            ))}
          </div>
        </div>

        <div className="mt-4">
          <WorkoutCoachPanel
            details={overloadTips.slice(0, 3).join(' ')}
            modificationCue={modificationCue}
            overloadCue={overloadSummary}
            setupCue={setupCue}
            title={
              workout.type === 'rest'
                ? 'Keep recovery useful, not complicated'
                : 'Keep the workout honest and on your side'
            }
          />
        </div>

        <div className="mt-4 rounded-[22px] border border-blush-300/14 bg-[linear-gradient(145deg,rgba(255,143,200,0.14),rgba(141,103,255,0.08)_58%,transparent)] p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/44">
              <Heart className="text-blush-200" size={16} />
              A note for you
            </div>
            <button className="ghost-chip gap-2" onClick={onToggleRoadmap} type="button">
              <CalendarIcon size={16} />
              {showRoadmap ? 'Hide what\'s next' : 'See what\'s next'}
            </button>
          </div>
          <p className="mt-4 text-[14px] leading-7 text-white/84">{helloLine}</p>
          <p className="mt-3 text-[14px] leading-7 text-white/68">{kuromiLine}</p>
        </div>
      </section>

      {showRoadmap && (
        <section className="surface">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="micro-label">What&apos;s next</div>
              <h3 className="mt-3 text-xl font-extrabold text-white">What the next stretch looks like</h3>
              <p className="section-copy">
                You do not need all 90 days in your head. Just let this show you the next
                few steps so the plan feels lighter.
              </p>
            </div>
            <button className="ghost-chip gap-2" onClick={onToggleRoadmap} type="button">
              Close
            </button>
          </div>

          <div className="no-scrollbar mt-5 grid auto-cols-[270px] grid-flow-col gap-3 overflow-x-auto pb-1">
            {roadmapWeeks.map((week) => (
              <article
                className="rounded-[22px] border border-white/8 bg-white/5 p-4"
                key={week.week}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/44">
                      Week {week.week}
                    </div>
                    <div className="mt-2 text-sm font-bold text-white">{week.phase}</div>
                  </div>
                  <span className="ghost-chip">
                    {week.range.start}-{week.range.end}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-7 gap-2">
                  {week.days.map((programDay) => (
                    <div
                      className={clsx(
                        'flex h-10 items-center justify-center rounded-2xl text-xs font-extrabold',
                        programDay < day && 'bg-mint-400/18 text-mint-300',
                        programDay === day &&
                          'bg-gradient-to-r from-blush-500 to-plum-400 text-white',
                        programDay > day && 'bg-white/5 text-white/48',
                      )}
                      key={programDay}
                    >
                      {programDay}
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function TrackingView({
  bodyCheckinsDue,
  closeoutHistory,
  currentDay,
  onChangeTracking,
  onOpenProof,
  onSaveDeficit,
  onSaveHydration,
  onSaveMindset,
  saving,
  trackingDraft,
  workoutComplete,
  workoutHistory,
}) {
  const [showTrends, setShowTrends] = useState(false)
  const todayHydration = trackingDraft.hydrationTargetMet
  const todayMindsetFilled =
    Boolean(trackingDraft.mindsetTitle.trim()) || Boolean(trackingDraft.mindsetLog.trim())

  return (
    <div className="grid gap-4">
      <section className="surface">
        <SectionHeader
          copy="Give yourself a clear ending to the day: calories, water, and one honest thought."
          kicker="For tonight"
          title="Finish today well"
        />

        <div className="mt-5 grid grid-cols-3 gap-2">
          <MiniStatus
            label="Burn"
            tone={workoutComplete ? 'good' : 'neutral'}
            value={workoutComplete ? 'Done' : 'Open'}
          />
          <MiniStatus
            label="Hydration"
            tone={todayHydration === true ? 'good' : todayHydration === false ? 'warning' : 'neutral'}
            value={
              todayHydration === true ? 'Win' : todayHydration === false ? 'Miss' : 'Not set'
            }
          />
          <MiniStatus
            label="Mindset"
            tone={todayMindsetFilled ? 'good' : 'neutral'}
            value={todayMindsetFilled ? 'Written' : 'Blank'}
          />
        </div>

        {bodyCheckinsDue && (
          <div className="mt-4 rounded-[22px] border border-gold-300/16 bg-gold-300/10 p-4 text-[#ffecc4]">
            <div className="flex items-center justify-between gap-4">
              <p className="text-[13px] leading-6">
                Your next body check-in is due. Finish tonight here first, then head to
                Progress when you want to add measurements or scan numbers.
              </p>
              <button className="ghost-chip shrink-0" onClick={onOpenProof} type="button">
                Open progress
              </button>
            </div>
          </div>
        )}

        {!workoutComplete && (
          <div className="mt-4 rounded-[22px] border border-white/8 bg-white/[0.04] p-4 text-[13px] leading-6 text-white/68">
            If your workout is still open, start there first. This part feels better once
            the main promise of the day is already done.
          </div>
        )}

        <div className="mt-4 flex justify-start">
          <button className="ghost-chip" onClick={() => setShowTrends((current) => !current)} type="button">
            {showTrends ? 'Hide trends' : 'See trends'}
          </button>
        </div>

        {showTrends && (
          <div className="mt-4 grid gap-4 rounded-[22px] border border-white/8 bg-white/[0.04] p-4">
            <NinetyDayBar
              color="text-mint-300"
              currentDay={currentDay}
              history={workoutHistory}
              label="Burn timeline"
            />
            <NinetyDayBar
              color="text-gold-300"
              currentDay={currentDay}
              history={closeoutHistory}
              label="Closeout timeline"
            />
          </div>
        )}
      </section>

      <TrackingCard
        accent="from-[#ff8fc8]/16 via-[#8bdcff]/10 to-[#c6b3ff]/10"
        description="Just the few things that help you end the day with clarity instead of guessing."
        icon={<Sparkles className="text-gold-300" size={18} />}
        title="Your check-in"
      >
        <div className="grid gap-4">
          <div className="rounded-[24px] border border-blush-300/12 bg-blush-300/[0.08] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-blush-200">
                  Calories
                </div>
                <p className="mt-2 text-[13px] leading-6 text-white/70">
                  Log the real number. Honesty tonight makes tomorrow easier.
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
                  This is just a simple yes or no. No drama, just a check-in.
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

          <div className="rounded-[24px] border border-plum-300/12 bg-plum-300/[0.08] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-plum-200">
                  What do you need to hear tonight?
                </div>
                <p className="mt-2 text-[13px] leading-6 text-white/70">
                  A few honest lines is enough. You are not writing for a grade here.
                </p>
              </div>
              <Brain className="text-plum-200" size={18} />
            </div>
            <div className="mt-4 rounded-[20px] border border-white/8 bg-white/[0.05] p-4">
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
                placeholder="What felt hard? What felt easier? What do you want tomorrow&apos;s Jamie to remember?"
                value={trackingDraft.mindsetLog}
              />
              <div className="mt-3 flex justify-end">
                <button className="ghost-chip" onClick={onSaveMindset} type="button">
                  {saving.mindset ? 'Saving...' : 'Save note'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </TrackingCard>
    </div>
  )
}

function GoalsView({
  coachDraft,
  coachSuggestions,
  coachSummary,
  coachThread,
  goals,
  newGoal,
  onAddGoal,
  onChangeCoachDraft,
  onChangeGoal,
  onCoachSend,
  onDisablePush,
  onEnablePush,
  onSendTestReminder,
  onSaveReminder,
  push,
  reminderDraft,
  saving,
  settings,
  supportSaving,
}) {
  const recentGoals = goals.slice(0, 3)
  const olderGoals = goals.slice(3)

  return (
    <div className="grid gap-4">
      <section className="surface overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,106,175,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(141,103,255,0.16),transparent_30%)]" />
        <div className="relative">
          <div className="micro-label">Your intention</div>
          <h2 className="display-copy mt-3 text-[1.9rem] leading-[0.96] text-white">
            What do you want to protect today?
          </h2>
          <p className="mt-3 text-[14px] leading-7 text-white/72">
            Keep it specific, kind, and real enough that you can actually follow through.
          </p>

          <div className="mt-5 flex items-center gap-3 rounded-[22px] border border-white/8 bg-white/6 p-2">
            <input
              className="w-full bg-transparent px-3 py-3 text-[14px] text-white outline-none placeholder:text-white/34"
              onChange={(event) => onChangeGoal(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') onAddGoal()
              }}
              placeholder="I will keep dinner simple and protein-forward..."
              type="text"
              value={newGoal}
            />
            <button className="primary-button w-auto px-4" onClick={onAddGoal} type="button">
              {saving ? <Check size={18} /> : <Plus size={18} />}
            </button>
          </div>

          {!goals.length && (
            <div className="mt-5 rounded-[22px] border border-white/8 bg-black/16 p-4">
              <p className="text-[14px] italic leading-7 text-white/74">
                I&apos;m starting with the woman in the mirror. If I want to take my life to a better place, I&apos;ll take a look at myself and make a change.
              </p>
              <div className="mt-3 text-right text-sm font-bold text-gold-300">
                — {USER_NAME}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="surface">
        <SectionHeader
          copy="These are the promises you made to yourself. Keep them close and keep them simple."
          kicker="Your wall"
          title={goals.length ? `${goals.length} promises saved` : 'Your wall is ready'}
        />

        <div className="mt-5 space-y-4">
          {goals.length ? (
            <>
              <div className="space-y-3">
                {recentGoals.map((goal) => (
                  <article
                    className="rounded-[22px] border border-white/8 bg-white/[0.05] p-4"
                    key={goal.id}
                  >
                    <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/42">
                      {formatGoalDate(goal)}
                    </div>
                    <p className="mt-3 text-[16px] leading-7 text-white/86">“{goal.text}”</p>
                  </article>
                ))}
              </div>

              {olderGoals.length > 0 && (
                <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
                  <div className="micro-label">Still on the wall</div>
                  <div className="mt-4 space-y-3">
                    {olderGoals.map((goal) => (
                      <article
                        className="rounded-[18px] border border-white/6 bg-white/[0.03] p-4"
                        key={goal.id}
                      >
                        <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/38">
                          {formatGoalDate(goal)}
                        </div>
                        <p className="mt-3 text-[15px] leading-7 text-white/76">
                          “{goal.text}”
                        </p>
                      </article>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-[22px] border border-white/8 bg-white/[0.04] p-4 text-[14px] leading-7 text-white/64">
              Add the first promise to yourself. Think more &quot;I will keep dinner simple
              and protein-forward&quot; and less &quot;I will suddenly become flawless.&quot;
            </div>
          )}
        </div>
      </section>

      <section className="surface">
        <SectionHeader
          copy="Less is better here. Set the kind of support that helps without making you feel watched."
          kicker="Quiet support"
          title="Let the app nudge you gently"
        />

        <div className="mt-5 grid gap-3">
          <PushSupportCard
            isMessagingConfigured={isMessagingConfigured}
            onDisablePush={onDisablePush}
            onEnablePush={onEnablePush}
            onSendTestReminder={onSendTestReminder}
            push={push}
            sending={supportSaving.pushTest}
          />
          <CalendarSupportCard calendarUrl="/Jamie_90_Day_Burn_Reminders.ics" />
          <ReminderRow
            copy="A simple prompt to open your plan and get the room set up."
            enabled={reminderDraft.dailyEnabled}
            label="Daily burn nudge"
            onSave={onSaveReminder}
            reminderId="daily"
            saving={supportSaving.reminders}
            time={reminderDraft.dailyTime}
          />
          <ReminderRow
            copy="A softer evening check so calories, water, and one honest thought do not drift."
            enabled={reminderDraft.closeoutEnabled}
            label="Evening closeout"
            onSave={onSaveReminder}
            reminderId="closeout"
            saving={supportSaving.reminders}
            time={reminderDraft.closeoutTime}
          />
        </div>

        <div className="mt-4 rounded-[20px] border border-white/8 bg-white/[0.04] p-4 text-[13px] leading-6 text-white/64">
          {settings?.displayName || USER_NAME}, this should feel like a hand on your back,
          not someone yelling in your ear.
        </div>
      </section>

      <section className="surface">
        <SectionHeader
          copy="Use this when you need a steadier voice, a simpler next move, or a place to say what is actually hard."
          kicker="Coach space"
          title={coachSummary.title}
        />

        <div className="mt-5 rounded-[22px] border border-white/8 bg-white/[0.05] p-4">
          <p className="text-[14px] leading-7 text-white/82">{coachSummary.body}</p>
          <p className="mt-3 text-[12px] font-bold uppercase tracking-[0.16em] text-white/40">
            {coachSummary.nextStep}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {coachSuggestions.map((suggestion) => (
            <button
              className="ghost-chip"
              key={suggestion}
              onClick={() => onCoachSend(suggestion)}
              type="button"
            >
              {suggestion}
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-[22px] border border-white/8 bg-white/[0.04] p-4">
          <div className="space-y-3">
            {coachThread.length ? (
              coachThread.slice(-4).map((entry) => (
                <article
                  className={clsx(
                    'rounded-[18px] px-4 py-3 text-[14px] leading-7',
                    entry.role === 'assistant'
                      ? 'border border-plum-300/16 bg-plum-300/[0.08] text-white/84'
                      : 'border border-white/8 bg-white/[0.04] text-white/72',
                  )}
                  key={entry.id}
                >
                  <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/38">
                    {entry.role === 'assistant' ? 'Coach' : 'Jamie'}
                  </div>
                  <p className="mt-2">{entry.message}</p>
                </article>
              ))
            ) : (
              <div className="rounded-[18px] border border-white/8 bg-white/[0.04] p-4 text-[14px] leading-7 text-white/64">
                Start with one honest sentence. This space works best when you say what is
                true instead of what sounds impressive.
              </div>
            )}
          </div>

          <div className="mt-4 flex gap-3">
            <textarea
              className="field-shell min-h-[96px] resize-none"
              onChange={(event) => onChangeCoachDraft(event.target.value)}
              placeholder="What feels hard today?"
              value={coachDraft}
            />
          </div>
          <button className="primary-button mt-3" onClick={() => onCoachSend()} type="button">
            {supportSaving.coach ? (
              'Saving...'
            ) : (
              <>
                <Send size={16} />
                <span className="ml-2">Send to coach space</span>
              </>
            )}
          </button>
        </div>
      </section>
    </div>
  )
}

function DataView({
  adherenceDelta,
  adherencePercent,
  completedWorkouts,
  cumulativeDeficit,
  currentDay,
  currentWeekAdherence,
  deficitBars,
  earliestMeasurement,
  earliestScan,
  hydrationStreak,
  inbodyDraft,
  inbodyDue,
  latestMeasurement,
  latestScan,
  measurementDraft,
  measurementsDue,
  mindsetEntries,
  onChangeInbody,
  onChangeMeasurements,
  onSaveInbody,
  onSaveMeasurements,
  previousMeasurement,
  previousScan,
  saving,
  trackingDaysLogged,
  weeklyReset,
  weekDeficit,
  workoutsThisWeek,
  hydrationThisWeek,
  mindsetThisWeek,
}) {
  const waistTotal = difference(latestMeasurement?.waist, earliestMeasurement?.waist)
  const hipsTotal = difference(latestMeasurement?.hips, earliestMeasurement?.hips)
  const chestTotal = difference(latestMeasurement?.chest, earliestMeasurement?.chest)
  const thighTotal = difference(latestMeasurement?.rThigh, earliestMeasurement?.rThigh)
  const bicepTotal = difference(latestMeasurement?.rBicep, earliestMeasurement?.rBicep)
  const smmTotal = difference(latestScan?.smm, earliestScan?.smm)
  const pbfTotal = difference(latestScan?.pbf, earliestScan?.pbf)
  const bmrTotal = difference(latestScan?.bmr, earliestScan?.bmr)

  const waistWeek = difference(latestMeasurement?.waist, previousMeasurement?.waist)
  const smmWeek = difference(latestScan?.smm, previousScan?.smm)
  const pbfWeek = difference(latestScan?.pbf, previousScan?.pbf)
  const ringOffset = 251 - (251 * adherencePercent) / 100
  const bodyProofNote = buildBodyProofNote({
    latestMeasurement,
    earliestMeasurement,
    latestScan,
    earliestScan,
  })
  const [showDetails, setShowDetails] = useState(false)
  const [showPerspective, setShowPerspective] = useState(false)

  return (
    <div className="grid gap-4">
      <section className="surface">
        <SectionHeader
          copy="This is where your measurements and scan data can remind you that progress is still happening."
          kicker="Your progress"
          title="What your body is showing"
        />

        {!latestMeasurement && !latestScan ? (
          <div className="mt-5 rounded-[22px] border border-white/8 bg-white/[0.04] p-4 text-[14px] leading-7 text-white/64">
            There is no progress data here yet. Once you add measurements or a scan, this
            space starts telling a kinder story than the scale by itself.
          </div>
        ) : (
          <>
            <div className="no-scrollbar mt-5 grid auto-cols-[84%] grid-flow-col gap-3 overflow-x-auto pb-1">
              <ProofCard
                helper={waistWeek === null ? 'Need one more tape entry' : formatDeltaText(waistWeek, 'in', 'down')}
                label="Waist"
                tone={getTrendTone(waistTotal, 'down')}
                value={formatMetricValue(latestMeasurement?.waist, 'in')}
              />
              <ProofCard
                helper={formatDeltaText(hipsTotal, 'in', 'down')}
                label="Hips"
                tone={getTrendTone(hipsTotal, 'down')}
                value={formatMetricValue(latestMeasurement?.hips, 'in')}
              />
              <ProofCard
                helper={formatDeltaText(smmWeek, 'lb', 'up')}
                label="SMM"
                tone={getTrendTone(smmTotal, 'up')}
                value={formatMetricValue(latestScan?.smm, 'lb')}
              />
              <ProofCard
                helper={formatDeltaText(pbfWeek, '%', 'down')}
                label="PBF"
                tone={getTrendTone(pbfTotal, 'down')}
                value={formatMetricValue(latestScan?.pbf, '%')}
              />
            </div>

            <div className="mt-5 rounded-[22px] border border-white/8 bg-white/6 p-4">
              <div className="micro-label">What this means</div>
              <p className="mt-2 text-[14px] leading-7 text-white/80">{bodyProofNote}</p>
            </div>

            <div className="mt-4 rounded-[22px] border border-white/8 bg-white/[0.04] p-4">
              <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/42">
                Changes since your first entry
              </div>
              <div className="mt-4 space-y-3">
                <TrendRow label="Chest" trend={chestTotal} unit="in" better="down" />
                <TrendRow label="Waist" trend={waistTotal} unit="in" better="down" />
                <TrendRow label="Hips" trend={hipsTotal} unit="in" better="down" />
                <TrendRow label="R. Thigh" trend={thighTotal} unit="in" better="down" />
                <TrendRow label="R. Bicep" trend={bicepTotal} unit="in" better="up" />
                <TrendRow label="SMM" trend={smmTotal} unit="lb" better="up" />
                <TrendRow label="PBF" trend={pbfTotal} unit="%" better="down" />
                <TrendRow label="BMR" trend={bmrTotal} unit="kcal" better="up" />
              </div>
            </div>
          </>
        )}

        {(measurementsDue || inbodyDue) && (
          <div className="mt-4 rounded-[22px] border border-white/8 bg-white/[0.04] p-4 text-[13px] leading-6 text-white/64">
            {measurementsDue && 'Your measurements are due again. '}
            {inbodyDue && 'Your scan data is due again. '}
            Fresh data helps this process feel clearer and more trustworthy.
          </div>
        )}
      </section>

      <section className="surface">
        <SectionHeader
          copy="Keep your measurements and scan notes together so your progress stays easy to read."
          kicker="Check in"
          title="Add new progress data"
        />

        <div className="mt-5 grid gap-4">
          <div className="rounded-[24px] border border-mint-300/12 bg-mint-300/[0.08] p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-mint-200">
                  Measurements
                </div>
                <p className="mt-2 text-[13px] leading-6 text-white/70">
                  These often show progress before the scale decides to be helpful.
                </p>
              </div>
              <span className="ghost-chip">
                {measurementsDue ? 'Recommended now' : 'Current enough'}
              </span>
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
              {saving.measurement ? 'Saving...' : 'Save progress numbers'}
            </button>
          </div>

          <div className="rounded-[24px] border border-gold-300/12 bg-gold-300/[0.08] p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-gold-300">
                  InBody scan
                </div>
                <p className="mt-2 text-[13px] leading-6 text-white/70">
                  This is just information. It is here to help you, not judge you.
                </p>
              </div>
              <span className="ghost-chip">
                {inbodyDue ? 'Recommended now' : 'Current enough'}
              </span>
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
                hint="The truest read on fat-loss trend."
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
      </section>

      <section className="surface">
        <SectionHeader
          copy="This is the calm read on how your week is going."
          kicker="This week"
          title="How things are moving"
        />

        <div className="mt-5 grid gap-4">
          <div className="flex justify-start">
            <button className="ghost-chip" onClick={() => setShowDetails((current) => !current)} type="button">
              {showDetails ? 'Hide details' : 'See details'}
            </button>
          </div>

          <div className="rounded-[22px] border border-white/8 bg-white/6 p-4">
            <div className="micro-label">Your week</div>
            <div className="mt-4 space-y-4">
              <div>
                <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/42">
                  What went well
                </div>
                <p className="mt-2 text-[14px] leading-7 text-white/82">{weeklyReset.recap}</p>
              </div>
              <div className="rounded-[18px] border border-gold-300/16 bg-gold-300/10 p-4">
                <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-gold-300">
                  What the data is saying
                </div>
                <p className="mt-2 text-[14px] leading-7 text-[#ffecc4]">
                  {weeklyReset.highlight}
                </p>
              </div>
              <div className="rounded-[18px] border border-blush-300/16 bg-blush-300/10 p-4">
                <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-blush-200">
                  What to focus on next
                </div>
                <p className="mt-2 text-[14px] leading-7 text-blush-50/92">
                  {weeklyReset.focus}
                </p>
              </div>
            </div>
          </div>

          {showDetails && (
            <>
              <div className="flex items-center justify-between gap-4 rounded-[24px] border border-white/8 bg-white/[0.04] p-4">
                <div>
                  <div className="micro-label">Consistency</div>
                  <div className="display-copy mt-3 text-[2.3rem] leading-none text-white">
                    {adherencePercent}%
                  </div>
                  <div
                    className={clsx(
                      'mt-2 flex items-center gap-1 text-sm font-bold',
                      adherenceDelta >= 0 ? 'text-mint-300' : 'text-blush-200',
                    )}
                  >
                    {adherenceDelta >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    {adherenceDelta >= 0 ? '+' : ''}
                    {adherenceDelta}% versus last week
                  </div>
                </div>

                <div className="relative h-24 w-24 flex-shrink-0">
                  <svg className="h-full w-full -rotate-90">
                    <circle
                      className="text-white/8"
                      cx="48"
                      cy="48"
                      fill="transparent"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                    />
                    <circle
                      className="text-blush-400"
                      cx="48"
                      cy="48"
                      fill="transparent"
                      r="40"
                      stroke="currentColor"
                      strokeDasharray="251"
                      strokeDashoffset={ringOffset}
                      strokeLinecap="round"
                      strokeWidth="8"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Zap className="text-gold-300" size={22} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <MiniStatus label="Burns" tone="good" value={String(workoutsThisWeek)} />
                <MiniStatus label="Hydration" tone="good" value={String(hydrationThisWeek)} />
                <MiniStatus label="Mindset" tone="good" value={String(mindsetThisWeek)} />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <AnalyticStat
                  icon={<Flame className="text-blush-300" size={16} />}
                  label="Burns logged"
                  value={String(completedWorkouts)}
                />
                <AnalyticStat
                  icon={<Droplets className="text-sky-300" size={16} />}
                  label="Hydration streak"
                  value={String(hydrationStreak)}
                />
                <AnalyticStat
                  icon={<PieChart className="text-gold-300" size={16} />}
                  label="Week deficit"
                  value={formatSignedNumber(weekDeficit)}
                />
                <AnalyticStat
                  icon={<Brain className="text-plum-300" size={16} />}
                  label="Mindset notes"
                  value={String(mindsetEntries)}
                />
              </div>

              <div className="rounded-[22px] border border-white/8 bg-white/[0.04] p-4">
                <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/42">
                  Last seven days
                </div>

                <div className="mt-4 flex h-40 items-end justify-between gap-2">
                  {deficitBars.map((bar) => (
                    <div className="flex w-full flex-col items-center gap-2" key={bar.label}>
                      <div
                        className={clsx(
                          'w-full rounded-t-[12px] rounded-b-[8px]',
                          bar.value >= 0
                            ? 'bg-gradient-to-t from-mint-500 to-mint-300'
                            : 'bg-gradient-to-t from-blush-500 to-blush-300',
                        )}
                        style={{ height: `${bar.height}%` }}
                      />
                      <span className="text-[10px] font-extrabold text-white/40">
                        {bar.label}
                      </span>
                    </div>
                  ))}
                </div>

                <p className="mt-4 text-center text-[12px] leading-6 text-white/54">
                  Positive bars mean you logged a deficit. Negative bars mean the day closed over target or without one.
                </p>

                <div className="mt-4 text-[13px] leading-6 text-white/66">
                  Total logged deficit so far:{' '}
                  <span className="font-bold text-white">
                    {formatSignedNumber(cumulativeDeficit)}
                  </span>
                  . Tracking days saved:{' '}
                  <span className="font-bold text-white">{trackingDaysLogged}</span>. Week score:{' '}
                  <span className="font-bold text-white">{currentWeekAdherence}%</span>. Day{' '}
                  <span className="font-bold text-white">{currentDay || 0}</span> of{' '}
                  <span className="font-bold text-white">{TOTAL_DAYS}</span>.
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      <section className="surface">
        <SectionHeader
          copy="Open this when you need a steadier way to think about the process."
          kicker="A calmer perspective"
          title="If your brain starts spiraling"
        />

        <div className="mt-5 flex justify-start">
          <button className="ghost-chip" onClick={() => setShowPerspective((current) => !current)} type="button">
            {showPerspective ? 'Close this' : 'Open this'}
          </button>
        </div>

        {showPerspective && (
          <div className="no-scrollbar mt-5 grid auto-cols-[84%] grid-flow-col gap-3 overflow-x-auto pb-1">
            {PERSPECTIVE_CARDS.map((card) => (
              <article
                className="rounded-[24px] border border-white/8 bg-[linear-gradient(155deg,rgba(255,106,175,0.14),rgba(255,255,255,0.04)_52%,rgba(141,103,255,0.14))] p-5"
                key={card.title}
              >
                <div className="micro-label">{card.category}</div>
                <h3 className="mt-3 text-lg font-extrabold text-white">{card.title}</h3>
                <p className="mt-3 text-[14px] leading-7 text-white/74">{card.body}</p>
                <div className="mt-4 rounded-[18px] border border-white/8 bg-white/8 p-3 text-[13px] leading-6 text-white/82">
                  <span className="font-bold text-gold-300">Coach note:</span> {card.takeaway}
                </div>
              </article>
            ))}
          </div>
        )}
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

function PushSupportCard({
  isMessagingConfigured,
  onDisablePush,
  onEnablePush,
  onSendTestReminder,
  push,
  sending,
}) {
  const statusLine = !isMessagingConfigured
    ? 'Add the web push key in env first.'
    : !push.supported
      ? 'This browser does not support web push here.'
      : push.permission === 'denied'
        ? 'Notifications are blocked in this browser right now.'
        : push.enabled
          ? 'Push reminders are connected on this device.'
          : 'This device is not connected for push yet.'

  return (
    <div className="rounded-[22px] border border-white/8 bg-white/[0.04] p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Bell className="text-gold-300" size={16} />
            <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/42">
              Push support
            </div>
          </div>
          <p className="mt-3 text-[14px] leading-7 text-white/74">
            Let Jamie hear from the app at the right time, not just when she happens to
            remember to open it.
          </p>
          <p className="mt-3 text-[12px] font-bold uppercase tracking-[0.16em] text-white/40">
            {statusLine}
          </p>
        </div>
        {push.enabled ? (
          <div className="flex shrink-0 flex-col gap-2">
            <button
              className="primary-button w-auto px-4"
              disabled={sending}
              onClick={onSendTestReminder}
              type="button"
            >
              {sending ? 'Sending...' : 'Send test nudge'}
            </button>
            <button
              className="secondary-button w-auto px-4"
              disabled={push.loading || sending}
              onClick={onDisablePush}
              type="button"
            >
              Turn off
            </button>
          </div>
        ) : (
          <button
            className="primary-button w-auto shrink-0 px-4"
            disabled={
              push.loading || !push.canPrompt || !push.supported || !isMessagingConfigured
            }
            onClick={onEnablePush}
            type="button"
          >
            {push.loading ? 'Connecting...' : 'Turn on'}
          </button>
        )}
      </div>
    </div>
  )
}

function CalendarSupportCard({ calendarUrl }) {
  return (
    <div className="rounded-[22px] border border-white/8 bg-white/[0.04] p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <CalendarIcon className="text-gold-300" size={16} />
            <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/42">
              Calendar support
            </div>
          </div>
          <p className="mt-3 text-[14px] leading-7 text-white/74">
            If push feels messy, add the full 90-day reminder plan to Jamie&apos;s
            calendar once and let it meet her there each day.
          </p>
          <p className="mt-3 text-[12px] leading-6 text-white/46">
            This includes a 7:00 AM workout check-in, nightly closeout reminders,
            weekly reset notes, and progress check-ins. If your phone downloads the
            file first, just tap it once to add it to Calendar.
          </p>
        </div>
        <a
          className="primary-button inline-flex w-auto shrink-0 items-center justify-center px-4"
          href={calendarUrl}
        >
          Add to Calendar
        </a>
      </div>
    </div>
  )
}

function ReminderRow({ copy, enabled, label, onSave, reminderId, saving, time }) {
  return (
    <div className="rounded-[22px] border border-white/8 bg-white/[0.04] p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Bell className="text-gold-300" size={16} />
            <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/42">
              {label}
            </div>
          </div>
          <p className="mt-3 text-[14px] leading-7 text-white/74">{copy}</p>
        </div>
        <button
          className={clsx(
            enabled ? 'good-button px-4' : 'secondary-button px-4',
            'w-auto shrink-0',
          )}
          disabled={saving}
          onClick={() => onSave(reminderId, { enabled: !enabled, time })}
          type="button"
        >
          {enabled ? 'On' : 'Off'}
        </button>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <input
          className="field-shell max-w-[140px]"
          disabled={!enabled || saving}
          onChange={(event) =>
            onSave(reminderId, { enabled, time: event.target.value })
          }
          type="time"
          value={time}
        />
        <p className="text-[12px] leading-6 text-white/46">
          Keep this at a time when a tiny nudge is actually useful.
        </p>
      </div>
    </div>
  )
}

function QuickStat({ label, value }) {
  return (
    <div className="stat-pill">
      <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/42">
        {label}
      </div>
      <div className="mt-2 text-lg font-extrabold text-white">{value}</div>
    </div>
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

function NinetyDayBar({ color, currentDay, history, label }) {
  return (
    <div className="mt-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/42">
          {label}
        </span>
        <span className="text-[11px] font-bold text-white/58">Day {currentDay || 0}</span>
      </div>
      <div className="no-scrollbar flex gap-1 overflow-x-auto pb-1">
        {history.map((status, index) => (
          <div
            className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-[8px] border border-white/8 bg-white/[0.04]"
            key={`${label}-${index + 1}`}
          >
            {status === true && <CheckCircle2 className={color} size={16} />}
            {status === false && <XCircle className="text-white/20" size={16} />}
          </div>
        ))}
      </div>
    </div>
  )
}

function AnalyticStat({ icon, label, value }) {
  return (
    <div className="rounded-[20px] border border-white/8 bg-white/[0.04] p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/42">
          {label}
        </div>
        <div>{icon}</div>
      </div>
      <div className="mt-3 text-xl font-extrabold text-white">{value}</div>
    </div>
  )
}

function ProofCard({ helper, label, tone, value }) {
  return (
    <article
      className={clsx(
        'rounded-[24px] border p-5',
        tone === 'good' && 'border-mint-400/16 bg-gradient-to-br from-mint-400/10 to-transparent',
        tone === 'warning' && 'border-gold-300/16 bg-gradient-to-br from-gold-300/10 to-transparent',
        tone === 'neutral' && 'border-white/8 bg-white/[0.04]',
      )}
    >
      <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/42">
        {label}
      </div>
      <div className="display-copy mt-4 text-[2rem] leading-none text-white">{value}</div>
      <div
        className={clsx(
          'mt-4 text-[13px] leading-6',
          tone === 'good' && 'text-mint-200',
          tone === 'warning' && 'text-[#ffe7b2]',
          tone === 'neutral' && 'text-white/58',
        )}
      >
        {helper}
      </div>
    </article>
  )
}

function TrendRow({ label, trend, unit, better }) {
  const displayValue =
    trend === null || typeof trend === 'undefined'
      ? 'No data yet'
      : `${trend > 0 ? '+' : ''}${trend} ${unit}`

  const improved = trend === null ? null : better === 'down' ? trend < 0 : trend > 0
  const isDown = trend === null ? false : trend < 0

  return (
    <div className="flex items-center justify-between border-b border-white/6 py-2.5 last:border-0 last:pb-0">
      <span className="text-sm font-medium text-white/72">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-white">{displayValue}</span>
        <div
          className={clsx(
            'flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.04]',
            improved === null && 'text-white/34',
            improved === true && 'text-mint-300',
            improved === false && 'text-blush-200',
          )}
        >
          {improved === null ? (
            <Sparkles size={14} />
          ) : isDown ? (
            <TrendingDown size={14} />
          ) : (
            <TrendingUp size={14} />
          )}
        </div>
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
        <h1 className="mt-5 text-2xl font-extrabold text-white">Building Jamie&apos;s dashboard...</h1>
        <p className="mt-3 text-[14px] leading-7 text-white/62">
          Pulling in your workouts, check-ins, goals, and progress data.
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

function buildWorkoutPlayerSubtitle({
  currentVideoState,
  trackingLoggedToday,
  workout,
  workoutComplete,
}) {
  if (!workout) {
    return 'Your workout will show up here when the program day is live.'
  }

  if (workout.type === 'rest') {
    return workoutComplete
      ? 'Your recovery is already logged. Open this only if you want a calm reset.'
      : 'Open this when you are ready for a calm recovery block. Gentle still counts.'
  }

  if (workoutComplete) {
    return trackingLoggedToday
      ? 'Your burn is already done. Reopen it only if you want to review the flow.'
      : 'Your burn is already done. Tonight just needs a clean closeout.'
  }

  if (currentVideoState?.opened) {
    return 'You already started this today. Pick it back up from where your focus still feels steady.'
  }

  return 'Press play, follow the structure, and keep every rep inside the range that still feels strong and safe.'
}

function buildCoachSummary({
  day,
  hydrationStreak,
  inbodyDue,
  measurementsDue,
  trackingLoggedToday,
  workout,
  workoutComplete,
  workoutStreak,
}) {
  if (!day || !workout) {
    return {
      title: 'We are getting ready',
      body: `Day one starts on ${PROGRAM_START}. Until then, let this stay light and simple.`,
      nextStep: 'Come back when the first workout is live.',
    }
  }

  if (!workoutComplete) {
    return {
      title: workout.type === 'rest' ? 'Let recovery count' : 'Keep the bar low enough to start',
      body:
        workout.type === 'rest'
          ? 'A short walk, a little mobility, and a calmer body still count as doing the plan well today.'
          : `You do not need to prove anything in ${workout.name}. Set the room up, press play, and let the first round be enough to get you moving.`,
      nextStep:
        workout.type === 'rest'
          ? 'Choose the easiest recovery action and let that be enough.'
          : 'Start with setup and the first round only.',
    }
  }

  if (!trackingLoggedToday) {
    return {
      title: 'Close the loop tonight',
      body: 'Your hard part is already done. Tonight just needs water, calories, and one honest note so tomorrow does not start in a fog.',
      nextStep: 'Finish your check-in before the day is over.',
    }
  }

  if (measurementsDue || inbodyDue) {
    return {
      title: 'Let your proof stay visible',
      body: 'Fresh body data can calm your brain down faster than guessing. You do not need perfect numbers, just current ones.',
      nextStep: measurementsDue ? 'Add your measurements next.' : 'Add your latest scan next.',
    }
  }

  return {
    title: 'This is what steady looks like',
    body: `You have a ${workoutStreak}-day workout streak and a ${hydrationStreak}-day hydration streak right now. That is enough proof to trust the pattern a little more.`,
    nextStep: 'Protect the same rhythm tomorrow.',
  }
}

function buildCoachSuggestions({
  day,
  inbodyDue,
  measurementsDue,
  trackingLoggedToday,
  workout,
  workoutComplete,
}) {
  if (!day || !workout) {
    return ['What should I focus on first?', 'How do I make day one feel easier?']
  }

  const suggestions = []

  if (!workoutComplete) {
    suggestions.push('Help me start without overthinking it.')
    suggestions.push(
      workout.type === 'rest'
        ? 'What would count as enough recovery today?'
        : 'How should I scale this workout today?',
    )
  }

  if (workoutComplete && !trackingLoggedToday) {
    suggestions.push('What matters most tonight?')
  }

  if (measurementsDue || inbodyDue) {
    suggestions.push('Why should I log my progress again?')
  }

  suggestions.push('I need a calmer way to think about this.')

  return suggestions.slice(0, 3)
}

function buildCoachReply({
  message,
  summary,
  inbodyDue,
  measurementsDue,
  trackingLoggedToday,
  workout,
  workoutComplete,
}) {
  const text = String(message).toLowerCase()

  if (matchesAny(text, ['tired', 'exhausted', 'drained', 'low energy'])) {
    return 'Then make today smaller, not dramatic. Set the room up, do the first round, and let that round decide whether your body can give you more.'
  }

  if (matchesAny(text, ['scale', 'weight', 'fat', 'bigger', 'bloated'])) {
    return 'The scale is one signal, not the whole truth. Keep collecting proof from workouts, measurements, and scans so one noisy number does not get to run the whole day.'
  }

  if (matchesAny(text, ['food', 'eat', 'hungry', 'snack', 'craving'])) {
    return 'Make the next food choice boring and protein-forward. A calmer dinner usually helps more than trying to repair the whole day with guilt.'
  }

  if (matchesAny(text, ['time', 'busy', 'schedule', 'late'])) {
    return 'Protect the start, not the perfect session. Setup, first round, and one honest finish still beat waiting for a cleaner day.'
  }

  if (matchesAny(text, ['motivation', 'focus', 'disciplined', 'mindset'])) {
    return 'You do not need a better mood before you begin. You need one small action that makes the mood a little less important.'
  }

  if (!workoutComplete && workout?.type !== 'rest') {
    return `Today only needs one clean pass through ${workout.name}. Use the lighter version if you need it and let solid form be the standard.`
  }

  if (!workoutComplete && workout?.type === 'rest') {
    return 'Keep recovery gentle on purpose. A walk, some mobility, and a little water still move the plan forward.'
  }

  if (workoutComplete && !trackingLoggedToday) {
    return 'The workout already counts. Close tonight out with water, calories, and one honest line so you can leave the day feeling finished.'
  }

  if (measurementsDue || inbodyDue) {
    return measurementsDue
      ? 'Fresh measurements can calm your brain down faster than mirror guessing. Keep the tape honest and let the numbers just be information.'
      : 'A fresh scan is not a judgment. It is just a clearer read on what this phase is doing for you.'
  }

  return `${summary.body} ${summary.nextStep}`
}

function matchesAny(text, keywords) {
  return keywords.some((keyword) => text.includes(keyword))
}

async function requestCoachReply(payload) {
  try {
    const response = await fetch('/api/coach', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        context: {
          coachBody: payload.coachSummary?.body || '',
          coachTitle: payload.coachSummary?.title || '',
          day: payload.day || 0,
          goal: payload.goal || '',
          hydrationStreak: payload.hydrationStreak || 0,
          inbodyDue: Boolean(payload.inbodyDue),
          measurementsDue: Boolean(payload.measurementsDue),
          memorySummary:
            payload.coachMemory?.memorySummary ||
            payload.coachMemory?.latestReply ||
            '',
          nextStep: payload.coachSummary?.nextStep || '',
          phaseName: payload.phaseName || '',
          trackingLoggedToday: Boolean(payload.trackingLoggedToday),
          workoutComplete: Boolean(payload.workoutComplete),
          workoutName: payload.workout?.name || '',
          workoutStreak: payload.workoutStreak || 0,
        },
        messages: [
          ...(payload.recentMessages || []).map((entry) => ({
            message: entry.message,
            role: entry.role,
          })),
          {
            message: payload.message,
            role: 'user',
          },
        ],
      }),
    })

    const result = await response.json()
    if (!response.ok || !result?.success) {
      throw new Error(result?.error || 'Coach route could not answer just yet.')
    }

    return result
  } catch (error) {
    console.warn('Coach route failed, falling back to local coach logic.', error)
    return null
  }
}

function buildHeroCopy({
  day,
  workout,
  workoutComplete,
  trackingLoggedToday,
  measurementsDue,
  inbodyDue,
}) {
  if (!day || !workout) {
    return `You start on ${PROGRAM_START}. Until then, this space is getting ready to make day one feel easy to step into.`
  }

  if (!workoutComplete) {
    if (workout.type === 'rest') {
      return `${USER_NAME}, this is a recovery day. Let gentle still count. A little movement, a little care, and the day still moves you forward.`
    }

    return `${USER_NAME}, let today stay simple. Start the workout, stay in your own pace, and give yourself one finished promise before the day gets noisy.`
  }

  if (!trackingLoggedToday) {
    return 'Your workout is already done. Give yourself a clean ending tonight with water, calories, and a few honest words.'
  }

  if (inbodyDue) {
    return 'Your pattern is still unfolding. A fresh scan would make the picture clearer without turning it into a big emotional event.'
  }

  if (measurementsDue) {
    return 'Your measurements are due again. A few fresh numbers could help the mirror and the data tell the same story.'
  }

  return 'You did enough for today. Let the calm, repeatable work be the whole assignment.'
}

function buildRecommendedAction({
  day,
  workout,
  workoutComplete,
  trackingLoggedToday,
  measurementsDue,
  inbodyDue,
}) {
  if (!day || !workout) {
    return 'Day one is coming. Once it starts, you will only need to follow the next step.'
  }

  if (!workoutComplete) {
    return workout.type === 'rest'
      ? 'Take the recovery day seriously, then come back tonight and finish your check-in.'
      : `Open ${workout.name}, use the version that feels strong and safe for your body, and log it when you finish.`
  }

  if (!trackingLoggedToday) {
    return 'Your workout is done. Finish the day with water, calories, and one honest note to yourself.'
  }

  if (measurementsDue) {
    return 'Add fresh measurements soon so your progress stays visible, not vague.'
  }

  if (inbodyDue) {
    return 'A fresh InBody scan would help you see the trend a little more clearly.'
  }

  return 'Today is on track. Let that be enough, and come back the same way tomorrow.'
}

function buildWeeklyReset({
  workoutsThisWeek,
  hydrationThisWeek,
  mindsetThisWeek,
  weekDeficit,
  measurementsDue,
  inbodyDue,
  latestScan,
  previousScan,
}) {
  let recap =
    'Even a mixed week can still move you forward when the pattern stays alive.'

  if (latestScan && previousScan) {
    const pbfChange = difference(latestScan.pbf, previousScan.pbf)
    const smmChange = difference(latestScan.smm, previousScan.smm)

    if (pbfChange !== null && pbfChange < 0) {
      recap =
        'This week gave you visible progress. Your body-fat trend is moving in a helpful direction, and that is a real win.'
    } else if (smmChange !== null && smmChange > 0) {
      recap =
        'You held or gained muscle this week. That is exactly the kind of quiet win that changes how the whole phase feels.'
    }
  } else if (workoutsThisWeek >= 4 && hydrationThisWeek >= 4) {
    recap =
      'You followed through this week. The basics showed up often enough for the work to really count.'
  } else if (mindsetThisWeek >= 3) {
    recap =
      'You kept checking in with yourself this week, and that usually makes the physical side easier to trust and repeat.'
  }

  let highlight = 'You have not added fresh progress data yet this week.'
  if (latestScan && previousScan) {
    const pbfChange = difference(latestScan.pbf, previousScan.pbf)
    const smmChange = difference(latestScan.smm, previousScan.smm)

    if (pbfChange !== null && pbfChange < 0) {
      highlight = `${Math.abs(pbfChange)}% lower in PBF than the last scan. That is a clean, meaningful trend.`
    } else if (smmChange !== null && smmChange > 0) {
      highlight = `Your SMM is up ${smmChange} lb from the last scan. That is strong body-composition progress.`
    } else {
      highlight = 'You logged a fresh scan, and it now belongs to the longer trend. That still counts as progress.'
    }
  } else if (inbodyDue) {
    highlight = 'Your next scan is due, so the next layer of progress is ready to be collected.'
  } else if (measurementsDue) {
    highlight = 'Your measurements are due again. Inches often show the win before the scale ever does.'
  }

  let focus =
    'Keep the next week boring in the best way: same structure, same honesty, same follow-through.'

  if (workoutsThisWeek < 4) {
    focus =
      'Protect your workout start time first. The easiest way to raise consistency is making the workout easier to begin.'
  } else if (hydrationThisWeek < 4) {
    focus =
      'Give yourself one less decision next week by choosing a simple water target and repeating it.'
  } else if (mindsetThisWeek < 3) {
    focus =
      'Leave yourself a few honest lines most nights. That little reflection can calm the whole process down.'
  } else if (weekDeficit <= 0) {
    focus =
      'Use one or two protein-forward defaults this week so protecting the deficit feels easier and less exhausting.'
  } else if (inbodyDue) {
    focus =
      'Book or log your next scan so this phase keeps feeling visible instead of vague.'
  } else if (measurementsDue) {
      focus =
        'Take your next measurements soon so the changes you feel can have numbers standing beside them.'
  }

  return { recap, highlight, focus }
}

function buildBodyProofNote({
  latestMeasurement,
  earliestMeasurement,
  latestScan,
  earliestScan,
}) {
  const waistShift = difference(latestMeasurement?.waist, earliestMeasurement?.waist)
  const pbfShift = difference(latestScan?.pbf, earliestScan?.pbf)
  const smmShift = difference(latestScan?.smm, earliestScan?.smm)

  if (waistShift !== null && waistShift < 0 && pbfShift !== null && pbfShift < 0) {
    return 'This is one of those quiet wins turning into something you can really see. Your waist and body-fat trend are moving together, which is exactly the kind of alignment that helps the process feel real.'
  }

  if (smmShift !== null && smmShift > 0 && pbfShift !== null && pbfShift <= 0) {
    return 'Holding or building muscle while body-fat percentage holds or improves is very strong progress. You are not spinning your wheels.'
  }

  if (waistShift !== null && waistShift < 0) {
    return 'A smaller waist measurement still counts, even if the rest of the data looks quieter. Little shifts like this usually stack up before they shout.'
  }

  if (latestMeasurement || latestScan) {
    return 'The data is still young, and that is okay. Keep collecting it and let the trend become obvious before you judge it.'
  }

  return 'There is no progress data here yet, but this space is ready when you are.'
}

function indexById(entries) {
  return entries.reduce((accumulator, entry) => {
    accumulator[entry.id] = entry
    return accumulator
  }, {})
}

function hasTrackingEntry(entry) {
  if (!entry) return false
  return (
    entry.caloricDeficit === 0 ||
    Number.isFinite(entry.caloricDeficit) ||
    typeof entry.hydrationTargetMet === 'boolean' ||
    Boolean(entry.mindsetTitle?.trim()) ||
    Boolean(entry.mindsetLog?.trim())
  )
}

function valueToInput(value) {
  return value === 0 || Number.isFinite(value) ? String(value) : ''
}

function getPreviousEntry(entries) {
  if (entries.length < 2) return null
  return [...entries].sort((left, right) => left.id.localeCompare(right.id)).at(-2)
}

function getDateKeysForDayRange(start, end) {
  const keys = []
  for (let day = start; day <= end; day += 1) {
    keys.push(getLocalDateKey(getProgramDateForDay(day)))
  }
  return keys
}

function getHydrationStreak(trackingEntries, todayKey) {
  const keyed = indexById(trackingEntries)
  let streak = 0
  let cursor = todayKey

  while (keyed[cursor]?.hydrationTargetMet === true) {
    streak += 1
    cursor = shiftDateKey(cursor, -1)
  }

  return streak
}

function buildTimelineHistory(elapsedDays, type, recordsByDate) {
  return Array.from({ length: TOTAL_DAYS }, (_, index) => {
    const day = index + 1
    if (day > elapsedDays) return null

    const dateKey = getLocalDateKey(getProgramDateForDay(day))
    const record = recordsByDate[dateKey]

    if (type === 'workout') return Boolean(record?.completed)
    if (type === 'tracking') return hasTrackingEntry(record)
    if (type === 'deficit') return record ? Number(record.caloricDeficit) > 0 : false
    if (type === 'hydration') return record ? record.hydrationTargetMet === true : false
    return record ? Boolean(record.mindsetLog?.trim()) : false
  })
}

function buildWeeklyDeficitBars(currentDay, trackingByDate) {
  if (!currentDay) {
    return Array.from({ length: 7 }, (_, index) => ({
      label: `D${index + 1}`,
      value: 0,
      height: 12,
    }))
  }

  const labels = []
  const values = []
  const startDay = Math.max(1, currentDay - 6)

  for (let day = startDay; day <= currentDay; day += 1) {
    const dateKey = getLocalDateKey(getProgramDateForDay(day))
    const deficit = Number(trackingByDate[dateKey]?.caloricDeficit) || 0
    labels.push(`D${day}`)
    values.push(deficit)
  }

  const maxValue = Math.max(...values.map((value) => Math.abs(value)), 1)

  return values.map((value, index) => ({
    label: labels[index],
    value,
    height: Math.max(12, Math.round((Math.abs(value) / maxValue) * 100)),
  }))
}

function getRoadmapSlice(currentWeek) {
  const start = Math.max(0, currentWeek - 2)
  const end = Math.min(PROGRAM_WEEKS.length, currentWeek + 2)
  return PROGRAM_WEEKS.slice(start, end)
}

function formatGoalDate(goal) {
  if (!goal?.createdAt?.toDate) return 'Just now'
  return goal.createdAt.toDate().toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

function formatSignedNumber(value) {
  return `${value > 0 ? '+' : ''}${value}`
}

function formatMetricValue(value, unit) {
  return value === null || typeof value === 'undefined' ? '—' : `${value}${unit ? ` ${unit}` : ''}`
}

function formatDeltaText(delta, unit, direction) {
  if (delta === null || typeof delta === 'undefined') return 'Need another entry to compare'
  if (delta === 0) return 'Flat versus the comparison point'
  const better = direction === 'down' ? delta < 0 : delta > 0
  const prefix = delta > 0 ? '+' : ''
  if (better) return `${prefix}${delta} ${unit} in the direction we want`
  return `${prefix}${delta} ${unit}; still useful feedback`
}

function getTrendTone(delta, betterDirection) {
  if (delta === null || typeof delta === 'undefined') return 'neutral'
  if (delta === 0) return 'neutral'
  const improved = betterDirection === 'down' ? delta < 0 : delta > 0
  return improved ? 'good' : 'warning'
}
