import fs from 'fs'
import path from 'path'

export interface AppConfig {
  app: {
    name: string
    baseUrl: string
    callbackPath: string
    timezone: string
  }
  oauth: {
    google: {
      clientId: string
      clientSecret: string
      redirectUri: string
    }
    github: {
      clientId: string
      clientSecret: string
      redirectUri: string
    }
  }
  gemini: {
    defaultModel: string
  }
  telegram: {
    apiEndpoint: string
  }
}

const defaultConfig: AppConfig = {
  app: {
    name: 'Dann-Tele Gateway',
    baseUrl: process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || 'https://dannteam.biz.id',
    callbackPath: '/callback',
    timezone: 'Asia/Jakarta',
  },
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      redirectUri: (process.env.NEXT_PUBLIC_APP_URL || 'https://dannteam.biz.id') + '/callback?provider=google',
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      redirectUri: (process.env.NEXT_PUBLIC_APP_URL || 'https://dannteam.biz.id') + '/callback?provider=github',
    },
  },
  gemini: {
    defaultModel: 'gemini-2.5-flash',
  },
  telegram: {
    apiEndpoint: 'https://api.telegram.org',
  },
}

let loadedConfig: AppConfig | null = null

export function getConfig(): AppConfig {
  if (loadedConfig) return loadedConfig

  try {
    const configPath = path.join(process.cwd(), 'config', 'config.json')
    if (fs.existsSync(configPath)) {
      const fileContent = fs.readFileSync(configPath, 'utf8')
      const parsed = JSON.parse(fileContent)
      loadedConfig = {
        app: { ...defaultConfig.app, ...parsed.app },
        oauth: {
          google: {
            clientId: parsed.oauth?.google?.clientId || process.env.GOOGLE_CLIENT_ID || defaultConfig.oauth.google.clientId,
            clientSecret: parsed.oauth?.google?.clientSecret || process.env.GOOGLE_CLIENT_SECRET || defaultConfig.oauth.google.clientSecret,
            redirectUri: parsed.oauth?.google?.redirectUri || defaultConfig.oauth.google.redirectUri,
          },
          github: {
            clientId: parsed.oauth?.github?.clientId || process.env.GITHUB_CLIENT_ID || defaultConfig.oauth.github.clientId,
            clientSecret: parsed.oauth?.github?.clientSecret || process.env.GITHUB_CLIENT_SECRET || defaultConfig.oauth.github.clientSecret,
            redirectUri: parsed.oauth?.github?.redirectUri || defaultConfig.oauth.github.redirectUri,
          },
        },
        gemini: { ...defaultConfig.gemini, ...parsed.gemini },
        telegram: { ...defaultConfig.telegram, ...parsed.telegram },
      }
      return loadedConfig!
    }
  } catch (err) {
    console.error('Failed to load config/config.json, falling back to defaults:', err)
  }

  loadedConfig = defaultConfig
  return loadedConfig!
}

export function getBaseUrl(): string {
  const cfg = getConfig()
  return cfg.app.baseUrl.replace(/\/$/, '')
}

export function getCallbackUrl(provider?: string): string {
  const baseUrl = getBaseUrl()
  const pathName = getConfig().app.callbackPath || '/callback'
  if (provider) {
    return `${baseUrl}${pathName}?provider=${encodeURIComponent(provider)}`
  }
  return `${baseUrl}${pathName}`
}

export function getApiUrl(pathStr: string = ''): string {
  const baseUrl = getBaseUrl()
  const cleanPath = pathStr.startsWith('/') ? pathStr : `/${pathStr}`
  return `${baseUrl}/api${cleanPath}`
}

export function getAssetUrl(pathStr: string = ''): string {
  const baseUrl = getBaseUrl()
  const cleanPath = pathStr.startsWith('/') ? pathStr : `/${pathStr}`
  return `${baseUrl}${cleanPath}`
}
