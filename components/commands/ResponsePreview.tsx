'use client'

import React from 'react'

interface TelegramMessage {
  from?: { username?: string; first_name?: string }
}

interface TelegramBot {
  name?: string
  timezone?: string
}

interface ResponsePreviewProps {
  responseType: string
  response: string
  imageUrl?: string
  buttons?: Array<{ label: string; type: 'url' | 'callback'; value: string }>
  decorations?: string[]
  bot?: TelegramBot
}

export function ResponsePreview({
  responseType,
  response,
  imageUrl,
  buttons = [],
  decorations = [],
  bot = { name: 'Dann-Tele Bot' },
}: ResponsePreviewProps) {
  const decors = decorations.length > 0 ? decorations.join(' ') + ' ' : ''
  const formattedText = decors + (response || 'Your bot response preview will appear here...')

  return (
    <div className="rounded-xl border border-border bg-black/60 p-4 font-sans text-xs shadow-inner">
      <div className="flex items-center gap-2 border-b border-border/50 pb-2 mb-3 text-[11px] text-muted-foreground font-semibold">
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>Telegram Live Response Preview</span>
      </div>

      <div className="max-w-sm rounded-2xl bg-[#1e232a] border border-white/10 p-3 text-white space-y-2 shadow-lg">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-6 w-6 rounded-full bg-primary/30 flex items-center justify-center text-[10px] font-bold text-primary">
            🤖
          </div>
          <span className="text-xs font-bold text-primary">{bot.name || 'Bot'}</span>
          <span className="text-[10px] text-gray-400 ml-auto">Just now</span>
        </div>

        {responseType === 'image' && imageUrl && (
          <div className="rounded-lg overflow-hidden border border-white/10 max-h-48 bg-black/40">
            <img
              src={imageUrl}
              alt="Media Preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                ;(e.target as HTMLElement).style.display = 'none'
              }}
            />
          </div>
        )}

        <p className="whitespace-pre-wrap break-words text-xs leading-relaxed text-gray-100">
          {formattedText}
        </p>

        {buttons.length > 0 && (
          <div className="grid gap-1.5 pt-2 border-t border-white/10">
            {buttons.map((btn, idx) => (
              <div
                key={idx}
                className="w-full py-1.5 px-3 rounded-lg bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary font-medium text-center text-xs transition cursor-pointer truncate"
              >
                {btn.label || 'Button'} {btn.type === 'url' ? '🔗' : '⚡'}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
