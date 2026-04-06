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

function buildConversation(messages) {
  return messages.map((entry) => ({
    role: entry.role,
    parts: [{ text: entry.text }],
  }))
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

    const reply = sanitizeReply(
      response?.text || response?.candidates?.[0]?.content?.parts?.[0]?.text,
    )

    if (!reply) {
      json(res, 502, { error: 'Coach reply was empty.' })
      return
    }

    json(res, 200, {
      success: true,
      model,
      reply,
      usage: response?.usageMetadata || null,
    })
  } catch (error) {
    json(res, 500, {
      error: error?.message || 'Coach route could not reply.',
      success: false,
    })
  }
}
