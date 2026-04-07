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
    .slice(0, 480)
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
  if (wordCount < 16) return true

  if (
    /be kind, be honest|next clear step|one step at a time|take the damn win|you've got this/i.test(
      String(reply || '').trim(),
    )
  ) {
    return true
  }

  return /^(hey|hi|hello)\s+jamie[.!]*$/i.test(String(reply || '').trim())
}

function includesAny(text, phrases) {
  return phrases.some((phrase) => text.includes(phrase))
}

function buildFallbackReply(context, latestUserMessage) {
  const prompt = String(latestUserMessage || '').toLowerCase()
  const nextStep =
    context?.nextStep ||
    (context?.workoutComplete
      ? 'Close the loop with water, calories, and a little credit for yourself.'
      : context?.workoutName
        ? `Set up for ${context.workoutName} and do the first honest round only.`
        : 'Make the next step tiny and start there.')

  if (
    includesAny(prompt, [
      'stuck',
      'motivat',
      'start',
      'behind',
      'overwhelmed',
      'lazy',
      'tired',
      'exhausted',
    ])
  ) {
    if (context?.workoutComplete) {
      return 'I get why your brain is still trying to pick at today, but the hard part is already done. Plenty of strong women finish the workout and still feel weirdly behind anyway, which is honestly just anxious brain nonsense. Keep it simple now: close out the basics gently and let that be enough. What part of today still feels unfinished to you?'
    }

    if (context?.workoutName) {
      return `Of course this feels bigger in your head than it does in real life. The trick is that momentum usually shows up after you start, not before, and that is true for almost everybody. Your only job right now is this: ${nextStep} What part usually throws you off first, starting or sticking with it?`
    }

    return `I know this feels heavy right now, but that does not mean you are failing. Most hard days need a smaller first step, not a tougher speech. ${nextStep} What would make today feel doable instead of perfect?`
  }

  if (
    includesAny(prompt, ['scale', 'weight', 'body', 'bloated', 'fat', 'puffy', 'mirror'])
  ) {
    return 'Yeah, I get why that got loud in your head. A weird scale day or a bloated day can come from soreness, salt, stress, sleep, hormones, or just being a human woman with a body, and none of that means you blew it. Cut the bullshit and go back to signal over drama: protein, water, your workout or walk, then tell me what number or thought hooked you the hardest.'
  }

  if (includesAny(prompt, ['calories', 'protein', 'cardio', 'food', 'eat', 'eating'])) {
    return 'I know food noise can make everything feel way more dramatic than it needs to. The boring truth still wins here: enough protein, an honest calorie target, decent movement, and enough recovery beat hacks every damn time. Pick one anchor meal you can trust today, and tell me where your evenings usually start slipping.'
  }

  if (includesAny(prompt, ['guilty', 'ashamed', 'mad at myself', 'hate', 'disappointed'])) {
    return 'That self-attack voice is loud because you care, not because it is telling the truth. If your best friend said this about herself, you would not let her spiral into that nonsense for even five minutes. Take the next kind but useful step: breathe, stand up, drink some water, and do the next honest thing in front of you. What are you accusing yourself of right now?'
  }

  if (context?.measurementsDue || context?.inbodyDue) {
    return 'I know the numbers can feel loaded, but they are information, not a courtroom. If you have them, log them cleanly and let the trend do the talking instead of your panic. If you do not have them yet, keep moving and come back when you do.'
  }

  if (context?.nextStep) {
    return `I hear you. Nothing about this moment needs a perfect reset, just a real one. ${context.nextStep} What is the actual sticking point today: your body, your schedule, or your head?`
  }

  return 'I hear you, and I am not grading you over one rough moment. Most of this gets better when we stop trying to fix the whole week at once and just handle the next honest step. Take one calm action, then come back and tell me what part feels hardest to trust right now.'
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
        temperature: 0.8,
        topP: 0.9,
        maxOutputTokens: 220,
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
