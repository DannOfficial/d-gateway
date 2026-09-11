import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getDb } from '../../../../lib/mongodb'

function getAppBaseUrl(request) {
  const host = request.headers.get('host') || 'localhost:3000'
  const proto = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https')
  return `${proto}://${host}`
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  const baseUrl = getAppBaseUrl(request)

  if (!token) {
    return NextResponse.redirect(`${baseUrl}/login?error=missing-token`)
  }

  try {
    const db = await getDb()
    const user = await db.collection('users').findOne({ verificationToken: token })

    if (!user) {
      return NextResponse.redirect(`${baseUrl}/login?error=invalid-token`)
    }

    // Mark email as verified
    await db.collection('users').updateOne(
      { _id: user._id },
      {
        $set: { emailVerified: true, updatedAt: new Date() },
        $unset: { verificationToken: '' },
      }
    )

    // Automatically log user in by setting session cookie
    const sessionToken = randomUUID()
    await db.collection('sessions').insertOne({
      token: sessionToken,
      userId: user._id,
      createdAt: new Date(),
    })

    const response = NextResponse.redirect(`${baseUrl}/callback?verified=1`)
    response.cookies.set('dann_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })

    return response
  } catch (err) {
    console.error('Email verification error:', err)
    return NextResponse.redirect(`${baseUrl}/login?error=server-error`)
  }
}
