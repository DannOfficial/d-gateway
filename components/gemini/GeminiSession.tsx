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
  onSaveKey,
  onValidateKey,
  userRole = 'free',
  logs = [],
}: GeminiSessionProps) {
  const [keyInput, setKeyInput] = useState(apiKey || '')
  const [validating, setValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash')

  const totalReqs = logs.length
  const successCount = logs.filter((l) => l.status === 'SUCCESS').length
  const errorCount = logs.filter((l) => l.status === 'ERROR').length
  const avgLatency =
    totalReqs > 0 ? Math.round(logs.reduce((a, b) => a + (b.latency || 0), 0) / totalReqs) : 0

  async function handleValidate() {
    if (!keyInput.trim()) return
    setValidating(true)
    setValidationResult(null)
    try {
      const res = await onValidateKey(keyInput)
      if (res.valid) {
        setValidationResult('✅ Key Valid! Connected to Google Gemini API.')
      } else {
        setValidationResult(`❌ Key Invalid: ${res.error || 'Validation failed'}`)
      }
    } finally {
      setValidating(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      await onSaveKey(keyInput)
      setValidationResult('✅ Gemini API Key saved successfully!')
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
          Google Gemini API Key (@google/genai)
          <input
            type="password"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder="AIzaSy..."
            className="mt-1 w-full p-2.5 rounded-lg border border-input bg-card font-mono text-xs"
          />
        </label>

        {validationResult && (
          <div className="p-2.5 rounded-lg border border-border bg-muted/40 font-semibold">
            {validationResult}
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            disabled={validating || !keyInput}
            onClick={handleValidate}
            className="ghost-button compact"
          >
            {validating ? <PuzzleSpinner size="sm" /> : 'Check API Key ⚡'}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="primary-button compact"
          >
            {saving ? <PuzzleSpinner size="sm" /> : 'Save Key →'}
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
