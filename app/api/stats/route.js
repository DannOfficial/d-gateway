import { NextResponse } from 'next/server'
import os from 'os'
import { getDb } from '../../../lib/mongodb'
import { getCurrentUser } from '../../../lib/auth'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDb()

  const [totalBots, totalCommands, totalLogs, totalRpgPlayers] = await Promise.all([
    db.collection('bots').countDocuments({ userId: user._id }),
    db.collection('commands').countDocuments({ userId: user._id }),
    db.collection('logs').countDocuments({ userId: user._id }),
    db.collection('rpg_players').countDocuments({}),
  ])

  // System Hardware Metrics
  const totalMem = os.totalmem()
  const freeMem = os.freemem()
  const usedMem = totalMem - freeMem
  const memUsagePercent = Math.round((usedMem / totalMem) * 100)

  const cpus = os.cpus()
  const cpuModel = cpus && cpus.length > 0 ? cpus[0].model : 'Standard Processor'
  const loadAvg = os.loadavg()
  const cpuUsagePercent = Math.min(100, Math.round((loadAvg[0] || 0.1) * 20))

  const nodeVersion = process.version
  const osType = `${os.type()} ${os.release()} (${os.arch()})`

  // Get Server Network IP Address
  const networkInterfaces = os.networkInterfaces()
  let serverIp = '127.0.0.1'
  for (const name of Object.keys(networkInterfaces)) {
    for (const net of networkInterfaces[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        serverIp = net.address
        break
      }
    }
  }

  // 7-day timeline stats based on database logs
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const recentLogs = await db.collection('logs')
    .find({ userId: user._id, createdAt: { $gte: sevenDaysAgo } })
    .toArray()

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

    chartData.push({ date: dateStr, label, count: count || 0 })
  }

  return NextResponse.json({
    stats: {
      totalBots,
      totalCommands,
      totalLogs,
      totalRpgPlayers,
      chartData,
      system: {
        memory: {
          total: `${(totalMem / (1024 * 1024 * 1024)).toFixed(2)} GB`,
          used: `${(usedMem / (1024 * 1024 * 1024)).toFixed(2)} GB`,
          free: `${(freeMem / (1024 * 1024 * 1024)).toFixed(2)} GB`,
          percentage: memUsagePercent,
        },
        cpu: {
          model: cpuModel,
          cores: cpus.length,
          usagePercentage: cpuUsagePercent,
          loadAvg: loadAvg.map((l) => l.toFixed(2)),
        },
        nodeVersion,
        os: osType,
        ipAddress: serverIp,
      },
    },
  })
}
