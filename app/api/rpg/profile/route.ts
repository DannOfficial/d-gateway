import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = await getDb()
  const players = await db.collection('rpg_players').find({}).sort({ money: -1 }).limit(50).toArray()

  return NextResponse.json({
    players: players.map((p) => ({
      id: p._id.toString(),
      nama: p.nama || 'Player',
      tag: p.tag || '@player',
      health: p.health ?? 100,
      money: p.money ?? 0,
      bank: p.bank ?? 0,
      hewan: p.hewan || [],
      tanaman: p.tanaman || [],
      kota: p.kota || 'Jakarta',
      inventory: p.inventory || [],
    })),
  })
}
