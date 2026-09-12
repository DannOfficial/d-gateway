import { NextResponse } from 'next/server'
import { getDb, ObjectId } from '../../../lib/mongodb'
import { getCurrentUser } from '../../../lib/auth'

// GET /api/commands - list all commands for current user's bots
export async function GET(request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
    response: cmd.response,
    decorations: Array.isArray(cmd.decorations) ? cmd.decorations : [],
    mode: cmd.mode || 'all', // 'all' | 'group' | 'private'
    limit: typeof cmd.limit === 'number' ? cmd.limit : -1, // -1 means unlimited
    usageCount: cmd.usageCount || 0,
    responseType: cmd.responseType || 'text', // 'text' | 'image' | 'hydrated_button' | 'callback_button'
    imageUrl: cmd.imageUrl || '',
    buttons: cmd.buttons || [], // Array of { label, type: 'url'|'callback', value }
    allowedRole: cmd.allowedRole || 'user', // 'user' | 'admin' | 'superadmin' | 'owner'
    aiSessionMode: Boolean(cmd.aiSessionMode),
    scrapeUrl: cmd.scrapeUrl || '',
    requireQuery: Boolean(cmd.requireQuery),
    createdAt: cmd.createdAt,
  }))

  return NextResponse.json({ commands: formatted })
}

// POST /api/commands - create or update a command
export async function POST(request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { id, botId, command, response, decorations, mode, limit, responseType, imageUrl, buttons, allowedRole, aiSessionMode, scrapeUrl, requireQuery } = body

    if (!command || !String(command).trim()) {
      return NextResponse.json({ error: 'Command string is required (e.g. /menu or /start).' }, { status: 400 })
    }

    const normalizedCmd = String(command).trim().toLowerCase()
    const formattedCmd = normalizedCmd.startsWith('/') ? normalizedCmd : `/${normalizedCmd}`

    const db = await getDb()

    const doc = {
      userId: user._id,
      botId: botId && ObjectId.isValid(botId) ? new ObjectId(botId) : null,
      command: formattedCmd,
      response: String(response || '').trim(),
      decorations: Array.isArray(decorations) ? decorations.map(String) : [],
      mode: ['all', 'group', 'private'].includes(mode) ? mode : 'all',
      limit: typeof limit === 'number' ? limit : -1,
      responseType: ['text', 'image', 'hydrated_button', 'callback_button'].includes(responseType) ? responseType : 'text',
      imageUrl: String(imageUrl || '').trim(),
      buttons: Array.isArray(buttons) ? buttons : [],
      allowedRole: ['user', 'admin', 'superadmin', 'owner'].includes(allowedRole) ? allowedRole : 'user',
      aiSessionMode: Boolean(aiSessionMode),
      scrapeUrl: String(scrapeUrl || '').trim(),
      requireQuery: Boolean(requireQuery),
      updatedAt: new Date(),
    }

    if (id && ObjectId.isValid(id)) {
      await db.collection('commands').updateOne({ _id: new ObjectId(id), userId: user._id }, { $set: doc })
      return NextResponse.json({ ok: true, id })
    } else {
      doc.createdAt = new Date()
      doc.usageCount = 0
      const res = await db.collection('commands').insertOne(doc)
      return NextResponse.json({ ok: true, id: res.insertedId.toString() }, { status: 201 })
    }
  } catch (err) {
    console.error('Command save error:', err)
    return NextResponse.json({ error: 'Failed to save command.' }, { status: 500 })
  }
}
