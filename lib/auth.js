import { betterAuth } from 'better-auth'
import { mongodbAdapter } from 'better-auth/adapters/mongodb'
import { toNextJsHandler } from 'better-auth/next-js'
import { Resend } from 'resend'
import { getDb } from './mongodb'

const baseURL = (process.env.BETTER_AUTH_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL || process.env.V0_RUNTIME_URL || 'http://localhost:3000').replace(/\/$/, '')
const origins = [baseURL, 'http://localhost:3000', process.env.V0_RUNTIME_URL, process.env.V0_DEV_APP_URL, process.env.V0_BUILD_URL, process.env.V0_SANDBOX_URL].filter(Boolean)

let authPromise
export async function getAuth() {
  if (!authPromise) {
    authPromise = getDb().then((db) => betterAuth({
      database: mongodbAdapter(db),
      baseURL,
      trustedOrigins: origins,
      emailAndPassword: { enabled: true, requireEmailVerification: true },
      socialProviders: {
        google: { clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET },
        github: { clientId: process.env.GITHUB_CLIENT_ID, clientSecret: process.env.GITHUB_CLIENT_SECRET },
      },
      user: { additionalFields: { role: { type: 'string', defaultValue: 'free' }, plan: { type: 'string', defaultValue: 'free' }, avatarPathname: { type: 'string', required: false } } },
      emailVerification: {
        sendVerificationEmail: async ({ user, url }) => {
          const resend = new Resend(process.env.RESEND_API_KEY)
          const { error } = await resend.emails.send({ from: `dann-tele <${process.env.RESEND_EMAIL_DOMAIN || 'onboarding@resend.dev'}>`, to: [user.email], subject: 'Verify your dann-tele email', html: `<p>Hi ${user.name || 'there'},</p><p>Verify your email to activate your workspace:</p><p><a href="${url}">Verify email</a></p>` }, { idempotencyKey: `verify-email/${user.id}` })
          if (error) throw new Error('Unable to send verification email')
        },
      },
      ...(process.env.NODE_ENV === 'development' ? { advanced: { defaultCookieAttributes: { sameSite: 'none', secure: true } } } : {}),
    }))
  }
  return authPromise
}

export async function getAuthHandler() { return toNextJsHandler(await getAuth()) }

export async function getCurrentUser() {
  const auth = await getAuth()
  const session = await auth.api.getSession({ headers: await import('next/headers').then(({ headers }) => headers()) })
  return session?.user || null
}

export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) throw new Error('UNAUTHORIZED')
  return user
}
