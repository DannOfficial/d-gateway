import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import { getDb } from '../../../../lib/mongodb'
import { sendGmailVerificationEmail } from '../../../../lib/email'
import { getBaseUrl } from '../../../../lib/config'

export async function POST(request) {
  try {
    const { name, email, password } = await request.json()
    if (!name || !email || !password || password.length < 8) {
      return NextResponse.json({ error: 'Name, valid email, and an 8+ character password are required.' }, { status: 400 })
    }

    const db = await getDb()
    const normalizedEmail = String(email).trim().toLowerCase()

    // Check if user already exists
    const existingUser = await db.collection('users').findOne({ email: normalizedEmail })
    if (existingUser) {
      return NextResponse.json({ error: 'An account with that email already exists.' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const verificationToken = randomUUID()

    const userDoc = {
      name: String(name).trim(),
      email: normalizedEmail,
      passwordHash,
      emailVerified: false,
      verificationToken,
      surveySource: null,
      role: 'free',
      plan: 'free',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection('users').insertOne(userDoc)
    const baseUrl = getBaseUrl()
    const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${verificationToken}`

    // Send verification email via Gmail SMTP
    await sendGmailVerificationEmail({
      to: normalizedEmail,
      name: userDoc.name,
      verificationUrl,
    })

    return NextResponse.json({
      message: 'Account created! A verification link has been sent to your email.',
      user: { id: result.insertedId.toString(), name: userDoc.name, email: userDoc.email, emailVerified: false },
    }, { status: 201 })
  } catch (err) {
    console.error('Registration error:', err)
    return NextResponse.json({ error: 'Unable to create account.' }, { status: 500 })
  }
}
