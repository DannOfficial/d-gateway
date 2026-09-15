import { NextResponse } from 'next/server'
import { getCurrentUser } from '../../../../lib/auth'
import { getDb, ObjectId } from '../../../../lib/mongodb'
import { cookies } from 'next/headers'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, user: null }, { status: 401 })

  const db = await getDb()
  const uId = user._id ? user._id : user.id
  const query = typeof uId === 'string' && ObjectId.isValid(uId) ? { _id: new ObjectId(uId) } : { _id: uId }
  const freshUser = await db.collection('users').findOne(query) || user

  return NextResponse.json({
    success: true,
    user: {
      id: freshUser._id ? freshUser._id.toString() : freshUser.id,
      name: freshUser.name,
      email: freshUser.email,
      surveySource: freshUser.surveySource || null,
      role: freshUser.role || 'free',
      plan: freshUser.plan || 'free',
      emailVerified: freshUser.emailVerified ?? true,
      twoFactorEnabled: Boolean(freshUser.twoFactorEnabled),
      hasTwoFactorPin: Boolean(freshUser.twoFactorPin),
      geminiApiKey: freshUser.geminiApiKey || '',
      image: freshUser.image || null,
    },
  })
}

export async function DELETE() {
  const cookieStore = await cookies()
  const token = cookieStore.get('dann_session')?.value

  if (token) {
    try {
      const db = await getDb()
      await db.collection('sessions').deleteOne({ token })
    } catch (e) {
      console.error('Logout delete session error:', e)
    }
  }

  const response = NextResponse.json({ success: true, message: 'Logged out successfully.' })
  response.cookies.delete('dann_session')
  response.cookies.delete('better-auth.session_token')
  return response
}
