'use client'

import React from 'react'
import { Bot, Command, Activity, Radio } from 'lucide-react'

export interface BotStatsProps {
  totalBots: number
  runningBots: number
  stoppedBots: number
  totalCommands: number
  userRole?: string
}

export function BotStats({
  totalBots,
  runningBots,
  stoppedBots,
  totalCommands,
  userRole = 'free',
}: BotStatsProps) {
  const limitLabel = userRole === 'vip' ? '10 Bots Max' : userRole === 'premium' ? '25 Bots Max' : userRole === 'admin' ? 'Unlimited' : '3 Bots Max'

  return (
    <div className="metric-grid">
      <div className="metric-card">
        <div className="metric-icon"><Bot size={18} /></div>
        <span>Connected bots</span>
        <strong>{totalBots}</strong>
        <small>{limitLabel}</small>
      </div>
      <div className="metric-card">
        <div className="metric-icon text-emerald-400"><Activity size={18} /></div>
        <span>Running bots</span>
        <strong>{runningBots}</strong>
        <small>Active webhooks</small>
      </div>
      <div className="metric-card">
        <div className="metric-icon text-amber-400"><Radio size={18} /></div>
        <span>Stopped bots</span>
        <strong>{stoppedBots}</strong>
        <small>Inactive</small>
      </div>
      <div className="metric-card">
        <div className="metric-icon text-primary"><Command size={18} /></div>
        <span>Commands processed</span>
        <strong>{totalCommands}</strong>
        <small>All time updates</small>
      </div>
    </div>
  )
}
