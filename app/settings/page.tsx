'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Settings as SettingsIcon, Bot, Globe, Shield, Save, Download } from 'lucide-react'
import { PuzzleSpinner } from '@/components/ui/puzzle-spinner'

type BotItem = { id: string; name: string; username: string | null; timezone?: string; rpgMode?: boolean; footer?: string }

export default function SettingsPage() {
  const [fullname, setFullname] = useState('')
  const [ownerId, setOwnerId] = useState('')
  const [bots, setBots] = useState<BotItem[]>([])
  const [selectedBotId, setSelectedBotId] = useState('')
  const [botTimezone, setBotTimezone] = useState('Asia/Jakarta')
  const [rpgEnabled, setRpgEnabled] = useState(false)
  const [botFooter, setBotFooter] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    Promise.all([fetch('/api/auth/me'), fetch('/api/bots')])
      .then(async ([meRes, botsRes]) => {
        if (meRes.ok) {
          const meData = await meRes.json()
          setFullname(meData.user?.name || '')
          setOwnerId(meData.user?.id || '')
        }
        if (botsRes.ok) {
          const botsData = await botsRes.json()
          const bList = botsData.bots || []
          setBots(bList)
          if (bList.length > 0) {
            setSelectedBotId(bList[0].id)
            setBotTimezone(bList[0].timezone || 'Asia/Jakarta')
            setRpgEnabled(Boolean(bList[0].rpgMode))
            setBotFooter(bList[0].footer || '')
          }
        }
      })
      .finally(() => setLoading(false))
  }, [])

  function handleSelectBot(botId: string) {
    setSelectedBotId(botId)
    const b = bots.find((item) => item.id === botId)
    if (b) {
      setBotTimezone(b.timezone || 'Asia/Jakarta')
      setRpgEnabled(Boolean(b.rpgMode))
      setBotFooter(b.footer || '')
    }
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedBotId) return
    setSaving(true)
    setMessage('')
    try {
      const res = await fetch(`/api/bots/${selectedBotId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ timezone: botTimezone, rpgMode: rpgEnabled, footer: botFooter }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage('Bot settings saved successfully.')
        setBots((cur) => cur.map((item) => item.id === selectedBotId ? { ...item, timezone: botTimezone, rpgMode: rpgEnabled, footer: botFooter } : item))
      } else {
        setMessage(data.error || 'Failed to update bot settings.')
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-background text-foreground">
        <PuzzleSpinner size="lg" />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background p-6 text-foreground md:p-12">
      <div className="mx-auto max-w-2xl">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <h1 className="mt-4 text-3xl font-bold flex items-center gap-2"><SettingsIcon size={28} /> Global Bot & Workspace Settings</h1>
        <p className="text-sm text-muted-foreground">Configure bot owner credentials, RPG mode responses, timezone realtimes, and footers.</p>

        <form onSubmit={handleSaveSettings} className="mt-8 space-y-6 rounded-2xl border border-border bg-card p-6 shadow-xl">
          <div className="space-y-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold"><Shield size={18} /> Owner & Workspace Info</h2>
            <label className="block text-sm">Workspace Account Owner Name
              <input value={fullname} disabled className="mt-1.5 w-full rounded-lg border border-input bg-muted p-2.5 text-sm" />
            </label>
            <label className="block text-sm">Owner User ID
              <input value={ownerId} disabled className="mt-1.5 w-full rounded-lg border border-input bg-muted p-2.5 text-sm font-mono text-xs" />
            </label>
          </div>

          <div className="space-y-4 border-t border-border pt-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold"><Bot size={18} /> Select Telegram Bot Configuration</h2>
            {bots.length === 0 ? (
              <p className="text-sm text-muted-foreground">No bots connected. Please add a bot from the Dashboard first.</p>
            ) : (
              <>
                <label className="block text-sm font-semibold">Bot Target
                  <select value={selectedBotId} onChange={(e) => handleSelectBot(e.target.value)} className="mt-1.5 w-full rounded-lg border border-input bg-background p-2.5 text-sm">
                    {bots.map((b) => (
                      <option key={b.id} value={b.id}>{b.name} ({b.username ? `@${b.username}` : 'Bot'})</option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm">Realtime Response Timezone
                  <input value={botTimezone} onChange={(e) => setBotTimezone(e.target.value)} placeholder="e.g. Asia/Jakarta, UTC, America/New_York" className="mt-1.5 w-full rounded-lg border border-input bg-background p-2.5 text-sm" />
                </label>

                <label className="flex items-center gap-3 rounded-lg border border-border p-3 text-sm">
                  <input type="checkbox" checked={rpgEnabled} onChange={(e) => setRpgEnabled(e.target.checked)} />
                  <span>Enable Built-in RPG Engine (/rpg, /hunt, /daily, /heal, /inventory)</span>
                </label>

                <label className="block text-sm">Bot Footer Text (Appended to responses)
                  <textarea value={botFooter} onChange={(e) => setBotFooter(e.target.value)} rows={3} placeholder="Powered by dann-tele gateway" className="mt-1.5 w-full rounded-lg border border-input bg-background p-2.5 text-sm" />
                </label>
              </>
            )}
          </div>

          <div className="border-t border-border pt-6 flex items-center justify-between">
            <a href="/api/db/export" download className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted">
              <Download size={16} /> Download DB Export
            </a>
            <button type="submit" disabled={saving || !selectedBotId} className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {saving ? <PuzzleSpinner size="sm" /> : <><Save size={16} /> Save Settings</>}
            </button>
          </div>
          {message && <p className="text-center text-sm text-primary font-medium">{message}</p>}
        </form>
      </div>
    </main>
  )
}
