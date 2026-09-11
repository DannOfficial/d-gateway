import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDb, publicBot } from '../../../../lib/mongodb'
import { getCurrentUser } from '../../../../lib/auth'

async function getOwnedBot(botId, userId) {
  if (!ObjectId.isValid(botId)) return null
  const db = await getDb()
  return db.collection('bots').findOne({ _id: new ObjectId(botId), userId })
}

export async function GET(request, { params }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { botId } = await params
  const bot = await getOwnedBot(botId, user._id)
  if (!bot) return NextResponse.json({ error: 'Bot not found' }, { status: 404 })

  // Fetch latest webhook status from Telegram if connected
  let webhookInfo = null
  if (bot.token) {
    try {
      const whRes = await fetch(`https://api.telegram.org/bot${bot.token}/getWebhookInfo`)
      const whData = await whRes.json()
      if (whData.ok) webhookInfo = whData.result
    } catch {}
  }

  return NextResponse.json({
    bot: publicBot(bot),
    webhookInfo,
  })
}

export async function DELETE(request, { params }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { botId } = await params
  const bot = await getOwnedBot(botId, user._id)
  if (!bot) return NextResponse.json({ error: 'Bot not found' }, { status: 404 })

  // Clean up webhook on Telegram
  if (bot.token) {
    try {
      await fetch(`https://api.telegram.org/bot${bot.token}/deleteWebhook`, { method: 'POST' })
    } catch (e) {
      console.error('Delete webhook error:', e)
    }
  }

  const db = await getDb()
  await db.collection('bots').deleteOne({ _id: bot._id })
  await db.collection('logs').deleteMany({ botId: bot._id })

  return NextResponse.json({ ok: true, message: 'Bot deleted successfully.' })
}

export async function PATCH(request, { params }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { botId } = await params
  const body = await request.json()
  const name = String(body.name || '').trim()

  if (!name || name.length > 80) {
    return NextResponse.json({ error: 'Invalid bot name.' }, { status: 400 })
  }

  const bot = await getOwnedBot(botId, user._id)
  if (!bot) return NextResponse.json({ error: 'Bot not found' }, { status: 404 })

  const db = await getDb()
  await db.collection('bots').updateOne({ _id: bot._id }, { $set: { name, updatedAt: new Date() } })

  return NextResponse.json({ bot: publicBot({ ...bot, name }) })
}
