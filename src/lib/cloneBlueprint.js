export const CLONE_SURVEY_ID = 'tailored-clone-intake'
export const CLONE_SURVEY_VERSION = 1

export const CLONE_SURVEY_DEFAULTS = {
  clientName: '',
  appName: '',
  primaryGoal: 'fat-loss',
  targetOutcome: 'lose-20-30',
  goalReason: '',
  biggestBlock: '',
  trainingMode: 'hybrid',
  videoPreference: 'follow-along',
  gymComfort: 'some',
  restDayStyle: 'fun-recovery',
  daysPerWeek: '4',
  sessionLength: '30-45',
  equipmentAccess: ['bands', 'dumbbells'],
  checkInTime: 'evening',
  reminderStyle: 'calendar',
  coachTone: 'best-friend',
  accountabilityStyle: 'direct-kind',
  swearLevel: 'light',
  truthLevel: 'honest',
  themeDirection: 'cute-hardcore',
  visualNotes: '',
  trackingFocus: ['workouts', 'calories', 'water', 'measurements'],
  nutritionSupport: ['protein', 'hydration', 'simple-meals'],
  supplementInterest: ['protein', 'vitamins'],
  communityStyle: 'private',
  supportCircle: 'solo',
  injuriesOrLimits: '',
  noGoMovements: '',
  mustRemember: '',
  badDaySupport: '',
  noGoWords: '',
  mustHaveFeatures: '',
  absolutelyNot: '',
  dreamFeel: '',
}

export const SURVEY_OPTION_SETS = {
  primaryGoal: [
    ['fat-loss', 'Lose body fat'],
    ['recomp', 'Recompose'],
    ['strength', 'Get stronger'],
    ['energy', 'Feel better'],
    ['confidence', 'Confidence reset'],
    ['consistency', 'Build habits'],
  ],
  targetOutcome: [
    ['lose-10-15', '10-15 lb'],
    ['lose-20-30', '20-30 lb'],
    ['lose-30-plus', '30+ lb'],
    ['recomp-look', 'Look tighter'],
    ['strength-first', 'Strength first'],
    ['health-reset', 'Health reset'],
  ],
  trainingMode: [
    ['video-first', 'Workout videos'],
    ['gym-first', 'In the gym'],
    ['hybrid', 'Hybrid'],
    ['home-only', 'Home only'],
  ],
  videoPreference: [
    ['follow-along', 'Follow-along videos'],
    ['demo-then-do', 'Demo, then do it'],
    ['timer-based', 'Timers over videos'],
    ['plan-only', 'Just tell me the plan'],
  ],
  gymComfort: [
    ['new', 'Gym feels new'],
    ['some', 'Some gym comfort'],
    ['confident', 'Comfortable in gym'],
    ['needs-guide', 'Need machine guidance'],
  ],
  restDayStyle: [
    ['fun-recovery', 'Fun recovery'],
    ['walk-stretch', 'Walk + stretch'],
    ['heavy-option', 'Heavy lift option'],
    ['totally-light', 'Very low-pressure'],
  ],
  daysPerWeek: [
    ['3', '3 days'],
    ['4', '4 days'],
    ['5', '5 days'],
    ['6', '6 days'],
  ],
  sessionLength: [
    ['20-30', '20-30 min'],
    ['30-45', '30-45 min'],
    ['45-60', '45-60 min'],
    ['60-plus', '60+ min'],
  ],
  checkInTime: [
    ['morning', 'Morning'],
    ['midday', 'Midday'],
    ['evening', 'Evening'],
    ['flexible', 'Flexible'],
  ],
  reminderStyle: [
    ['calendar', 'Calendar reminders'],
    ['morning-evening', 'Morning + night'],
    ['gentle', 'Gentle nudges'],
    ['firm', 'Firm accountability'],
    ['none', 'No reminders'],
  ],
  coachTone: [
    ['soft', 'Soft and calming'],
    ['best-friend', 'Best-friend energy'],
    ['direct-kind', 'Direct but kind'],
    ['playful-savage', 'Playful menace'],
    ['facts-first', 'Facts over fluff'],
    ['therapist-coach', 'Therapist + coach'],
  ],
  accountabilityStyle: [
    ['gentle', 'Gentle nudge'],
    ['direct-kind', 'Direct with heart'],
    ['question-first', 'Ask before pushing'],
    ['hype', 'Hype me up'],
    ['zero-bullshit', 'No bullshit'],
  ],
  swearLevel: [
    ['none', 'Keep it clean'],
    ['light', 'A little'],
    ['medium', 'Some swearing'],
    ['high', 'Let it rip'],
  ],
  truthLevel: [
    ['soft-truth', 'Soft truth'],
    ['honest', 'Honest'],
    ['edgy', 'Push me a bit'],
    ['hard-truth', 'Give me the hard truth'],
  ],
  themeDirection: [
    ['cute-hardcore', 'Cute but dangerous'],
    ['dark-pink-gym', 'Dark pink gym'],
    ['clean-athlete', 'Clean athlete'],
    ['luxe-feminine', 'Luxe feminine'],
    ['minimal-focus', 'Minimal focus'],
    ['glow-up', 'Full glow-up'],
  ],
  communityStyle: [
    ['private', 'Private only'],
    ['trusted-circle', 'Trusted circle'],
    ['wall', 'Community wall'],
    ['coach-only', 'Coach only'],
  ],
  supportCircle: [
    ['solo', 'Solo'],
    ['partner', 'One accountability person'],
    ['small-group', 'Small squad'],
    ['public-proof', 'Public proof helps'],
  ],
}

