import { getDb } from './mongodb'

export type LogCategory =
  | 'AUTH'
  | 'BOT'
  | 'COMMAND'
  | 'PLUGIN'
  | 'API'
  | 'GEMINI'
  | 'OAUTH'
  | 'SECURITY'
  | 'DATABASE'
  | 'SYSTEM'
  | 'RPG'

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG'

export function redactSecrets(data: any): any {
  if (!data) return data
  if (typeof data === 'string') {
    return data
      .replace(/(api[_-]?key|token|auth|bearer|secret|password|pin)=([^&]+)/gi, '$1=[REDACTED]')
      .replace(/(Bearer\s+)[A-Za-z0-9._~+/-]+=*/gi, '$1[REDACTED]')
  }

  if (typeof data === 'object') {
    const copy = Array.isArray(data) ? [...data] : { ...data }
    for (const key of Object.keys(copy)) {
      const lower = key.toLowerCase()
      if (
        lower.includes('token') ||
        lower.includes('password') ||
        lower.includes('secret') ||
        lower.includes('apikey') ||
        lower.includes('pin')
      ) {
        copy[key] = '[REDACTED]'
      } else if (typeof copy[key] === 'object' && copy[key] !== null) {
        copy[key] = redactSecrets(copy[key])
      }
    }
    return copy
  }

  return data
}

export async function logEvent(
  category: LogCategory,
  message: string,
  meta: Record<string, any> = {},
  level: LogLevel = 'INFO'
) {
  const sanitizedMeta = redactSecrets(meta)
  const logDoc = {
    category,
    level,
    message,
    meta: sanitizedMeta,
    createdAt: new Date(),
  }

  try {
    const db = await getDb()
    await db.collection('central_logs').insertOne(logDoc)
  } catch (err) {
    console.error(`[Logger Failure - ${category}]`, err)
  }

  const logStr = `[${new Date().toISOString()}] [${level}] [${category}] ${message}`
  if (level === 'ERROR') {
    console.error(logStr, sanitizedMeta)
  } else if (level === 'WARN') {
    console.warn(logStr, sanitizedMeta)
  } else {
    console.log(logStr, sanitizedMeta)
  }
}
