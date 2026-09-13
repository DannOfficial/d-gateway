import { NextResponse } from 'next/server'
import { getDb, publicBot } from '../../../lib/mongodb'
import { getCurrentUser } from '../../../lib/auth'
import { randomBytes } from 'node:crypto'

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

  if (!name || name.length > 80) {
    return NextResponse.json({ error: 'Bot name is required (max 80 characters).' }, { status: 400 })
  }

  if (!token || !/^\d{6,}:[A-Za-z0-9_-]{20,}$/.test(token)) {
    return NextResponse.json({ error: 'Invalid Telegram Bot token format (e.g., 123456789:ABCdef...).' }, { status: 400 })
  }

  // Verify token with Telegram API getMe
  let telegramBotInfo = null
  try {
    const meRes = await fetch(`https://api.telegram.org/bot${token}/getMe`)
    const meData = await meRes.json()
    if (!meData.ok) {
      return NextResponse.json({ error: `Telegram rejected token: ${meData.description || 'Invalid token'}` }, { status: 422 })
    }
    telegramBotInfo = meData.result
  } catch (err) {
    return NextResponse.json({ error: `Failed to connect to Telegram API: ${err.message}` }, { status: 502 })
  }

  const db = await getDb()

  // Enforce Role-based Bot Limit
  const userRole = String(user.role || 'free').toLowerCase()
  const currentBotCount = await db.collection('bots').countDocuments({ userId: user._id })

  const LIMITS = { free: 3, vip: 10, premium: 25, admin: Infinity }
  const maxLimit = LIMITS[userRole] !== undefined ? LIMITS[userRole] : 3

  if (currentBotCount >= maxLimit) {
    return NextResponse.json({
      error: `Role '${userRole.toUpperCase()}' Anda dibatasi maksimal ${maxLimit} bot saja per bulan. Silakan upgrade role Anda (VIP / Premium / Admin) untuk menambah lebih banyak bot.`,
      roleLimitReached: true,
      role: userRole,
      limit: maxLimit,
      currentCount: currentBotCount,
    }, { status: 403 })
  }

  const botDoc = {
    userId: user._id,
    name,
    token,
    username: telegramBotInfo.username || null,
    firstName: telegramBotInfo.first_name || null,
    status: 'stopped',
    isRunning: false,
    webhookSecret: randomBytes(32).toString('hex'),
    commands: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const result = await db.collection('bots').insertOne(botDoc)
  return NextResponse.json({
    bot: publicBot({ ...botDoc, _id: result.insertedId }),
  }, { status: 201 })
}
