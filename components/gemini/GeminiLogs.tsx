'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'

export interface GeminiLogEntry {
  id: string
  telegramUser: string
  model: string
  latency: number
  status: 'SUCCESS' | 'ERROR'
  createdAt: string
  error?: string
}

export interface GeminiLogsProps {
  logs: GeminiLogEntry[]
}

export function GeminiLogs({ logs }: GeminiLogsProps) {
  return (
    <div className="space-y-2 text-xs">
      <h3 className="font-bold text-sm text-foreground">Realtime Gemini Request Stream</h3>
      {logs.length === 0 ? (
        <div className="p-6 text-center text-muted-foreground border border-border rounded-xl">
          No Gemini AI requests logged yet.
        </div>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between p-3 rounded-xl border border-border bg-card/80 font-mono text-[11px]"
            >
              <div className="space-y-0.5">
                <span className="font-bold text-primary">@{log.telegramUser}</span>
                <p className="text-muted-foreground">Model: {log.model} · {log.latency}ms</p>
                {log.error && <p className="text-destructive font-semibold">{log.error}</p>}
              </div>
              <div className="text-right space-y-1">
                <Badge variant={log.status === 'SUCCESS' ? 'success' : 'destructive'}>
                  {log.status}
                </Badge>
                <time className="block text-[10px] text-muted-foreground">
                  {new Date(log.createdAt).toLocaleTimeString()}
                </time>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
