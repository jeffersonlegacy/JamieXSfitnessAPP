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

export function buildThemeConfig(answers) {
  const themePresets = {
    'cute-hardcore': {
      background: 'dark-pink-gym',
      dock: 'glass-blush',
      surfaces: 'blush-plum-glass',
      mascotEnergy: 'cute but dangerous',
    },
    'dark-pink-gym': {
      background: 'neon-pink-to-ink',
      dock: 'glass-ink',
      surfaces: 'gym-poster-dark',
      mascotEnergy: 'hardcore feminine gym',
    },
    'clean-athlete': {
      background: 'graphite-clean',
      dock: 'frosted-smoke',
      surfaces: 'minimal-athlete',
      mascotEnergy: 'clean athlete',
    },
    'luxe-feminine': {
      background: 'rose-obsidian',
      dock: 'soft-glass-rose',
      surfaces: 'luxe-rose-dark',
      mascotEnergy: 'elevated feminine',
    },
    'minimal-focus': {
      background: 'ink-focus',
      dock: 'thin-glass',
      surfaces: 'quiet-contrast',
      mascotEnergy: 'minimal focus',
    },
    'glow-up': {
      background: 'berry-violet-glow',
      dock: 'luminous-glass',
      surfaces: 'glow-dark',
      mascotEnergy: 'main-character transformation',
    },
  }

  return {
    themeId: answers.themeDirection,
    ...(themePresets[answers.themeDirection] || themePresets['cute-hardcore']),
    customNotes: compactNotes([answers.visualNotes, answers.dreamFeel]),
  }
}

export function buildTabConfig(answers) {
  const trackingSelections = ensureArray(answers.trackingFocus, [])
  const nutritionEnabled = ensureArray(answers.nutritionSupport, []).length > 0
  const supportLabel = answers.coachTone === 'soft' ? 'Support' : 'Motivation'
  const tabs = [
    {
      id: 'workout',
      label: 'Workout',
      purpose: 'Daily workout or recovery guidance',
      enabled: true,
    },
    {
      id: 'tracking',
      label: 'Tracking',
      purpose: 'Check-ins, calories, hydration, measurements, scans',
      enabled: true,
      modules: trackingSelections,
    },
  ]

  if (nutritionEnabled) {
    tabs.push({
      id: 'nutrition',
      label: 'Nutrition',
      purpose: 'Simple food, supplement, and support guidance',
      enabled: true,
    })
  }

  tabs.push(
    {
      id: 'support',
      label: supportLabel,
      purpose: 'Mindset, truths, coach, and encouragement',
      enabled: true,
    },
    {
      id: 'wall',
      label: answers.communityStyle === 'private' ? 'Wall' : 'Promises',
      purpose: 'Goal wall and proof of follow-through',
      enabled: true,
    },
  )

  return tabs
}

export function buildCoachConfig(answers) {
  const toneGuide = {
    soft: 'calming, gentle, reassuring',
    'best-friend': 'best-friend energy, warm, real, protective',
    'direct-kind': 'direct, kind, grounded, honest',
    'playful-savage': 'playful menace, hype, cheeky, sharp',
    'facts-first': 'clear, evidence-based, no fluff',
    'therapist-coach': 'reflective, validating, insightful, steady',
  }

  return {
    persona: 'Coach Kitty',
    toneId: answers.coachTone,
    toneDescriptor: toneGuide[answers.coachTone] || toneGuide['best-friend'],
    accountabilityStyle: answers.accountabilityStyle,
    swearLevel: answers.swearLevel,
    truthLevel: answers.truthLevel,
    memoryPriorities: compactNotes([
      answers.mustRemember,
      answers.biggestBlock,
      answers.badDaySupport,
      answers.goalReason,
    ]),
    avoid: compactNotes([answers.noGoWords, answers.absolutelyNot]),
  }
}

export function buildTrackingConfig(answers) {
  const focus = ensureArray(answers.trackingFocus, [])
  return {
    checkInTime: answers.checkInTime,
    reminderStyle: answers.reminderStyle,
    modules: {
      workouts: true,
      calories: focus.includes('calories'),
      water: focus.includes('water'),
      measurements: focus.includes('measurements'),
      photos: focus.includes('photos'),
      inbody: focus.includes('inbody'),
      steps: focus.includes('steps'),
      mindset: focus.includes('mindset'),
      strengthPrs: focus.includes('strength-prs'),
    },
    defaultCloseoutCopy:
      answers.checkInTime === 'morning'
        ? 'Keep the check-in light so they will actually use it early.'
        : 'Treat the check-in like a clean end-of-day closeout.',
  }
}

