import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getDb } from '../../../../lib/mongodb'

const GITHUB_CLIENT_ID = 'Ov23li7cmDcy2xVYxMjj'
const GITHUB_CLIENT_SECRET = '5561027dca8714ac38cb97eb5c53e8a6de9f0900'
const BASE_URL = 'https://dannteam.biz.id'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  // Step 1: If no code, redirect to GitHub OAuth
  if (!code) {
    const githubAuthUrl = new URL('https://github.com/login/oauth/authorize')
    githubAuthUrl.searchParams.set('client_id', GITHUB_CLIENT_ID)
    githubAuthUrl.searchParams.set('redirect_uri', `${BASE_URL}/api/auth/github`)
    githubAuthUrl.searchParams.set('scope', 'user:email')

    return NextResponse.redirect(githubAuthUrl.toString())
  }

  // Step 2: Handle OAuth callback
  try {
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: `${BASE_URL}/api/auth/github`,
      }),
    })

    const tokens = await tokenResponse.json()

    if (!tokens.access_token) {
      console.error('GitHub OAuth token error:', tokens)
      return NextResponse.redirect(`${BASE_URL}/login?error=github_auth_failed`)
    }

    // Get user info from GitHub
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        'User-Agent': 'Dann-Tele-Gateway',
      },
    })
    const userData = await userResponse.json()

    // Get primary email if user profile email is private
    let email = userData.email
    if (!email) {
      const emailRes = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          'User-Agent': 'Dann-Tele-Gateway',
        },
      })
      const emails = await emailRes.json()
      if (Array.isArray(emails)) {
        const primary = emails.find((e) => e.primary) || emails[0]
        if (primary) email = primary.email
      }
    }

    if (!email) {
      return NextResponse.redirect(`${BASE_URL}/login?error=no_email_provided`)
    }

    const normalizedEmail = String(email).trim().toLowerCase()
    const name = userData.name || userData.login || normalizedEmail.split('@')[0]

    const db = await getDb()

    let user = await db.collection('users').findOne({ email: normalizedEmail })
    if (!user) {
      const newUser = {
        name,
        email: normalizedEmail,
        emailVerified: true,
        image: userData.avatar_url || null,
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
    console.error('GitHub OAuth error:', err)
    return NextResponse.redirect(`${BASE_URL}/login?error=server_error`)
  }
}
