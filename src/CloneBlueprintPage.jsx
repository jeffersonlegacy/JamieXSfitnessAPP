import { useEffect, useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import {
  ArrowLeft,
  Check,
  Clipboard,
  Download,
  Dumbbell,
  HeartHandshake,
  Palette,
  Salad,
  Save,
  Sparkles,
  Target,
} from 'lucide-react'
import { firebaseEnvKeys, isFirebaseConfigured } from './lib/firebase'
import { useFirebaseSession } from './hooks/useFirebaseSession'
import { useCloneBlueprint } from './hooks/useCloneBlueprint'
import {
  CLONE_SURVEY_DEFAULTS,
  MULTI_OPTION_SETS,
  SURVEY_OPTION_SETS,
  buildCloneBlueprintDoc,
  buildCloneBlueprintJson,
  buildCloneBlueprintMarkdown,
  buildStarterBundleJson,
  getCloneSurveyProgress,
  mergeCloneAnswers,
  toggleMultiChoice,
} from './lib/cloneBlueprint'

export default function CloneBlueprintPage() {
  const session = useFirebaseSession()
  const intake = useCloneBlueprint(session.user)
  const [answers, setAnswers] = useState(CLONE_SURVEY_DEFAULTS)
  const [savingState, setSavingState] = useState('idle')
  const [packView, setPackView] = useState('bundle')
  const [showCoachPrompt, setShowCoachPrompt] = useState(false)
  const [toast, setToast] = useState('')
  const hydratedRef = useRef(false)

  useEffect(() => {
    if (hydratedRef.current) return
    if (intake.loading) return

    if (intake.intake?.answers) {
      setAnswers(mergeCloneAnswers(intake.intake.answers))
    }

    hydratedRef.current = true
  }, [intake.intake, intake.loading])

  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(''), 2200)
    return () => window.clearTimeout(timer)
  }, [toast])

  const progress = useMemo(() => getCloneSurveyProgress(answers), [answers])
  const blueprint = useMemo(() => buildCloneBlueprintDoc(answers), [answers])
  const blueprintMarkdown = useMemo(() => buildCloneBlueprintMarkdown(answers), [answers])
  const blueprintJson = useMemo(() => buildCloneBlueprintJson(answers), [answers])
  const starterBundleJson = useMemo(() => buildStarterBundleJson(answers), [answers])

  if (!isFirebaseConfigured || session.status === 'needs-config') {
    return <BlueprintConfigurationState envKeys={firebaseEnvKeys} />
  }

  if (session.status === 'loading' || intake.loading) {
    return <BlueprintLoadingState />
  }

  if (session.status === 'error' || intake.error) {
    return <BlueprintErrorState error={session.error || intake.error} />
  }

  async function handleSaveDraft() {
    setSavingState('draft')
    try {
      await intake.actions.saveDraft(answers)
      setToast('Draft saved.')
    } catch (error) {
      setToast(error.message || 'Could not save the draft.')
    } finally {
      setSavingState('idle')
    }
  }

  async function handleSubmit() {
    setSavingState('submit')
    try {
      await intake.actions.submit(answers)
      setToast('Blueprint locked in.')
    } catch (error) {
      setToast(error.message || 'Could not save the blueprint.')
    } finally {
      setSavingState('idle')
    }
  }

  async function handleCopy(label, value) {
    try {
      await window.navigator.clipboard.writeText(value)
      setToast(`${label} copied.`)
    } catch {
      setToast(`Could not copy ${label.toLowerCase()} yet.`)
    }
  }

  function handleDownloadFile(filename, content, mimeType) {
    try {
      const blob = new Blob([content], { type: mimeType })
      const url = window.URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = filename
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
      window.URL.revokeObjectURL(url)
      setToast(`${filename} downloaded.`)
    } catch {
      setToast('Could not download the file yet.')
    }
  }

  return (
    <div className="relative flex min-h-screen min-h-[100svh] justify-center overflow-hidden">
      <div className="app-shell">
        <div className="tab-scroll-area no-scrollbar">
          <div className="grid gap-4 pb-[calc(2rem+env(safe-area-inset-bottom))]">
            <section className="hero-panel">
              <a
                className="inline-flex items-center gap-2 text-[12px] font-extrabold text-white/64 transition hover:text-white"
                href="/"
              >
                <ArrowLeft size={14} />
                Back to Jamie's app
              </a>

              <div className="mt-5 flex items-start justify-between gap-4">
                <div>
                  <div className="micro-label text-blush-100">Tailored app intake</div>
                  <h1 className="display-copy mt-3 max-w-[10ch] text-[2.4rem] leading-[0.9] text-white">
                    Build their version.
                  </h1>
                  <p className="mt-3 max-w-[19rem] text-[14px] leading-7 text-white/76">
                    This survey turns one person&apos;s goals, taste, schedule, and
                    brain into a clone-ready app blueprint.
                  </p>
                </div>

                <div className="rounded-[22px] border border-white/10 bg-white/8 px-4 py-3 text-right">
                  <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/42">
                    Progress
                  </div>
                  <div className="mt-2 text-2xl font-extrabold text-white">{progress.pct}%</div>
                  <div className="mt-1 text-[12px] leading-5 text-white/56">
                    {progress.complete} of {progress.total} core picks done
                  </div>
                </div>
              </div>

              <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/8">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blush-500 via-blush-400 to-gold-300 transition-all"
                  style={{ width: `${progress.pct}%` }}
                />
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <StatusChip label={`Status: ${intake.intake?.status || 'not saved yet'}`} />
                <StatusChip label={`Clone name: ${blueprint.cloneMeta.cloneName}`} />
                <StatusChip label={`Tabs: ${blueprint.summary.tabPlan.join(' · ')}`} />
              </div>
            </section>

            <SurveyCard
              copy="Who is this app for, what are they chasing, and what tends to throw them off?"
              icon={<Target className="text-gold-300" size={18} />}
              kicker="Part 1"
              title="The person"
            >
              <div className="grid gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <TextField
                    label="Their name"
                    onChange={(value) => updateAnswer(setAnswers, 'clientName', value)}
                    placeholder="Jamie"
                    value={answers.clientName}
                  />
                  <TextField
                    label="App name"
                    onChange={(value) => updateAnswer(setAnswers, 'appName', value)}
                    placeholder="Jamie's Reset"
                    value={answers.appName}
                  />
                </div>

                <ChoiceGroup
                  label="Primary goal"
                  onSelect={(value) => updateAnswer(setAnswers, 'primaryGoal', value)}
                  options={SURVEY_OPTION_SETS.primaryGoal}
                  value={answers.primaryGoal}
                />
                <ChoiceGroup
                  label="Target outcome"
                  onSelect={(value) => updateAnswer(setAnswers, 'targetOutcome', value)}
                  options={SURVEY_OPTION_SETS.targetOutcome}
                  value={answers.targetOutcome}
                />
                <TextAreaField
                  label="Why now?"
                  onChange={(value) => updateAnswer(setAnswers, 'goalReason', value)}
                  placeholder="What makes this version of the app matter for them right now?"
                  value={answers.goalReason}
                />
                <TextAreaField
                  label="Biggest block"
                  onChange={(value) => updateAnswer(setAnswers, 'biggestBlock', value)}
                  placeholder="What usually knocks them off track?"
                  value={answers.biggestBlock}
                />
              </div>
            </SurveyCard>

            <SurveyCard
              copy="Shape the training around how they actually like to move, not how they think they should."
              icon={<Dumbbell className="text-blush-200" size={18} />}
              kicker="Part 2"
              title="Training fit"
            >
              <div className="grid gap-3">
                <ChoiceGroup
                  label="Main training mode"
                  onSelect={(value) => updateAnswer(setAnswers, 'trainingMode', value)}
                  options={SURVEY_OPTION_SETS.trainingMode}
                  value={answers.trainingMode}
                />
                <ChoiceGroup
                  label="Workout guidance style"
                  onSelect={(value) => updateAnswer(setAnswers, 'videoPreference', value)}
                  options={SURVEY_OPTION_SETS.videoPreference}
                  value={answers.videoPreference}
                />
                <ChoiceGroup
                  label="Gym comfort"
                  onSelect={(value) => updateAnswer(setAnswers, 'gymComfort', value)}
                  options={SURVEY_OPTION_SETS.gymComfort}
                  value={answers.gymComfort}
                />
                <ChoiceGroup
                  label="Rest days should feel like"
                  onSelect={(value) => updateAnswer(setAnswers, 'restDayStyle', value)}
                  options={SURVEY_OPTION_SETS.restDayStyle}
                  value={answers.restDayStyle}
                />
                <div className="grid grid-cols-2 gap-3">
                  <ChoiceGroup
                    label="Days each week"
                    onSelect={(value) => updateAnswer(setAnswers, 'daysPerWeek', value)}
                    options={SURVEY_OPTION_SETS.daysPerWeek}
                    value={answers.daysPerWeek}
                  />
                  <ChoiceGroup
                    label="Session length"
                    onSelect={(value) => updateAnswer(setAnswers, 'sessionLength', value)}
                    options={SURVEY_OPTION_SETS.sessionLength}
                    value={answers.sessionLength}
                  />
                </div>
                <MultiChoiceGroup
                  label="Equipment access"
                  onToggle={(value) =>
                    updateAnswer(
                      setAnswers,
                      'equipmentAccess',
                      toggleMultiChoice(answers.equipmentAccess, value),
                    )
                  }
                  options={MULTI_OPTION_SETS.equipmentAccess}
                  values={answers.equipmentAccess}
                />
                <TextAreaField
                  label="Injuries or limits"
                  onChange={(value) => updateAnswer(setAnswers, 'injuriesOrLimits', value)}
                  placeholder="What needs to be respected physically?"
                  value={answers.injuriesOrLimits}
                />
                <TextAreaField
                  label="Movements to avoid"
                  onChange={(value) => updateAnswer(setAnswers, 'noGoMovements', value)}
                  placeholder="Anything that should not show up in the workouts?"
                  value={answers.noGoMovements}
                />
              </div>
            </SurveyCard>

            <SurveyCard
              copy="This is where the app stops sounding generic and starts sounding like someone they would actually listen to."
              icon={<HeartHandshake className="text-mint-300" size={18} />}
              kicker="Part 3"
              title="Coach voice"
            >
              <div className="grid gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <ChoiceGroup
                    label="Best check-in time"
                    onSelect={(value) => updateAnswer(setAnswers, 'checkInTime', value)}
                    options={SURVEY_OPTION_SETS.checkInTime}
                    value={answers.checkInTime}
                  />
                  <ChoiceGroup
                    label="Reminder style"
                    onSelect={(value) => updateAnswer(setAnswers, 'reminderStyle', value)}
                    options={SURVEY_OPTION_SETS.reminderStyle}
                    value={answers.reminderStyle}
                  />
                </div>
                <ChoiceGroup
                  label="Coach tone"
                  onSelect={(value) => updateAnswer(setAnswers, 'coachTone', value)}
                  options={SURVEY_OPTION_SETS.coachTone}
                  value={answers.coachTone}
                />
                <ChoiceGroup
                  label="Accountability style"
                  onSelect={(value) => updateAnswer(setAnswers, 'accountabilityStyle', value)}
                  options={SURVEY_OPTION_SETS.accountabilityStyle}
                  value={answers.accountabilityStyle}
                />
                <div className="grid grid-cols-2 gap-3">
                  <ChoiceGroup
                    label="Swear level"
                    onSelect={(value) => updateAnswer(setAnswers, 'swearLevel', value)}
                    options={SURVEY_OPTION_SETS.swearLevel}
                    value={answers.swearLevel}
                  />
                  <ChoiceGroup
                    label="Truth level"
                    onSelect={(value) => updateAnswer(setAnswers, 'truthLevel', value)}
                    options={SURVEY_OPTION_SETS.truthLevel}
                    value={answers.truthLevel}
                  />
                </div>
                <TextAreaField
                  label="What should the coach remember?"
                  onChange={(value) => updateAnswer(setAnswers, 'mustRemember', value)}
                  placeholder="What personal truth or context should the app carry forward?"
                  value={answers.mustRemember}
                />
                <TextAreaField
                  label="What helps on bad days?"
                  onChange={(value) => updateAnswer(setAnswers, 'badDaySupport', value)}
                  placeholder="What kind of message helps instead of making it worse?"
                  value={answers.badDaySupport}
                />
                <TextAreaField
                  label="Words or angles to avoid"
                  onChange={(value) => updateAnswer(setAnswers, 'noGoWords', value)}
                  placeholder="Anything the app should never say?"
                  value={answers.noGoWords}
                />
              </div>
            </SurveyCard>

            <SurveyCard
              copy="Decide how much proof they want to see, and how much nutrition support should live in the app."
              icon={<Salad className="text-gold-300" size={18} />}
              kicker="Part 4"
              title="Tracking and nutrition"
            >
              <div className="grid gap-3">
                <MultiChoiceGroup
                  label="What should the app track?"
                  onToggle={(value) =>
                    updateAnswer(
                      setAnswers,
                      'trackingFocus',
                      toggleMultiChoice(answers.trackingFocus, value),
                    )
                  }
                  options={MULTI_OPTION_SETS.trackingFocus}
                  values={answers.trackingFocus}
                />
                <MultiChoiceGroup
                  label="Nutrition support lanes"
                  onToggle={(value) =>
                    updateAnswer(
                      setAnswers,
                      'nutritionSupport',
                      toggleMultiChoice(answers.nutritionSupport, value),
                    )
                  }
                  options={MULTI_OPTION_SETS.nutritionSupport}
                  values={answers.nutritionSupport}
                />
                <MultiChoiceGroup
                  label="Supplement interest"
                  onToggle={(value) =>
                    updateAnswer(
                      setAnswers,
                      'supplementInterest',
                      toggleMultiChoice(answers.supplementInterest, value),
                    )
                  }
                  options={MULTI_OPTION_SETS.supplementInterest}
                  values={answers.supplementInterest}
                />
              </div>
            </SurveyCard>

            <SurveyCard
              copy="This is where the clone starts to feel unmistakably theirs."
              icon={<Palette className="text-plum-300" size={18} />}
              kicker="Part 5"
              title="Look and feel"
            >
              <div className="grid gap-3">
                <ChoiceGroup
                  label="Theme direction"
                  onSelect={(value) => updateAnswer(setAnswers, 'themeDirection', value)}
                  options={SURVEY_OPTION_SETS.themeDirection}
                  value={answers.themeDirection}
                />
                <TextAreaField
                  label="Visual notes"
                  onChange={(value) => updateAnswer(setAnswers, 'visualNotes', value)}
                  placeholder="Colors, mascots, textures, references, or anything the design should echo."
                  value={answers.visualNotes}
                />
                <TextAreaField
                  label="What should it feel like to open this app?"
                  onChange={(value) => updateAnswer(setAnswers, 'dreamFeel', value)}
                  placeholder="Give the emotional direction in plain language."
                  value={answers.dreamFeel}
                />
              </div>
            </SurveyCard>

            <SurveyCard
              copy="Decide how public or private this should be, plus the features that absolutely need to stay in or stay out."
              icon={<Sparkles className="text-blush-200" size={18} />}
              kicker="Part 6"
              title="Boundaries and must-haves"
            >
              <div className="grid gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <ChoiceGroup
                    label="Community style"
                    onSelect={(value) => updateAnswer(setAnswers, 'communityStyle', value)}
                    options={SURVEY_OPTION_SETS.communityStyle}
                    value={answers.communityStyle}
                  />
                  <ChoiceGroup
                    label="Support circle"
                    onSelect={(value) => updateAnswer(setAnswers, 'supportCircle', value)}
                    options={SURVEY_OPTION_SETS.supportCircle}
                    value={answers.supportCircle}
                  />
                </div>
                <TextAreaField
                  label="Must-have features"
                  onChange={(value) => updateAnswer(setAnswers, 'mustHaveFeatures', value)}
                  placeholder="What absolutely belongs in their version?"
                  value={answers.mustHaveFeatures}
                />
                <TextAreaField
                  label="Absolutely not"
                  onChange={(value) => updateAnswer(setAnswers, 'absolutelyNot', value)}
                  placeholder="What should never be in the clone?"
                  value={answers.absolutelyNot}
                />
              </div>
            </SurveyCard>

            <section className="surface">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="micro-label">Generated pack</div>
                  <h2 className="mt-3 text-xl font-extrabold text-white">
                    {blueprint.summary.appName}
                  </h2>
                  <p className="section-copy">
                    {blueprint.summary.headline} This pack now pre-fills the theme, tabs,
                    coach voice, tracking stack, and nutrition support.
                  </p>
                </div>
                <StatusChip label={intake.intake?.status || 'draft mode'} />
              </div>

              <div className="mt-5 grid gap-3">
                <SummaryRow label="Theme" value={blueprint.brand.visualDirection} />
                <SummaryRow label="Tabs" value={blueprint.navigation.tabs.join(', ')} />
                <SummaryRow label="Coach" value={blueprint.summary.appTone} />
                <SummaryRow label="Visual direction" value={blueprint.summary.visualDirection} />
                <SummaryRow
                  label="Tracking stack"
                  value={blueprint.tracking.enabled.join(', ') || 'Keep tracking light'}
                />
                <SummaryRow
                  label="Nutrition support"
                  value={blueprint.nutrition.enabled.join(', ') || 'Keep nutrition light'}
                />
              </div>

              <div className="mt-5 rounded-[24px] border border-white/8 bg-white/[0.04] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-extrabold text-white">Starter bundle</div>
                    <p className="mt-2 max-w-[24rem] text-[13px] leading-6 text-white/68">
                      This is the implementation-ready pack. It includes theme tokens,
                      tabs, copy seeds, data seeds, and AI seed rules.
                    </p>
                  </div>
                  <button
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-2 text-[11px] font-extrabold text-white/80 transition hover:text-white"
                    onClick={() => handleCopy('Starter bundle', starterBundleJson)}
                    type="button"
                  >
                    <Clipboard size={14} />
                    Copy pack
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <PackViewButton
                    active={packView === 'bundle'}
                    label="Bundle"
                    onClick={() => setPackView('bundle')}
                  />
                  <PackViewButton
                    active={packView === 'prompt'}
                    label="Coach prompt"
                    onClick={() => setPackView('prompt')}
                  />
                  <PackViewButton
                    active={packView === 'json'}
                    label="Full JSON"
                    onClick={() => setPackView('json')}
                  />
                </div>

                <pre className="mt-4 max-h-[320px] overflow-auto rounded-[18px] border border-white/8 bg-black/24 p-4 text-[11px] leading-6 text-white/72">
                  {packView === 'bundle'
                    ? starterBundleJson
                    : packView === 'prompt'
                      ? blueprint.generator.coachPrompt
                      : blueprintJson}
                </pre>

                <div className="mt-4 grid gap-3">
                  <button
                    className="secondary-button justify-between"
                    onClick={() => setShowCoachPrompt((current) => !current)}
                    type="button"
                  >
                    <span>{showCoachPrompt ? 'Hide coach prompt preview' : 'Preview coach prompt notes'}</span>
                    <span>{showCoachPrompt ? '−' : '+'}</span>
                  </button>

                  {showCoachPrompt ? (
                    <div className="rounded-[20px] border border-white/8 bg-black/20 p-4 text-[12px] leading-6 text-white/68">
                      Coach Kitty will remember:
                      <ul className="mt-2 list-disc pl-5">
                        {(blueprint.coach.memoryToKeep || []).map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    <ActionButton
                      icon={<Download size={14} />}
                      label="Download pack.json"
                      onClick={() =>
                        handleDownloadFile(
                          `${slugify(blueprint.cloneMeta.cloneName)}-pack.json`,
                          starterBundleJson,
                          'application/json',
                        )
                      }
                    />
                    <ActionButton
                      icon={<Download size={14} />}
                      label="Download blueprint.md"
                      onClick={() =>
                        handleDownloadFile(
                          `${slugify(blueprint.cloneMeta.cloneName)}-blueprint.md`,
                          blueprintMarkdown,
                          'text/markdown',
                        )
                      }
                    />
                    <ActionButton
                      icon={<Download size={14} />}
                      label="Download full.json"
                      onClick={() =>
                        handleDownloadFile(
                          `${slugify(blueprint.cloneMeta.cloneName)}-full.json`,
                          blueprintJson,
                          'application/json',
                        )
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <button
                  className="secondary-button"
                  disabled={savingState !== 'idle'}
                  onClick={handleSaveDraft}
                  type="button"
                >
                  <Save size={16} />
                  <span className="ml-2">{savingState === 'draft' ? 'Saving draft...' : 'Save draft'}</span>
                </button>
                <button
                  className="primary-button"
                  disabled={savingState !== 'idle'}
                  onClick={handleSubmit}
                  type="button"
                >
                  <Check size={16} />
                  <span className="ml-2">
                    {savingState === 'submit' ? 'Locking blueprint...' : 'Finish and lock blueprint'}
                  </span>
                </button>
              </div>
            </section>
          </div>
        </div>
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

function SurveyCard({ children, copy, icon, kicker, title }) {
  return (
    <section className="surface">
      <div className="flex items-start gap-3">
        <div className="rounded-[16px] border border-white/10 bg-white/8 p-2.5">{icon}</div>
        <div>
          <div className="micro-label">{kicker}</div>
          <h2 className="mt-3 text-xl font-extrabold text-white">{title}</h2>
          <p className="section-copy">{copy}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  )
}

function ChoiceGroup({ label, onSelect, options, value }) {
  return (
    <div className="grid gap-2">
      <div className="text-[12px] font-extrabold uppercase tracking-[0.16em] text-white/46">
        {label}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {options.map(([optionValue, optionLabel]) => (
          <button
            className={clsx(
              'rounded-[18px] border px-4 py-3 text-left text-[13px] font-bold transition',
              value === optionValue
                ? 'border-blush-300/26 bg-blush-300/[0.14] text-white'
                : 'border-white/8 bg-white/[0.04] text-white/74',
            )}
            key={optionValue}
            onClick={() => onSelect(optionValue)}
            type="button"
          >
            {optionLabel}
          </button>
        ))}
      </div>
    </div>
  )
}

function MultiChoiceGroup({ label, onToggle, options, values }) {
  const selected = new Set(values || [])

  return (
    <div className="grid gap-2">
      <div className="text-[12px] font-extrabold uppercase tracking-[0.16em] text-white/46">
        {label}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {options.map(([optionValue, optionLabel]) => (
          <button
            className={clsx(
              'rounded-[18px] border px-4 py-3 text-left text-[13px] font-bold transition',
              selected.has(optionValue)
                ? 'border-mint-300/24 bg-mint-300/[0.14] text-white'
                : 'border-white/8 bg-white/[0.04] text-white/74',
            )}
            key={optionValue}
            onClick={() => onToggle(optionValue)}
            type="button"
          >
            {optionLabel}
          </button>
        ))}
      </div>
    </div>
  )
}

function TextField({ label, onChange, placeholder, value }) {
  return (
    <label className="grid gap-2">
      <span className="text-[12px] font-extrabold uppercase tracking-[0.16em] text-white/46">
        {label}
      </span>
      <input
        className="field-shell"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type="text"
        value={value}
      />
    </label>
  )
}

function TextAreaField({ label, onChange, placeholder, value }) {
  return (
    <label className="grid gap-2">
      <span className="text-[12px] font-extrabold uppercase tracking-[0.16em] text-white/46">
        {label}
      </span>
      <textarea
        className="field-shell min-h-[110px] resize-none"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </label>
  )
}

function PackViewButton({ active, label, onClick }) {
  return (
    <button
      className={clsx(
        'rounded-full border px-3 py-2 text-[11px] font-extrabold transition',
        active
          ? 'border-blush-300/26 bg-blush-300/[0.14] text-white'
          : 'border-white/10 bg-white/6 text-white/74',
      )}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  )
}

function SummaryRow({ label, value }) {
  return (
    <div className="rounded-[20px] border border-white/8 bg-white/[0.035] px-4 py-3">
      <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/42">
        {label}
      </div>
      <div className="mt-2 text-[13px] leading-6 text-white/78">{value}</div>
    </div>
  )
}

function StatusChip({ label }) {
  return (
    <span className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/6 px-3 py-2 text-[11px] font-bold text-white/82">
      {label}
    </span>
  )
}

function ActionButton({ icon, label, onClick }) {
  return (
    <button
      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-2 text-[11px] font-extrabold text-white/80 transition hover:text-white"
      onClick={onClick}
      type="button"
    >
      {icon}
      {label}
    </button>
  )
}

function BlueprintConfigurationState({ envKeys }) {
  return (
    <div className="relative flex min-h-screen min-h-[100svh] justify-center overflow-hidden">
      <div className="app-shell justify-center">
        <section className="surface">
          <div className="micro-label text-blush-100">Setup needed</div>
          <h1 className="display-copy mt-3 text-[2.1rem] leading-[0.92] text-white">
            Firebase still needs its env vars.
          </h1>
          <p className="mt-3 text-[14px] leading-7 text-white/70">
            The survey shell is ready, but the client Firebase config is missing.
          </p>
          <div className="mt-4 rounded-[22px] border border-white/8 bg-white/[0.04] p-4 text-[12px] leading-6 text-white/66">
            {envKeys.join(', ')}
          </div>
        </section>
      </div>
    </div>
  )
}

function BlueprintLoadingState() {
  return (
    <div className="relative flex min-h-screen min-h-[100svh] justify-center overflow-hidden">
      <div className="app-shell justify-center">
        <section className="surface">
          <div className="micro-label">Loading</div>
          <h1 className="display-copy mt-3 text-[2rem] leading-[0.92] text-white">
            Building the survey shell.
          </h1>
          <p className="section-copy">Pulling in the saved blueprint if one already exists.</p>
        </section>
      </div>
    </div>
  )
}

function BlueprintErrorState({ error }) {
  return (
    <div className="relative flex min-h-screen min-h-[100svh] justify-center overflow-hidden">
      <div className="app-shell justify-center">
        <section className="surface">
          <div className="micro-label text-blush-100">Sync issue</div>
          <h1 className="display-copy mt-3 text-[2rem] leading-[0.92] text-white">
            The survey could not connect cleanly.
          </h1>
          <p className="mt-3 text-[14px] leading-7 text-white/70">
            {error?.message || 'Try refreshing once.'}
          </p>
        </section>
      </div>
    </div>
  )
}

function updateAnswer(setter, key, value) {
  setter((current) => ({
    ...current,
    [key]: value,
  }))
}

function slugify(value) {
  return String(value || 'client-pack')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
