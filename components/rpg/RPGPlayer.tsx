'use client'

import React from 'react'

export interface RPGPlayerProps {
  player: {
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
  }
}

export function RPGPlayer({ player }: RPGPlayerProps) {
  return (
    <div className="p-4 rounded-xl border border-border bg-card space-y-3 text-xs">
      <div className="flex items-center justify-between border-b border-border pb-2">
        <div>
          <b className="font-bold text-sm text-primary">{player.nama}</b>
          <span className="text-muted-foreground ml-2">{player.tag}</span>
        </div>
        <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
          {player.kota}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div>
          <span className="text-muted-foreground">❤️ Health:</span>
          <b className="ml-1 text-emerald-400">{player.health}/100</b>
        </div>
        <div>
          <span className="text-muted-foreground">💵 Cash:</span>
          <b className="ml-1">${player.money.toLocaleString()}</b>
        </div>
        <div>
          <span className="text-muted-foreground">🏦 Bank:</span>
          <b className="ml-1">${player.bank.toLocaleString()}</b>
        </div>
        <div>
          <span className="text-muted-foreground">🎒 Inventory:</span>
          <b className="ml-1">{player.inventory.length} items</b>
        </div>
      </div>
    </div>
  )
}
