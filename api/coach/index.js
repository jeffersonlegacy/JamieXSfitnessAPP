import {
  buildCoachInstruction,
  getGeminiClient,
  getGeminiModelName,
  normalizeCoachMessages,
} from '../../src/lib/server/gemini.js'

function json(res, statusCode, payload) {
  res.status(statusCode).setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(payload))
}

function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let text = ''

    req.on('data', (chunk) => {
      text += chunk.toString('utf8')
    })

    req.on('end', () => {
      if (!text.trim()) {
        resolve({})
        return
      }

      try {
        resolve(JSON.parse(text))
      } catch {
        reject(new Error('Request body must be valid JSON.'))
      }
    })

    req.on('error', reject)
  })
}

function sanitizeReply(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 280)
}

function extractReplyText(response) {
  const direct = sanitizeReply(response?.text)
  if (direct) return direct

  const parts = response?.candidates?.[0]?.content?.parts || []
  return sanitizeReply(
    parts
      .map((part) => part?.text || '')
      .filter(Boolean)
      .join(' '),
  )
}

function isThinReply(reply) {
  const wordCount = String(reply || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length

  if (!wordCount) return true
  if (wordCount < 4) return true

  return /^(hey|hi|hello)\s+jamie[.!]*$/i.test(String(reply || '').trim())
}

function buildFallbackReply(context, latestUserMessage) {
  const prompt = String(latestUserMessage || '').toLowerCase()

  if (prompt.includes('stuck') || prompt.includes('motivat') || prompt.includes('start')) {
    if (context?.workoutComplete) {
      return 'You already did the hard part today. Close out the basics gently and let that count.'
    }

    if (context?.workoutName) {
      return 'Make the next step tiny: open the workout, do the first round only, and let momentum show up after you start.'
    }

    return 'Make the next step tiny. Start with five honest minutes instead of waiting to feel fully ready.'
  }

  if (prompt.includes('scale') || prompt.includes('weight') || prompt.includes('body')) {
    return 'One number is not the whole story. Stay with the trend and the habits that are already moving for you.'
  }

  if (context?.measurementsDue || context?.inbodyDue) {
    return 'If you have the numbers, log them. If you do not, keep going and come back when you do.'
  }

  if (context?.nextStep) {
    return `Keep it simple: ${context.nextStep}`
  }

  return 'Be kind, be honest, and take the next clear step instead of trying to solve everything at once.'
}

function buildConversation(messages) {
  return messages.map((entry) => ({
    role: entry.role,
    parts: [{ text: entry.text }],
  }))
}

function isHighRiskMessage(text) {
  const normalized = String(text || '').toLowerCase()

  return [
    'suicide',
    'kill myself',
    'want to die',
    'hurt myself',
    'self harm',
    'self-harm',
    'end my life',
    'not worth living',
    'better off dead',
  ].some((phrase) => normalized.includes(phrase))
}

function buildHighRiskReply() {
  return 'Jamie, I’m really glad you said that out loud. I need you to reach out to a real person right now: call or text 988 in the U.S., or call emergency services if you might act on this tonight. Stay with someone, or get someone to stay with you.'
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'POST,OPTIONS')
    res.status(204).end()
    return
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST,OPTIONS')
    json(res, 405, { error: 'Method not allowed.' })
    return
  }

  let body
  try {
    body = await parseRequestBody(req)
  } catch (error) {
    json(res, 400, { error: error.message })
    return
  }

  try {
    const context = body?.context && typeof body.context === 'object' ? body.context : {}
    const messages = normalizeCoachMessages(body?.messages ?? body?.recentMessages)

    if (!messages.length && !String(body?.message || '').trim()) {
      json(res, 400, { error: 'Provide a message or at least one recent conversation message.' })
      return
    }

    const conversation = messages.length
      ? buildConversation(messages)
      : [{ role: 'user', parts: [{ text: String(body.message).trim() }] }]
    const latestUserMessage =
      messages.filter((entry) => entry.role === 'user').at(-1)?.text ||
      String(body?.message || '').trim()

    if (isHighRiskMessage(latestUserMessage)) {
      json(res, 200, {
        success: true,
        model: 'safety-fallback',
        reply: buildHighRiskReply(),
        usage: null,
      })
      return
    }

    const prompt = buildCoachInstruction(context)
    const ai = getGeminiClient()
    const model = getGeminiModelName()

    const response = await ai.models.generateContent({
      model,
      contents: conversation,
      config: {
        systemInstruction: prompt,
        temperature: 0.7,
        topP: 0.9,
        maxOutputTokens: 120,
      },
    })

    const reply = extractReplyText(response)

    const finalReply = isThinReply(reply)
      ? buildFallbackReply(context, latestUserMessage)
      : reply

    json(res, 200, {
      success: true,
      model,
      reply: finalReply,
      usage: response?.usageMetadata || null,
    })
  } catch (error) {
    json(res, 500, {
      error: error?.message || 'Coach route could not reply.',
      success: false,
    })
  }
}
