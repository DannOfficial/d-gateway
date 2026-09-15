import React, { useState } from 'react'
import { Sparkles, Terminal, Shield, Globe, Cpu, Play, CheckCircle, Save, Layers, ArrowRight, ArrowLeft } from 'lucide-react'
import { ResponseTypeSelector } from './ResponseTypeSelector'
import { RoleAccessSelector } from './RoleAccessSelector'
import { AICommandEditor } from './AICommandEditor'
import { ApiTester } from './ApiTester'
import { ResponsePreview } from './ResponsePreview'
import { CustomSelect } from '@/components/ui/custom-select'
import { PuzzleSpinner } from '@/components/ui/puzzle-spinner'

export interface CommandWizardData {
  id?: string
  command: string
  aliases: string[]
  description: string
  category: string
  parameters: Array<{ name: string; required: boolean; description: string }>
  response: string
  decorations: string[]
  mode: 'all' | 'group' | 'private'
  limit: number
  cooldown: number
  responseType: 'text' | 'image' | 'hydrated_button' | 'callback_button'
  imageUrl?: string
  buttons: Array<{ label: string; type: 'url' | 'callback'; value: string }>
  allowedRole: 'user' | 'admin' | 'superadmin' | 'owner'
  aiSessionMode: boolean
  aiModel?: string
  aiContext?: string
  apiEndpoint?: string
  apiMethod?: 'GET' | 'POST'
  apiHeaders?: Array<{ key: string; value: string }>
}

export interface CommandWizardProps {
  initialData?: Partial<CommandWizardData>
  onSave: (data: CommandWizardData) => Promise<void>
  saving?: boolean
}

const WIZARD_STEPS = [
  { id: 1, name: 'Basic', icon: Layers, desc: 'Name & Category' },
  { id: 2, name: 'Trigger', icon: Terminal, desc: 'Command & Aliases' },
  { id: 3, name: 'Parameters', icon: Play, desc: 'Input Parameters' },
  { id: 4, name: 'Response', icon: Sparkles, desc: 'Type & Formatting' },
  { id: 5, name: 'Permissions', icon: Shield, desc: 'Roles & Limits' },
  { id: 6, name: 'API Integration', icon: Globe, desc: 'External Endpoints' },
  { id: 7, name: 'Gemini AI', icon: Cpu, desc: 'AI Session Mode' },
  { id: 8, name: 'Testing', icon: Play, desc: 'Live Execution Test' },
  { id: 9, name: 'Review', icon: CheckCircle, desc: 'Configuration Summary' },
  { id: 10, name: 'Save & Sync', icon: Save, desc: 'Persist & Telegram Sync' },
]

