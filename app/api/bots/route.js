import { NextResponse } from 'next/server'
import { getDb, publicBot } from '../../../lib/mongodb'
import { getCurrentUser } from '../../../lib/auth'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = await getDb()
  const bots = await db.collection('bots').find({ userId: user._id }).sort({ createdAt: -1 }).toArray()
  return NextResponse.json({ bots: bots.map(publicBot) })
}

export async function POST(request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const name = String(body.name || '').trim()
  const token = String(body.token || '').trim()
  if (!name || name.length > 80 || !/^\d{6,}:[A-Za-z0-9_-]{20,}$/.test(token)) {
    return NextResponse.json({ error: 'Bot name and valid Telegram token are required.' }, { status: 400 })
  }
  const db = await getDb()
  const bot = { userId: user._id, name, token, username: null, status: 'pending', commands: 0, createdAt: new Date(), updatedAt: new Date() }
  const result = await db.collection('bots').insertOne(bot)
  return NextResponse.json({ bot: publicBot({ ...bot, _id: result.insertedId }) }, { status: 201 })
}
