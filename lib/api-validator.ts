import { validateUrlForSsrf } from './ssrf'

export interface ApiValidationResult {
  valid: boolean
  statusCode?: number
  latencyMs?: number
  contentType?: string
  responsePreview?: string
  error?: string
}

export async function validateExternalApiEndpoint(
  endpointUrl: string,
  method: 'GET' | 'POST' = 'GET',
  headers: Record<string, string> = {},
  sampleQuery: string = 'test'
): Promise<ApiValidationResult> {
  if (!endpointUrl || !endpointUrl.trim()) {
    return { valid: false, error: 'API endpoint URL is empty.' }
  }

  const filledUrl = endpointUrl.replace(/\{query\}/g, encodeURIComponent(sampleQuery)).replace(/@query/g, encodeURIComponent(sampleQuery))

  const ssrfCheck = await validateUrlForSsrf(filledUrl)
  if (!ssrfCheck.safe) {
    return { valid: false, error: `SSRF Violation: ${ssrfCheck.reason}` }
  }

  const startTime = Date.now()
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)

  try {
    const res = await fetch(filledUrl, {
      method,
      headers: {
        'User-Agent': 'Dann-Tele-Gateway/1.0',
        Accept: 'application/json, text/plain, */*',
        ...headers,
      },
      signal: controller.signal,
    })

    const latencyMs = Date.now() - startTime
    clearTimeout(timeout)

    const contentType = res.headers.get('content-type') || ''
    const bodyText = await res.text()

    if (!res.ok) {
      return {
        valid: false,
        statusCode: res.status,
        latencyMs,
        contentType,
        error: `HTTP ${res.status}: ${res.statusText || 'API returned error status'}`,
      }
    }

    let isJson = false
    try {
      JSON.parse(bodyText)
      isJson = true
    } catch {
      isJson = false
    }

    return {
      valid: true,
      statusCode: res.status,
      latencyMs,
      contentType,
      responsePreview: bodyText.slice(0, 500) + (bodyText.length > 500 ? '...' : ''),
    }
  } catch (err: any) {
    clearTimeout(timeout)
    const latencyMs = Date.now() - startTime

    if (err.name === 'AbortError') {
      return { valid: false, latencyMs, error: 'API request timed out after 8 seconds.' }
    }

    return { valid: false, latencyMs, error: err.message || 'Failed to connect to API endpoint.' }
  }
}
