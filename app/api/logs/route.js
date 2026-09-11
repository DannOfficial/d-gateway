import { NextResponse } from 'next/server'
import { getDb } from '../../../lib/mongodb'
import { getCurrentUser } from '../../../lib/auth'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDb()
  const logs = await db.collection('logs')
    .find({ userId: user._id })
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray()

  const formatted = logs.map((log) => ({
    id: log._id.toString(),
    botId: log.botId ? log.botId.toString() : null,
    chatId: log.chatId || '',
    username: log.username || 'Anonymous',
    chatType: log.chatType || 'private',
    text: log.text || '',
    type: log.type || 'message',
    createdAt: log.createdAt,
  }))

  return NextResponse.json({ logs: formatted })
}
