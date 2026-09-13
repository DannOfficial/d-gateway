import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDb } from '@/lib/mongodb'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: Request, { params }: { params: Promise<{ botId: string }> }) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { botId } = await params
  if (!botId || !ObjectId.isValid(botId)) {
    return NextResponse.json({ ok: false, error: 'Invalid Bot ID' }, { status: 400 })
  }

  const db = await getDb()
  const bot = await db.collection('bots').findOne({ _id: new ObjectId(botId) })
  if (!bot) {
    return NextResponse.json({ ok: false, error: 'Bot not found' }, { status: 404 })
  }

  // Ownership Check
  if (String(bot.userId) !== String(user._id)) {
    return NextResponse.json({ ok: false, error: 'Forbidden: You do not own this bot' }, { status: 403 })
  }

  try {
    await fetch(`https://api.telegram.org/bot${bot.token}/deleteWebhook`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ drop_pending_updates: true }),
    }).catch(() => {})

    await db.collection('bots').updateOne(
      { _id: bot._id },
      { $set: { status: 'stopped', isRunning: false, updatedAt: new Date() } }
    )

    const updatedBot = await db.collection('bots').findOne({ _id: bot._id })
    return NextResponse.json({ ok: true, message: 'Bot stopped successfully', bot: updatedBot })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
