'use client'

import React from 'react'
import { RPGStats } from './RPGStats'
import { RPGLeaderboard } from './RPGLeaderboard'
import { RPGPlayer } from './RPGPlayer'
import { Card } from '@/components/ui/card'

export interface RPGDashboardProps {
  players: Array<{
    id: string
    nama: string
    tag: string
    health: number
    money: number
    bank: number
    hewan: string[]
    tanaman: string[]
    kota: string
    inventory: string[]
  }>
}

export function RPGDashboard({ players }: RPGDashboardProps) {
  const topMoney = players.length > 0 ? Math.max(...players.map((p) => p.money)) : 0

  return (
    <Card className="panel p-6 space-y-6">
      <RPGStats totalPlayers={players.length} topMoney={topMoney} />

      <RPGLeaderboard players={players} />

      {players.length > 0 && (
        <div className="space-y-3 pt-2 border-t border-border">
          <h3 className="font-bold text-sm text-foreground">Featured RPG Profiles</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {players.slice(0, 4).map((player) => (
              <RPGPlayer key={player.id} player={player} />
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}
