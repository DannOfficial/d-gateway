import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import { getDb } from '../../../../lib/mongodb'

export async function POST(request) {
  try {
    const { email, password } = await request.json()
    const db = await getDb()
    const normalizedEmail = String(email || '').trim().toLowerCase()

    const user = await db.collection('users').findOne({ email: normalizedEmail })
    if (!user || !user.passwordHash || !(await bcrypt.compare(password || '', user.passwordHash))) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
    }

    if (user.emailVerified === false) {
      return NextResponse.json({
        error: 'Please verify your email address before logging in. Check your inbox for the verification link.',
        unverified: true,
      }, { status: 403 })
    }

    const sessionToken = randomUUID()
    await db.collection('sessions').insertOne({
      token: sessionToken,
      userId: user._id,
      createdAt: new Date(),
    })

    const response = NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        surveySource: user.surveySource || null,
      },
    })

    response.cookies.set('dann_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })

    return response
  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json({ error: 'Unable to log in.' }, { status: 500 })
  }
}
