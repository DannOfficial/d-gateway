import { NextResponse } from 'next/server'
import { getDb } from '../../../../lib/mongodb'
import { getCurrentUser } from '../../../../lib/auth'

export async function POST(request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { botId } = await request.json()
  const db = await getDb()
  const bot = await db.collection('bots').findOne({ _id: new (await import('mongodb')).ObjectId(botId), userId: user._id })
  if (!bot) return NextResponse.json({ error: 'Bot not found.' }, { status: 404 })
  const telegram = await fetch(`https://api.telegram.org/bot${bot.token}/getMe`)
  const payload = await telegram.json()
  if (!payload.ok) return NextResponse.json({ error: 'Telegram rejected this token.' }, { status: 422 })
  await db.collection('bots').updateOne({ _id: bot._id }, { $set: { username: payload.result.username, status: 'connected', validatedAt: new Date() } })
  return NextResponse.json({ username: payload.result.username, status: 'connected' })
}
