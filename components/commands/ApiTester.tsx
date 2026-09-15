'use client'

import React, { useState } from 'react'
import { PuzzleSpinner } from '@/components/ui/puzzle-spinner'
import { Play } from 'lucide-react'

export interface ApiTesterProps {
  command: string
  apiEndpoint?: string
  onTestComplete?: (result: any) => void
}

export function ApiTester({ command, apiEndpoint, onTestComplete }: ApiTesterProps) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  async function handleTest() {
    if (!query.trim() && !apiEndpoint) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ command: command || '/pinterest', query, endpoint: apiEndpoint }),
      })
      const data = await res.json()
      setResult(data)
      if (onTestComplete) onTestComplete(data)
    } catch (err: any) {
      const errRes = { error: err.message || 'Scrape request failed' }
      setResult(errRes)
      if (onTestComplete) onTestComplete(errRes)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-3.5 border border-border rounded-xl bg-muted/20 space-y-3 text-xs">
      <div className="flex items-center justify-between font-bold">
        <span>API / Scrape Endpoint Tester</span>
        <span className="text-[10px] text-muted-foreground">SSRF Protected</span>
      </div>
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Query param (contoh: kucing, anime)"
          className="flex-1 p-2 rounded-lg border border-input bg-background"
        />
        <button
          type="button"
          onClick={handleTest}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition"
        >
          {loading ? <PuzzleSpinner size="sm" /> : <><Play size={13} fill="currentColor" /> Test API</>}
        </button>
      </div>
      {result && (
        <pre className="p-3 rounded-lg bg-black/80 text-emerald-400 font-mono text-[10px] max-h-40 overflow-auto border border-border/50">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  )
}
