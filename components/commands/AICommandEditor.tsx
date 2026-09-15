'use client'

import React from 'react'
import { Sparkles } from 'lucide-react'

export interface AICommandEditorProps {
  enabled: boolean
  onChangeEnabled: (val: boolean) => void
  model?: string
  onChangeModel?: (val: string) => void
  context?: string
  onChangeContext?: (val: string) => void
}

export function AICommandEditor({
  enabled,
  onChangeEnabled,
  model = 'gemini-2.5-flash',
  onChangeModel,
  context = '',
  onChangeContext,
}: AICommandEditorProps) {
  return (
    <div className="p-3.5 border border-border rounded-xl bg-card space-y-3 text-xs">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 font-bold text-primary">
          <Sparkles size={16} />
          <span>Gemini AI Command Mode</span>
        </label>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onChangeEnabled(e.target.checked)}
          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
        />
      </div>

      {enabled && (
        <div className="space-y-3 pt-2 border-t border-border/60">
          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
              Selected Model
            </label>
            <select
              value={model}
              onChange={(e) => onChangeModel && onChangeModel(e.target.value)}
              className="w-full p-2 rounded-lg border border-input bg-background font-mono"
            >
              <option value="gemini-2.5-flash">gemini-2.5-flash (Fast & Recommended)</option>
              <option value="gemini-2.0-flash">gemini-2.0-flash (VIP/PRO Tier)</option>
              <option value="gemini-2.5-pro">gemini-2.5-pro (Premium Tier)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
              System Prompt / Context
            </label>
            <textarea
              value={context}
              onChange={(e) => onChangeContext && onChangeContext(e.target.value)}
              rows={3}
              placeholder="System prompt context for Gemini AI..."
              className="w-full p-2.5 rounded-lg border border-input bg-background text-xs"
            />
          </div>
        </div>
      )}
    </div>
  )
}
