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
  const name = body.name === undefined ? undefined : String(body.name || '').trim()
  const action = body.action
  const settings = {
    ...(body.timezone !== undefined ? { timezone: String(body.timezone) } : {}),
    ...(body.rpgMode !== undefined ? { rpgMode: Boolean(body.rpgMode) } : {}),
    ...(body.footer !== undefined ? { footer: String(body.footer).slice(0, 500) } : {}),
  }

  if (name !== undefined && (!name || name.length > 80)) {
    return NextResponse.json({ error: 'Invalid bot name.' }, { status: 400 })
  }

  const bot = await getOwnedBot(botId, user._id)
  if (!bot) return NextResponse.json({ error: 'Bot not found' }, { status: 404 })

  const db = await getDb()
  const updates = { ...settings, updatedAt: new Date() }
  if (name !== undefined) updates.name = name
  if (action === 'start' || action === 'restart') {
    if (!bot.token) return NextResponse.json({ error: 'Bot token is missing.' }, { status: 400 })
    const webhookUrl = `${new URL(request.url).origin}/api/telegram/webhook/${bot._id}`
    const result = await fetch(`https://api.telegram.org/bot${bot.token}/setWebhook`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url: webhookUrl }),
    }).then((r) => r.json()).catch(() => ({ ok: false }))
    if (!result.ok) return NextResponse.json({ error: 'Unable to start bot.' }, { status: 502 })
    updates.status = 'connected'
    updates.webhookUrl = webhookUrl
  } else if (action === 'stop') {
    if (!bot.token) return NextResponse.json({ error: 'Bot token is missing.' }, { status: 400 })
    const result = await fetch(`https://api.telegram.org/bot${bot.token}/deleteWebhook`, { method: 'POST' })
      .then((response) => response.json())
      .catch(() => ({ ok: false }))
    if (!result.ok) return NextResponse.json({ error: 'Unable to stop bot.' }, { status: 502 })
    updates.status = 'stopped'
  }
  await db.collection('bots').updateOne({ _id: bot._id }, { $set: updates })

  return NextResponse.json({ bot: publicBot({ ...bot, ...updates }) })
}
