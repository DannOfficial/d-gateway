import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDb, publicBot } from '@/lib/mongodb'
import { getCurrentUser } from '@/lib/auth'

function getAppBaseUrl(request: Request) {
  const host = request.headers.get('host') || 'localhost:3000'
  const proto = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https')
  return `${proto}://${host}`
}

export async function POST(request: Request, { params }: { params: Promise<{ botId: string }> }) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { botId } = await params
  if (!botId || !ObjectId.isValid(botId)) {
    return NextResponse.json({ ok: false, error: 'Invalid Bot ID' }, { status: 400 })
  }

  const db = await getDb()
  const bot = await db.collection('bots').findOne({ _id: new ObjectId(botId) })
  if (!bot) {
    return NextResponse.json({ ok: false, error: 'Bot not found' }, { status: 404 })
  }

  // Ownership Check
  if (String(bot.userId) !== String(user._id)) {
    return NextResponse.json({ ok: false, error: 'Forbidden: You do not own this bot' }, { status: 403 })
  }

  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || getAppBaseUrl(request)
  const webhookUrl = `${appBaseUrl}/api/telegram/webhook/${bot._id.toString()}`

  try {
    await db.collection('bots').updateOne({ _id: bot._id }, { $set: { status: 'starting', error: null, updatedAt: new Date() } })
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    const tgRes = await fetch(`https://api.telegram.org/bot${bot.token}/setWebhook`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        secret_token: bot.webhookSecret,
        allowed_updates: ['message', 'edited_message', 'callback_query'],
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout))
    const tgData = await tgRes.json()

    if (!tgRes.ok || !tgData.ok) {
      await db.collection('bots').updateOne(
        { _id: bot._id },
        { $set: { status: 'error', updatedAt: new Date() } }
      )
      return NextResponse.json(
        { ok: false, error: tgData.description || 'Failed to set Telegram webhook' },
        { status: 400 }
      )
    }

    await db.collection('bots').updateOne(
      { _id: bot._id },
      { $set: { status: 'running', isRunning: true, webhookUrl, updatedAt: new Date() } }
    )

    const updatedBot = await db.collection('bots').findOne({ _id: bot._id })
    return NextResponse.json({ ok: true, message: 'Bot started successfully', bot: publicBot(updatedBot) })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
