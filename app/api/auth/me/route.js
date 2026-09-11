import { NextResponse } from 'next/server'
import { getCurrentUser } from '../../../../lib/auth'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ user: null }, { status: 401 })
  return NextResponse.json({ user: { id: user._id.toString(), name: user.name, email: user.email } })
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.delete('dann_session')
  return response
}
