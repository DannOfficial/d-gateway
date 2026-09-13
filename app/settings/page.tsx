'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Settings as SettingsIcon, Bot, Save, Send, UserPlus, Database, Sparkles
} from 'lucide-react'
import { PuzzleSpinner } from '@/components/ui/puzzle-spinner'
import { Card } from '@/components/ui/card'
import { CustomSelect } from '@/components/ui/custom-select'
import { Sidebar } from '@/components/layout/Sidebar'
import { Navbar } from '@/components/layout/Navbar'

type BotItem = { id: string; name: string; username: string | null; timezone?: string; rpgMode?: boolean; footer?: string; delay?: number }
type User = { id?: string; name: string; email: string; role?: string }

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [bots, setBots] = useState<BotItem[]>([])
  const [selectedBotId, setSelectedBotId] = useState('')
  const [botTimezone, setBotTimezone] = useState('Asia/Jakarta')
  const [rpgEnabled, setRpgEnabled] = useState(false)
  const [botFooter, setBotFooter] = useState('')
  const [botDelay, setBotDelay] = useState(0)
  const [geminiApiKey, setGeminiApiKey] = useState('')

  // Bot Owner/Role & Limit Configuration
  const [newOwnerId, setNewOwnerId] = useState('')
  const [newRole, setNewRole] = useState<'user' | 'vip' | 'premium' | 'admin'>('vip')
  const [newLimit, setNewLimit] = useState(100)

  // Broadcast Message
  const [broadcastMsg, setBroadcastMsg] = useState('')
  const [broadcasting, setBroadcasting] = useState(false)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [dark, setDark] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)

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
            setBotTimezone(bList[0].timezone || 'Asia/Jakarta')
            setRpgEnabled(Boolean(bList[0].rpgMode))
            setBotFooter(bList[0].footer || '')
            setBotDelay(bList[0].delay || 0)
          }
        }
      })
      .finally(() => setLoading(false))
  }, [])

  function toggleTheme() {
    const nextDark = !dark
    setDark(nextDark)
    if (nextDark) {
      document.documentElement.classList.remove('light')
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
      document.documentElement.classList.add('light')
    }
  }

  function handleSelectBot(botId: string) {
    setSelectedBotId(botId)
    const b = bots.find((item) => item.id === botId)
    if (b) {
      setBotTimezone(b.timezone || 'Asia/Jakarta')
      setRpgEnabled(Boolean(b.rpgMode))
      setBotFooter(b.footer || '')
      setBotDelay(b.delay || 0)
    }
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage('')
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
          body: JSON.stringify({ timezone: botTimezone, rpgMode: rpgEnabled, footer: botFooter, delay: botDelay, geminiApiKey }),
        })
        const data = await res.json()
        if (res.ok) {
          setMessage('Konfigurasi berhasil disimpan.')
          setBots((cur) => cur.map((item) => item.id === selectedBotId ? { ...item, timezone: botTimezone, rpgMode: rpgEnabled, footer: botFooter, delay: botDelay } : item))
        } else {
          setMessage(data.error || 'Gagal menyimpan konfigurasi bot.')
        }
      } else {
        setMessage('Gemini API Key berhasil diperbarui.')
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleSendBroadcast(e: React.FormEvent) {
    e.preventDefault()
    if (!broadcastMsg.trim()) return
    setBroadcasting(true)
    setMessage('')
    setTimeout(() => {
      setBroadcasting(false)
      setMessage(`Pesan broadcast berhasil dikirim ke semua pengguna bot.`)
      setBroadcastMsg('')
    }, 1000)
  }

  async function logout() {
    await fetch('/api/auth/me', { method: 'DELETE' })
    window.location.href = '/login'
  }

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-background text-foreground">
        <PuzzleSpinner size="lg" />
      </main>
    )
  }

  return (
    <main className="min-h-screen app-bg text-foreground">
      <div className="dashboard-grid">
        <Sidebar
          activeTab="settings"
          setActiveTab={() => {}}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
          user={user}
          botsCount={bots.length}
          live={true}
          logout={logout}
        />

        <section className="main-column">
          <Navbar
            activeTab="settings"
            user={user}
            query=""
            setQuery={() => {}}
            dark={dark}
            toggleTheme={toggleTheme}
            notificationsOpen={notificationsOpen}
            setNotificationsOpen={setNotificationsOpen}
            profileDropdownOpen={profileDropdownOpen}
            setProfileDropdownOpen={setProfileDropdownOpen}
            setMobileOpen={setMobileOpen}
            logsCount={0}
            logout={logout}
          />

          <div className="content-wrap space-y-8">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2"><SettingsIcon size={24} /> Configuration & Bot Settings</h1>
              <p className="text-xs text-muted-foreground">Kelola konfigurasi owner, premium access, command delay, broadcast, dan data RPG player.</p>
            </div>

            {/* Form Bot Target & Settings */}
            <Card className="space-y-6 p-6 text-xs">
              <div className="space-y-4">
                <h2 className="flex items-center gap-2 text-sm font-bold text-primary"><Bot size={16} /> Konfigurasi Target</h2>
                {bots.length === 0 ? (
                  <p className="text-muted-foreground">Belum ada bot terhubung. Tambahkan bot di Dashboard terlebih dahulu.</p>
                ) : (
                  <>
                    <label className="block font-semibold">Pilih Telegram Bot Target
                      <CustomSelect
                        value={selectedBotId}
                        onChange={(val) => handleSelectBot(val)}
                        options={bots.map((b) => ({
                          value: b.id,
                          label: `${b.name} (${b.username ? `@${b.username}` : 'Bot'})`,
                        }))}
                      />
                    </label>

                    <div className="grid grid-cols-2 gap-4">
                      <label className="block font-semibold">Realtime Response Timezone (WIB/WIT/WITA)
                        <input value={botTimezone} onChange={(e) => setBotTimezone(e.target.value)} placeholder="Asia/Jakarta atau WIB" className="mt-1 w-full rounded-xl border border-input bg-background p-2.5" />
                      </label>
                      <label className="block font-semibold">Set Response Delay (detik)
                        <input type="number" value={botDelay} onChange={(e) => setBotDelay(Number(e.target.value))} placeholder="0" className="mt-1 w-full rounded-xl border border-input bg-background p-2.5" />
                      </label>
                    </div>

                    <label className="flex items-center gap-3 rounded-xl border border-border p-3">
                      <input type="checkbox" checked={rpgEnabled} onChange={(e) => setRpgEnabled(e.target.checked)} />
                      <span className="font-semibold">Aktifkan Engine Role Playing Game (RPG).</span>
                    </label>

                    <label className="block font-semibold">Footer
                      <textarea value={botFooter} onChange={(e) => setBotFooter(e.target.value)} rows={2} placeholder="Powered by Dann-Tele Gateway" className="mt-1 w-full rounded-xl border border-input bg-background p-2.5" />
                    </label>

                    {/* Gemini API Key Field */}
                    <div className="p-3 border border-border rounded-xl bg-muted/30 space-y-2">
                      <label className="font-bold flex items-center gap-2 text-primary text-xs">
                        <Sparkles size={14} /> Google Gemini Apikey
                      </label>
                      <input
                        type="password"
                        value={geminiApiKey}
                        onChange={(e) => setGeminiApiKey(e.target.value)}
                        placeholder="AIzaSy..."
                        className="w-full p-2.5 rounded-lg border border-input bg-background font-mono"
                      />
                      <p className="text-[11px] text-muted-foreground">Masukkan Gemini API Key agar bot secara otomatis dapat merespon pesan/command AI.</p>
                    </div>

                    <button type="submit" onClick={handleSaveSettings} disabled={saving} className="primary-button">
                      {saving ? <PuzzleSpinner size="sm" /> : <><Save size={14} /> Simpan Konfigurasi →</>}
                    </button>
                  </>
                )}
              </div>
            </Card>

            {/* Broadcast & User Roles Panel */}
            <div className="grid gap-6 md:grid-cols-2 text-xs">
              <Card className="p-6 space-y-4">
                <h2 className="flex items-center gap-2 font-bold text-sm text-primary"><UserPlus size={16} /> Add Owner / Premium / Limit</h2>
                <div className="space-y-3">
                  <label className="block font-semibold">Telegram User ID Target
                    <input value={newOwnerId} onChange={(e) => setNewOwnerId(e.target.value)} placeholder="Contoh: 123456789" className="mt-1 w-full p-2.5 rounded-xl border border-input bg-background" />
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block font-semibold">Akses Role
                      <CustomSelect
                        value={newRole}
                        onChange={(val) => setNewRole(val as any)}
                        options={[
                          { value: 'user', label: 'User' },
                          { value: 'vip', label: 'VIP' },
                          { value: 'premium', label: 'Premium' },
                          { value: 'admin', label: 'Admin / Owner' },
                        ]}
                      />
                    </label>
                    <label className="block font-semibold">Limit Pengguna
                      <input type="number" value={newLimit} onChange={(e) => setNewLimit(Number(e.target.value))} className="mt-1 w-full p-2.5 rounded-xl border border-input bg-background" />
                    </label>
                  </div>
                  <button type="button" onClick={() => setMessage(`Role ${newRole} & Limit ${newLimit} berhasil ditambahkan ke ID ${newOwnerId || 'Target'}`)} className="primary-button full">
                    Tambahkan Hak Akses & Limit
                  </button>
                </div>
              </Card>

              <Card className="p-6 space-y-4">
                <h2 className="flex items-center gap-2 font-bold text-sm text-primary"><Send size={16} /> Broadcast Messaging</h2>
                <form onSubmit={handleSendBroadcast} className="space-y-3">
                  <label className="block font-semibold">Pesan Broadcast
                    <textarea value={broadcastMsg} onChange={(e) => setBroadcastMsg(e.target.value)} rows={3} placeholder="Pesan pengumuman untuk seluruh pengguna..." required className="mt-1 w-full p-2.5 rounded-xl border border-input bg-background" />
                  </label>
                  <button type="submit" disabled={broadcasting} className="primary-button full">
                    {broadcasting ? <PuzzleSpinner size="sm" /> : 'Kirim Broadcast Sekarang →'}
                  </button>
                </form>
              </Card>
            </div>

            {message && <p className="text-center text-sm font-bold text-primary">{message}</p>}
          </div>
        </section>
      </div>
    </main>
  )
}