export const MULTI_OPTION_SETS = {
  equipmentAccess: [
    ['bands', 'Bands'],
    ['dumbbells', 'Dumbbells'],
    ['bench', 'Bench'],
    ['barbell', 'Barbell'],
    ['machines', 'Machines'],
    ['treadmill', 'Treadmill'],
    ['walking-only', 'Just walking'],
  ],
  trackingFocus: [
    ['workouts', 'Workout completion'],
    ['calories', 'Calories'],
    ['water', 'Water'],
    ['measurements', 'Measurements'],
    ['photos', 'Progress photos'],
    ['inbody', 'InBody / scans'],
    ['steps', 'Steps / walks'],
    ['mindset', 'Mindset notes'],
    ['strength-prs', 'Strength PRs'],
  ],
  nutritionSupport: [
    ['protein', 'Protein help'],
    ['hydration', 'Hydration support'],
    ['simple-meals', 'Simple meal ideas'],
    ['snack-swaps', 'Snack swaps'],
    ['supplements', 'Supplement guidance'],
    ['grocery-list', 'Grocery list ideas'],
    ['restaurant-help', 'Restaurant survival'],
  ],
  supplementInterest: [
    ['protein', 'Protein powders / shakes'],
    ['vitamins', 'Vitamins'],
    ['energy', 'Energy support'],
    ['hydration', 'Hydration products'],
    ['fat-loss-tools', 'Fat-loss support'],
    ['recovery', 'Recovery support'],
    ['none', 'Keep supplements minimal'],
  ],
}

export const REQUIRED_CLONE_FIELDS = [
  'clientName',
  'primaryGoal',
  'trainingMode',
  'videoPreference',
  'daysPerWeek',
  'sessionLength',
  'coachTone',
  'themeDirection',
]

const SINGLE_LABELS = buildSingleLabelMap()
const MULTI_LABELS = buildMultiLabelMap()

function buildSingleLabelMap() {
  return Object.entries(SURVEY_OPTION_SETS).reduce((accumulator, [key, entries]) => {
    accumulator[key] = Object.fromEntries(entries)
    return accumulator
  }, {})
}

function buildMultiLabelMap() {
  return Object.entries(MULTI_OPTION_SETS).reduce((accumulator, [key, entries]) => {
    accumulator[key] = Object.fromEntries(entries)
    return accumulator
  }, {})
}

export function mergeCloneAnswers(savedAnswers) {
  return {
    ...CLONE_SURVEY_DEFAULTS,
    ...(savedAnswers || {}),
    equipmentAccess: ensureArray(savedAnswers?.equipmentAccess, CLONE_SURVEY_DEFAULTS.equipmentAccess),
    trackingFocus: ensureArray(savedAnswers?.trackingFocus, CLONE_SURVEY_DEFAULTS.trackingFocus),
    nutritionSupport: ensureArray(savedAnswers?.nutritionSupport, CLONE_SURVEY_DEFAULTS.nutritionSupport),
    supplementInterest: ensureArray(savedAnswers?.supplementInterest, CLONE_SURVEY_DEFAULTS.supplementInterest),
  }
}

function ensureArray(value, fallback) {
  return Array.isArray(value) ? value : [...fallback]
}

export function toggleMultiChoice(current, value) {
  const list = Array.isArray(current) ? current : []
  return list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value]
}

export function getCloneSurveyProgress(answers) {
  const complete = REQUIRED_CLONE_FIELDS.filter((key) => hasValue(answers[key])).length
  return {
    complete,
    total: REQUIRED_CLONE_FIELDS.length,
    pct: Math.round((complete / REQUIRED_CLONE_FIELDS.length) * 100),
  }
}

function hasValue(value) {
  if (Array.isArray(value)) return value.length > 0
  return Boolean(String(value || '').trim())
}

function labelFor(group, value) {
  return SINGLE_LABELS[group]?.[value] || value
}

