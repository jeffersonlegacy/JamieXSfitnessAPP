import { GoogleGenAI } from '@google/genai'

let aiClient = null

function requiredEnv(name) {
  const value = globalThis.process?.env?.[name]
  if (!value) {
    throw new Error(`Missing required Gemini env var: ${name}`)
  }
  return value
}

export function getGeminiClient() {
  if (aiClient) return aiClient

  aiClient = new GoogleGenAI({
    apiKey: requiredEnv('GEMINI_API_KEY'),
  })

  return aiClient
}

export function getGeminiModelName() {
  return globalThis.process?.env?.GEMINI_MODEL || 'gemini-2.5-flash'
}

export function normalizeCoachMessages(messages) {
  if (!Array.isArray(messages)) return []

  return messages
    .map((entry) => {
      const role = entry?.role === 'assistant' || entry?.role === 'model' ? 'model' : 'user'
      const text = String(
        entry?.content ?? entry?.message ?? entry?.text ?? '',
      ).trim()

      if (!text) return null

      return { role, text }
    })
    .filter(Boolean)
    .slice(-12)
}

export function buildCoachInstruction(context = {}) {
  const parts = []

  parts.push(
    "You are Coach Kitty inside Jamie's fitness app. Speak to Jamie directly like a best friend who also knows training.",
  )
  parts.push(
    'Your response order is: 1) acknowledge what feels true, 2) give a relatable reframe or example when helpful, 3) give one clear next move.',
  )
  parts.push(
    'Use a warm, grounded, funny, human tone. You can be a little unhinged in a charming way.',
  )
  parts.push(
    'Keep replies short: two to five sentences, usually under 110 words.',
  )
  parts.push(
    'Do not answer with only a greeting. Always give Jamie one concrete next step.',
  )
  parts.push(
    'Occasional mild swearing is okay when it adds warmth or punch. Think damn, hell, or bullshit. Never be cruel.',
  )
  parts.push(
    'Do not sound clinical, corporate, or generic. Do not mention policies or hidden reasoning.',
  )
  parts.push(
    'Use therapeutic listening without claiming to be a therapist or licensed professional.',
  )
  parts.push(
    'If the user sounds stuck, tired, discouraged, or self-critical, make the next step smaller and more doable.',
  )
  parts.push(
    'When it helps you understand Jamie better, ask one short follow-up question at the end. Questions should help you learn patterns, fears, wins, or what throws her off.',
  )
  parts.push(
    'If the user is talking about a workout, focus on safe setup, scaling, clean form, and progressive overload without ego.',
  )
  parts.push(
    'If the user is talking about food, progress, body image, or metabolism, prefer evidence-based fundamentals over trends, hacks, or fads.',
  )
  parts.push(
    'If the user is talking about progress or measurement, help her see the signal without turning it into a grade.',
  )
  parts.push(
    'Never shame her body, food choices, or pace. Preserve dignity and momentum.',
  )
  parts.push(
    'If the context is uncertain, say so plainly and do not pretend to know more than you do.',
  )

  if (context.displayName) parts.push(`Her name is ${context.displayName}.`)
  if (context.day) parts.push(`Program day: ${context.day}.`)
  if (context.workoutName) parts.push(`Workout: ${context.workoutName}.`)
  if (context.phaseName) parts.push(`Phase: ${context.phaseName}.`)
  if (context.nextStep) parts.push(`Suggested next step: ${context.nextStep}.`)
  if (context.workoutComplete) {
    parts.push('The workout for today is already complete.')
  }
  if (context.trackingLoggedToday) {
    parts.push('Today\'s check-in has already been logged.')
  }
  if (context.measurementsDue) {
    parts.push('Measurements are due or useful right now.')
  }
  if (context.inbodyDue) {
    parts.push('InBody scan data is due or useful right now.')
  }
  if (context.memorySummary) {
    parts.push(`Memory summary: ${context.memorySummary}.`)
  }
  if (context.latestMindsetTitle) {
    parts.push(`Latest mindset note title: ${context.latestMindsetTitle}.`)
  }
  if (context.latestMindsetLog) {
    parts.push(`Latest mindset note: ${context.latestMindsetLog}.`)
  }
  if (context.goal) {
    parts.push(`Current focus: ${context.goal}.`)
  }
  if (Array.isArray(context.recentGoals) && context.recentGoals.length) {
    parts.push(`Recent goals: ${context.recentGoals.join(' | ')}.`)
  }
  if (Array.isArray(context.recentMindsetNotes) && context.recentMindsetNotes.length) {
    parts.push(
      `Recent mindset notes: ${context.recentMindsetNotes
        .map((entry) => `${entry.title || 'Untitled'} - ${entry.log || ''}`.trim())
        .join(' | ')}.`,
    )
  }
  if (context.workoutStreak) {
    parts.push(`Workout streak: ${context.workoutStreak} day(s).`)
  }
  if (context.hydrationStreak) {
    parts.push(`Hydration streak: ${context.hydrationStreak} day(s).`)
  }

  return parts.join(' ')
}
