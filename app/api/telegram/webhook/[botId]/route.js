import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDb } from '../../../../../lib/mongodb'

async function sendMessage(token, chatId, text) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
      signal: controller.signal,
    })
    if (!response.ok) throw new Error(`Telegram responded ${response.status}`)
  } finally {
    clearTimeout(timeout)
  }
}

export async function POST(request, { params }) {
  const { botId } = await params
  if (!ObjectId.isValid(botId)) return NextResponse.json({ ok: false }, { status: 404 })
  const db = await getDb()
  const bot = await db.collection('bots').findOne({ _id: new ObjectId(botId), status: { $in: ['connected', 'pending'] } })
  if (!bot) return NextResponse.json({ ok: false }, { status: 404 })
  const update = await request.json()
  const message = update.message
  if (!message?.chat?.id) return NextResponse.json({ ok: true })
  const text = typeof message.text === 'string' ? message.text.slice(0, 4000) : ''
  await db.collection('logs').insertOne({ botId: bot._id, userId: bot.userId, type: 'message', chatId: String(message.chat.id), username: message.from?.username || null, text, createdAt: new Date() })
  await db.collection('bots').updateOne({ _id: bot._id }, { $inc: { commands: text.startsWith('/') ? 1 : 0 }, $set: { lastMessageAt: new Date(), status: 'connected' } })
  try {
    if (text === '/start') await sendMessage(bot.token, message.chat.id, 'Connected with dann-tele. Your bot is ready.')
    else if (text === '/help') await sendMessage(bot.token, message.chat.id, 'Available commands:\n/start — connect your chat\n/help — show this help')
  } catch (error) {
    console.error('[v0] Telegram response failed:', error)
  }
  return NextResponse.json({ ok: true })
}
