import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDb } from '../../../../../lib/mongodb'

async function sendTelegramMessage(token, chatId, text, replyToMessageId) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)
  try {
    const payload = {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
    }
    if (replyToMessageId) {
      payload.reply_to_message_id = replyToMessageId
    }
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}))
      console.error('[Telegram API] sendMessage failed:', errJson)
    }
  } catch (err) {
    console.error('[Telegram API] sendMessage exception:', err)
  } finally {
    clearTimeout(timeout)
  }
}

export async function POST(request, { params }) {
  const { botId } = await params
  if (!botId || !ObjectId.isValid(botId)) {
    return NextResponse.json({ ok: false, error: 'Invalid Bot ID' }, { status: 404 })
  }

  const db = await getDb()
  const bot = await db.collection('bots').findOne({ _id: new ObjectId(botId) })
  if (!bot) {
    return NextResponse.json({ ok: false, error: 'Bot not found' }, { status: 404 })
  }

  let update
  try {
    update = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON payload' }, { status: 400 })
  }

  const message = update.message || update.edited_message
  if (!message || !message.chat?.id) {
    return NextResponse.json({ ok: true })
  }

  const chatId = message.chat.id
  const text = typeof message.text === 'string' ? message.text.slice(0, 4000) : ''
  const senderUsername = message.from?.username || message.from?.first_name || 'Anonymous'
  const isCommand = text.startsWith('/')

  // Log incoming message to MongoDB
  await db.collection('logs').insertOne({
    botId: bot._id,
    userId: bot.userId,
    chatId: String(chatId),
    username: senderUsername,
    text,
    type: isCommand ? 'command' : 'message',
    createdAt: new Date(),
  })

  // Update bot counters and status in MongoDB
  await db.collection('bots').updateOne(
    { _id: bot._id },
    {
      $inc: { commands: isCommand ? 1 : 0 },
      $set: { lastMessageAt: new Date(), status: 'connected', updatedAt: new Date() },
    }
  )

  // Handle standard commands
  if (isCommand) {
    const commandLower = text.trim().split(' ')[0].toLowerCase()
    if (commandLower === '/start') {
      await sendTelegramMessage(
        bot.token,
        chatId,
        `🤖 <b>Welcome to ${bot.name || 'Dann-Tele Bot'}!</b>\n\nYour bot is successfully connected and integrated with <b>Dann-Tele Gateway</b>.\n\nType /help to view available commands.`,
        message.message_id
      )
    } else if (commandLower === '/help') {
      await sendTelegramMessage(
        bot.token,
        chatId,
        `📋 <b>Command List:</b>\n\n/start - Connect and initialize\n/status - Check bot gateway status\n/ping - Ping gateway latency\n/help - Show this help menu`,
        message.message_id
      )
    } else if (commandLower === '/status') {
      await sendTelegramMessage(
        bot.token,
        chatId,
        `✅ <b>Gateway Status:</b> Operational\n<b>Bot ID:</b> <code>${bot._id}</code>\n<b>Connected:</b> Yes`,
        message.message_id
      )
    } else if (commandLower === '/ping') {
      await sendTelegramMessage(
        bot.token,
        chatId,
        `🏓 <b>Pong!</b> Gateway response time: &lt;100ms`,
        message.message_id
      )
    }
  }

  return NextResponse.json({ ok: true })
}
