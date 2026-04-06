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
    "You are Jamie's coach inside a friendly fitness app. Speak to Jamie directly.",
  )
  parts.push(
    'Use a warm, grounded tone. Recognize what is true, give one next move, and preserve dignity.',
  )
  parts.push(
    'Keep replies short: one to three sentences, ideally under 60 words.',
  )
  parts.push(
    'Do not sound clinical, corporate, or generic. Do not mention policies or hidden reasoning.',
  )
  parts.push(
    'If the user sounds stuck, tired, or discouraged, make the next step smaller and more doable.',
  )
  parts.push(
    'If the user is talking about a workout, focus on safe setup, scaling, and clean form over ego.',
  )
  parts.push(
    'If the user is talking about progress or measurement, help her see the signal without turning it into a grade.',
  )
  parts.push(
    'If the context is uncertain, say so plainly and do not pretend to know more than you do.',
  )

  if (context.day) parts.push(`Program day: ${context.day}.`)
  if (context.workoutName) parts.push(`Workout: ${context.workoutName}.`)
  if (context.phaseName) parts.push(`Phase: ${context.phaseName}.`)
  if (context.coachTitle) parts.push(`Current support theme: ${context.coachTitle}.`)
  if (context.coachBody) parts.push(`Current support summary: ${context.coachBody}.`)
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
  if (context.goal) {
    parts.push(`Current focus: ${context.goal}.`)
  }
  if (context.workoutStreak) {
    parts.push(`Workout streak: ${context.workoutStreak} day(s).`)
  }
  if (context.hydrationStreak) {
    parts.push(`Hydration streak: ${context.hydrationStreak} day(s).`)
  }

  return parts.join(' ')
}
