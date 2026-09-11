import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import { getDb } from '../../../../lib/mongodb'

export async function POST(request) {
  try {
    const { name, email, password } = await request.json()
    if (!name || !email || !password || password.length < 8) return NextResponse.json({ error: 'Name, email, and an 8+ character password are required.' }, { status: 400 })
    const db = await getDb()
    const normalizedEmail = email.trim().toLowerCase()
    const existing = await db.collection('users').findOne({ email: normalizedEmail })
    if (existing) return NextResponse.json({ error: 'An account with that email already exists.' }, { status: 409 })
    const user = { name: name.trim(), email: normalizedEmail, passwordHash: await bcrypt.hash(password, 12), createdAt: new Date() }
    const result = await db.collection('users').insertOne(user)
    const session = randomUUID()
    await db.collection('sessions').insertOne({ token: session, userId: result.insertedId, createdAt: new Date() })
    const response = NextResponse.json({ user: { name: user.name, email: user.email } }, { status: 201 })
    response.cookies.set('dann_session', session, { httpOnly: true, secure: process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'production', sameSite: process.env.NODE_ENV === 'development' ? 'none' : 'lax', maxAge: 60 * 60 * 24 * 30, path: '/' })
    return response
  } catch (error) { return NextResponse.json({ error: 'Unable to create account.' }, { status: 500 }) }
}
