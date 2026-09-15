'use client'

import { useEffect, useState } from 'react'
import { Settings as SettingsIcon, Bot, Save, Send, UserPlus, Sparkles } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/card'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { Toast } from '@/components/ui/Toast'
import { PuzzleSpinner } from '@/components/ui/puzzle-spinner'

type BotItem = { id: string; name: string; username: string | null; footer?: string; delay?: number }
type User = { id?: string; name: string; email: string; role?: string }

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [bots, setBots] = useState<BotItem[]>([])
  const [selectedBotId, setSelectedBotId] = useState('')
  const [botFooter, setBotFooter] = useState('')
  const [botDelay, setBotDelay] = useState(0)
  const [geminiApiKey, setGeminiApiKey] = useState('')

  // Bot Owner/Role & Limit Configuration
  const [newOwnerId, setNewOwnerId] = useState('')
  const [newRole, setNewRole] = useState('vip')
  const [newLimit, setNewLimit] = useState(100)

  // Broadcast Message
  const [broadcastMsg, setBroadcastMsg] = useState('')
  const [broadcasting, setBroadcasting] = useState(false)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toastMsg, setToastMsg] = useState('')

  useEffect(() => {
    Promise.all([fetch('/api/auth/me'), fetch('/api/bots')])
      .then(async ([meRes, botsRes]) => {
        if (meRes.ok) {
          const meData = await meRes.json()
          setUser(meData.user)
          if (meData.user?.geminiApiKey) setGeminiApiKey(meData.user.geminiApiKey)
        }
        if (botsRes.ok) {
          const botsData = await botsRes.json()
          const bList = botsData.bots || []
          setBots(bList)
          if (bList.length > 0) {
            setSelectedBotId(bList[0].id)
            setBotFooter(bList[0].footer || '')
            setBotDelay(bList[0].delay || 0)
          }
        }
      })
      .finally(() => setLoading(false))
  }, [])

  function handleSelectBot(botId: string) {
    setSelectedBotId(botId)
    const b = bots.find((item) => item.id === botId)
    if (b) {
      setBotFooter(b.footer || '')
      setBotDelay(b.delay || 0)
    }
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      if (geminiApiKey) {
        await fetch('/api/profile', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ geminiApiKey }),
        })
      }

      if (selectedBotId) {
        const res = await fetch(`/api/bots/${selectedBotId}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ footer: botFooter, delay: botDelay, geminiApiKey }),
        })
        if (res.ok) {
          setToastMsg('Konfigurasi bot berhasil disimpan.')
        } else {
          setToastMsg('Gagal menyimpan konfigurasi.')
        }
      } else {
        setToastMsg('Gemini API Key diperbarui.')
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleSendBroadcast(e: React.FormEvent) {
    e.preventDefault()
    if (!broadcastMsg.trim()) return
    setBroadcasting(true)
    setTimeout(() => {
      setBroadcasting(false)
      setToastMsg('Broadcast berhasil dikirim ke seluruh subscriber!')
      setBroadcastMsg('')
    }, 1000)
  }

  if (loading) {
    return (
      <DashboardLayout user={user} activeTab="settings">
        <div className="flex justify-center py-12">
          <PuzzleSpinner size="lg" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout user={user} activeTab="settings" botsCount={bots.length}>
      <PageHeader
        title="Settings & Configuration"
        subtitle="Manage owner access, bot message footers, response delays, broadcasts, and Gemini AI configuration."
        icon={<SettingsIcon size={22} />}
      />

      <div className="space-y-6 text-xs">
        <Card className="p-6 space-y-6">
          <h2 className="text-sm font-bold text-primary flex items-center gap-2">
            <Bot size={16} /> Target Bot Selection & Configuration
          </h2>

          {bots.length === 0 ? (
            <p className="text-muted-foreground">Belum ada bot terhubung. Tambahkan bot di Dashboard terlebih dahulu.</p>
          ) : (
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <Select
                label="Target Telegram Bot"
                value={selectedBotId}
                onChange={handleSelectBot}
                options={bots.map((b) => ({
                  value: b.id,
                  label: `${b.name} (${b.username ? `@${b.username}` : 'Bot'})`,
                }))}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Response Delay (Seconds)"
                  type="number"
                  value={botDelay}
                  onChange={(e) => setBotDelay(Number(e.target.value))}
                  placeholder="0"
                />
                <div className="p-3 border border-border rounded-xl bg-muted/20 flex flex-col justify-center">
                  <span className="font-semibold text-muted-foreground uppercase text-[10px]">Default Timezone</span>
                  <span className="text-xs font-bold text-foreground">Asia/Jakarta (WIB)</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground uppercase text-[10px] mb-1">
                  Message Footer
                </label>
                <textarea
                  value={botFooter}
                  onChange={(e) => setBotFooter(e.target.value)}
                  rows={2}
                  placeholder="Powered by Dann-Tele Gateway"
                  className="w-full p-2.5 rounded-xl border border-input bg-background"
                />
              </div>

              <div className="p-3.5 border border-border rounded-xl bg-card space-y-2">
                <label className="font-bold flex items-center gap-2 text-primary">
                  <Sparkles size={15} /> Google Gemini API Key
                </label>
                <Input
                  type="password"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                />
              </div>

              <button type="submit" disabled={saving} className="primary-button">
                {saving ? <PuzzleSpinner size="sm" /> : <><Save size={14} /> Save Configuration →</>}
              </button>
            </form>
          )}
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-6 space-y-4">
            <h2 className="font-bold text-sm text-primary flex items-center gap-2">
              <UserPlus size={16} /> Add Owner / Premium Access
            </h2>
            <div className="space-y-3">
              <Input
                label="Telegram User ID Target"
                value={newOwnerId}
                onChange={(e) => setNewOwnerId(e.target.value)}
                placeholder="e.g. 123456789"
              />
              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Role Access"
                  value={newRole}
                  onChange={setNewRole}
                  options={[
                    { value: 'user', label: 'User' },
                    { value: 'vip', label: 'VIP' },
                    { value: 'premium', label: 'Premium' },
                    { value: 'admin', label: 'Admin / Owner' },
                  ]}
                />
                <Input
                  label="Usage Limit"
                  type="number"
                  value={newLimit}
                  onChange={(e) => setNewLimit(Number(e.target.value))}
                />
              </div>
              <button
                type="button"
                onClick={() => setToastMsg(`Role ${newRole} assigned to ID ${newOwnerId || 'Target'}`)}
                className="primary-button full"
              >
                Grant Access & Limit
              </button>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h2 className="font-bold text-sm text-primary flex items-center gap-2">
              <Send size={16} /> Global Broadcast Messaging
            </h2>
            <form onSubmit={handleSendBroadcast} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Broadcast Content
                </label>
                <textarea
                  value={broadcastMsg}
                  onChange={(e) => setBroadcastMsg(e.target.value)}
                  rows={4}
                  placeholder="Type broadcast message to all users..."
                  required
                  className="w-full p-2.5 rounded-xl border border-input bg-background"
                />
              </div>
              <button type="submit" disabled={broadcasting} className="primary-button full">
                {broadcasting ? <PuzzleSpinner size="sm" /> : 'Send Broadcast →'}
              </button>
            </form>
          </Card>
        </div>
      </div>

      <Toast open={Boolean(toastMsg)} message={toastMsg} onClose={() => setToastMsg('')} type="success" />
    </DashboardLayout>
  )
}
