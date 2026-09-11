import { NextResponse } from 'next/server'
import { getCurrentUser } from '../../../../lib/auth'
import { getDb } from '../../../../lib/mongodb'
import { cookies } from 'next/headers'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ user: null }, { status: 401 })

  return NextResponse.json({
    user: {
      id: user._id ? user._id.toString() : user.id,
      name: user.name,
      email: user.email,
      surveySource: user.surveySource || null,
      role: user.role || 'free',
      plan: user.plan || 'free',
      emailVerified: user.emailVerified ?? true,
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

  const response = NextResponse.json({ ok: true })
  response.cookies.delete('dann_session')
  response.cookies.delete('better-auth.session_token')
  return response
}
