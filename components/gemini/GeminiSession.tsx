'use client'

import React, { useState } from 'react'
import { GeminiStatus } from './GeminiStatus'
import { GeminiModelSelector } from './GeminiModelSelector'
import { GeminiUsage } from './GeminiUsage'
import { GeminiLogs, GeminiLogEntry } from './GeminiLogs'
import { PuzzleSpinner } from '@/components/ui/puzzle-spinner'
import { Card } from '@/components/ui/card'

export interface GeminiSessionProps {
  apiKey: string
  onSaveKey: (key: string) => Promise<void>
  onValidateKey: (key: string) => Promise<{ valid: boolean; error?: string }>
  userRole?: string
  logs?: GeminiLogEntry[]
}

export function GeminiSession({
  apiKey,
  onValidateKey,
  userRole = 'free',
  logs = [],
}: GeminiSessionProps) {
  const [keyInput, setKeyInput] = useState(apiKey || '')
  const [saving, setSaving] = useState(false)
  const [validationResult, setValidationResult] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash')

  const totalReqs = logs.length
  const successCount = logs.filter((l) => l.status === 'SUCCESS').length
  const errorCount = logs.filter((l) => l.status === 'ERROR').length
  const avgLatency =
    totalReqs > 0 ? Math.round(logs.reduce((a, b) => a + (b.latency || 0), 0) / totalReqs) : 0

  async function handleSaveAndVerify() {
    if (!keyInput.trim()) {
      setValidationResult('⚠️ Please enter a valid Gemini API Key.')
      return
    }
    setSaving(true)
    setValidationResult(null)
    try {
      const res = await onValidateKey(keyInput.trim())
      if (res.valid) {
        setValidationResult('✅ Gemini API Key verified with @google/genai and saved successfully!')
      } else {
        setValidationResult(`❌ ${res.error || 'Invalid Gemini API Key.'}`)
      }
    } catch {
      setValidationResult('❌ Error connecting to Gemini validation service.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="panel p-6 space-y-6">
      <GeminiStatus
        hasKey={Boolean(apiKey)}
        maskedKey={apiKey ? apiKey.slice(0, 6) + '...' + apiKey.slice(-4) : undefined}
      />

      <div className="p-4 rounded-xl border border-border bg-background space-y-3 text-xs">
        <label className="block font-bold text-primary">
          Google Gemini API Key (@google/genai SDK)
          <input
            type="password"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder="AIzaSy..."
            className="mt-1 w-full p-2.5 rounded-lg border border-input bg-card font-mono text-xs"
          />
        </label>

        {validationResult && (
          <div
            className={`p-2.5 rounded-lg border font-semibold ${
              validationResult.startsWith('✅')
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                : 'border-destructive/30 bg-destructive/10 text-destructive'
            }`}
          >
            {validationResult}
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            disabled={saving || !keyInput.trim()}
            onClick={handleSaveAndVerify}
            className="primary-button compact"
          >
            {saving ? <PuzzleSpinner size="sm" /> : 'Save & Verify Gemini Key →'}
          </button>
        </div>
      </div>

      <GeminiModelSelector value={selectedModel} onChange={setSelectedModel} userRole={userRole} />

      <GeminiUsage
        totalRequests={totalReqs}
        successCount={successCount}
        errorCount={errorCount}
        avgLatencyMs={avgLatency}
      />

      <GeminiLogs logs={logs} />
    </Card>
  )
}
