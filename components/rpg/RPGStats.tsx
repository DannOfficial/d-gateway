'use client'

import React from 'react'
import { Trophy, Shield, Coins, Users } from 'lucide-react'

export interface RPGStatsProps {
  totalPlayers: number
  topMoney: number
  activeCount?: number
}

export function RPGStats({ totalPlayers, topMoney, activeCount = 0 }: RPGStatsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
      <div className="p-3.5 rounded-xl border border-border bg-card">
        <div className="flex items-center gap-2 text-primary mb-1">
          <Users size={16} />
          <span className="text-[10px] uppercase font-bold text-muted-foreground">Registered RPG Players</span>
        </div>
        <p className="text-xl font-bold">{totalPlayers}</p>
      </div>

      <div className="p-3.5 rounded-xl border border-border bg-card">
        <div className="flex items-center gap-2 text-amber-500 mb-1">
          <Coins size={16} />
          <span className="text-[10px] uppercase font-bold text-muted-foreground">Highest Cash Held</span>
        </div>
        <p className="text-xl font-bold">${topMoney.toLocaleString()}</p>
      </div>

      <div className="p-3.5 rounded-xl border border-border bg-card">
        <div className="flex items-center gap-2 text-emerald-400 mb-1">
          <Trophy size={16} />
          <span className="text-[10px] uppercase font-bold text-muted-foreground">RPG Game Engine</span>
        </div>
        <p className="text-xl font-bold text-emerald-400">ACTIVE</p>
      </div>
    </div>
  )
}
