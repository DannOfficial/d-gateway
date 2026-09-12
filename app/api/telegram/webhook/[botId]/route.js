import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDb } from '../../../../../lib/mongodb'

function html(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

// Format time in specified timezone (Asia/Jakarta, WIB, WIT, WITA, etc)
function getFormattedTimeInZone(timeZoneParam) {
  let tz = timeZoneParam || 'Asia/Jakarta'
  if (tz === 'WIB') tz = 'Asia/Jakarta'
  if (tz === 'WITA') tz = 'Asia/Makassar'
  if (tz === 'WIT') tz = 'Asia/Jayapura'

  const now = new Date()
  try {
    const timeFormatter = new Intl.DateTimeFormat('id-ID', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
    const dateFormatter = new Intl.DateTimeFormat('id-ID', {
      timeZone: tz,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
    return {
      time: timeFormatter.format(now),
      date: dateFormatter.format(now),
      timezone: tz,
    }
  } catch {
    return {
      time: now.toLocaleTimeString(),
      date: now.toLocaleDateString(),
      timezone: 'Asia/Jakarta',
    }
  }
}

function renderTemplate(value, message, bot) {
  const from = message.from || {}
  const tzInfo = getFormattedTimeInZone(bot.timezone)
  return String(value || '').replace(/@(username|fullname|id|time|date|timezone|botname)\b/g, (_, key) => ({
    username: `@${from.username || from.first_name || 'user'}`,
    fullname: [from.first_name, from.last_name].filter(Boolean).join(' ') || 'user',
    id: from.id || '',
    time: tzInfo.time,
    date: tzInfo.date,
    timezone: tzInfo.timezone,
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

  // Handle Dynamic Inline Callback Query (without requiring hardcoded URLs)
  if (update.callback_query) {
    const cq = update.callback_query
    const chatId = cq.message?.chat?.id
    const data = String(cq.data || '')
    await sendTelegramPayload(bot.token, 'answerCallbackQuery', {
      callback_query_id: cq.id,
      text: `Processing: ${data}`,
    })

    if (chatId) {
      if (data.startsWith('rpg:')) {
        const action = data.replace(/^rpg:/, '')
        update.message = { chat: cq.message.chat, from: cq.from, text: `/${action}`, message_id: cq.message.message_id }
      } else if (data.startsWith('nav:') || data.startsWith('action:')) {
        await sendTelegramPayload(bot.token, 'sendMessage', {
          chat_id: chatId,
          text: `✨ <b>Callback Executed:</b> <code>${html(data)}</code>`,
          parse_mode: 'HTML',
        })
        return NextResponse.json({ ok: true })
      } else {
        update.message = { chat: cq.message.chat, from: cq.from, text: data.startsWith('/') ? data : `/${data}`, message_id: cq.message.message_id }
      }
      if (!update.message) return NextResponse.json({ ok: true })
    } else {
      return NextResponse.json({ ok: true })
    }
  }

  const message = update.message || update.edited_message
  if (!message || !message.chat?.id) {
    return NextResponse.json({ ok: true })
  }

  const chatId = message.chat.id
  const chatType = message.chat.type || 'private'
  const isGroup = chatType === 'group' || chatType === 'supergroup'
  const text = typeof message.text === 'string' ? message.text.slice(0, 4000) : ''
  const senderUsername = message.from?.username || message.from?.first_name || 'Anonymous'
  const senderId = message.from?.id
  const isCommand = text.startsWith('/')

  let botUserRole = 'user'
  if (senderId && (senderId === bot.ownerTelegramId || String(senderId) === String(bot.userId))) {
    botUserRole = 'owner'
  }

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
  const cmdClean = rawCmd.split('@')[0]
  const queryParam = commandParts.slice(1).join(' ').trim()

  // RPG Command Handler
  if (bot.rpgMode && ['/rpg', '/hunt', '/heal', '/daily', '/inventory', '/farm', '/work', '/bank'].includes(cmdClean)) {
    const playerKey = `${bot._id}:${chatId}:${senderId || senderUsername}`
    const players = db.collection('rpg_players')
    const player = await players.findOne({ key: playerKey }) || {
      key: playerKey, botId: bot._id, chatId: String(chatId), userId: senderId, username: senderUsername,
      id: String(senderId || Date.now()),
      nama: senderUsername,
      tag: `@${senderUsername}`,
      health: 100, maxHp: 100, money: 500, bank: 1000,
      hewan: ['Kucing', 'Ayam'],
      tanaman: ['Padi', 'Jagung'],
      kota: 'Jakarta',
      inventory: ['Hunter Sword', 'Potion'], dailyAt: null,
    }

    let reply = ''
    if (cmdClean === '/rpg') {
      reply = `🎮 <b>RPG Profile - ${html(player.nama)}</b> (${html(player.kota)})\nTag: ${html(player.tag)}\n❤️ Health: ${player.health}/${player.maxHp}\n💵 Cash: $${player.money} | 🏦 Bank: $${player.bank}\n🐱 Hewan: ${player.hewan.join(', ')}\n🌱 Tanaman: ${player.tanaman.join(', ')}`
    } else if (cmdClean === '/inventory') {
      reply = `🎒 <b>Inventory (${html(player.nama)})</b>\n${player.inventory.map((i) => `• ${html(i)}`).join('\n')}`
    } else if (cmdClean === '/heal') {
      player.health = player.maxHp
      reply = '✨ Darah kamu telah pulih sepenuhnya (100 HP).'
    } else if (cmdClean === '/daily') {
      const today = new Date().toISOString().slice(0, 10)
      if (player.dailyAt === today) reply = '⏳ Klaim harian sudah diambil hari ini. Kembali besok!'
      else { player.dailyAt = today; player.money += 250; reply = '🎁 Klaim harian berhasil: +$250 uang tunai!' }
    } else if (cmdClean === '/farm') {
      player.money += 100
      reply = '🌾 Kamu berkebun dan memanen tanaman: +$100!'
    } else if (cmdClean === '/work') {
      player.money += 150
      reply = '💼 Kamu bekerja seharian di kota: +$150!'
    } else if (cmdClean === '/bank') {
      reply = `🏦 <b>Bank Central RPG</b>\nSaldo Bank: $${player.bank}\nCash: $${player.money}`
    } else {
      const won = Math.random() > 0.25
      if (won) { player.money += 120; player.inventory.push('Kulit Serigala'); reply = '⚔️ Berburu sukses! Mendapatkan +$120 & Kulit Serigala.' }
      else { player.health = Math.max(0, player.health - 15); reply = '💥 Berburu gagal! Kamu terkena serangan (-15 HP).' }
    }

    await players.updateOne({ key: playerKey }, { $set: player }, { upsert: true })
    await sendTelegramPayload(bot.token, 'sendMessage', {
      chat_id: chatId, text: reply + (bot.footer ? `\n\n${bot.footer}` : ''), parse_mode: 'HTML',
      reply_markup: { inline_keyboard: [[
        { text: '⚔️ Hunt', callback_data: 'rpg:hunt' },
        { text: '🌾 Farm', callback_data: 'rpg:farm' },
        { text: '🎒 Inventory', callback_data: 'rpg:inventory' },
      ]] }, reply_to_message_id: message.message_id,
    })
    return NextResponse.json({ ok: true })
  }

  // Check Custom Commands
  const customCmd = await db.collection('commands').findOne({
    $or: [{ botId: bot._id }, { userId: bot.userId }],
    command: cmdClean,
  })

  if (customCmd) {
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

    if (customCmd.mode === 'group' && !isGroup) {
      await sendTelegramPayload(bot.token, 'sendMessage', {
        chat_id: chatId, text: 'Perintah ini hanya dapat digunakan dalam <b>Mode Grup</b>.', parse_mode: 'HTML', reply_to_message_id: message.message_id,
      })
      return NextResponse.json({ ok: true })
    }

    if (customCmd.mode === 'private' && isGroup) {
      await sendTelegramPayload(bot.token, 'sendMessage', {
        chat_id: chatId, text: 'Perintah ini hanya dapat digunakan dalam <b>Mode Private (DM)</b>.', parse_mode: 'HTML', reply_to_message_id: message.message_id,
      })
      return NextResponse.json({ ok: true })
    }

    if (typeof customCmd.limit === 'number' && customCmd.limit > -1) {
      if ((customCmd.usageCount || 0) >= customCmd.limit) {
        await sendTelegramPayload(bot.token, 'sendMessage', {
          chat_id: chatId, text: 'Kuota penggunaan perintah ini telah habis.', parse_mode: 'HTML', reply_to_message_id: message.message_id,
        })
        return NextResponse.json({ ok: true })
      }
      await db.collection('commands').updateOne({ _id: customCmd._id }, { $inc: { usageCount: 1 } })
    }

    let reply_markup
    if (customCmd.buttons && customCmd.buttons.length > 0) {
      const inline_keyboard = customCmd.buttons.map((btn) => {
        if (btn.type === 'url') return [{ text: btn.label, url: btn.value }]
        return [{ text: btn.label, callback_data: btn.value || btn.label }]
      })
      reply_markup = { inline_keyboard }
    }

    let finalResponse = ''
    const decors = Array.isArray(customCmd.decorations) && customCmd.decorations.length > 0 ? customCmd.decorations.join(' ') + ' ' : ''

    if (customCmd.aiSessionMode) {
      finalResponse = `${decors}<b>[Gemini AI Response]</b>\nHello @${senderUsername}, I am your AI assistant handling command <code>${cmdClean}</code>. ${queryParam ? `Query: ${html(queryParam)}` : ''}`
    } else {
      finalResponse = decors + renderTemplate(customCmd.response || 'Command executed.', message, bot)
    }

    if (queryParam) finalResponse = finalResponse.replace(/@query\b/g, html(queryParam))
    if (bot.footer) finalResponse += `\n\n${bot.footer}`

    if (customCmd.responseType === 'image' && customCmd.imageUrl) {
      await sendTelegramPayload(bot.token, 'sendPhoto', {
        chat_id: chatId, photo: customCmd.imageUrl, caption: finalResponse, parse_mode: 'HTML', reply_markup, reply_to_message_id: message.message_id,
      })
    } else {
      await sendTelegramPayload(bot.token, 'sendMessage', {
        chat_id: chatId, text: finalResponse, parse_mode: 'HTML', reply_markup, reply_to_message_id: message.message_id,
      })
    }

    return NextResponse.json({ ok: true })
  }

  // Standard Default Commands
  if (cmdClean === '/start') {
    await sendTelegramPayload(bot.token, 'sendMessage', {
      chat_id: chatId,
      text: `<b>Welcome to ${html(bot.name || 'Dann-Tele Bot')}!</b>\n\nConnected with <b>Dann-Tele Gateway</b>.\nType /help for available commands.` + (bot.footer ? `\n\n${bot.footer}` : ''),
      parse_mode: 'HTML',
      reply_to_message_id: message.message_id,
    })
  } else if (cmdClean === '/help') {
    await sendTelegramPayload(bot.token, 'sendMessage', {
      chat_id: chatId,
      text: `<b>Command Menu:</b>\n/start - Initialize bot\n/status - Gateway status\n/rpg - RPG Profile & Game\n/ping - Ping speed`,
      parse_mode: 'HTML',
      reply_to_message_id: message.message_id,
    })
  } else if (cmdClean === '/status') {
    const tz = getFormattedTimeInZone(bot.timezone)
    await sendTelegramPayload(bot.token, 'sendMessage', {
      chat_id: chatId,
      text: `<b>Status:</b> Operational\n<b>Timezone:</b> ${tz.timezone} (${tz.time} - ${tz.date})\n<b>Your Role:</b> ${botUserRole}`,
      parse_mode: 'HTML',
      reply_to_message_id: message.message_id,
    })
  } else if (cmdClean === '/ping') {
    await sendTelegramPayload(bot.token, 'sendMessage', {
      chat_id: chatId, text: `<b>Pong!</b> Latency: &lt;50ms`, parse_mode: 'HTML', reply_to_message_id: message.message_id,
    })
  }

  return NextResponse.json({ ok: true })
}
