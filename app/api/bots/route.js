import { NextResponse } from 'next/server'
import { getDb, publicBot } from '../../../lib/mongodb'
import { getCurrentUser } from '../../../lib/auth'

function getAppBaseUrl(request) {
  const host = request.headers.get('host') || 'localhost:3000'
  const proto = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https')
  return `${proto}://${host}`
}

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = await getDb()
  const bots = await db.collection('bots').find({ userId: user._id }).sort({ createdAt: -1 }).toArray()
  return NextResponse.json({ bots: bots.map(publicBot) })
}

export async function POST(request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const name = String(body.name || '').trim()
  const token = String(body.token || '').trim()

  if (!name || name.length > 80) {
    return NextResponse.json({ error: 'Bot name is required (max 80 characters).' }, { status: 400 })
  }

  if (!token || !/^\d{6,}:[A-Za-z0-9_-]{20,}$/.test(token)) {
    return NextResponse.json({ error: 'Invalid Telegram Bot token format (e.g., 123456789:ABCdef...).' }, { status: 400 })
  }

  // Verify token with Telegram API getMe
  let telegramBotInfo = null
  try {
    const meRes = await fetch(`https://api.telegram.org/bot${token}/getMe`)
    const meData = await meRes.json()
    if (!meData.ok) {
      return NextResponse.json({ error: `Telegram rejected token: ${meData.description || 'Invalid token'}` }, { status: 422 })
    }
    telegramBotInfo = meData.result
  } catch (err) {
    return NextResponse.json({ error: `Failed to connect to Telegram API: ${err.message}` }, { status: 502 })
  }

  const db = await getDb()
  const botDoc = {
    userId: user._id,
    name,
    token,
    username: telegramBotInfo.username || null,
    firstName: telegramBotInfo.first_name || null,
    status: 'pending',
    commands: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const result = await db.collection('bots').insertOne(botDoc)
  const botId = result.insertedId.toString()
  const baseUrl = getAppBaseUrl(request)
  const webhookUrl = `${baseUrl}/api/telegram/webhook/${botId}`

  // Attempt to set webhook on Telegram
  let webhookSet = false
  try {
    const webhookRes = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url: webhookUrl, allowed_updates: ['message', 'edited_message', 'callback_query'] }),
    })
    const webhookData = await webhookRes.json()
    if (webhookData.ok) {
      webhookSet = true
    }
  } catch (err) {
    console.error('Failed to set Telegram webhook:', err)
  }

  const finalStatus = webhookSet || telegramBotInfo ? 'connected' : 'pending'
  await db.collection('bots').updateOne({ _id: result.insertedId }, { $set: { status: finalStatus, webhookUrl } })

  return NextResponse.json({
    bot: publicBot({ ...botDoc, _id: result.insertedId, status: finalStatus, webhookUrl }),
  }, { status: 201 })
}