export function CommandWizard({ initialData, onSave, saving = false }: CommandWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)

  const [commandName, setCommandName] = useState(initialData?.command || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [category, setCategory] = useState(initialData?.category || 'General')
  const [aliases, setAliases] = useState<string[]>(initialData?.aliases || [])
  const [newAlias, setNewAlias] = useState('')
  const [paramsList, setParamsList] = useState<Array<{ name: string; required: boolean; description: string }>>(
    initialData?.parameters || [{ name: 'query', required: false, description: 'Search keywords' }]
  )
  const [cmdResponse, setCmdResponse] = useState(initialData?.response || '')
  const [decorations, setDecorations] = useState<string[]>(initialData?.decorations || ['✨', '🔥'])
  const [newDecor, setNewDecor] = useState('')
  const [mode, setMode] = useState<'all' | 'group' | 'private'>(initialData?.mode || 'all')
  const [limit, setLimit] = useState(initialData?.limit ?? -1)
  const [cooldown, setCooldown] = useState(initialData?.cooldown ?? 0)
  const [responseType, setResponseType] = useState<'text' | 'image' | 'hydrated_button' | 'callback_button'>(
    initialData?.responseType || 'text'
  )
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || '')
  const [buttons, setButtons] = useState<Array<{ label: string; type: 'url' | 'callback'; value: string }>>(
    initialData?.buttons || []
  )
  const [allowedRole, setAllowedRole] = useState<'user' | 'admin' | 'superadmin' | 'owner'>(
    initialData?.allowedRole || 'user'
  )
  const [aiSessionMode, setAiSessionMode] = useState(Boolean(initialData?.aiSessionMode))
  const [aiModel, setAiModel] = useState(initialData?.aiModel || 'gemini-2.5-flash')
  const [aiContext, setAiContext] = useState(initialData?.aiContext || 'You are a helpful Telegram AI assistant.')
  const [apiEndpoint, setApiEndpoint] = useState(initialData?.apiEndpoint || '')
  const [apiMethod, setApiMethod] = useState<'GET' | 'POST'>(initialData?.apiMethod || 'GET')
  const [apiHeaders, setApiHeaders] = useState<Array<{ key: string; value: string }>>(initialData?.apiHeaders || [])

  async function handleFinalSave() {
    await onSave({
      id: initialData?.id,
      command: commandName.startsWith('/') ? commandName : `/${commandName}`,
      aliases,
      description,
      category,
      parameters: paramsList,
      response: cmdResponse,
      decorations,
      mode,
      limit: Number(limit),
      cooldown: Number(cooldown),
      responseType,
      imageUrl,
      buttons,
      allowedRole,
      aiSessionMode,
      aiModel,
      aiContext,
      apiEndpoint,
      apiMethod,
      apiHeaders,
    })
  }

  return (
    <div className="space-y-6 text-xs">
      <div className="overflow-x-auto pb-2 border-b border-border">
        <div className="flex items-center gap-2 min-w-max">
          {WIZARD_STEPS.map((s) => {
            const Icon = s.icon
            const isActive = currentStep === s.id
            const isCompleted = currentStep > s.id
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setCurrentStep(s.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : isCompleted
                    ? 'bg-primary/10 text-primary hover:bg-primary/20'
                    : 'bg-muted/40 text-muted-foreground hover:bg-muted'
                }`}
              >
                <span className="flex size-5 items-center justify-center rounded-full bg-background/20 text-[10px] font-bold">
                  {s.id}
                </span>
                <Icon size={14} />
                <span>{s.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h3 className="font-bold text-sm text-primary flex items-center gap-2">
              Step {currentStep}: {WIZARD_STEPS[currentStep - 1].name}
            </h3>
            <p className="text-[11px] text-muted-foreground">{WIZARD_STEPS[currentStep - 1].desc}</p>
          </div>
          <span className="text-xs font-mono font-bold text-muted-foreground">
            {currentStep} / {WIZARD_STEPS.length}
          </span>
        </div>

        {currentStep === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block font-semibold mb-1 uppercase text-[10px] text-muted-foreground">
                Command Title / Display Name
              </label>
              <input
                value={commandName}
                onChange={(e) => setCommandName(e.target.value)}
                placeholder="Pinterest Search"
                className="w-full p-2.5 rounded-xl border border-input bg-background font-semibold"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 uppercase text-[10px] text-muted-foreground">Description</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Search images from Pinterest API"
                className="w-full p-2.5 rounded-xl border border-input bg-background"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 uppercase text-[10px] text-muted-foreground">Category</label>
              <CustomSelect
                value={category}
                onChange={setCategory}
                options={[
                  { value: 'General', label: 'General / Utility' },
                  { value: 'Media', label: 'Media & Downloader' },
                  { value: 'Search', label: 'Search & Tools' },
                  { value: 'Fun', label: 'Fun & Entertainment' },
                  { value: 'Admin', label: 'Admin & Management' },
                ]}
              />
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block font-semibold mb-1 uppercase text-[10px] text-muted-foreground">
                Primary Trigger Keyword
              </label>
              <input
                value={commandName}
                onChange={(e) => setCommandName(e.target.value)}
                placeholder="/pinterest"
                className="w-full p-2.5 rounded-xl border border-input bg-background font-mono font-bold text-primary"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 uppercase text-[10px] text-muted-foreground">Aliases</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {aliases.map((al, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted border font-mono">
                    /{al}
                    <button type="button" onClick={() => setAliases(aliases.filter((_, i) => i !== idx))} className="text-destructive font-bold">
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={newAlias}
                  onChange={(e) => setNewAlias(e.target.value)}
                  placeholder="e.g. pin"
                  className="flex-1 p-2 rounded-xl border border-input bg-background font-mono"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newAlias.trim()) {
                      setAliases([...aliases, newAlias.trim().replace(/^\//, '')])
                      setNewAlias('')
                    }
                  }}
                  className="px-3 py-2 rounded-xl bg-secondary font-semibold"
                >
                  + Add Alias
                </button>
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between font-bold">
              <span>Dynamic Parameters Mapping</span>
              <button
                type="button"
                onClick={() => setParamsList([...paramsList, { name: 'param', required: false, description: '' }])}
                className="text-primary hover:underline text-xs"
              >
                + Add Parameter
              </button>
            </div>
            {paramsList.map((p, idx) => (
              <div key={idx} className="flex gap-2 items-center p-2.5 border border-border rounded-xl bg-muted/20">
                <input
                  value={p.name}
                  onChange={(e) => {
                    const c = [...paramsList]
                    c[idx].name = e.target.value
                    setParamsList(c)
                  }}
                  placeholder="param_name"
                  className="p-2 rounded-lg border bg-background font-mono flex-1"
                />
                <input
                  value={p.description}
                  onChange={(e) => {
                    const c = [...paramsList]
                    c[idx].description = e.target.value
                    setParamsList(c)
                  }}
                  placeholder="Description"
                  className="p-2 rounded-lg border bg-background flex-1"
                />
                <label className="flex items-center gap-1 font-semibold text-[11px]">
                  <input
                    type="checkbox"
                    checked={p.required}
                    onChange={(e) => {
                      const c = [...paramsList]
                      c[idx].required = e.target.checked
                      setParamsList(c)
                    }}
                  />
                  Required
                </label>
                <button type="button" onClick={() => setParamsList(paramsList.filter((_, i) => i !== idx))} className="text-destructive font-bold text-base px-2">
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-4">
            <ResponseTypeSelector value={responseType} onChange={setResponseType} />
            {responseType === 'image' && (
              <label className="block font-semibold">
                Media URL (Image / GIF / MP4)
                <input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://cdn.example.com/media.jpg"
                  className="w-full mt-1 p-2 rounded-xl border border-input bg-background"
                />
              </label>
            )}
            <div>
              <label className="block font-semibold mb-1">Response Template (HTML Enabled)</label>
              <textarea
                value={cmdResponse}
                onChange={(e) => setCmdResponse(e.target.value)}
                rows={4}
                placeholder="Hasil untuk @query: {result}"
                className="w-full p-2.5 rounded-xl border border-input bg-background font-mono text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Response Prefix Emoji / Decorations</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {decorations.map((d, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-muted border">
                    {d}
                    <button type="button" onClick={() => setDecorations(decorations.filter((_, i) => i !== idx))} className="text-destructive font-bold">
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={newDecor}
                  onChange={(e) => setNewDecor(e.target.value)}
                  placeholder="Add emoji (e.g. ✨)"
                  className="flex-1 p-2 rounded-xl border bg-background"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newDecor.trim()) {
                      setDecorations([...decorations, newDecor.trim()])
                      setNewDecor('')
                    }
                  }}
                  className="px-3 py-2 rounded-xl bg-secondary font-semibold"
                >
                  + Add
                </button>
              </div>
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-4">
            <RoleAccessSelector value={allowedRole} onChange={setAllowedRole} />
            <div>
              <label className="block font-semibold mb-1">Scope Mode</label>
              <CustomSelect
                value={mode}
                onChange={(val) => setMode(val as any)}
                options={[
                  { value: 'all', label: 'Group & Private Chat (All Scopes)' },
                  { value: 'group', label: 'Group Chat Only' },
                  { value: 'private', label: 'Private DM Only' },
                ]}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <label className="block font-semibold">
                Usage Limit (-1 = unlimited)
                <input
                  type="number"
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  className="w-full mt-1 p-2 rounded-xl border border-input bg-background"
                />
              </label>
              <label className="block font-semibold">
                Cooldown (Seconds)
                <input
                  type="number"
                  value={cooldown}
                  onChange={(e) => setCooldown(Number(e.target.value))}
                  className="w-full mt-1 p-2 rounded-xl border border-input bg-background"
                />
              </label>
            </div>
          </div>
        )}

        {currentStep === 6 && (
          <div className="space-y-4">
            <div>
              <label className="block font-semibold mb-1">External API Endpoint URL</label>
              <div className="flex gap-2">
                <select
                  value={apiMethod}
                  onChange={(e) => setApiMethod(e.target.value as any)}
                  className="p-2.5 rounded-xl border bg-background font-bold"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                </select>
                <input
                  value={apiEndpoint}
                  onChange={(e) => setApiEndpoint(e.target.value)}
                  placeholder="https://api.example.com/pinterest?q={query}"
                  className="flex-1 p-2.5 rounded-xl border border-input bg-background font-mono"
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between font-bold">
                <span>Custom HTTP Headers</span>
                <button
                  type="button"
                  onClick={() => setApiHeaders([...apiHeaders, { key: 'Authorization', value: 'Bearer token' }])}
                  className="text-primary hover:underline text-xs"
                >
                  + Add Header
                </button>
              </div>
              {apiHeaders.map((h, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    value={h.key}
                    onChange={(e) => {
                      const c = [...apiHeaders]
                      c[idx].key = e.target.value
                      setApiHeaders(c)
                    }}
                    placeholder="Header Key"
                    className="p-2 rounded-lg border bg-background flex-1 font-mono"
                  />
                  <input
                    value={h.value}
                    onChange={(e) => {
                      const c = [...apiHeaders]
                      c[idx].value = e.target.value
                      setApiHeaders(c)
                    }}
                    placeholder="Header Value"
                    className="p-2 rounded-lg border bg-background flex-1 font-mono"
                  />
                  <button type="button" onClick={() => setApiHeaders(apiHeaders.filter((_, i) => i !== idx))} className="text-destructive font-bold text-base px-2">
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentStep === 7 && (
          <div className="space-y-4">
            <AICommandEditor enabled={aiSessionMode} onChangeEnabled={setAiSessionMode} />
            {aiSessionMode && (
              <div className="space-y-3 p-3 border border-border rounded-xl bg-muted/20">
                <div>
                  <label className="block font-semibold mb-1">Target AI Model</label>
                  <select
                    value={aiModel}
                    onChange={(e) => setAiModel(e.target.value)}
                    className="w-full p-2.5 rounded-xl border bg-background font-mono"
                  >
                    <option value="gemini-2.5-flash">gemini-2.5-flash (Fast & Lightweight)</option>
                    <option value="gemini-2.5-pro">gemini-2.5-pro (Advanced Reasoning)</option>
                    <option value="gemini-1.5-pro">gemini-1.5-pro (Legacy Long Context)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">AI Prompt Context</label>
                  <textarea
                    value={aiContext}
                    onChange={(e) => setAiContext(e.target.value)}
                    rows={3}
                    className="w-full p-2.5 rounded-xl border bg-background text-xs"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {currentStep === 8 && (
          <div className="space-y-4">
            <h4 className="font-bold text-xs uppercase text-muted-foreground">Interactive Live Command Tester</h4>
            <ApiTester command={commandName || '/pinterest'} apiEndpoint={apiEndpoint} />
            <ResponsePreview
              responseType={responseType}
              response={cmdResponse}
              imageUrl={imageUrl}
              buttons={buttons}
              decorations={decorations}
            />
          </div>
        )}

        {currentStep === 9 && (
          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-sm text-primary">Configuration Review Summary</h4>
            <div className="grid grid-cols-2 gap-3 p-3 border border-border rounded-xl bg-muted/20 font-mono">
              <div><span className="text-muted-foreground">Command:</span> <b>{commandName}</b></div>
              <div><span className="text-muted-foreground">Category:</span> {category}</div>
              <div><span className="text-muted-foreground">Aliases:</span> {aliases.join(', ') || 'None'}</div>
              <div><span className="text-muted-foreground">Scope:</span> {mode}</div>
              <div><span className="text-muted-foreground">Role:</span> {allowedRole}</div>
              <div><span className="text-muted-foreground">Response Type:</span> {responseType}</div>
              <div><span className="text-muted-foreground">API Endpoint:</span> {apiEndpoint || 'None'}</div>
              <div><span className="text-muted-foreground">Gemini AI Mode:</span> {aiSessionMode ? 'Enabled' : 'Disabled'}</div>
            </div>
          </div>
        )}

        {currentStep === 10 && (
          <div className="space-y-4 text-center py-4">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/20 text-primary">
              <Save size={24} />
            </div>
            <h4 className="font-bold text-base">Ready to Save & Sync Command</h4>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              This action will persist command settings to MongoDB database and sync command registration with Telegram bot runtime.
            </p>
            <button type="button" onClick={handleFinalSave} disabled={saving} className="primary-button full py-3 font-bold text-sm">
              {saving ? <PuzzleSpinner size="sm" /> : <><CheckCircle size={16} /> Save & Register Command →</>}
            </button>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-border pt-4">
          <button
            type="button"
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 font-semibold text-xs disabled:opacity-40"
          >
            <ArrowLeft size={14} /> Back
          </button>

          {currentStep < 10 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => Math.min(10, prev + 1))}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 font-semibold text-xs text-primary-foreground hover:bg-primary/90"
            >
              Next Step <ArrowRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinalSave}
              disabled={saving}
              className="primary-button"
            >
              {saving ? <PuzzleSpinner size="sm" /> : 'Save Command'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
