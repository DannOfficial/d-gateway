import { NextResponse } from 'next/server'
import { getDb, ObjectId } from '../../../lib/mongodb'
import { getCurrentUser } from '../../../lib/auth'
import { syncBotCommandsWithTelegram } from '../../../lib/telegram-sync'

// GET /api/commands - list all commands for current user's bots
export async function GET(request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const botId = searchParams.get('botId')

  const db = await getDb()
  const filter = { userId: user._id }
  if (botId && ObjectId.isValid(botId)) {
    filter.botId = new ObjectId(botId)
  }

  const commands = await db.collection('commands').find(filter).sort({ createdAt: -1 }).toArray()

  const formatted = commands.map((cmd) => ({
    id: cmd._id.toString(),
    botId: cmd.botId ? cmd.botId.toString() : null,
    command: cmd.command,
    aliases: cmd.aliases || [],
    description: cmd.description || '',
    category: cmd.category || 'General',
    parameters: cmd.parameters || [],
    response: cmd.response,
    decorations: Array.isArray(cmd.decorations) ? cmd.decorations : [],
    mode: cmd.mode || 'all',
    limit: typeof cmd.limit === 'number' ? cmd.limit : -1,
    cooldown: typeof cmd.cooldown === 'number' ? cmd.cooldown : 0,
    usageCount: cmd.usageCount || 0,
    responseType: cmd.responseType || 'text',
    imageUrl: cmd.imageUrl || '',
    buttons: cmd.buttons || [],
    allowedRole: cmd.allowedRole || 'user',
    aiSessionMode: Boolean(cmd.aiSessionMode),
    aiModel: cmd.aiModel || 'gemini-2.5-flash',
    aiContext: cmd.aiContext || '',
    apiEndpoint: cmd.apiEndpoint || cmd.scrapeUrl || '',
    apiMethod: cmd.apiMethod || 'GET',
    apiHeaders: cmd.apiHeaders || [],
    createdAt: cmd.createdAt,
  }))

  return NextResponse.json({ success: true, commands: formatted })
}

// POST /api/commands - create or update a command
export async function POST(request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 })

  try {
    const body = await request.json()
    const {
      id,
      botId,
      command,
      aliases,
      description,
      category,
      parameters,
      response,
      decorations,
      mode,
      limit,
      cooldown,
      responseType,
      imageUrl,
      buttons,
      allowedRole,
      aiSessionMode,
      aiModel,
      aiContext,
      apiEndpoint,
      apiMethod,
      apiHeaders,
    } = body

    if (!command || !String(command).trim()) {
      return NextResponse.json({ success: false, error: { code: 'INVALID_COMMAND', message: 'Command string is required (e.g. /pinterest or /menu).' } }, { status: 400 })
    }

    const normalizedCmd = String(command).trim().toLowerCase()
    const formattedCmd = normalizedCmd.startsWith('/') ? normalizedCmd : `/${normalizedCmd}`

    const db = await getDb()
    let ownedBotId = null
    if (botId) {
      if (!ObjectId.isValid(botId)) return NextResponse.json({ success: false, error: { code: 'INVALID_BOT_ID', message: 'Invalid bot ID.' } }, { status: 400 })
      const ownedBot = await db.collection('bots').findOne(
        { _id: new ObjectId(botId), userId: user._id },
        { projection: { _id: 1 } }
      )
      if (!ownedBot) return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'You do not own this bot.' } }, { status: 403 })
      ownedBotId = ownedBot._id
    }

    const doc = {
      userId: user._id,
      botId: ownedBotId,
      command: formattedCmd,
      aliases: Array.isArray(aliases) ? aliases.map((a) => String(a).replace(/^\//, '').toLowerCase()) : [],
      description: String(description || '').trim(),
      category: String(category || 'General').trim(),
      parameters: Array.isArray(parameters) ? parameters : [],
      response: String(response || '').trim(),
      decorations: Array.isArray(decorations) ? decorations.map(String) : [],
      mode: ['all', 'group', 'private'].includes(mode) ? mode : 'all',
      limit: typeof limit === 'number' ? limit : -1,
      cooldown: typeof cooldown === 'number' ? cooldown : 0,
      responseType: ['text', 'image', 'hydrated_button', 'callback_button'].includes(responseType) ? responseType : 'text',
      imageUrl: String(imageUrl || '').trim(),
      buttons: Array.isArray(buttons) ? buttons : [],
      allowedRole: ['user', 'admin', 'superadmin', 'owner'].includes(allowedRole) ? allowedRole : 'user',
      aiSessionMode: Boolean(aiSessionMode),
      aiModel: String(aiModel || 'gemini-2.5-flash').trim(),
      aiContext: String(aiContext || '').trim(),
      apiEndpoint: String(apiEndpoint || '').trim(),
      apiMethod: ['GET', 'POST'].includes(apiMethod) ? apiMethod : 'GET',
      apiHeaders: Array.isArray(apiHeaders) ? apiHeaders : [],
      updatedAt: new Date(),
    }

    let savedId = id
    if (id && ObjectId.isValid(id)) {
      const result = await db.collection('commands').updateOne({ _id: new ObjectId(id), userId: user._id }, { $set: doc })
      if (!result.matchedCount) return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Command not found.' } }, { status: 404 })
    } else {
      doc.createdAt = new Date()
      doc.usageCount = 0
      const res = await db.collection('commands').insertOne(doc)
      savedId = res.insertedId.toString()
    }

    if (ownedBotId) {
      await syncBotCommandsWithTelegram(db, ownedBotId)
    }

    return NextResponse.json({ success: true, data: { id: savedId, message: 'Command saved and synced with Telegram bot.' } })
  } catch (err) {
    console.error('Command save error:', err)
    return NextResponse.json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to save command.' } }, { status: 500 })
  }
}
