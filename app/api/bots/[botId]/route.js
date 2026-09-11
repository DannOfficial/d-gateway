import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDb, publicBot } from '../../../../lib/mongodb'
import { getCurrentUser } from '../../../../lib/auth'

async function ownedBot(botId, userId) {
  if (!ObjectId.isValid(botId)) return null
  return (await getDb()).collection('bots').findOne({ _id: new ObjectId(botId), userId })
}

export async function DELETE(request, { params }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { botId } = await params
  const db = await getDb()
  const bot = await ownedBot(botId, user._id)
  if (!bot) return NextResponse.json({ error: 'Bot not found' }, { status: 404 })
  await db.collection('bots').deleteOne({ _id: bot._id })
  await db.collection('logs').deleteMany({ botId: bot._id })
  return NextResponse.json({ ok: true })
}

export async function PATCH(request, { params }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { botId } = await params
  const body = await request.json()
  const name = String(body.name || '').trim()
  if (!name || name.length > 80) return NextResponse.json({ error: 'Invalid bot name' }, { status: 400 })
  const db = await getDb()
  const bot = await ownedBot(botId, user._id)
  if (!bot) return NextResponse.json({ error: 'Bot not found' }, { status: 404 })
  await db.collection('bots').updateOne({ _id: bot._id }, { $set: { name, updatedAt: new Date() } })
  return NextResponse.json({ bot: publicBot({ ...bot, name }) })
}
