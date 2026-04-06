import { useEffect, useState } from 'react'
import clsx from 'clsx'
import {
  Activity,
  BarChart2,
  Brain,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
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
import WorkoutCoachPanel from './components/WorkoutCoachPanel'
import WorkoutPlayer from './components/WorkoutPlayer'
import {
  HELLO_LINES,
  KUROMI_LINES,
  PERSPECTIVE_CARDS,
  PROGRAM_START,
  TOTAL_DAYS,
  USER_NAME,
  formatLongDate,
  getLatestByDate,
  getLocalDateKey,
  getOverloadSummary,
  getOverloadTips,
  getPhaseForDay,
  getPhaseName,
  getProgramDay,
  getRestPlan,
  getWeekForDay,
  getWorkoutForDay,
  isInBodyDue,
  isMeasurementDue,
  numberOrNull,
  pickMotivationLine,
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

export default function App() {
  const [activeTab, setActiveTab] = useState('workout')
  const [trackingDraft, setTrackingDraft] = useState(EMPTY_TRACKING)
  const [measurementDraft, setMeasurementDraft] = useState(EMPTY_MEASUREMENTS)
  const [inbodyDraft, setInbodyDraft] = useState(EMPTY_INBODY)
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
  })
  const [toast, setToast] = useState('')

  const session = useFirebaseSession()
  const dashboard = useJamieDashboard(session.user)

  const todayKey = getLocalDateKey()
  const todayDay = getProgramDay(todayKey)
  const todayWorkout = todayDay ? getWorkoutForDay(todayDay) : null
  const currentWeek = todayDay ? getWeekForDay(todayDay) : 1
  const currentPhase = todayDay ? getPhaseForDay(todayDay) : 1
  const currentPhaseName = getPhaseName(currentPhase)

  const workoutsByDate = indexById(dashboard.workouts)
  const trackingByDate = indexById(dashboard.tracking)
  const measurementsByDate = indexById(dashboard.measurements)
  const scansByDate = indexById(dashboard.inbodyScans)

  const todayWorkoutEntry = workoutsByDate[todayKey]
  const todayTrackingEntry = trackingByDate[todayKey]
  const todayMeasurementEntry = measurementsByDate[todayKey]
  const todayScanEntry = scansByDate[todayKey]
  const todayVideoState = dashboard.videoStateById?.[todayKey] ?? null
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
  const hydrationWins = dashboard.tracking.filter(
    (entry) => entry.hydrationTargetMet === true,
  ).length
  const latestMeasurement = getLatestByDate(dashboard.measurements)
  const latestScan = getLatestByDate(dashboard.inbodyScans)

  const measurementsDue = isMeasurementDue(dashboard.measurements, todayKey)
  const inbodyDue = isInBodyDue(dashboard.inbodyScans, todayKey)

  const workoutComplete = Boolean(todayWorkoutEntry?.completed)
  const helloLine = pickMotivationLine(
    HELLO_LINES,
    completedWorkouts.length + currentWeek,
  )
  const kuromiLine = pickMotivationLine(
    KUROMI_LINES,
    hydrationWins + (todayDay || 1),
  )

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
      const trimmed = newGoal.trim()
      await dashboard.actions.addGoal(trimmed)
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

  return (
    <div className="relative flex min-h-screen justify-center">
      <div className="app-shell">
        {activeTab === 'workout' && (
          <WorkoutView
            currentPhaseName={currentPhaseName}
            currentWeek={currentWeek}
            currentVideoState={todayVideoState}
            day={todayDay}
            onPlayerOpenChange={handlePlayerOpenChange}
            playerOpen={playerOpen}
            todayKey={todayKey}
            workout={todayWorkout}
            workoutComplete={workoutComplete}
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
            trackingDraft={trackingDraft}
            workout={todayWorkout}
            workoutComplete={workoutComplete}
          />
        )}

        {activeTab === 'goals' && (
          <MotivationView
            onChangeTracking={setTrackingDraft}
            onSaveMindset={handleSaveMindset}
            saving={saving.goal}
            settings={dashboard.settings}
            supportSaving={saving}
            helloLine={helloLine}
            kuromiLine={kuromiLine}
            currentDay={todayDay}
            trackingDraft={trackingDraft}
          />
        )}

        {activeTab === 'data' && (
          <ProgressWallView
            goals={dashboard.goals}
            newGoal={newGoal}
            onAddGoal={handleAddGoal}
            onChangeGoal={setNewGoal}
            saving={saving}
            settings={dashboard.settings}
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
          label="Tracking"
          onClick={() => setActiveTab('tracking')}
        />
        <NavButton
          icon={<Heart size={20} />}
          isActive={activeTab === 'goals'}
          label="Motivation"
          onClick={() => setActiveTab('goals')}
        />
        <NavButton
          icon={<Target size={20} />}
          isActive={activeTab === 'data'}
          label="Wall"
          onClick={() => setActiveTab('data')}
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

function WorkoutView({
  currentPhaseName,
  currentWeek,
  currentVideoState,
  day,
  onPlayerOpenChange,
  playerOpen,
  todayKey,
  workout,
  workoutComplete,
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
  const setupCue = getSetupCue(workout, currentWeek)
  const modificationCue = getModificationCopy(workout.type)
  const playerSubtitle = buildWorkoutPlayerSubtitle({
    currentVideoState,
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
              {formatLongDate(todayKey)}. Press play, move with control, and let the workout
              fit your body today.
            </p>
          </div>
          <span className="ghost-chip">{workoutComplete ? 'Submitted' : 'Ready'}</span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="ghost-chip">
            {workout.duration === '-' ? 'Recovery' : `${workout.duration} min`}
          </span>
          <span className="ghost-chip">{workout.equipment}</span>
          <span className="ghost-chip">Week {currentWeek}</span>
          <span className="ghost-chip">{currentPhaseName}</span>
        </div>
      </section>

      <WorkoutPlayer
        badge={workout.type === 'rest' ? 'Recovery flow' : 'Your player'}
        defaultOpen={true}
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
        <SectionHeader
          copy="Keep today safe, clear, and strong. The point is not matching the woman on screen. The point is finishing your version well."
          kicker="Your cues"
          title="What to watch for today"
        />

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
  saving,
  trackingDraft,
  workout,
  workoutComplete,
}) {
  const todayHydration = trackingDraft.hydrationTargetMet

  return (
    <div className="grid gap-4">
      <section className="surface">
        <SectionHeader
          copy="This is just the closeout. Record the workout, calories, and water so today feels complete."
          kicker="Your closeout"
          title="Check in and move on"
        />

        <div className="mt-5 grid grid-cols-3 gap-2">
          <MiniStatus
            label="Workout"
            tone={workoutComplete ? 'good' : 'neutral'}
            value={workoutComplete ? 'Submitted' : 'Open'}
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
        description="Nothing extra here. Just the things that tell you the day is closed."
        icon={<Sparkles className="text-gold-300" size={18} />}
        title="Your check-in"
      >
        <div className="grid gap-4">
          <div className="rounded-[24px] border border-mint-300/12 bg-mint-300/[0.08] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-mint-200">
                  Workout submitted
                </div>
                <p className="mt-2 text-[13px] leading-6 text-white/70">
                  {workout?.type === 'rest'
                    ? 'Use this once your recovery work is done.'
                    : 'Use this once your burn is done and you want the day recorded.'}
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
                ? workout?.type === 'rest'
                  ? 'Recovery is recorded'
                  : 'Today is recorded'
                : saving.workout
                  ? 'Saving...'
                  : workout?.type === 'rest'
                    ? 'Yes, I did today’s recovery'
                    : 'Yes, I showed up for today'}
            </button>
          </div>

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
        </div>
      </TrackingCard>

      <TrackingCard
        accent="from-[#8ef0c2]/14 via-[#ffe08a]/10 to-[#ff9dcc]/10"
        description="Measurements and scan data live here too, so all of your tracking stays in one place."
        icon={<BarChart2 className="text-mint-200" size={18} />}
        title="Body tracking"
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
              Add what you have so the story stays current.
            </div>
          )}

          <div className="rounded-[24px] border border-mint-300/12 bg-mint-300/[0.08] p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-mint-200">
                  Measurements
                </div>
                <p className="mt-2 text-[13px] leading-6 text-white/70">
                  Keep the tape honest and simple. This is here to help you notice shape changes clearly.
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
                  This is just information. Let it support you, not scare you.
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
  onChangeTracking,
  onSaveMindset,
  settings,
  supportSaving,
  helloLine,
  kuromiLine,
  currentDay,
  trackingDraft,
}) {
  const [showPerspective, setShowPerspective] = useState(false)

  return (
    <div className="grid gap-4">
      <section className="surface">
        <SectionHeader
          copy="This tab is here for the part of the process that needs softness, honesty, and a steadier voice."
          kicker="For your head and heart"
          title="What you need to hear today"
        />

        <div className="mt-5 grid gap-3">
          <article className="rounded-[24px] border border-blush-300/14 bg-[linear-gradient(150deg,rgba(255,143,200,0.18),rgba(255,255,255,0.04)_52%,rgba(141,103,255,0.08))] p-5">
            <div className="micro-label">Hello Kitty softness</div>
            <p className="mt-3 text-[15px] leading-7 text-white/88">{helloLine}</p>
          </article>
          <article className="rounded-[24px] border border-plum-300/14 bg-[linear-gradient(155deg,rgba(141,103,255,0.16),rgba(255,255,255,0.03)_52%,rgba(255,106,175,0.08))] p-5">
            <div className="micro-label">Kuromi backbone</div>
            <p className="mt-3 text-[15px] leading-7 text-white/82">{kuromiLine}</p>
          </article>
        </div>
      </section>

      <section className="surface">
        <SectionHeader
          copy="Use this when your brain starts spiraling, bargaining, or acting like one weird day means everything is broken."
          kicker="A steadier perspective"
          title="Come here before you start making up stories"
        />

        <div className="mt-5 flex justify-start">
          <button
            className="ghost-chip"
            onClick={() => setShowPerspective((current) => !current)}
            type="button"
          >
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

      <section className="surface">
        <SectionHeader
          copy="If you need to leave yourself a thought tonight, do it here instead of keeping it rattling around in your head."
          kicker="A note to yourself"
          title="Leave Jamie something kind and true"
        />

        <div className="mt-5 rounded-[24px] border border-plum-300/12 bg-plum-300/[0.08] p-4">
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
            placeholder="What felt hard? What helped? What do you want tomorrow's Jamie to remember?"
            value={trackingDraft.mindsetLog}
          />
          <div className="mt-3 flex justify-end">
            <button className="ghost-chip" onClick={onSaveMindset} type="button">
              {supportSaving.mindset ? 'Saving...' : 'Save note'}
            </button>
          </div>
        </div>
      </section>

      <section className="surface">
        <SectionHeader
          copy="We are keeping reminders simple here. Add the calendar once and let it quietly carry the rhythm for you."
          kicker="Quiet support"
          title="Keep the reminders easy"
        />

        <div className="mt-5 grid gap-3">
          <CalendarSupportCard calendarUrl="/Jamie_90_Day_Burn_Reminders.ics" />
        </div>

        <div className="mt-4 rounded-[20px] border border-white/8 bg-white/[0.04] p-4 text-[13px] leading-6 text-white/64">
          {settings?.displayName || USER_NAME}, this should feel like a hand on your back,
          not another thing you have to manage.
        </div>
      </section>
    </div>
  )
}

function ProgressWallView({ goals, newGoal, onAddGoal, onChangeGoal, saving, settings }) {
  const wallName = settings?.displayName || USER_NAME
  const jamiePosts = goals

  return (
    <div className="grid gap-4">
      <section className="surface">
        <SectionHeader
          copy="Write one line and let it land. This wall is just for Jamie's words, dated and held in place."
          kicker="Chalkboard wall"
          title="Sketch today's promise"
        />

        <div className="mt-5 rounded-[28px] border border-[#d7f0d8]/10 bg-[linear-gradient(180deg,rgba(25,45,38,0.98),rgba(18,34,30,0.98))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),inset_0_0_0_1px_rgba(255,255,255,0.03),0_22px_44px_rgba(0,0,0,0.28)]">
          <div className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#c7dfcb]/58">
            Fresh chalk
          </div>
          <p className="mt-3 text-[14px] leading-7 text-[#ecf7ee]/72">
            One promise. One truth. One line you want to see staring back at you later.
          </p>
          <div className="mt-4 rounded-[22px] border border-white/8 bg-black/14 p-2">
            <input
              className="w-full bg-transparent px-3 py-3 text-[15px] text-[#f6fff8] outline-none placeholder:text-[#f6fff8]/28"
              onChange={(event) => onChangeGoal(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') onAddGoal()
              }}
              placeholder="I am keeping my promise to myself today."
              type="text"
              value={newGoal}
            />
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="text-[12px] leading-6 text-[#d5e8d9]/48">
              Etched as {wallName}. Total promises: {goals.length}.
            </div>
            <button className="primary-button w-auto px-4" onClick={onAddGoal} type="button">
              {saving.goal ? 'Sketching...' : 'Sketch it'}
            </button>
          </div>
        </div>
      </section>

      <section className="surface">
        <SectionHeader
          copy="Every line stays dated so Jamie can see what she asked of herself and when she chose it."
          kicker="Your chalkboard"
          title={jamiePosts.length ? 'What is on the board' : 'The board is ready'}
        />

        <div className="mt-5 space-y-4">
          {jamiePosts.length ? (
            jamiePosts.map((post) => (
              <article
                className="rounded-[28px] border border-[#d7f0d8]/10 bg-[linear-gradient(180deg,rgba(23,43,36,0.98),rgba(17,31,27,0.98))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),inset_0_0_0_1px_rgba(255,255,255,0.03),0_18px_38px_rgba(0,0,0,0.26)]"
                key={post.id}
              >
                <div className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#cfdfd2]/52">
                  {formatGoalDate(post)}
                </div>
                <p
                  className="mt-4 text-[20px] leading-8 text-[#f3fff5]/88"
                  style={{
                    fontFamily: '"Bradley Hand", "Chalkboard SE", "Comic Sans MS", cursive',
                    textShadow: '0 1px 0 rgba(255,255,255,0.06), 0 0 18px rgba(237,255,242,0.06)',
                  }}
                >
                  {post.text}
                </p>
              </article>
            ))
          ) : (
            <div className="rounded-[24px] border border-white/8 bg-white/[0.04] p-5 text-[14px] leading-7 text-white/62">
              The chalkboard is empty right now. Add one line and it will show up here with today's date.
            </div>
          )}
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
  const calendarSchemeUrl = toCalendarSchemeUrl(calendarUrl)

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
            This is the reminder system now. Add the full 90-day plan to Jamie&apos;s
            calendar once and let it meet her there each day.
          </p>
          <p className="mt-3 text-[12px] leading-6 text-white/46">
            This includes a 7:00 AM workout check-in, nightly closeout reminders,
            weekly reset notes, and progress check-ins. If your phone downloads the
            file first, tap it once from Downloads to add it to Calendar.
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2">
          <a
            className="primary-button inline-flex w-auto items-center justify-center px-4"
            href={calendarSchemeUrl}
          >
            Open in Calendar
          </a>
          <a
            className="secondary-button inline-flex w-auto items-center justify-center px-4"
            download="Jamie_90_Day_Burn_Reminders.ics"
            href={calendarUrl}
            rel="noreferrer"
            target="_blank"
          >
            Download file
          </a>
        </div>
      </div>
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

function indexById(entries) {
  return entries.reduce((accumulator, entry) => {
    accumulator[entry.id] = entry
    return accumulator
  }, {})
}

function toCalendarSchemeUrl(url) {
  if (!url) return '#'
  if (url.startsWith('https://')) {
    return url.replace('https://', 'webcal://')
  }
  if (url.startsWith('http://')) {
    return url.replace('http://', 'webcal://')
  }
  return url
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

function formatMetricValue(value, unit) {
  return value === null || typeof value === 'undefined' ? '—' : `${value}${unit ? ` ${unit}` : ''}`
}
