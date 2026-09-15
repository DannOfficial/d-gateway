'use client'

import React from 'react'
import { Sparkles, CheckCircle2, AlertCircle } from 'lucide-react'

export interface GeminiStatusProps {
  hasKey: boolean
  maskedKey?: string
  statusMessage?: string
}

export function GeminiStatus({ hasKey, maskedKey, statusMessage }: GeminiStatusProps) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl ${hasKey ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
          <Sparkles size={20} />
        </div>
        <div>
          <b className="text-sm font-bold block">Google Gemini API Runtime</b>
          <p className="text-xs text-muted-foreground">
            {hasKey ? `Key Connected (${maskedKey || '••••••••'})` : 'No API key configured'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {hasKey ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 size={13} /> Active
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-500 border border-amber-500/20">
            <AlertCircle size={13} /> Key Required
          </span>
        )}
      </div>
    </div>
  )
}
