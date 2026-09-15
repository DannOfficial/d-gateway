import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getConfig, getCallbackUrl } from '../../../../lib/config'

export async function GET() {
  const config = getConfig()
  const githubClientId = config.oauth.github.clientId

  if (!githubClientId) {
    const baseUrl = config.app.baseUrl
    return NextResponse.redirect(`${baseUrl}/login?error=oauth_not_configured`)
  }

  const state = `github_${randomUUID()}`
  const redirectUri = getCallbackUrl('github')

  const githubAuthUrl = new URL('https://github.com/login/oauth/authorize')
  githubAuthUrl.searchParams.set('client_id', githubClientId)
  githubAuthUrl.searchParams.set('redirect_uri', redirectUri)
  githubAuthUrl.searchParams.set('scope', 'user:email')
  githubAuthUrl.searchParams.set('state', state)

  const response = NextResponse.redirect(githubAuthUrl.toString())
  response.cookies.set('oauth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 10,
    path: '/',
  })

  return response
}
