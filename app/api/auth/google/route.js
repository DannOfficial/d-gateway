import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getDb } from '../../../../lib/mongodb'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const BASE_URL = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export async function GET(request) {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return NextResponse.redirect(`${BASE_URL}/login?error=oauth_not_configured`)
  }
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  // Step 1: If no code, redirect to Google OAuth authorization endpoint
  if (!code) {
    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    googleAuthUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID)
    googleAuthUrl.searchParams.set('redirect_uri', `${BASE_URL}/api/auth/google`)
    googleAuthUrl.searchParams.set('response_type', 'code')
    googleAuthUrl.searchParams.set('scope', 'openid email profile')
    googleAuthUrl.searchParams.set('access_type', 'offline')
    googleAuthUrl.searchParams.set('prompt', 'consent')

    return NextResponse.redirect(googleAuthUrl.toString())
  }

  // Step 2: Handle OAuth callback, exchange code for tokens
  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: `${BASE_URL}/api/auth/google`,
        grant_type: 'authorization_code',
      }),
    })

    const tokens = await tokenResponse.json()

    if (!tokens.access_token) {
      console.error('Google OAuth token error:', tokens)
      return NextResponse.redirect(`${BASE_URL}/login?error=google_auth_failed`)
    }

    // Get user info from Google
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })

    const userData = await userResponse.json()
    if (!userData.email) {
      return NextResponse.redirect(`${BASE_URL}/login?error=no_email_provided`)
    }

    const email = String(userData.email).trim().toLowerCase()
    const name = userData.name || userData.given_name || email.split('@')[0]

    const db = await getDb()

    // Find or create user doc
    let user = await db.collection('users').findOne({ email })
    if (!user) {
      const newUser = {
        name,
        email,
        emailVerified: true,
        image: userData.picture || null,
        role: 'free',
        plan: 'free',
        surveySource: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      const res = await db.collection('users').insertOne(newUser)
      user = { ...newUser, _id: res.insertedId }
    } else if (!user.emailVerified) {
      await db.collection('users').updateOne({ _id: user._id }, { $set: { emailVerified: true } })
    }

    // Generate session token
    const sessionToken = randomUUID()
    await db.collection('sessions').insertOne({
      token: sessionToken,
      userId: user._id,
      createdAt: new Date(),
    })

    const response = NextResponse.redirect(`${BASE_URL}/callback`)
    response.cookies.set('dann_session', sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })

    return response
  } catch (err) {
    console.error('Google OAuth error:', err)
    return NextResponse.redirect(`${BASE_URL}/login?error=server_error`)
  }
}
