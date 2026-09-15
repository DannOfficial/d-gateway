'use client'

import React from 'react'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/badge'

export interface LogDetailsProps {
  open: boolean
  onClose: () => void
  log?: {
    id: string
    username: string
    chatType: string
    type: string
    text: string
    createdAt: string
  }
}

export function LogDetails({ open, onClose, log }: LogDetailsProps) {
  if (!log) return null

  return (
    <Modal open={open} onClose={onClose} title="Webhook Log Details" maxWidth="md">
      <div className="space-y-3 text-xs">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <span className="font-bold text-primary">@{log.username}</span>
          <Badge variant={log.type === 'command' ? 'success' : 'default'}>{log.type}</Badge>
        </div>

        <div>
          <span className="text-muted-foreground block text-[10px] uppercase font-bold">Chat Scope</span>
          <p className="font-semibold">{log.chatType}</p>
        </div>

        <div>
          <span className="text-muted-foreground block text-[10px] uppercase font-bold">Payload Content</span>
          <pre className="p-3 rounded-lg border border-border bg-black/80 font-mono text-[11px] text-emerald-400 whitespace-pre-wrap">
            {log.text || '[Non-text update payload]'}
          </pre>
        </div>

        <div>
          <span className="text-muted-foreground block text-[10px] uppercase font-bold">Timestamp</span>
          <p className="font-mono">{new Date(log.createdAt).toLocaleString()}</p>
        </div>
      </div>
    </Modal>
  )
}
