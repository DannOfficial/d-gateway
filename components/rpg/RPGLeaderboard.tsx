'use client'

import React from 'react'
import { Trophy } from 'lucide-react'

export interface RPGLeaderboardProps {
  players: Array<{
    id: string
    nama: string
    tag: string
    money: number
    bank: number
    kota: string
  }>
}

export function RPGLeaderboard({ players }: RPGLeaderboardProps) {
  return (
    <div className="space-y-3 text-xs">
      <div className="flex items-center justify-between border-b border-border pb-2">
        <h3 className="font-bold text-sm flex items-center gap-2">
          <Trophy size={16} className="text-amber-500" /> RPG Cash Leaderboard
        </h3>
        <span className="text-[10px] text-muted-foreground">Top Richest Players</span>
      </div>

      {players.length === 0 ? (
        <div className="p-6 text-center text-muted-foreground border border-border rounded-xl">
          No RPG player data found. Players will appear after sending /rpg in Telegram.
        </div>
      ) : (
        <div className="space-y-2">
          {players.slice(0, 10).map((p, idx) => (
            <div
              key={p.id}
              className="flex items-center justify-between p-3 rounded-xl border border-border bg-card hover:bg-muted/30 transition"
            >
              <div className="flex items-center gap-3">
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                  idx === 0 ? 'bg-amber-500 text-black' : idx === 1 ? 'bg-slate-300 text-black' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-muted text-muted-foreground'
                }`}>
                  {idx + 1}
                </span>
                <div>
                  <b className="font-bold">{p.nama}</b>
                  <span className="text-muted-foreground ml-1 font-mono text-[11px]">{p.tag}</span>
                </div>
              </div>

              <div className="text-right">
                <p className="font-bold text-primary font-mono">${p.money.toLocaleString()}</p>
                <span className="text-[10px] text-muted-foreground">Bank: ${p.bank.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
