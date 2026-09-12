import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDb } from '../../../../../lib/mongodb'

function html(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

function renderTemplate(value, message, bot) {
  const from = message.from || {}
  const now = new Date()
  return String(value || '').replace(/@(username|fullname|id|time|date|timezone|botname)\b/g, (_, key) => ({
    username: `@${from.username || from.first_name || 'user'}`,
    fullname: [from.first_name, from.last_name].filter(Boolean).join(' ') || 'user',
    id: from.id || '',
    time: now.toLocaleTimeString(),
    date: now.toLocaleDateString(),
    timezone: bot.timezone || 'UTC',
    botname: bot.name || 'Telegram Bot',
  }[key]))
}

async function sendTelegramPayload(token, endpoint, payload) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/${endpoint}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}))
      console.error(`[Telegram API] ${endpoint} failed:`, errJson)
    }

  } catch (err) {
    console.error(`[Telegram API] ${endpoint} exception:`, err)
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

  // Handle Callback Query (e.g. hydrated/callback buttons)
  if (update.callback_query) {
    const cq = update.callback_query
    const chatId = cq.message?.chat?.id
    const data = cq.data || ''
    await sendTelegramPayload(bot.token, 'answerCallbackQuery', {
      callback_query_id: cq.id,
      text: `Callback received: ${data}`,
    })
    if (chatId) {
      const action = String(data).replace(/^rpg:/, '')
      if (['hunt', 'heal', 'daily', 'inventory'].includes(action)) {
        update.message = { chat: cq.message.chat, from: cq.from, text: `/${action}`, message_id: cq.message.message_id }
      } else {
      await sendTelegramPayload(bot.token, 'sendMessage', {
        chat_id: chatId,
        text: `<b>Button Action Processed:</b> <code>${html(data)}</code>`,
        parse_mode: 'HTML',
      })
    }
    if (!update.message) return NextResponse.json({ ok: true })
    } else return NextResponse.json({ ok: true })
  }

  const message = update.message || update.edited_message
  if (!message || !message.chat?.id) {
    return NextResponse.json({ ok: true })
  }

  const chatId = message.chat.id
  const chatType = message.chat.type || 'private' // 'private', 'group', 'supergroup', 'channel'
  const isGroup = chatType === 'group' || chatType === 'supergroup'
  const text = typeof message.text === 'string' ? message.text.slice(0, 4000) : ''
  const senderUsername = message.from?.username || message.from?.first_name || 'Anonymous'
  const senderId = message.from?.id
  const isCommand = text.startsWith('/')

  // Determine user internal role in bot context (default 'user', owner if matches bot creator/configured)
  let botUserRole = 'user'
  if (senderId && (senderId === bot.ownerTelegramId || String(senderId) === String(bot.userId))) {
    botUserRole = 'owner'
  }

  // Log incoming message
  await db.collection('logs').insertOne({
    botId: bot._id,
    userId: bot.userId,
    chatId: String(chatId),
    username: senderUsername,
    chatType,
    text,
    type: isCommand ? 'command' : 'message',
    createdAt: new Date(),
  })

  // Update bot counters
  await db.collection('bots').updateOne(
    { _id: bot._id },
    {
      $inc: { commands: isCommand ? 1 : 0 },
      $set: { lastMessageAt: new Date(), status: 'connected', updatedAt: new Date() },
    }
  )

  if (!isCommand) {
    return NextResponse.json({ ok: true })
  }

  const commandParts = text.trim().split(' ')
  const rawCmd = commandParts[0].toLowerCase()
  const cmdClean = rawCmd.split('@')[0] // remove @botusername suffix in groups
  const queryParam = commandParts.slice(1).join(' ').trim()

    // Lightweight, persistent RPG commands. State is keyed by bot, chat and Telegram user.
    if (bot.rpgMode && ['/rpg', '/hunt', '/heal', '/daily', '/inventory'].includes(cmdClean)) {
      const playerKey = `${bot._id}:${chatId}:${senderId || senderUsername}`
      const players = db.collection('rpg_players')
      const player = await players.findOne({ key: playerKey }) || {
        key: playerKey, botId: bot._id, chatId: String(chatId), userId: senderId, username: senderUsername,
        hp: 100, maxHp: 100, xp: 0, gold: 0, inventory: [], dailyAt: null,
      }
      let reply
      if (cmdClean === '/rpg') {
        reply = `<b>RPG Profile</b>\nHP: ${player.hp}/${player.maxHp}\nXP: ${player.xp}\nGold: ${player.gold}`
      } else if (cmdClean === '/inventory') {
        reply = `<b>Inventory</b>\n${player.inventory.length ? player.inventory.map((item) => `- ${html(item)}`).join('\n') : 'Empty'}`
      } else if (cmdClean === '/heal') {
        player.hp = player.maxHp
        reply = 'You restored your health to full.'
      } else if (cmdClean === '/daily') {
        const today = new Date().toISOString().slice(0, 10)
        if (player.dailyAt === today) reply = 'Daily reward already claimed. Come back tomorrow.'
        else { player.dailyAt = today; player.gold += 50; player.xp += 25; reply = 'Daily reward: +50 gold and +25 XP!' }
      } else {
        const won = Math.random() > 0.25
        if (won) { player.gold += 10; player.xp += 15; player.inventory.push('Hunt trophy'); reply = 'Hunt successful! +10 gold, +15 XP.' }
        else { player.hp = Math.max(0, player.hp - 10); reply = 'The hunt failed. You lost 10 HP.' }
      }
      await players.updateOne({ key: playerKey }, { $set: player }, { upsert: true })
      await sendTelegramPayload(bot.token, 'sendMessage', {
        chat_id: chatId, text: reply + (bot.footer ? `\n\n${bot.footer}` : ''), parse_mode: 'HTML',
        reply_markup: { inline_keyboard: [[
          { text: 'Hunt', callback_data: 'rpg:hunt' }, { text: 'Heal', callback_data: 'rpg:heal' },
          { text: 'Inventory', callback_data: 'rpg:inventory' },
        ]] }, reply_to_message_id: message.message_id,
      })
      return NextResponse.json({ ok: true })
    }


  // Check custom user-defined commands in MongoDB
  const customCmd = await db.collection('commands').findOne({
    $or: [{ botId: bot._id }, { userId: bot.userId }],
    command: cmdClean,
  })

  if (customCmd) {
    // Role Hierarchy Enforcement
    const roleRanks = { user: 0, admin: 1, superadmin: 2, owner: 3 }
    const requiredRank = roleRanks[customCmd.allowedRole || 'user'] || 0
    const userRank = roleRanks[botUserRole] || 0

    if (userRank < requiredRank) {
      await sendTelegramPayload(bot.token, 'sendMessage', {
        chat_id: chatId,
        text: `Perintah ini membutuhkan role minimal <b>${(customCmd.allowedRole || 'user').toUpperCase()}</b>. Role Anda: <b>${botUserRole.toUpperCase()}</b>.`,
        parse_mode: 'HTML',
        reply_to_message_id: message.message_id,
      })
      return NextResponse.json({ ok: true })
    }

    // 1. Scope mode check (group / private)
    if (customCmd.mode === 'group' && !isGroup) {
      await sendTelegramPayload(bot.token, 'sendMessage', {
        chat_id: chatId,
        text: 'Perintah ini hanya dapat digunakan dalam <b>Mode Grup</b>.',
        parse_mode: 'HTML',
        reply_to_message_id: message.message_id,
      })
      return NextResponse.json({ ok: true })
    }

    if (customCmd.mode === 'private' && isGroup) {
      await sendTelegramPayload(bot.token, 'sendMessage', {
        chat_id: chatId,
        text: 'Perintah ini hanya dapat digunakan dalam <b>Mode Private (DM)</b>.',
        parse_mode: 'HTML',
        reply_to_message_id: message.message_id,
      })
      return NextResponse.json({ ok: true })
    }

    // 2. Command usage limit check
    if (typeof customCmd.limit === 'number' && customCmd.limit > -1) {
      if ((customCmd.usageCount || 0) >= customCmd.limit) {
        await sendTelegramPayload(bot.token, 'sendMessage', {
          chat_id: chatId,
          text: 'Kuota penggunaan perintah ini telah habis.',
          parse_mode: 'HTML',
          reply_to_message_id: message.message_id,
        })
        return NextResponse.json({ ok: true })
      }
      // Decrement/Increment limit count
      await db.collection('commands').updateOne(
        { _id: customCmd._id },
        { $inc: { usageCount: 1 } }
      )
    }

    // Build reply markup buttons
    let reply_markup
    if (customCmd.buttons && customCmd.buttons.length > 0) {
      const inline_keyboard = customCmd.buttons.map((btn) => {
        if (btn.type === 'url') {
          return [{ text: btn.label, url: btn.value }]
        } else {
          return [{ text: btn.label, callback_data: btn.value || btn.label }]
        }
      })
      reply_markup = { inline_keyboard }
    }

    // Check required parameter/query
    if (customCmd.requireQuery && !queryParam) {
      await sendTelegramPayload(bot.token, 'sendMessage', {
        chat_id: chatId,
        text: `Penggunaan perintah ini memerlukan parameter/query.\nContoh: <code>${customCmd.command} kucing</code>`,
        parse_mode: 'HTML',
        reply_to_message_id: message.message_id,
      })
      return NextResponse.json({ ok: true })
    }

    // Handle scraping if scrapeUrl is set
    let scrapeOutput = ''
    if (customCmd.scrapeUrl) {
      try {
        const scrapeTarget = new URL(customCmd.scrapeUrl)
        if (queryParam) {
          scrapeTarget.searchParams.set('q', queryParam)
          scrapeTarget.searchParams.set('query', queryParam)
        }
        const fetchRes = await fetch(scrapeTarget.toString(), {
          headers: { 'User-Agent': 'Dann-Tele-Bot/1.0' },
        })
        const contentType = fetchRes.headers.get('content-type') || ''
        if (contentType.includes('application/json')) {
          const json = await fetchRes.json()
          scrapeOutput = typeof json === 'object' ? JSON.stringify(json, null, 2) : String(json)
        } else {
          scrapeOutput = await fetchRes.text()
        }
        scrapeOutput = scrapeOutput.slice(0, 2000)
      } catch (err) {
        scrapeOutput = `[Scraping Error: ${err.message}]`
      }
    }

    let finalResponse = renderTemplate(customCmd.response || 'Command executed.', message, bot)
    if (queryParam) finalResponse = finalResponse.replace(/@query\b/g, html(queryParam))
    if (scrapeOutput) finalResponse += `\n\n<b>Hasil API/Scrape:</b>\n<pre>${html(scrapeOutput)}</pre>`
    if (bot.footer) finalResponse += `\n\n${bot.footer}`

    // 3. Send response according to type
    if (customCmd.responseType === 'image' && customCmd.imageUrl) {
      await sendTelegramPayload(bot.token, 'sendPhoto', {
        chat_id: chatId,
        photo: customCmd.imageUrl,
        caption: finalResponse,
        parse_mode: 'HTML',
        reply_markup,
        reply_to_message_id: message.message_id,
      })
    } else {
      await sendTelegramPayload(bot.token, 'sendMessage', {
        chat_id: chatId,
        text: finalResponse,
        parse_mode: 'HTML',
        reply_markup,
        reply_to_message_id: message.message_id,
      })
    }

    return NextResponse.json({ ok: true })
  }

  // Handle standard default commands
  if (cmdClean === '/start') {
    await sendTelegramPayload(bot.token, 'sendMessage', {
      chat_id: chatId,
      text: `<b>Welcome to ${html(bot.name || 'Dann-Tele Bot')}!</b>\n\nYour bot is successfully connected and integrated with <b>Dann-Tele Gateway</b>.\n\nType /help to view available commands.` + (bot.footer ? `\n\n${bot.footer}` : ''),
      parse_mode: 'HTML',
      reply_to_message_id: message.message_id,
    })
  } else if (cmdClean === '/help') {
    await sendTelegramPayload(bot.token, 'sendMessage', {
      chat_id: chatId,
      text: `<b>Command List:</b>\n\n/start - Connect and initialize\n/status - Check bot gateway status\n/ping - Ping gateway latency\n/help - Show this help menu`,
      parse_mode: 'HTML',
      reply_to_message_id: message.message_id,
    })
  } else if (cmdClean === '/status') {
    await sendTelegramPayload(bot.token, 'sendMessage', {
      chat_id: chatId,
      text: `<b>Gateway Status:</b> Operational\n<b>Bot ID:</b> <code>${bot._id}</code>\n<b>Mode:</b> ${isGroup ? 'Group' : 'Private'}\n<b>Your Role:</b> ${botUserRole}`,
      parse_mode: 'HTML',
      reply_to_message_id: message.message_id,
    })
  } else if (cmdClean === '/ping') {
    await sendTelegramPayload(bot.token, 'sendMessage', {
      chat_id: chatId,
      text: `<b>Pong!</b> Gateway response time: &lt;100ms`,
      parse_mode: 'HTML',
      reply_to_message_id: message.message_id,
    })
  }

  return NextResponse.json({ ok: true })
}
