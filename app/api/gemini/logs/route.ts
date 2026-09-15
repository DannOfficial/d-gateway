import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = await getDb()
  const logs = await db
    .collection('gemini_logs')
    .find({ userId: user._id })
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray()

  return NextResponse.json({
    logs: logs.map((l) => ({
      id: l._id.toString(),
      telegramUser: l.telegramUser || 'Anonymous',
      model: l.model || 'gemini-2.5-flash',
      latency: l.latency || 0,
      status: l.status || 'SUCCESS',
      error: l.error || null,
      createdAt: l.createdAt ? new Date(l.createdAt).toISOString() : new Date().toISOString(),
    })),
  })
}
