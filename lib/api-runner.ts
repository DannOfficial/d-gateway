import { validateUrlForSsrf } from './ssrf'

export function redactSensitiveData(input: string): string {
  if (!input) return ''
  return input
    .replace(/(api[_-]?key|token|auth|bearer|secret|password|pin)=([^&]+)/gi, '$1=[REDACTED]')
    .replace(/(Bearer\s+)[A-Za-z0-9._~+/-]+=*/gi, '$1[REDACTED]')
}

export async function executeExternalApiCommand(
  db: any,
  bot: any,
  command: any,
  queryParam: string,
  senderUsername: string
): Promise<string> {
  const rawUrl = command.apiEndpoint || command.scrapeUrl
  if (!rawUrl) return '⚠️ No API endpoint configured for this command.'

  const filledUrl = rawUrl.replace(/\{query\}/g, encodeURIComponent(queryParam || 'kucing')).replace(/@query/g, encodeURIComponent(queryParam || 'kucing'))

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
    return `⚠️ <b>SSRF Security Blocked:</b> Target API endpoint is not allowed (${ssrf.reason})`
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
      status: res.ok ? 'SUCCESS' : 'FAILED',
      createdAt: new Date(),
    })

    if (!res.ok) {
      return `⚠️ <b>API Error (HTTP ${res.status}):</b> ${res.statusText || 'External API returned error'}`
    }

    if (command.response) {
      let output = command.response
      if (jsonResult && typeof jsonResult === 'object') {
        output = output.replace(/\{result\}/g, typeof jsonResult.data === 'string' ? jsonResult.data : JSON.stringify(jsonResult, null, 2))
      } else {
        output = output.replace(/\{result\}/g, bodyText.slice(0, 1000))
      }
      return output
    }

    if (jsonResult) {
      return `✨ <b>[API Response]</b>\n<pre>${JSON.stringify(jsonResult, null, 2).slice(0, 3500)}</pre>`
    }

    return `✨ <b>[API Response]</b>\n${bodyText.slice(0, 2000)}`
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

    return `⚠️ <b>API Execution Failed:</b> ${err.message || 'Timeout / Network Error'}`
  }
}
