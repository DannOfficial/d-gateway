'use client'

import React from 'react'
import { Play, Square, RefreshCw, Trash2 } from 'lucide-react'

export interface BotActionsProps {
  status: string
  onStart: () => void
  onStop: () => void
  onRestart: () => void
  onDelete: () => void
  disabled?: boolean
}

export function BotActions({
  status,
  onStart,
  onStop,
  onRestart,
  onDelete,
  disabled = false,
}: BotActionsProps) {
  const isRunning = ['running', 'connected', 'active'].includes((status || '').toLowerCase())

  return (
    <div className="flex items-center gap-1.5">
      {isRunning ? (
        <button
          type="button"
          disabled={disabled}
          onClick={onStop}
          className="ghost-button compact text-amber-400 hover:bg-amber-500/10"
        >
          <Square size={13} className="mr-1" /> Stop
        </button>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={onStart}
          className="ghost-button compact text-emerald-400 hover:bg-emerald-500/10"
        >
          <Play size={13} className="mr-1" /> Start Bot
        </button>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={onRestart}
        className="ghost-button compact"
      >
        <RefreshCw size={13} className="mr-1" /> Restart
      </button>

      <button
        type="button"
        disabled={disabled}
        onClick={onDelete}
        className="delete-button"
        aria-label="Delete bot"
      >
        <Trash2 size={15} />
      </button>
    </div>
  )
}
