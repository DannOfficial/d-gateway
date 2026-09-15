import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = await getDb()
  const topPlayers = await db
    .collection('rpg_players')
    .find({})
    .sort({ money: -1 })
    .limit(20)
    .toArray()

  return NextResponse.json({
    leaderboard: topPlayers.map((p) => ({
      id: p._id.toString(),
      nama: p.nama || 'Player',
      tag: p.tag || '@player',
      money: p.money ?? 0,
      bank: p.bank ?? 0,
      kota: p.kota || 'Jakarta',
    })),
  })
}