function labelsFor(group, values) {
  return ensureArray(values, []).map((value) => MULTI_LABELS[group]?.[value] || value)
}

export function buildCloneSummary(answers) {
  const clientName = answers.clientName?.trim() || 'This client'
  const appName =
    answers.appName?.trim() || `${clientName.split(' ')[0] || 'Custom'}'s Reset`
  const themeLabel = labelFor('themeDirection', answers.themeDirection)
  const goalLabel = labelFor('primaryGoal', answers.primaryGoal)
  const trainingModeLabel = labelFor('trainingMode', answers.trainingMode)
  const coachToneLabel = labelFor('coachTone', answers.coachTone)
  const accountabilityLabel = labelFor('accountabilityStyle', answers.accountabilityStyle)
  const nutritionLane = labelsFor('nutritionSupport', answers.nutritionSupport)
  const trackingLane = labelsFor('trackingFocus', answers.trackingFocus)
  const tabs = ['Workout', 'Tracking', 'Support', 'Wall']

  if (nutritionLane.length) {
    tabs.splice(2, 0, 'Nutrition')
  }

  return {
    appName,
    clientName,
    headline: `${clientName} needs a ${themeLabel.toLowerCase()} app built around ${goalLabel.toLowerCase()} and ${trainingModeLabel.toLowerCase()}.`,
    appTone: `${coachToneLabel} with ${accountabilityLabel.toLowerCase()} accountability.`,
    visualDirection: themeLabel,
    trainingPlan: `${trainingModeLabel} with ${labelFor('videoPreference', answers.videoPreference).toLowerCase()}, ${answers.daysPerWeek} sessions per week, and ${labelFor('sessionLength', answers.sessionLength).toLowerCase()} blocks.`,
    trackingFocus: trackingLane,
    nutritionLane,
    tabPlan: tabs,
    priorityNotes: compactNotes([
      answers.goalReason,
      answers.biggestBlock,
      answers.badDaySupport,
      answers.mustRemember,
      answers.mustHaveFeatures,
    ]),
    boundaryNotes: compactNotes([
      answers.injuriesOrLimits,
      answers.noGoMovements,
      answers.noGoWords,
      answers.absolutelyNot,
    ]),
  }
}

function compactNotes(entries) {
  return entries
    .map((entry) => String(entry || '').trim())
    .filter(Boolean)
    .slice(0, 5)
}

export function buildCloneMeta(answers, summary) {
  const clientName = answers.clientName?.trim() || 'Client'
  const firstName = clientName.split(' ')[0] || clientName

  return {
    cloneName: `${firstName}'s Tailored Burn`,
    templateId: 'jamie-burn-core-v1',
    themeId: answers.themeDirection,
    sourceApp: 'jamie-burn',
    surveyId: CLONE_SURVEY_ID,
    surveyVersion: CLONE_SURVEY_VERSION,
    recommendedTabs: summary.tabPlan,
    trainingMode: answers.trainingMode,
    coachTone: answers.coachTone,
  }
}

export function buildCloneBlueprintDoc(answers) {
  const mergedAnswers = mergeCloneAnswers(answers)
  const summary = buildCloneSummary(mergedAnswers)
  const cloneMeta = buildCloneMeta(mergedAnswers, summary)

  return {
    answers: mergedAnswers,
    summary,
    cloneMeta,
  }
}

export function buildCloneBlueprintMarkdown(answers) {
  const { summary, cloneMeta } = buildCloneBlueprintDoc(answers)

  return [
    `# ${cloneMeta.cloneName}`,
    '',
    `## Snapshot`,
    `- Client: ${summary.clientName}`,
    `- App name: ${summary.appName}`,
    `- Tone: ${summary.appTone}`,
    `- Visual direction: ${summary.visualDirection}`,
    `- Training plan: ${summary.trainingPlan}`,
    `- Tabs: ${summary.tabPlan.join(', ')}`,
    '',
    `## Nutrition support`,
    summary.nutritionLane.length ? `- ${summary.nutritionLane.join('\n- ')}` : '- Not a major lane',
    '',
    `## Tracking focus`,
    summary.trackingFocus.length ? `- ${summary.trackingFocus.join('\n- ')}` : '- Keep tracking light',
    '',
    `## Priority notes`,
    summary.priorityNotes.length ? `- ${summary.priorityNotes.join('\n- ')}` : '- None added yet',
    '',
    `## Boundaries`,
    summary.boundaryNotes.length ? `- ${summary.boundaryNotes.join('\n- ')}` : '- None added yet',
  ].join('\n')
}

export function buildCloneBlueprintJson(answers) {
  return JSON.stringify(buildCloneBlueprintDoc(answers), null, 2)
}
