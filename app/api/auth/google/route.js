import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getConfig, getCallbackUrl } from '../../../../lib/config'

export async function GET() {
  const config = getConfig()
  const googleClientId = config.oauth.google.clientId

  if (!googleClientId) {
    const baseUrl = config.app.baseUrl
    return NextResponse.redirect(`${baseUrl}/login?error=oauth_not_configured`)
  }

  const state = `google_${randomUUID()}`
  const redirectUri = getCallbackUrl('google')

  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  googleAuthUrl.searchParams.set('client_id', googleClientId)
  googleAuthUrl.searchParams.set('redirect_uri', redirectUri)
  googleAuthUrl.searchParams.set('response_type', 'code')
  googleAuthUrl.searchParams.set('scope', 'openid email profile')
  googleAuthUrl.searchParams.set('state', state)
  googleAuthUrl.searchParams.set('access_type', 'offline')
  googleAuthUrl.searchParams.set('prompt', 'consent')

  const response = NextResponse.redirect(googleAuthUrl.toString())
  response.cookies.set('oauth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 10,
    path: '/',
  })

  return response
}
