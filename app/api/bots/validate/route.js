import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDb, publicBot } from '../../../../lib/mongodb'
import { getCurrentUser } from '../../../../lib/auth'
import { getBaseUrl } from '../../../../lib/config'

export async function POST(request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { botId } = await request.json()
  if (!botId || !ObjectId.isValid(botId)) {
    return NextResponse.json({ error: 'Invalid Bot ID.' }, { status: 400 })
  }

  const db = await getDb()
  const bot = await db.collection('bots').findOne({ _id: new ObjectId(botId), userId: user._id })
  if (!bot) return NextResponse.json({ error: 'Bot not found.' }, { status: 404 })

  try {
    const telegramRes = await fetch(`https://api.telegram.org/bot${bot.token}/getMe`)
    const payload = await telegramRes.json()
    if (!payload.ok) {
      await db.collection('bots').updateOne({ _id: bot._id }, { $set: { status: 'error', updatedAt: new Date() } })
      return NextResponse.json({ error: 'Telegram rejected this bot token.', details: payload.description }, { status: 422 })
    }

    const username = payload.result.username
    const baseUrl = getBaseUrl()
    const webhookUrl = `${baseUrl}/api/telegram/webhook/${bot._id.toString()}`

    // Re-register Webhook
    let webhookOk = false
    try {
      const whRes = await fetch(`https://api.telegram.org/bot${bot.token}/setWebhook`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url: webhookUrl, allowed_updates: ['message', 'edited_message', 'callback_query'] }),
      })
      const whData = await whRes.json()
      webhookOk = whData.ok
    } catch (e) {
      console.error('Webhook set error:', e)
    }

    const status = 'connected'
    await db.collection('bots').updateOne(
      { _id: bot._id },
      { $set: { username, status, webhookUrl, validatedAt: new Date(), updatedAt: new Date() } }
    )

    return NextResponse.json({
      bot: publicBot({ ...bot, username, status, webhookUrl }),
      webhookOk,
    })
  } catch (err) {
    return NextResponse.json({ error: `Telegram validation error: ${err.message}` }, { status: 502 })
  }
}
