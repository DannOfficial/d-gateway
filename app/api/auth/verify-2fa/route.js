import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getCurrentUser } from '../../../../lib/auth'
import { getDb, ObjectId } from '../../../../lib/mongodb'

export async function POST(request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized session.' } }, { status: 401 })
    }

    const { pin } = await request.json()
    if (!pin || typeof pin !== 'string') {
      return NextResponse.json({ success: false, error: { code: 'INVALID_PIN', message: 'PIN is required.' } }, { status: 400 })
    }

    const db = await getDb()
    const uId = user._id ? user._id : user.id
    const query = typeof uId === 'string' && ObjectId.isValid(uId) ? { _id: new ObjectId(uId) } : { _id: uId }
    const dbUser = await db.collection('users').findOne(query)

    if (!dbUser || !dbUser.twoFactorEnabled || !dbUser.twoFactorPin) {
      return NextResponse.json({ success: true, message: '2FA not enabled for this user.' })
    }

    if (dbUser.lockedUntil && new Date(dbUser.lockedUntil) > new Date()) {
      const waitMins = Math.ceil((new Date(dbUser.lockedUntil).getTime() - Date.now()) / 60000)
      return NextResponse.json(
        { success: false, error: { code: 'ACCOUNT_LOCKED', message: `Too many failed 2FA attempts. Try again in ${waitMins} minute(s).` } },
        { status: 429 }
      )
    }

    const isMatch = await bcrypt.compare(pin.trim(), dbUser.twoFactorPin)
    if (!isMatch) {
      const failedAttempts = (dbUser.failed2FAAttempts || 0) + 1
      const updateObj = { failed2FAAttempts: failedAttempts }
      if (failedAttempts >= 5) {
        updateObj.lockedUntil = new Date(Date.now() + 15 * 60 * 1000)
      }
      await db.collection('users').updateOne(query, { $set: updateObj })

      const remaining = Math.max(0, 5 - failedAttempts)
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_PIN',
            message: remaining > 0 ? `Incorrect 2FA PIN. ${remaining} attempt(s) remaining.` : 'Too many failed attempts. Account locked for 15 minutes.',
          },
        },
        { status: 401 }
      )
    }

    await db.collection('users').updateOne(query, { $set: { failed2FAAttempts: 0, lockedUntil: null } })

    return NextResponse.json({ success: true, message: '2FA PIN verified successfully.' })
  } catch (err) {
    console.error('Verify 2FA error:', err)
    return NextResponse.json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to verify 2FA PIN.' } }, { status: 500 })
  }
}
