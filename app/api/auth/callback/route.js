import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { cookies } from 'next/headers'
import { getDb } from '../../../../lib/mongodb'
import { getConfig, getCallbackUrl } from '../../../../lib/config'

export async function POST(request) {
  try {
    const body = await request.json()
    const { provider, code, state } = body

    if (!provider || !code) {
      return NextResponse.json({ success: false, error: { code: 'INVALID_PARAMS', message: 'Provider and authorization code are required.' } }, { status: 400 })
    }

    const cookieStore = await cookies()
    const savedState = cookieStore.get('oauth_state')?.value

    if (!savedState || !state || savedState !== state) {
      return NextResponse.json({ success: false, error: { code: 'CSRF_STATE_MISMATCH', message: 'OAuth state validation failed.' } }, { status: 400 })
    }

    const config = getConfig()
    const redirectUri = getCallbackUrl(provider)
    let email = ''
    let name = ''
    let picture = null

    if (provider === 'google') {
      const googleClientId = config.oauth.google.clientId
      const googleClientSecret = config.oauth.google.clientSecret

      if (!googleClientId || !googleClientSecret) {
        return NextResponse.json({ success: false, error: { code: 'OAUTH_NOT_CONFIGURED', message: 'Google OAuth credentials not configured.' } }, { status: 500 })
      }

      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: googleClientId,
          client_secret: googleClientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      })

      const tokens = await tokenRes.json()
      if (!tokens.access_token) {
        console.error('Google token exchange error:', tokens)
        return NextResponse.json({ success: false, error: { code: 'GOOGLE_AUTH_FAILED', message: tokens.error_description || 'Failed to exchange authorization code.' } }, { status: 400 })
      }

      const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      })
      const userData = await userRes.json()

      if (!userData.email) {
        return NextResponse.json({ success: false, error: { code: 'NO_EMAIL', message: 'No email address provided by Google account.' } }, { status: 400 })
      }

      email = String(userData.email).trim().toLowerCase()
      name = userData.name || userData.given_name || email.split('@')[0]
      picture = userData.picture || null

    } else if (provider === 'github') {
      const githubClientId = config.oauth.github.clientId
      const githubClientSecret = config.oauth.github.clientSecret

      if (!githubClientId || !githubClientSecret) {
        return NextResponse.json({ success: false, error: { code: 'OAUTH_NOT_CONFIGURED', message: 'GitHub OAuth credentials not configured.' } }, { status: 500 })
      }

      const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          client_id: githubClientId,
          client_secret: githubClientSecret,
          code,
          redirect_uri: redirectUri,
        }),
      })

      const tokens = await tokenRes.json()
      if (!tokens.access_token) {
        console.error('GitHub token exchange error:', tokens)
        return NextResponse.json({ success: false, error: { code: 'GITHUB_AUTH_FAILED', message: tokens.error_description || 'Failed to exchange authorization code.' } }, { status: 400 })
      }

      const userRes = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          'User-Agent': 'Dann-Tele-Gateway',
        },
      })
      const userData = await userRes.json()

      let githubEmail = userData.email
      if (!githubEmail) {
        const emailRes = await fetch('https://api.github.com/user/emails', {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
            'User-Agent': 'Dann-Tele-Gateway',
          },
        })
        const emails = await emailRes.json()
        if (Array.isArray(emails)) {
          const primary = emails.find((e) => e.primary) || emails[0]
          if (primary) githubEmail = primary.email
        }
      }

      if (!githubEmail) {
        return NextResponse.json({ success: false, error: { code: 'NO_EMAIL', message: 'No email address provided by GitHub account.' } }, { status: 400 })
      }

      email = String(githubEmail).trim().toLowerCase()
      name = userData.name || userData.login || email.split('@')[0]
      picture = userData.avatar_url || null
    } else {
      return NextResponse.json({ success: false, error: { code: 'UNSUPPORTED_PROVIDER', message: 'OAuth provider not supported.' } }, { status: 400 })
    }

    const db = await getDb()

    let user = await db.collection('users').findOne({ email })
    if (!user) {
      const newUser = {
        name,
        email,
        emailVerified: true,
        image: picture,
        role: 'free',
        plan: 'free',
        surveySource: null,
        twoFactorEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      const res = await db.collection('users').insertOne(newUser)
      user = { ...newUser, _id: res.insertedId }
    } else {
      const updates = { emailVerified: true, updatedAt: new Date() }
      if (!user.image && picture) updates.image = picture
      await db.collection('users').updateOne({ _id: user._id }, { $set: updates })
    }

    await db.collection('oauth_accounts').updateOne(
      { userId: user._id, provider },
      { $set: { userId: user._id, provider, email, updatedAt: new Date() } },
      { upsert: true }
    )

    const sessionToken = randomUUID()
    await db.collection('sessions').insertOne({
      token: sessionToken,
      userId: user._id,
      createdAt: new Date(),
    })

    const response = NextResponse.json({ success: true, data: { user: { id: String(user._id), name: user.name, email: user.email, surveySource: user.surveySource } } })
    response.cookies.set('dann_session', sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })
    response.cookies.delete('oauth_state')

    return response
  } catch (err) {
    console.error('OAuth callback API error:', err)
    return NextResponse.json({ success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error during authentication.' } }, { status: 500 })
  }
}
