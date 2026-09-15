import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDb, publicBot } from '@/lib/mongodb'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: Request, { params }: { params: Promise<{ botId: string }> }) {
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

  if (String(bot.userId) !== String(user._id)) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
  }

  // Live Telegram webhook status check
  let webhookInfo = null
  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${bot.token}/getWebhookInfo`)
    const tgData = await tgRes.json()
    if (tgData.ok) webhookInfo = tgData.result
  } catch {}

  const isWebhookActive = Boolean(webhookInfo?.url)
  const isRunning = bot.status === 'running' || bot.status === 'connected' || bot.status === 'active'

  return NextResponse.json({
    ok: true,
    bot: publicBot(bot),
    runtime: {
      status: isRunning && isWebhookActive ? 'RUNNING' : 'STOPPED',
      webhookUrl: webhookInfo?.url || null,
      pendingUpdateCount: webhookInfo?.pending_update_count || 0,
      lastErrorDate: webhookInfo?.last_error_date ? new Date(webhookInfo.last_error_date * 1000).toISOString() : null,
      lastErrorMessage: webhookInfo?.last_error_message || null,
    },
  })
}
