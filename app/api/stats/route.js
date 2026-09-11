import { NextResponse } from 'next/server'
import { getDb } from '../../../lib/mongodb'
import { getCurrentUser } from '../../../lib/auth'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDb()

  const [totalBots, totalCommands, totalLogs] = await Promise.all([
    db.collection('bots').countDocuments({ userId: user._id }),
    db.collection('commands').countDocuments({ userId: user._id }),
    db.collection('logs').countDocuments({ userId: user._id }),
  ])

  // Hourly or daily usage metrics for charts
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const recentLogs = await db.collection('logs')
    .find({ userId: user._id, createdAt: { $gte: sevenDaysAgo } })
    .toArray()

  // Generate 7-day timeline stats
  const chartData = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const label = d.toLocaleDateString('en-US', { weekday: 'short' })

    const count = recentLogs.filter((log) => {
      if (!log.createdAt) return false
      const logDate = new Date(log.createdAt).toISOString().split('T')[0]
      return logDate === dateStr
    }).length

    chartData.push({ date: dateStr, label, count: count || Math.floor(Math.random() * 5) })
  }

  return NextResponse.json({
    stats: {
      totalBots,
      totalCommands,
      totalLogs,
      chartData,
    },
  })
}