export function buildNutritionConfig(answers) {
  const lanes = ensureArray(answers.nutritionSupport, [])
  const supplements = ensureArray(answers.supplementInterest, [])
  const categories = [
    {
      id: 'protein',
      title: 'Protein support',
      enabled: lanes.includes('protein') || supplements.includes('protein'),
      items: ['Protein powders', 'Shakes', 'Protein bars', 'Lean meal anchors'],
      guidance: 'Make protein easier, not more complicated.',
    },
    {
      id: 'hydration',
      title: 'Hydration support',
      enabled: lanes.includes('hydration') || supplements.includes('hydration'),
      items: ['Water goals', 'Electrolytes', 'Coconut water', 'Workout hydration'],
      guidance: 'Use hydration to steady energy and appetite, not as a punishment ritual.',
    },
    {
      id: 'simple-meals',
      title: 'Simple meals',
      enabled: lanes.includes('simple-meals') || lanes.includes('grocery-list'),
      items: ['Easy breakfasts', 'High-protein lunches', 'Dinner defaults', 'Snack swaps'],
      guidance: 'Default meals beat perfect meal plans.',
    },
    {
      id: 'supplements',
      title: 'Supplements',
      enabled: lanes.includes('supplements') || supplements.some((entry) => entry !== 'none'),
      items: labelsFor('supplementInterest', supplements.filter((entry) => entry !== 'none')),
      guidance: 'Supplements should support the basics, not replace them.',
    },
    {
      id: 'restaurant-help',
      title: 'Restaurant help',
      enabled: lanes.includes('restaurant-help'),
      items: ['Protein-first ordering', 'Swap strategy', 'Calorie damage control'],
      guidance: 'The app should help them recover quickly from normal life, not fear it.',
    },
  ].filter((entry) => entry.enabled)

  return {
    enabled: categories.length > 0,
    categories,
    tone: 'friend helping out with the what, why, when, and how',
  }
}

export function buildWorkoutConfig(answers) {
  return {
    mode: answers.trainingMode,
    guidanceStyle: answers.videoPreference,
    gymComfort: answers.gymComfort,
    daysPerWeek: answers.daysPerWeek,
    sessionLength: answers.sessionLength,
    restDayStyle: answers.restDayStyle,
    equipmentAccess: ensureArray(answers.equipmentAccess, []),
    mustRespect: compactNotes([answers.injuriesOrLimits, answers.noGoMovements]),
  }
}

export function buildCoachPrompt(answers) {
  const summary = buildCloneSummary(answers)
  const coach = buildCoachConfig(answers)

  return [
    `# Coach prompt for ${summary.clientName}`,
    '',
    `You are Coach Kitty for ${summary.clientName}.`,
    `Speak like ${coach.toneDescriptor}.`,
    `Accountability style: ${coach.accountabilityStyle}.`,
    `Swear level: ${coach.swearLevel}.`,
    `Truth level: ${coach.truthLevel}.`,
    '',
    `## Core job`,
    `- Help ${summary.clientName} stay consistent with ${summary.trainingPlan.toLowerCase()}.`,
    `- Keep the focus on ${summary.headline.replace(`${summary.clientName} needs a `, '').replace(/\.$/, '')}.`,
    `- Be useful on hard days instead of preachy.`,
    `- Use fact over fad.`,
    `- Remember personal context and bring it back naturally.`,
    '',
    `## Remember`,
    ...(coach.memoryPriorities.length ? coach.memoryPriorities.map((entry) => `- ${entry}`) : ['- No memory notes saved yet']),
    '',
    `## Avoid`,
    ...(coach.avoid.length ? coach.avoid.map((entry) => `- ${entry}`) : ['- No forbidden language noted yet']),
  ].join('\n')
}

