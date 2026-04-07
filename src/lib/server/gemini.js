import { readFileSync } from 'node:fs'
import { GoogleGenAI } from '@google/genai'

let aiClient = null
const COACH_KITTY_SYSTEM = readFileSync(
  new URL('./coach-kitty.md', import.meta.url),
  'utf8',
).trim()

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
    .slice(-8)
}

export function buildCoachInstruction(context = {}) {
  const parts = []

  parts.push(COACH_KITTY_SYSTEM)

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
  if (Array.isArray(context.likedTruths) && context.likedTruths.length) {
    parts.push(`Truths that landed well for Jamie: ${context.likedTruths.join(' | ')}.`)
  }
  if (Array.isArray(context.sensitiveTruths) && context.sensitiveTruths.length) {
    parts.push(
      `Sensitive truths Jamie swiped down on: ${context.sensitiveTruths.join(' | ')}. Treat these as delicate areas and approach them gently.`,
    )
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
