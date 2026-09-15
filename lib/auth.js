import { betterAuth } from 'better-auth'
import { mongodbAdapter } from 'better-auth/adapters/mongodb'
import { toNextJsHandler } from 'better-auth/next-js'
import { getDb, ObjectId } from './mongodb'
import { cookies } from 'next/headers'
import { getBaseUrl, getConfig } from './config'

const baseURL = getBaseUrl()
const config = getConfig()
const origins = (process.env.BETTER_AUTH_TRUSTED_ORIGINS || baseURL).split(',').map((origin) => origin.trim()).filter(Boolean)

let authPromise
export async function getAuth() {
  if (!authPromise) {
    authPromise = getDb().then((db) => betterAuth({
      database: mongodbAdapter(db),
      baseURL,
      trustedOrigins: origins,
      emailAndPassword: { enabled: true, requireEmailVerification: false },
      socialProviders: {
        ...(config.oauth.google.clientId && config.oauth.google.clientSecret ? {
          google: { clientId: config.oauth.google.clientId, clientSecret: config.oauth.google.clientSecret },
        } : {}),
        ...(config.oauth.github.clientId && config.oauth.github.clientSecret ? {
          github: { clientId: config.oauth.github.clientId, clientSecret: config.oauth.github.clientSecret },
        } : {}),
      },
      user: {
        additionalFields: {
          role: { type: 'string', defaultValue: 'free' },
          plan: { type: 'string', defaultValue: 'free' },
          surveySource: { type: 'string', required: false },
        },
      },
    }))
  }
  return authPromise
}

export async function getAuthHandler() {
  return toNextJsHandler(await getAuth())
}

export async function getCurrentUser() {
  const cookieStore = await cookies()
  const customToken = cookieStore.get('dann_session')?.value
  const db = await getDb()

  if (customToken) {
    const sessionDoc = await db.collection('sessions').findOne({ token: customToken })
    if (sessionDoc) {
      const uId = sessionDoc.userId
      const query = typeof uId === 'string' && ObjectId.isValid(uId) ? { _id: new ObjectId(uId) } : { _id: uId }
      const user = await db.collection('users').findOne(query)
      if (user) return user
    }
  }

  // Fallback to BetterAuth session lookup
  try {
    const auth = await getAuth()
    const reqHeaders = await import('next/headers').then(({ headers }) => headers())
    const session = await auth.api.getSession({ headers: reqHeaders })
    if (session?.user) {
      const uId = session.user.id
      const query = ObjectId.isValid(uId) ? { _id: new ObjectId(uId) } : { id: uId }
      let userDoc = await db.collection('users').findOne(query)
      if (!userDoc) userDoc = await db.collection('user').findOne(query)
      return userDoc || session.user
    }
  } catch (err) {
    console.error('getCurrentUser error:', err)
  }

  return null
}

export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) throw new Error('UNAUTHORIZED')
  return user
}
