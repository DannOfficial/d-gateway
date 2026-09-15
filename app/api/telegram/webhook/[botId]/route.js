import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDb } from '../../../../../lib/mongodb'
import { safeFetch } from '../../../../../lib/safe-fetch'
import { pluginRegistry } from '../../../../../plugins'
import { executeExternalApiCommand } from '../../../../../lib/api-runner'

function html(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

function isPrivateOrInternalUrl(urlString) {
  try {
    const parsed = new URL(urlString)
    const hostname = parsed.hostname.toLowerCase()

    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '::1' ||
      hostname.endsWith('.internal') ||
      hostname.endsWith('.local')
    ) {
      return true
    }

    if (/^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.|169\.254\.)/.test(hostname)) {
      return true
    }

    return false
  } catch {
    return true
  }
}

function getFormattedTimeInZone(timeZoneParam) {
  let tz = 'Asia/Jakarta'
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
  const tzInfo = getFormattedTimeInZone('Asia/Jakarta')
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

  const webhookSecret = request.headers.get('x-telegram-bot-api-secret-token')
  if (!bot.webhookSecret || webhookSecret !== bot.webhookSecret) {
    return NextResponse.json({ ok: false, error: 'Unauthorized webhook' }, { status: 401 })
  }

  if (bot.status === 'stopped' || bot.status === 'inactive' || bot.isRunning === false) {
    return NextResponse.json({ ok: true, message: 'Bot is stopped' })
  }

  let update
  try {
    update = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON payload' }, { status: 400 })
  }

  if (update.update_id) {
    const dupKey = `upd:${bot._id}:${update.update_id}`
    try {
      await db.collection('processed_updates').insertOne({ _id: dupKey, createdAt: new Date() })
    } catch (error) {
      if (error?.code === 11000) return NextResponse.json({ ok: true, message: 'Duplicate update ignored' })
      throw error
    }
  }

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
      $set: { lastMessageAt: new Date(), status: 'running', updatedAt: new Date() },
    }
  )

  if (!isCommand) {
    return NextResponse.json({ ok: true })
  }

  const commandParts = text.trim().split(' ')
  const rawCmd = commandParts[0].toLowerCase()
  const cmdClean = rawCmd.split('@')[0]
  const cmdName = cmdClean.startsWith('/') ? cmdClean.slice(1) : cmdClean
  const queryParam = commandParts.slice(1).join(' ').trim()

  // Plugin System Command Dispatcher (Built-in RPG, Utility, etc.)
  const pluginMap = pluginRegistry.getCommandMap()
  const pluginCmd = pluginMap.get(cmdName)

  if (pluginCmd) {
    try {
      const pluginReply = await pluginCmd.handler({
        bot,
        message,
        chatId,
        senderId,
        senderUsername,
        text,
        command: cmdName,
        params: queryParam,
        db,
        sendReply: async (t, opts) => sendTelegramPayload(bot.token, 'sendMessage', { chat_id: chatId, text: t, parse_mode: 'HTML', ...opts }),
      })

      if (pluginReply) {
        let finalReply = pluginReply + (bot.footer ? `\n\n${bot.footer}` : '')
        let reply_markup
        if (cmdName === 'rpg' || cmdName === 'profile') {
          reply_markup = {
            inline_keyboard: [[
              { text: '⚔️ Hunt', callback_data: 'rpg:hunt' },
              { text: '🌾 Farm', callback_data: 'rpg:farm' },
              { text: '🎒 Inventory', callback_data: 'rpg:inventory' },
            ]],
          }
        }

        await sendTelegramPayload(bot.token, 'sendMessage', {
          chat_id: chatId,
          text: finalReply,
          parse_mode: 'HTML',
          reply_markup,
          reply_to_message_id: message.message_id,
        })
      }
    } catch (err) {
      console.error(`[Plugin Exception] Executing command /${cmdName}:`, err)
      await sendTelegramPayload(bot.token, 'sendMessage', {
        chat_id: chatId,
        text: `⚠️ Error executing command <code>/${cmdName}</code>: ${html(err.message)}`,
        parse_mode: 'HTML',
        reply_to_message_id: message.message_id,
      })
    }
    return NextResponse.json({ ok: true })
  }

  // Check Custom Commands
  const customCmd = await db.collection('commands').findOne({ botId: bot._id, command: cmdClean })

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

    if (customCmd.apiEndpoint) {
      const apiExecResult = await executeExternalApiCommand(db, bot, customCmd, queryParam, senderUsername)
      finalResponse = decors + apiExecResult
    } else if (customCmd.aiSessionMode) {
      const ownerUser = await db.collection('users').findOne({ _id: new ObjectId(bot.userId) }) || await db.collection('user').findOne({ id: bot.userId })
      const geminiApiKey = bot.geminiApiKey || ownerUser?.geminiApiKey || process.env.GEMINI_API_KEY

      if (!geminiApiKey) {
        finalResponse = `${decors}⚠️ <b>Gemini AI Config:</b> Silakan masukkan Gemini API Key di menu <b>Settings / AI Session</b> dashboard.`
      } else {
        const startTime = Date.now()
        try {
          const { GoogleGenAI } = await import('@google/genai')
          const ai = new GoogleGenAI({ apiKey: geminiApiKey })
          const modelName = customCmd.aiModel || bot.aiModel || 'gemini-2.5-flash'
          const promptContext = customCmd.aiContext || bot.aiContext || 'Kamu adalah asisten Telegram AI yang cerdas, ramah, dan membantu.'
          const fullPrompt = `${promptContext}\n\nPengguna @${senderUsername} berkata: ${queryParam || text}`

          const response = await ai.models.generateContent({
            model: modelName,
            contents: fullPrompt,
          })

          const latency = Date.now() - startTime
          const aiText = response.text || 'Tidak ada respon dari Gemini AI.'
          finalResponse = `${decors}✨ <b>[Gemini AI Response]</b>\n${html(aiText)}`

          await db.collection('gemini_logs').insertOne({
            botId: bot._id,
            userId: bot.userId,
            telegramUser: senderUsername,
            model: modelName,
            latency,
            status: 'SUCCESS',
            createdAt: new Date(),
          })
        } catch (err) {
          const latency = Date.now() - startTime
          console.error('[Gemini AI Error]', err)
          finalResponse = `${decors}⚠️ <b>Gemini AI Error:</b> ${html(err.message || 'Gagal menghasilkan respon AI.')}`

          await db.collection('gemini_logs').insertOne({
            botId: bot._id,
            userId: bot.userId,
            telegramUser: senderUsername,
            model: customCmd.aiModel || 'gemini-2.5-flash',
            latency,
            status: 'ERROR',
            error: err.message,
            createdAt: new Date(),
          })
        }
      }
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
    const tz = getFormattedTimeInZone('Asia/Jakarta')
    await sendTelegramPayload(bot.token, 'sendMessage', {
      chat_id: chatId,
      text: `<b>Status:</b> Operational (RUNNING)\n<b>Timezone:</b> ${tz.timezone} (${tz.time} - ${tz.date})\n<b>Your Role:</b> ${botUserRole}`,
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
