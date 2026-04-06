import { getFirebaseAdminMessaging } from '../../src/lib/server/firebaseAdmin.js'

function json(res, statusCode, payload) {
  res.status(statusCode).setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(payload))
}

function parseTokens(body) {
  if (Array.isArray(body?.tokens)) {
    return body.tokens.map((token) => String(token).trim()).filter(Boolean)
  }

  if (body?.token) {
    return [String(body.token).trim()].filter(Boolean)
  }

  return []
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

  const tokens = parseTokens(body)
  if (!tokens.length) {
    json(res, 400, { error: 'Provide at least one FCM token.' })
    return
  }

  const title = String(body?.title || 'Jamie, your reminder is here').trim()
  const bodyText = String(
    body?.body ||
      'You do not need a perfect day. Just open the app and take the next easy step.',
  ).trim()
  const link = String(body?.link || '/').trim() || '/'

  const messaging = getFirebaseAdminMessaging()
  const response = await messaging.sendEachForMulticast({
    tokens,
    notification: {
      title,
      body: bodyText,
    },
    webpush: {
      fcmOptions: {
        link,
      },
    },
    data: {
      link,
      kind: String(body?.kind || 'reminder'),
    },
  })

  json(res, 200, {
    success: true,
    requested: tokens.length,
    successCount: response.successCount,
    failureCount: response.failureCount,
    responses: response.responses.map((item) => ({
      success: item.success,
      messageId: item.messageId || null,
      error: item.error ? item.error.message : null,
    })),
  })
}
