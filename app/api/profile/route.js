import { NextResponse } from 'next/server'
import { getCurrentUser } from '../../../lib/auth'
import { getDb, ObjectId } from '../../../lib/mongodb'
import bcrypt from 'bcryptjs'

export async function POST(request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { surveySource, name, email, password, twoFactorEnabled, twoFactorPin, geminiApiKey } = body

    const updateDoc = { updatedAt: new Date() }
    if (typeof surveySource === 'string') {
      updateDoc.surveySource = surveySource.trim()
    }
    if (typeof name === 'string' && name.trim()) {
      updateDoc.name = name.trim()
    }
    if (typeof email === 'string' && email.trim() && email.trim().toLowerCase() !== user.email) {
      updateDoc.email = email.trim().toLowerCase()
      updateDoc.emailVerified = false
    }
    if (typeof password === 'string' && password.length >= 8) {
      updateDoc.passwordHash = await bcrypt.hash(password, 12)
    }
    if (typeof twoFactorEnabled === 'boolean') {
      updateDoc.twoFactorEnabled = twoFactorEnabled
    }
    if (typeof twoFactorPin === 'string' && twoFactorPin.trim()) {
      updateDoc.twoFactorPin = await bcrypt.hash(twoFactorPin.trim(), 12)
    }
    if (typeof geminiApiKey === 'string') {
      updateDoc.geminiApiKey = geminiApiKey.trim()
    }

    const db = await getDb()
    const uId = user._id ? user._id : user.id
    const query = typeof uId === 'string' && ObjectId.isValid(uId) ? { _id: new ObjectId(uId) } : { _id: uId }

    await db.collection('users').updateOne(query, { $set: updateDoc })
    await db.collection('user').updateOne({ id: uId }, { $set: updateDoc }).catch(() => {})

    return NextResponse.json({ success: true, data: { message: 'Profile updated successfully.' } })
  } catch (err) {
    console.error('Profile update error:', err)
    return NextResponse.json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to update profile.' } }, { status: 500 })
  }
}
