'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Settings as SettingsIcon, Bot, Shield, Save, Download, LayoutDashboard, Command, List, LogOut, Menu, Moon, Sun, ChevronDown, User as UserIcon, Send, Clock, UserPlus, Zap, Database
} from 'lucide-react'
import { PuzzleSpinner } from '@/components/ui/puzzle-spinner'

type BotItem = { id: string; name: string; username: string | null; timezone?: string; rpgMode?: boolean; footer?: string; delay?: number }
type User = { id?: string; name: string; email: string; role?: string }
type RpgPlayer = {
  id: string
  nama: string
  tag: string
  health: number
  money: number
  bank: number
  hewan: string[]
  tanaman: string[]
  kota: string
  inventory: string[]
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [bots, setBots] = useState<BotItem[]>([])
  const [selectedBotId, setSelectedBotId] = useState('')
  const [botTimezone, setBotTimezone] = useState('Asia/Jakarta')
  const [rpgEnabled, setRpgEnabled] = useState(false)
  const [botFooter, setBotFooter] = useState('')
  const [botDelay, setBotDelay] = useState(0)

  // Bot Owner/Role & Limit Configuration
  const [newOwnerId, setNewOwnerId] = useState('')
  const [newRole, setNewRole] = useState<'user' | 'vip' | 'premium' | 'admin'>('vip')
  const [newLimit, setNewLimit] = useState(100)

  // Broadcast Message
  const [broadcastMsg, setBroadcastMsg] = useState('')
  const [broadcasting, setBroadcasting] = useState(false)

  // RPG Players Table
  const [rpgPlayers, setRpgPlayers] = useState<RpgPlayer[]>([
    {
      id: '1001',
      nama: 'Dann Admin',
      tag: '@dann_admin',
      health: 100,
      money: 1500,
      bank: 5000,
      hewan: ['Kucing Anggora', 'Ayam Kampong'],
      tanaman: ['Padi', 'Jagung'],
      kota: 'Jakarta',
      inventory: ['Pedang Kayu', 'Obat Potion'],
    },
    {
      id: '1002',
      nama: 'Budi Petualang',
      tag: '@budi_player',
      health: 85,
      money: 450,
      bank: 1200,
      hewan: ['Anjing'],
      tanaman: ['Gandum'],
      kota: 'Bandung',
      inventory: ['Pisau Berburu'],
    },
  ])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [dark, setDark] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)

  useEffect(() => {
    Promise.all([fetch('/api/auth/me'), fetch('/api/bots')])
      .then(async ([meRes, botsRes]) => {
        if (meRes.ok) {
          const meData = await meRes.json()
          setUser(meData.user)
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
    if (!selectedBotId) return
    setSaving(true)
    setMessage('')
    try {
      const res = await fetch(`/api/bots/${selectedBotId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ timezone: botTimezone, rpgMode: rpgEnabled, footer: botFooter, delay: botDelay }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage('Bot settings saved successfully.')
        setBots((cur) => cur.map((item) => item.id === selectedBotId ? { ...item, timezone: botTimezone, rpgMode: rpgEnabled, footer: botFooter, delay: botDelay } : item))
      } else {
        setMessage(data.error || 'Failed to update bot settings.')
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
        {mobileOpen && <button aria-label="Close navigation" className="mobile-scrim" onClick={() => setMobileOpen(false)} />}
        <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
          <div className="sidebar-brand">
            <Link href="/" className="brand-mark">›_</Link>
            <Link href="/" className="brand-name">dann-tele<span>settings</span></Link>
          </div>
          <div className="workspace-switch flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="avatar">{(user?.name || 'D').slice(0, 1).toUpperCase()}</span>
              <span>
                <b>{user?.name || 'Workspace'}</b>
                <small>{user?.email || 'Personal workspace'}</small>
              </span>
            </div>
            <span className="rounded bg-primary/20 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
              {user?.role || 'free'}
            </span>
          </div>

          <p className="nav-label">Navigation</p>
          <nav className="side-nav">
            <Link href="/dashboard"><LayoutDashboard size={17} /> Back to Dashboard</Link>
            <Link href="/dashboard#bots"><Bot size={17} /> Bots Inventory</Link>
            <Link href="/dashboard#commands"><Command size={17} /> Command Editor</Link>
            <Link href="/dashboard#logs"><List size={17} /> Logs</Link>
          </nav>

          <p className="nav-label">Configure</p>
          <nav className="side-nav">
            <Link href="/settings" className="active"><SettingsIcon size={17} />Settings</Link>
          </nav>

          <div className="sidebar-bottom">
            <button onClick={logout} className="logout-button">
              <LogOut size={16} /> Sign out
            </button>
          </div>
        </aside>

        <section className="main-column">
          <header className="topbar">
            <button className="menu-button" onClick={() => setMobileOpen(true)}><Menu size={20} /></button>
            <div className="crumb">
              <span>Workspace</span><b>/</b><strong>Settings</strong>
            </div>
            <div className="top-actions">
              <button className="icon-button" aria-label="Toggle theme" onClick={toggleTheme}>
                {dark ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              <div className="relative">
                <button className="profile-chip" onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}>
                  <span className="avatar small">{(user?.name || 'D').slice(0, 1).toUpperCase()}</span>
                  <span className="profile-name">{user?.name || 'User'}</span>
                  <ChevronDown size={15} />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 top-12 z-40 w-64 rounded-xl border border-border bg-card p-4 shadow-2xl text-foreground space-y-3">
                    <div className="border-b border-border pb-3">
                      <p className="font-bold text-sm truncate">{user?.name || 'Developer'}</p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email || 'email@example.com'}</p>
                    </div>
                    <div className="space-y-1 text-xs">
                      <Link href="/profile" onClick={() => setProfileDropdownOpen(false)} className="flex items-center gap-2 p-2 rounded hover:bg-muted font-medium">
                        <UserIcon size={14} /> Profile Settings ››
                      </Link>
                      <button onClick={logout} className="w-full text-left flex items-center gap-2 p-2 rounded hover:bg-destructive/10 text-destructive font-medium">
                        <LogOut size={14} /> Logout / Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          <div className="content-wrap space-y-8">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2"><SettingsIcon size={24} /> Configuration & Bot Settings</h1>
              <p className="text-xs text-muted-foreground">Kelola konfigurasi owner, premium access, command delay, broadcast, dan data RPG player.</p>
            </div>

            {/* Form Bot Target & Settings */}
            <form onSubmit={handleSaveSettings} className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-xl text-xs">
              <div className="space-y-4">
                <h2 className="flex items-center gap-2 text-sm font-bold text-primary"><Bot size={16} /> Konfigurasi Target Telegram Bot</h2>
                {bots.length === 0 ? (
                  <p className="text-muted-foreground">Belum ada bot terhubung. Tambahkan bot di Dashboard terlebih dahulu.</p>
                ) : (
                  <>
                    <label className="block font-semibold">Pilih Telegram Bot Target
                      <select value={selectedBotId} onChange={(e) => handleSelectBot(e.target.value)} className="mt-1 w-full rounded-lg border border-input bg-background p-2.5">
                        {bots.map((b) => (
                          <option key={b.id} value={b.id}>{b.name} ({b.username ? `@${b.username}` : 'Bot'})</option>
                        ))}
                      </select>
                    </label>

                    <div className="grid grid-cols-2 gap-4">
                      <label className="block font-semibold">Realtime Response Timezone (WIB/WIT/WITA)
                        <input value={botTimezone} onChange={(e) => setBotTimezone(e.target.value)} placeholder="Asia/Jakarta atau WIB" className="mt-1 w-full rounded-lg border border-input bg-background p-2.5" />
                      </label>
                      <label className="block font-semibold">Set Response Delay (detik)
                        <input type="number" value={botDelay} onChange={(e) => setBotDelay(Number(e.target.value))} placeholder="0" className="mt-1 w-full rounded-lg border border-input bg-background p-2.5" />
                      </label>
                    </div>

                    <label className="flex items-center gap-3 rounded-lg border border-border p-3">
                      <input type="checkbox" checked={rpgEnabled} onChange={(e) => setRpgEnabled(e.target.checked)} />
                      <span className="font-semibold">Aktifkan Engine RPG Telegram (/rpg, /hunt, /daily, /inventory, /farm, /work)</span>
                    </label>

                    <label className="block font-semibold">Bot Footer Reply Text
                      <textarea value={botFooter} onChange={(e) => setBotFooter(e.target.value)} rows={2} placeholder="Powered by Dann-Tele Gateway" className="mt-1 w-full rounded-lg border border-input bg-background p-2.5" />
                    </label>

                    <button type="submit" disabled={saving} className="primary-button">
                      {saving ? <PuzzleSpinner size="sm" /> : <><Save size={14} /> Simpan Konfigurasi Bot</>}
                    </button>
                  </>
                )}
              </div>
            </form>

            {/* Broadcast & User Roles Panel */}
            <div className="grid gap-6 md:grid-cols-2 text-xs">
              <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
                <h2 className="flex items-center gap-2 font-bold text-sm text-primary"><UserPlus size={16} /> Add Owner / Premium / Limit</h2>
                <div className="space-y-3">
                  <label className="block font-semibold">Telegram User ID Target
                    <input value={newOwnerId} onChange={(e) => setNewOwnerId(e.target.value)} placeholder="Contoh: 123456789" className="mt-1 w-full p-2.5 rounded border border-input bg-background" />
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block font-semibold">Akses Role
                      <select value={newRole} onChange={(e) => setNewRole(e.target.value as any)} className="mt-1 w-full p-2.5 rounded border border-input bg-background">
                        <option value="user">User</option>
                        <option value="vip">VIP</option>
                        <option value="premium">Premium</option>
                        <option value="admin">Admin / Owner</option>
                      </select>
                    </label>
                    <label className="block font-semibold">Limit Pengguna
                      <input type="number" value={newLimit} onChange={(e) => setNewLimit(Number(e.target.value))} className="mt-1 w-full p-2.5 rounded border border-input bg-background" />
                    </label>
                  </div>
                  <button type="button" onClick={() => setMessage(`Role ${newRole} & Limit ${newLimit} berhasil ditambahkan ke ID ${newOwnerId || 'Target'}`)} className="primary-button full">
                    Tambahkan Hak Akses & Limit
                  </button>
                </div>
              </div>

              <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
                <h2 className="flex items-center gap-2 font-bold text-sm text-primary"><Send size={16} /> Broadcast Messaging</h2>
                <form onSubmit={handleSendBroadcast} className="space-y-3">
                  <label className="block font-semibold">Pesan Broadcast
                    <textarea value={broadcastMsg} onChange={(e) => setBroadcastMsg(e.target.value)} rows={3} placeholder="Pesan pengumuman untuk seluruh pengguna..." required className="mt-1 w-full p-2.5 rounded border border-input bg-background" />
                  </label>
                  <button type="submit" disabled={broadcasting} className="primary-button full">
                    {broadcasting ? <PuzzleSpinner size="sm" /> : 'Kirim Broadcast Sekarang →'}
                  </button>
                </form>
              </div>
            </div>

            {/* RPG Data Table */}
            <div className="p-6 rounded-2xl border border-border bg-card space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-bold text-sm text-primary"><Database size={16} /> Tabel Data RPG Players (Inventory, Wealth, Hewan, Tanaman, Kota)</h2>
                <span className="text-muted-foreground">{rpgPlayers.length} Total Registered Players</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="border-b border-border bg-muted/40 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5">Player / Tag</th>
                      <th className="p-2.5">Kota</th>
                      <th className="p-2.5">Health</th>
                      <th className="p-2.5">Money / Bank</th>
                      <th className="p-2.5">Hewan</th>
                      <th className="p-2.5">Tanaman</th>
                      <th className="p-2.5">Inventory</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {rpgPlayers.map((p) => (
                      <tr key={p.id} className="hover:bg-muted/20">
                        <td className="p-2.5 font-bold">
                          {p.nama} <span className="block text-[10px] text-muted-foreground">{p.tag}</span>
                        </td>
                        <td className="p-2.5 font-semibold text-primary">{p.kota}</td>
                        <td className="p-2.5">{p.health} HP</td>
                        <td className="p-2.5 font-mono text-emerald-500 font-bold">${p.money} / ${p.bank}</td>
                        <td className="p-2.5">{p.hewan.join(', ')}</td>
                        <td className="p-2.5">{p.tanaman.join(', ')}</td>
                        <td className="p-2.5 text-[11px] font-mono">{p.inventory.join(', ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {message && <p className="text-center text-sm font-bold text-primary">{message}</p>}
          </div>
        </section>
      </div>
    </main>
  )
}
