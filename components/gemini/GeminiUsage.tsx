'use client'

import React from 'react'

export interface GeminiUsageProps {
  totalRequests: number
  successCount: number
  errorCount: number
  avgLatencyMs: number
}

export function GeminiUsage({
  totalRequests,
  successCount,
  errorCount,
  avgLatencyMs,
}: GeminiUsageProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
      <div className="p-3.5 rounded-xl border border-border bg-card">
        <span className="text-[10px] text-muted-foreground uppercase font-bold block">Total Requests</span>
        <p className="text-xl font-bold text-primary">{totalRequests}</p>
      </div>
      <div className="p-3.5 rounded-xl border border-border bg-card">
        <span className="text-[10px] text-muted-foreground uppercase font-bold block">Successful</span>
        <p className="text-xl font-bold text-emerald-400">{successCount}</p>
      </div>
      <div className="p-3.5 rounded-xl border border-border bg-card">
        <span className="text-[10px] text-muted-foreground uppercase font-bold block">Errors</span>
        <p className="text-xl font-bold text-destructive">{errorCount}</p>
      </div>
      <div className="p-3.5 rounded-xl border border-border bg-card">
        <span className="text-[10px] text-muted-foreground uppercase font-bold block">Avg Latency</span>
        <p className="text-xl font-bold text-foreground">{avgLatencyMs}ms</p>
      </div>
    </div>
  )
}