export function buildStarterBundle(answers) {
  const mergedAnswers = mergeCloneAnswers(answers)
  const summary = buildCloneSummary(mergedAnswers)
  const cloneMeta = buildCloneMeta(mergedAnswers, summary)
  const theme = buildThemeConfig(mergedAnswers)
  const tabs = buildTabConfig(mergedAnswers)
  const workout = buildWorkoutConfig(mergedAnswers)
  const coach = buildCoachConfig(mergedAnswers)
  const tracking = buildTrackingConfig(mergedAnswers)
  const nutrition = buildNutritionConfig(mergedAnswers)
  const topTracking = Object.entries(tracking.modules)
    .filter(([, enabled]) => enabled)
    .map(([key]) => key)

  return {
    summary,
    cloneMeta,
    schemaVersion: 2,
    template: {
      templateId: 'jamie-burn-core-v1',
      sourceApp: 'jamie-burn',
      sourceVersion: '1.0.0',
    },
    client: {
      clientName: summary.clientName,
      appName: summary.appName,
      goal: mergedAnswers.primaryGoal,
      targetOutcome: mergedAnswers.targetOutcome,
      biggestBlock: mergedAnswers.biggestBlock,
    },
    brand: {
      themeId: theme.themeId,
      visualDirection: summary.visualDirection,
      tone: mergedAnswers.coachTone,
      voiceRules: [
        mergedAnswers.accountabilityStyle,
        mergedAnswers.truthLevel,
        mergedAnswers.swearLevel === 'none'
          ? 'clean-language'
          : `${mergedAnswers.swearLevel}-swearing`,
      ],
    },
    experience: {
      trainingMode: mergedAnswers.trainingMode,
      videoPreference: mergedAnswers.videoPreference,
      restDayStyle: mergedAnswers.restDayStyle,
      daysPerWeek: Number(mergedAnswers.daysPerWeek) || mergedAnswers.daysPerWeek,
      sessionLength: mergedAnswers.sessionLength,
      checkInTime: mergedAnswers.checkInTime,
      reminderStyle: mergedAnswers.reminderStyle,
    },
    navigation: {
      tabs: tabs.map((entry) => entry.label),
      hiddenModules: nutrition.enabled ? [] : ['Nutrition'],
      defaultTab: 'Workout',
    },
    coach: {
      name: 'Coach Kitty',
      personality: coach.toneDescriptor,
      memoryToKeep: coach.memoryPriorities,
      noGoWords: coach.avoid,
      truthLevel: mergedAnswers.truthLevel,
    },
    tracking: {
      enabled: topTracking,
      priority: topTracking.filter((entry) =>
        ['workouts', 'calories', 'water', 'measurements', 'inbody'].includes(entry),
      ),
    },
    nutrition: {
      enabled: nutrition.categories.map((entry) => entry.id),
      supplements: labelsFor(
        'supplementInterest',
        mergedAnswers.supplementInterest.filter((entry) => entry !== 'none'),
      ),
    },
    memory: {
      boundaries: compactNotes([
        mergedAnswers.injuriesOrLimits,
        mergedAnswers.noGoMovements,
        mergedAnswers.absolutelyNot,
      ]),
      motivators: compactNotes([mergedAnswers.dreamFeel, mergedAnswers.mustRemember]),
    },
    appConfig: {
      client: {
        name: summary.clientName,
        appName: summary.appName,
      },
      theme,
      tabs,
      workout,
      coach,
      tracking,
      nutrition,
      community: {
        style: mergedAnswers.communityStyle,
        supportCircle: mergedAnswers.supportCircle,
      },
      implementationNotes: {
        mustHaveFeatures: compactNotes([mergedAnswers.mustHaveFeatures]),
        absolutelyNot: compactNotes([mergedAnswers.absolutelyNot]),
        visualNotes: compactNotes([mergedAnswers.visualNotes, mergedAnswers.dreamFeel]),
      },
    },
    coachPrompt: buildCoachPrompt(mergedAnswers),
    nutritionManifest: nutrition,
    starterBundle: {
      themeTokens: {
        background: theme.background,
        accent: mergedAnswers.themeDirection,
        surface: theme.surfaces,
        dock: theme.dock,
      },
      tabs: tabs.map((entry, index) => ({
        id: entry.id,
        label: entry.label,
        default: index === 0,
      })),
      copySeed: {
        workoutHeader: 'Today’s work',
        trackingHeader: 'What to record',
        nutritionHeader: 'Nutrition support',
        coachHeader: 'Coach Kitty',
        wallHeader: mergedAnswers.communityStyle === 'private' ? 'Your chalkboard' : 'Promise wall',
      },
      dataSeed: {
        trackingMetrics: topTracking,
        coachMemoryFields: [
          'goalReason',
          'biggestBlock',
          'mustRemember',
          'badDaySupport',
        ],
      },
      aiSeed: {
        systemStyle: `${coach.toneDescriptor}; ${mergedAnswers.accountabilityStyle}; ${mergedAnswers.truthLevel}; ${mergedAnswers.swearLevel}`,
      },
    },
  }
}

export function buildCloneBlueprintDoc(answers) {
  const mergedAnswers = mergeCloneAnswers(answers)
  const summary = buildCloneSummary(mergedAnswers)
  const cloneMeta = buildCloneMeta(mergedAnswers, summary)
  const starterBundle = buildStarterBundle(mergedAnswers)

  return {
    answers: mergedAnswers,
    summary,
    cloneMeta,
    schemaVersion: starterBundle.schemaVersion,
    template: starterBundle.template,
    client: starterBundle.client,
    brand: starterBundle.brand,
    experience: starterBundle.experience,
    navigation: starterBundle.navigation,
    coach: starterBundle.coach,
    tracking: starterBundle.tracking,
    nutrition: starterBundle.nutrition,
    memory: starterBundle.memory,
    starterBundle: starterBundle.starterBundle,
    generator: {
      appConfig: starterBundle.appConfig,
      coachPrompt: starterBundle.coachPrompt,
      nutritionManifest: starterBundle.nutritionManifest,
    },
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

export function buildStarterBundleJson(answers) {
  return JSON.stringify(buildStarterBundle(answers), null, 2)
}
