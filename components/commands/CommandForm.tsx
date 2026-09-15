'use client'

import React, { useState } from 'react'
import { ResponseTypeSelector } from './ResponseTypeSelector'
import { RoleAccessSelector } from './RoleAccessSelector'
import { AICommandEditor } from './AICommandEditor'
import { ApiTester } from './ApiTester'
import { ResponsePreview } from './ResponsePreview'
import { CustomSelect } from '@/components/ui/custom-select'
import { PuzzleSpinner } from '@/components/ui/puzzle-spinner'

export interface CommandFormData {
  id?: string
  command: string
  response: string
  decorations: string[]
  mode: 'all' | 'group' | 'private'
  limit: number
  responseType: 'text' | 'image' | 'hydrated_button' | 'callback_button'
  imageUrl?: string
  buttons: Array<{ label: string; type: 'url' | 'callback'; value: string }>
  allowedRole: 'user' | 'admin' | 'superadmin' | 'owner'
  aiSessionMode: boolean
  apiEndpoint?: string
}

export interface CommandFormProps {
  initialData?: Partial<CommandFormData>
  onSave: (data: CommandFormData) => Promise<void>
  saving?: boolean
}

export function CommandForm({ initialData, onSave, saving = false }: CommandFormProps) {
  const [activeTab, setActiveTab] = useState<'basic' | 'execution' | 'permissions' | 'response' | 'ai' | 'testing'>('basic')
  const [cmdString, setCmdString] = useState(initialData?.command || '')
  const [cmdResponse, setCmdResponse] = useState(initialData?.response || '')
  const [cmdDecorations, setCmdDecorations] = useState<string[]>(initialData?.decorations || ['✨', '🔥'])
  const [newDecorInput, setNewDecorInput] = useState('')
  const [cmdMode, setCmdMode] = useState<'all' | 'group' | 'private'>(initialData?.mode || 'all')
  const [cmdLimit, setCmdLimit] = useState(initialData?.limit ?? -1)
  const [cmdResponseType, setCmdResponseType] = useState<'text' | 'image' | 'hydrated_button' | 'callback_button'>(initialData?.responseType || 'text')
  const [cmdImageUrl, setCmdImageUrl] = useState(initialData?.imageUrl || '')
  const [cmdButtons, setCmdButtons] = useState<Array<{ label: string; type: 'url' | 'callback'; value: string }>>(initialData?.buttons || [])
  const [cmdRole, setCmdRole] = useState<'user' | 'admin' | 'superadmin' | 'owner'>(initialData?.allowedRole || 'user')
  const [cmdAiMode, setCmdAiMode] = useState(Boolean(initialData?.aiSessionMode))
  const [apiEndpoint, setApiEndpoint] = useState(initialData?.apiEndpoint || '')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await onSave({
      id: initialData?.id,
      command: cmdString,
      response: cmdResponse,
      decorations: cmdDecorations,
      mode: cmdMode,
      limit: Number(cmdLimit),
      responseType: cmdResponseType,
      imageUrl: cmdImageUrl,
      buttons: cmdButtons,
      allowedRole: cmdRole,
      aiSessionMode: cmdAiMode,
      apiEndpoint,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
      <div className="flex border-b border-border text-xs gap-1 overflow-x-auto">
        {(['basic', 'execution', 'permissions', 'response', 'ai', 'testing'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-2 font-semibold border-b-2 capitalize transition ${
              activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'ai' ? 'AI & API' : tab}
          </button>
        ))}
      </div>

      {activeTab === 'basic' && (
        <div className="space-y-4">
          <label className="block font-semibold">
            Trigger Command
            <input
              value={cmdString}
              onChange={(e) => setCmdString(e.target.value)}
              placeholder="/pinterest atau /start"
              required
              className="w-full mt-1 p-2.5 rounded-xl border border-input bg-background"
            />
          </label>

          <div>
            <label className="block font-semibold mb-1">Awalan Dekorasi Respon Bot</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {cmdDecorations.map((dec, idx) => (
                <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-muted border border-border">
                  {dec}
                  <button
                    type="button"
                    onClick={() => setCmdDecorations(cmdDecorations.filter((_, i) => i !== idx))}
                    className="text-destructive font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={newDecorInput}
                onChange={(e) => setNewDecorInput(e.target.value)}
                placeholder="Tambah emoji (e.g. 🌟)"
                className="flex-1 p-2 rounded-xl border border-input bg-background"
              />
              <button
                type="button"
                onClick={() => {
                  if (newDecorInput.trim()) {
                    setCmdDecorations([...cmdDecorations, newDecorInput.trim()])
                    setNewDecorInput('')
                  }
                }}
                className="px-3 py-2 rounded-xl bg-secondary text-secondary-foreground font-semibold"
              >
                + Dekor
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'execution' && (
        <div className="space-y-4">
          <label className="block font-semibold">
            Scope Mode
            <CustomSelect
              value={cmdMode}
              onChange={(val) => setCmdMode(val as any)}
              options={[
                { value: 'all', label: 'Grup & Private (All Scope)' },
                { value: 'group', label: 'Hanya Mode Grup' },
                { value: 'private', label: 'Hanya Mode Private (DM)' },
              ]}
            />
          </label>
        </div>
      )}

      {activeTab === 'permissions' && (
        <div className="space-y-4">
          <RoleAccessSelector value={cmdRole} onChange={setCmdRole} />
          <label className="block font-semibold">
            Limit Pengguna (-1 = unlimited)
            <input
              type="number"
              value={cmdLimit}
              onChange={(e) => setCmdLimit(Number(e.target.value))}
              className="w-full mt-1 p-2.5 rounded-xl border border-input bg-background"
            />
          </label>
        </div>
      )}

      {activeTab === 'response' && (
        <div className="space-y-4">
          <ResponseTypeSelector value={cmdResponseType} onChange={setCmdResponseType} />

          {cmdResponseType === 'image' && (
            <label className="block font-semibold">
              Media URL (image, MP4, GIF, WebM)
              <input
                value={cmdImageUrl}
                onChange={(e) => setCmdImageUrl(e.target.value)}
                placeholder="https://cdn.example.com/media.gif"
                className="w-full mt-1 p-2 rounded-xl border border-input bg-background"
              />
            </label>
          )}

          <label className="block font-semibold">
            Teks Balasan / Response Format (HTML Supported)
            <textarea
              value={cmdResponse}
              onChange={(e) => setCmdResponse(e.target.value)}
              rows={3}
              placeholder="Gunakan @username @fullname @id @time @date @timezone @botname..."
              className="w-full mt-1 p-2.5 rounded-xl border border-input bg-background"
            />
          </label>

          {(cmdResponseType === 'hydrated_button' || cmdResponseType === 'callback_button') && (
            <div className="p-3 border border-border rounded-xl bg-muted/20 space-y-2">
              <div className="flex items-center justify-between font-bold">
                <span>Inline Buttons Setup</span>
                <button
                  type="button"
                  onClick={() => setCmdButtons([...cmdButtons, { label: 'Tombol', type: 'url', value: 'https://dannteam.biz.id' }])}
                  className="text-primary hover:underline text-[11px]"
                >
                  + Tambah Tombol
                </button>
              </div>
              {cmdButtons.map((btn, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    value={btn.label}
                    onChange={(e) => {
                      const copy = [...cmdButtons]
                      copy[idx].label = e.target.value
                      setCmdButtons(copy)
                    }}
                    placeholder="Label"
                    className="p-1.5 rounded-lg border bg-background flex-1"
                  />
                  <select
                    value={btn.type}
                    onChange={(e) => {
                      const copy = [...cmdButtons]
                      copy[idx].type = e.target.value as any
                      setCmdButtons(copy)
                    }}
                    className="p-1.5 rounded-lg border bg-background"
                  >
                    <option value="url">URL Link</option>
                    <option value="callback">Callback</option>
                  </select>
                  <input
                    value={btn.value}
                    onChange={(e) => {
                      const copy = [...cmdButtons]
                      copy[idx].value = e.target.value
                      setCmdButtons(copy)
                    }}
                    placeholder="URL / Data"
                    className="p-1.5 rounded-lg border bg-background flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => setCmdButtons(cmdButtons.filter((_, i) => i !== idx))}
                    className="text-destructive font-bold text-sm"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'ai' && (
        <div className="space-y-4">
          <AICommandEditor enabled={cmdAiMode} onChangeEnabled={setCmdAiMode} />
          <div className="space-y-1">
            <label className="block font-semibold">API Scrape Endpoint (Optional)</label>
            <input
              value={apiEndpoint}
              onChange={(e) => setApiEndpoint(e.target.value)}
              placeholder="https://api.example.com/endpoint?q={{query}}"
              className="w-full p-2.5 rounded-xl border border-input bg-background"
            />
          </div>
          <ApiTester command={cmdString} apiEndpoint={apiEndpoint} />
        </div>
      )}

      {activeTab === 'testing' && (
        <ResponsePreview
          responseType={cmdResponseType}
          response={cmdResponse}
          imageUrl={cmdImageUrl}
          buttons={cmdButtons}
          decorations={cmdDecorations}
        />
      )}

      <button className="primary-button full mt-4" type="submit" disabled={saving}>
        {saving ? <PuzzleSpinner size="sm" /> : 'Simpan Command →'}
      </button>
    </form>
  )
}
