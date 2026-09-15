import { validateUrlForSsrf } from './ssrf'

export function redactSensitiveData(input: string): string {
  if (!input) return ''
  return input
    .replace(/(api[_-]?key|token|auth|bearer|secret|password|pin)=([^&]+)/gi, '$1=[REDACTED]')
    .replace(/(Bearer\s+)[A-Za-z0-9._~+/-]+=*/gi, '$1[REDACTED]')
}

function getNestedProperty(obj: any, pathStr: string): any {
  if (!obj || !pathStr) return undefined
  const cleanPath = pathStr.replace(/\[(\d+)\]/g, '.$1')
  const parts = cleanPath.split('.')
  let current = obj
  for (const p of parts) {
    if (!p) continue
    if (current === null || current === undefined) return undefined
    current = current[p]
  }
  return current
}

export async function executeExternalApiCommand(
  db: any,
  bot: any,
  command: any,
  queryParam: string,
  senderUsername: string
): Promise<{ text: string; dynamicImageUrl?: string }> {
  const rawUrl = command.apiEndpoint || command.scrapeUrl
  if (!rawUrl) return { text: '⚠️ No API endpoint configured for this command.' }

  const filledUrl = rawUrl
    .replace(/\{query\}/g, encodeURIComponent(queryParam || 'kucing'))
    .replace(/@query/g, encodeURIComponent(queryParam || 'kucing'))

  const ssrf = await validateUrlForSsrf(filledUrl)
  if (!ssrf.safe) {
    await db.collection('api_logs').insertOne({
      botId: bot._id,
      userId: bot.userId,
      command: command.command,
      endpoint: redactSensitiveData(rawUrl),
      status: 'BLOCKED',
      statusCode: 403,
      error: ssrf.reason,
      createdAt: new Date(),
    })
    return { text: `⚠️ <b>SSRF Security Blocked:</b> Target API endpoint is not allowed (${ssrf.reason})` }
  }

  const startTime = Date.now()
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)

  const headersObj: Record<string, string> = { 'User-Agent': 'Dann-Tele-Gateway/1.0', Accept: 'application/json' }
  if (Array.isArray(command.apiHeaders)) {
    for (const h of command.apiHeaders) {
      if (h.key && h.value) headersObj[h.key] = h.value
    }
  }

  try {
    const res = await fetch(filledUrl, {
      method: command.apiMethod || 'GET',
      headers: headersObj,
      signal: controller.signal,
    })

    const latency = Date.now() - startTime
    clearTimeout(timeout)

    const contentType = res.headers.get('content-type') || ''
    const bodyText = await res.text()

    let jsonResult: any = null
    try {
      jsonResult = JSON.parse(bodyText)
    } catch {
      jsonResult = null
    }

    await db.collection('api_logs').insertOne({
      botId: bot._id,
      userId: bot.userId,
      command: command.command,
      endpoint: redactSensitiveData(rawUrl),
      method: command.apiMethod || 'GET',
      statusCode: res.status,
      latency,
      contentType,
      status: res.ok ? 'SUCCESS' : 'FAILED',
      createdAt: new Date(),
    })

    if (!res.ok) {
      return { text: `⚠️ <b>API Error (HTTP ${res.status}):</b> ${res.statusText || 'External API returned error'}` }
    }

    let dynamicImageUrl: string | undefined = undefined
    if (jsonResult) {
      // Find dynamic image URL in jsonResult
      const candidates = [
        getNestedProperty(jsonResult, 'image'),
        getNestedProperty(jsonResult, 'photo'),
        getNestedProperty(jsonResult, 'url'),
        getNestedProperty(jsonResult, 'data.image'),
        getNestedProperty(jsonResult, 'data.photo'),
        getNestedProperty(jsonResult, 'data.url'),
        getNestedProperty(jsonResult, 'data[0].image'),
        getNestedProperty(jsonResult, 'data[0].photo'),
        getNestedProperty(jsonResult, 'data[0].url'),
        getNestedProperty(jsonResult, 'result[0].image'),
        getNestedProperty(jsonResult, 'result[0].url'),
      ]
      dynamicImageUrl = candidates.find((c) => typeof c === 'string' && /^https?:\/\//i.test(c))
    }

    if (command.response) {
      let output = command.response

      // Replace placeholders like {result.title} or {data[0].image}
      output = output.replace(/\{([a-zA-Z0-9_.[\]]+)\}/g, (match, path) => {
        if (path === 'result') {
          return typeof jsonResult?.data === 'string'
            ? jsonResult.data
            : JSON.stringify(jsonResult, null, 2)
        }
        const val = getNestedProperty(jsonResult, path)
        if (val !== undefined && val !== null) {
          return typeof val === 'object' ? JSON.stringify(val) : String(val)
        }
        return match
      })

      return { text: output, dynamicImageUrl }
    }

    if (jsonResult) {
      return {
        text: `✨ <b>[API Response]</b>\n<pre>${JSON.stringify(jsonResult, null, 2).slice(0, 3500)}</pre>`,
        dynamicImageUrl,
      }
    }

    return { text: `✨ <b>[API Response]</b>\n${bodyText.slice(0, 2000)}` }
  } catch (err: any) {
    clearTimeout(timeout)
    const latency = Date.now() - startTime

    await db.collection('api_logs').insertOne({
      botId: bot._id,
      userId: bot.userId,
      command: command.command,
      endpoint: redactSensitiveData(rawUrl),
      method: command.apiMethod || 'GET',
      statusCode: 500,
      latency,
      status: 'ERROR',
      error: err.message,
      createdAt: new Date(),
    })

    return { text: `⚠️ <b>API Execution Failed:</b> ${err.message || 'Timeout / Network Error'}` }
  }
}
