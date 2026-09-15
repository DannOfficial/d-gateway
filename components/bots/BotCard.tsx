'use client'

import React from 'react'
import { Bot } from 'lucide-react'
import { BotStatus } from './BotStatus'
import { BotActions } from './BotActions'

export interface BotCardProps {
  bot: {
    id: string
    name: string
    username: string | null
    status: string
    commands?: number
    createdAt?: string
  }
  onStart: (id: string) => void
  onStop: (id: string) => void
  onRestart: (id: string) => void
  onDelete: (id: string) => void
}

export function BotCard({ bot, onStart, onStop, onRestart, onDelete }: BotCardProps) {
  return (
    <div className="bot-row">
      <div className="bot-identity">
        <div className="bot-avatar">
          <Bot size={18} />
        </div>
        <div>
          <b>{bot.name}</b>
          <span>
            {bot.username ? `@${bot.username}` : 'Telegram bot'} · {bot.commands || 0} commands handled
          </span>
        </div>
      </div>
      <div className="bot-health">
        <BotStatus status={bot.status} />
        <BotActions
          status={bot.status}
          onStart={() => onStart(bot.id)}
          onStop={() => onStop(bot.id)}
          onRestart={() => onRestart(bot.id)}
          onDelete={() => onDelete(bot.id)}
        />
      </div>
    </div>
  )
}
