const PRIVATE_HOSTNAMES = new Set(['localhost', '127.0.0.1', '0.0.0.0', '[::1]'])

export function isPrivateUrl(value) {
  try {
    const url = new URL(value)
    const hostname = url.hostname.toLowerCase()
    if (!['http:', 'https:'].includes(url.protocol)) return true
    if (PRIVATE_HOSTNAMES.has(hostname) || hostname.endsWith('.local') || hostname.endsWith('.internal')) return true
    if (/^(10|127|169\.254|192\.168)\./.test(hostname)) return true
    if (/^172\.(1[6-9]|2\d|3[01])\./.test(hostname) || hostname.includes(':')) return true
    return false
  } catch {
    return true
  }
}

export async function safeFetch(value, init = {}, { timeoutMs = 8000, maxBytes = 1024 * 1024 } = {}) {
  if (isPrivateUrl(value)) throw new Error('Only public HTTP(S) URLs are allowed')
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(value, { ...init, redirect: 'error', signal: controller.signal })
    const length = Number(response.headers.get('content-length') || 0)
    if (length > maxBytes) throw new Error('Remote response is too large')
    return response
  } finally {
    clearTimeout(timer)
  }
}
