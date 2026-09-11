import { betterAuth } from 'better-auth'
import { mongodbAdapter } from 'better-auth/adapters/mongodb'
import { toNextJsHandler } from 'better-auth/next-js'
import { getDb, ObjectId } from './mongodb'
import { cookies } from 'next/headers'

const baseURL = (process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL || 'http://dannteam.biz.id').replace(/\/$/, '')
const origins = [baseURL, 'http://localhost:3000'].filter(Boolean)

let authPromise
export async function getAuth() {
  if (!authPromise) {
    authPromise = getDb().then((db) => betterAuth({
      database: mongodbAdapter(db),
      baseURL,
      trustedOrigins: origins,
      emailAndPassword: { enabled: true, requireEmailVerification: false },
      socialProviders: {
        google: { clientId: '899798992534-73pn5dcs69udjqoh5okiqv3tgl59aopq.apps.googleusercontent.com', clientSecret: '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' },
        github: { clientId: 'Ov23li7cmDcy2xVYxMjj', clientSecret: '5561027dca8714ac38cb97eb5c53e8a6de9f0900' },
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
