import { NextResponse } from 'next/server'
import { getCurrentUser } from '../../../../lib/auth'
import { getDb } from '../../../../lib/mongodb'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDb()
  const bots = await db.collection('bots').find({ userId: user._id }).toArray()
  const commands = await db.collection('commands').find({ userId: user._id }).toArray()
  const logs = await db.collection('logs').find({ userId: user._id }).limit(100).toArray()

  const exportData = {
    user: {
      name: user.name,
      email: user.email,
      role: user.role,
      plan: user.plan,
    },
    bots,
    commands,
    logs,
    exportedAt: new Date().toISOString(),
  }

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="dann-tele-workspace-export.json"',
    },
  })
}
