import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import { getDb } from '../../../../lib/mongodb'

export async function POST(request) {
  try {
    const { email, password } = await request.json()
    const db = await getDb()
    const user = await db.collection('users').findOne({ email: email?.trim().toLowerCase() })
    if (!user || !(await bcrypt.compare(password || '', user.passwordHash))) return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
    const session = randomUUID()
    await db.collection('sessions').insertOne({ token: session, userId: user._id, createdAt: new Date() })
    const response = NextResponse.json({ user: { name: user.name, email: user.email } })
    response.cookies.set('dann_session', session, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: process.env.NODE_ENV === 'development' ? 'none' : 'lax', maxAge: 60 * 60 * 24 * 30, path: '/' })
    return response
  } catch (error) { return NextResponse.json({ error: 'Unable to log in.' }, { status: 500 }) }
}
