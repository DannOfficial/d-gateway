'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { io } from 'socket.io-client'
import {
  Activity, Bell, Bot, ChevronDown, CircleHelp, Command, Edit, LayoutDashboard, List, LogOut, Menu, Moon, Plus, Radio, Search, Settings, ShieldCheck, Sun, TerminalSquare, Trash2, X, Zap, BarChart2, Shield
} from 'lucide-react'
import { PuzzleSpinner } from '@/components/ui/puzzle-spinner'

type BotItem = { id: string; name: string; username: string | null; status: string; commands: number; messages?: number; createdAt?: string }
type User = { name: string; email: string; role?: string; plan?: string; surveySource?: string | null }
type LogItem = { id: string; username: string; text: string; type: string; chatType: string; createdAt: string }
type CommandItem = {
  id: string
  command: string
  response: string
  mode: 'all' | 'group' | 'private'
  limit: number
  usageCount: number
  responseType: 'text' | 'image' | 'hydrated_button' | 'callback_button'
  imageUrl?: string
  buttons?: Array<{ label: string; type: 'url' | 'callback'; value: string }>
  allowedRole?: 'user' | 'admin' | 'superadmin' | 'owner'
}
type ChartPoint = { date: string; label: string; count: number }

const nav = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Bots', icon: Bot },
  { label: 'Commands', icon: Command },
  { label: 'Logs', icon: List },
]

export default function DashboardShell() {
  const [user, setUser] = useState<User | null>(null)
  const [bots, setBots] = useState<BotItem[]>([])
  const [logs, setLogs] = useState<LogItem[]>([])
  const [commandsList, setCommandsList] = useState<CommandItem[]>([])
  const [chartData, setChartData] = useState<ChartPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Bot Connection Modal
  const [modal, setModal] = useState(false)
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [token, setToken] = useState('')
  const [error, setError] = useState('')

  // Command Editor Modal
  const [cmdModal, setCmdModal] = useState(false)
  const [savingCmd, setSavingCmd] = useState(false)
  const [cmdId, setCmdId] = useState('')
  const [cmdString, setCmdString] = useState('')
  const [cmdResponse, setCmdResponse] = useState('')
  const [cmdMode, setCmdMode] = useState<'all' | 'group' | 'private'>('all')
  const [cmdLimit, setCmdLimit] = useState(-1)
  const [cmdResponseType, setCmdResponseType] = useState<'text' | 'image' | 'hydrated_button' | 'callback_button'>('text')
  const [cmdImageUrl, setCmdImageUrl] = useState('')
  const [cmdButtons, setCmdButtons] = useState<Array<{ label: string; type: 'url' | 'callback'; value: string }>>([])
  const [cmdRole, setCmdRole] = useState<'user' | 'admin' | 'superadmin' | 'owner'>('user')

  const [query, setQuery] = useState('')
  const [dark, setDark] = useState(true)
  const [live, setLive] = useState(false)

  async function load(silent = false) {
    if (!silent) setLoading(true); else setRefreshing(true)
    try {
      const [meRes, botsRes, logsRes, cmdsRes, statsRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/bots'),
        fetch('/api/logs'),
        fetch('/api/commands'),
        fetch('/api/stats'),
      ])

      if (meRes.ok) {
        const userData = await meRes.json()
        setUser(userData.user)
      }
      if (botsRes.ok) {
        const botsData = await botsRes.json()
        setBots(botsData.bots || [])
      }
      if (logsRes.ok) {
        const logsData = await logsRes.json()
        setLogs(logsData.logs || [])
      }
      if (cmdsRes.ok) {
        const cmdsData = await cmdsRes.json()
        setCommandsList(cmdsData.commands || [])
      }
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        if (statsData.stats?.chartData) {
          setChartData(statsData.stats.chartData)
        }
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    load()
    const timer = window.setInterval(() => load(true), 15000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const saved = window.localStorage.getItem('dann-tele-theme')
    const isDark = saved ? saved === 'dark' : true
    setDark(isDark)
    if (isDark) {
      document.documentElement.classList.remove('light')
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
      document.documentElement.classList.add('light')
    }

    const socketUrl = 'https://dannteam.biz.id'
    const socket = io(socketUrl, { transports: ['websocket', 'polling'] })
    socket.on('connect', () => setLive(true))
    socket.on('disconnect', () => setLive(false))
    socket.on('bots:updated', () => load(true))
    socket.on('logs:new', () => load(true))
    return () => socket.close()
  }, [])

  function toggleTheme() {
    const nextDark = !dark
    setDark(nextDark)
    if (nextDark) {
      document.documentElement.classList.remove('light')
      document.documentElement.classList.add('dark')
      window.localStorage.setItem('dann-tele-theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      document.documentElement.classList.add('light')
      window.localStorage.setItem('dann-tele-theme', 'light')
    }
  }

  async function addBot(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setAdding(true)

    try {
      const response = await fetch('/api/bots', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, token }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Unable to add bot')
        setAdding(false)
        return
      }

      setBots((current) => [data.bot, ...current])
      setName('')
      setToken('')
      setModal(false)

      const validation = await fetch('/api/bots/validate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ botId: data.bot.id }),
      })
      if (validation.ok) {
        const verified = await validation.json()
        if (verified.bot) {
          setBots((current) => current.map((bot) => (bot.id === data.bot.id ? verified.bot : bot)))
        }
      }
    } catch {
      setError('An error occurred while adding the bot.')
    } finally {
      setAdding(false)
    }
  }

  async function removeBot(id: string) {
    const previous = bots
    setBots((current) => current.filter((bot) => bot.id !== id))
    const response = await fetch(`/api/bots/${id}`, { method: 'DELETE' })
    if (!response.ok) setBots(previous)
  }

  async function handleSaveCommand(e: React.FormEvent) {
    e.preventDefault()
    setSavingCmd(true)
    try {
      const res = await fetch('/api/commands', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id: cmdId || undefined,
          command: cmdString,
          response: cmdResponse,
          mode: cmdMode,
          limit: Number(cmdLimit),
          responseType: cmdResponseType,
          imageUrl: cmdImageUrl,
          buttons: cmdButtons,
          allowedRole: cmdRole,
        }),
      })
      if (res.ok) {
        setCmdModal(false)
        resetCmdForm()
        load(true)
      }
    } finally {
      setSavingCmd(false)
    }
  }

  async function handleDeleteCommand(id: string) {
    setCommandsList((cur) => cur.filter((c) => c.id !== id))
    await fetch(`/api/commands/${id}`, { method: 'DELETE' })
  }

  function resetCmdForm() {
    setCmdId('')
    setCmdString('')
    setCmdResponse('')
    setCmdMode('all')
    setCmdLimit(-1)
    setCmdResponseType('text')
    setCmdImageUrl('')
    setCmdButtons([])
    setCmdRole('user')
  }

  function editCommand(cmd: CommandItem) {
    setCmdId(cmd.id)
    setCmdString(cmd.command)
    setCmdResponse(cmd.response)
    setCmdMode(cmd.mode)
    setCmdLimit(cmd.limit)
    setCmdResponseType(cmd.responseType)
    setCmdImageUrl(cmd.imageUrl || '')
    setCmdButtons(cmd.buttons || [])
    setCmdRole(cmd.allowedRole || 'user')
    setCmdModal(true)
  }

  async function logout() {
    await fetch('/api/auth/me', { method: 'DELETE' })
    window.location.href = '/login'
  }

  const filteredBots = useMemo(
    () => bots.filter((bot) => `${bot.name} ${bot.username || ''}`.toLowerCase().includes(query.toLowerCase())),
    [bots, query]
  )
  const totalCommandsCount = bots.reduce((sum, bot) => sum + (bot.commands || 0), 0)

  // Maximum value for SVG chart scaling
  const maxChartVal = Math.max(...chartData.map((d) => d.count), 5)

  return (
    <main className="min-h-screen app-bg text-foreground">
      <div className="dashboard-grid">
        {mobileOpen && <button aria-label="Close navigation" className="mobile-scrim" onClick={() => setMobileOpen(false)} />}
        <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
          <div className="sidebar-brand">
            <Link href="/" className="brand-mark">›_</Link>
            <Link href="/" className="brand-name">dann-tele<span>control room</span></Link>
            <button className="mobile-close" onClick={() => setMobileOpen(false)}><X size={18} /></button>
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

          <p className="nav-label">Workspace</p>
          <nav className="side-nav">
            {nav.map(({ label, icon: Icon }) => (
              <a
                key={label}
                href={`#${label.toLowerCase()}`}
                className={label === 'Overview' ? 'active' : ''}
                onClick={() => setMobileOpen(false)}
              >
                <Icon size={17} />
                {label}
                {label === 'Bots' && bots.length > 0 && <span className="nav-badge">{bots.length}</span>}
              </a>
            ))}
          </nav>

          <p className="nav-label">Configure</p>
          <nav className="side-nav">
            <a href="#settings"><Settings size={17} />Settings</a>
            <a href="/docs"><CircleHelp size={17} />Documentation & API</a>
          </nav>

          <div className="sidebar-bottom">
            <div className="status-row">
              <span className="status-dot" />
              {live ? 'Realtime ready (Socket.io)' : 'Realtime Polling'}
              <span className="pulse-line" />
            </div>
            <button onClick={logout} className="logout-button">
              <LogOut size={16} /> Sign out
            </button>
          </div>
        </aside>

        <section className="main-column">
          <header className="topbar">
            <button className="menu-button" onClick={() => setMobileOpen(true)}><Menu size={20} /></button>
            <div className="crumb">
              <span>Workspace</span><b>/</b><strong>Overview</strong>
            </div>
            <div className="top-actions">
              <div className="search-box">
                <Search size={16} />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search bots..." />
              </div>
              <button className="icon-button" aria-label="Toggle theme" onClick={toggleTheme}>
                {dark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button className="icon-button" aria-label="Notifications">
                <Bell size={18} /><i />
              </button>
              <button className="profile-chip" onClick={logout}>
                <span className="avatar small">{(user?.name || 'D').slice(0, 1).toUpperCase()}</span>
                <span className="profile-name">{user?.name || 'Developer'}</span>
                <ChevronDown size={15} />
              </button>
            </div>
          </header>

          <div className="content-wrap">
            <div className="hero-row">
              <div>
                <p className="eyebrow"><span className="live-dot" /> REALTIME TELEGRAM GATEWAY</p>
                <h1>Your command center.</h1>
                <p className="subtitle">Monitor every Telegram bot, custom command, and webhook event from one workspace.</p>
              </div>
              <button className="primary-button" onClick={() => setModal(true)}>
                <Plus size={17} /> Connect bot
              </button>
            </div>

            <div className="metric-grid">
              <Metric icon={Bot} label="Connected bots" value={bots.length} trend={`Role Limit: ${user?.role === 'vip' ? 10 : user?.role === 'premium' ? 25 : user?.role === 'admin' ? 'Unlimited' : 3}`} />
              <Metric icon={Command} label="Commands processed" value={totalCommandsCount} trend="All time updates" />
              <Metric icon={Activity} label="Webhook status" value="99.9%" trend="Operational" />
              <Metric icon={Radio} label="Gateway channel" value={live ? 'Socket.io' : 'HTTP Sync'} trend={refreshing ? 'Syncing...' : 'Live Data'} />
            </div>

            {/* Realtime Usage SVG Chart */}
            <section className="panel chart-panel my-6 p-6 rounded-2xl border border-border bg-card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="section-kicker flex items-center gap-1.5 text-xs text-primary font-semibold"><BarChart2 size={15} /> REALTIME ANALYTICS</div>
                  <h2 className="text-xl font-bold">Bot Activity & Command Traffic</h2>
                </div>
                <span className="text-xs text-muted-foreground">7 Days Overview</span>
              </div>

              <div className="h-44 w-full flex items-end justify-between gap-2 pt-6 px-2">
                {chartData.map((pt, idx) => {
                  const heightPercent = Math.max(12, Math.round((pt.count / maxChartVal) * 100))
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                      <div className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition">{pt.count} req</div>
                      <div
                        className="w-full bg-primary/20 hover:bg-primary/50 transition-all rounded-t-lg"
                        style={{ height: `${heightPercent}%` }}
                      />
                      <span className="text-xs font-medium text-muted-foreground">{pt.label}</span>
                    </div>
                  )
                })}
              </div>
            </section>

            {/* Bots Section */}
            <section className="panel bots-panel" id="bots">
              <div className="panel-heading">
                <div>
                  <div className="section-kicker"><span className="mini-icon"><Bot size={15} /></span> BOT INVENTORY</div>
                  <h2>Connected Telegram bots</h2>
                  <p>Deploy, monitor, and manage your Telegram bot fleet.</p>
                </div>
                <div className="heading-actions">
                  <button className="ghost-button" onClick={() => load(true)}>
                    {refreshing ? 'Syncing...' : 'Refresh'}
                  </button>
                  <button className="primary-button compact" onClick={() => setModal(true)}>
                    <Plus size={15} /> Add bot
                  </button>
                </div>
              </div>

              {filteredBots.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-art"><TerminalSquare size={24} /></div>
                  <h3>{query ? 'No bots found' : 'Your workspace is ready'}</h3>
                  <p>{query ? 'Try another search term.' : 'Connect your first Telegram bot to start receiving live webhook messages here.'}</p>
                  {!query && <button className="primary-button" onClick={() => setModal(true)}>Connect your first bot</button>}
                </div>
              ) : (
                <div className="bot-list">
                  {filteredBots.map((bot) => {
                    const isConnected = bot.status === 'connected' || bot.status === 'active'
                    const isError = bot.status === 'error'
                    return (
                      <div className="bot-row" key={bot.id}>
                        <div className="bot-identity">
                          <div className="bot-avatar"><Bot size={18} /></div>
                          <div>
                            <b>{bot.name}</b>
                            <span>{bot.username ? `@${bot.username}` : 'Telegram bot'} · {bot.commands || 0} commands handled</span>
                          </div>
                        </div>
                        <div className="bot-health">
                          <span className={`health-pill ${isConnected ? 'healthy' : isError ? 'pending' : 'pending'}`}>
                            <i />
                            {isConnected ? 'Operational' : isError ? 'Token Error' : 'Pending webhook'}
                          </span>
                          <button aria-label={`Delete ${bot.name}`} className="delete-button" onClick={() => removeBot(bot.id)}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>

            {/* Custom Commands Management Section */}
            <section className="panel commands-panel my-6 p-6 rounded-2xl border border-border bg-card" id="commands">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="section-kicker flex items-center gap-1.5 text-xs text-primary font-semibold"><Command size={15} /> COMMAND EDITOR</div>
                  <h2 className="text-xl font-bold">Custom Bot Commands</h2>
                  <p className="text-xs text-muted-foreground">Configure triggers, group/private modes, usage limits, and rich button replies.</p>
                </div>
                <button
                  className="primary-button compact"
                  onClick={() => { resetCmdForm(); setCmdModal(true) }}
                >
                  <Plus size={15} /> Create Command
                </button>
              </div>

              {commandsList.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">Belum ada command custom. Klik 'Create Command' untuk menambahkan menu atau tombol baru.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {commandsList.map((cmd) => (
                    <div key={cmd.id} className="p-4 rounded-xl border border-border bg-background/50 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-primary">{cmd.command}</span>
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-primary/30 text-primary">
                            {cmd.mode}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{cmd.response || '[Rich Reply]'}</p>
                        <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                          <span>Limit: {cmd.limit === -1 ? 'Unlimited' : `${cmd.usageCount}/${cmd.limit}`}</span>
                          <span>•</span>
                          <span>Type: {cmd.responseType}</span>
                          <span>•</span>
                          <span>Role: {cmd.allowedRole || 'user'}</span>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-end gap-2 border-t border-border/50 pt-2">
                        <button onClick={() => editCommand(cmd)} className="text-xs text-primary hover:underline flex items-center gap-1">
                          <Edit size={12} /> Edit
                        </button>
                        <button onClick={() => handleDeleteCommand(cmd.id)} className="text-xs text-destructive hover:underline flex items-center gap-1">
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Realtime Logs Feed */}
            <div className="bottom-grid">
              <section className="panel activity-panel" id="logs">
                <div className="panel-heading compact-heading">
                  <div>
                    <div className="section-kicker"><span className="mini-icon pink"><Activity size={15} /></span> REALTIME LOGS FEED</div>
                    <h2>Recent webhook updates</h2>
                  </div>
                </div>
                {logs.length === 0 ? (
                  <div className="activity-item">
                    <span className="activity-icon blue"><ShieldCheck size={16} /></span>
                    <div><b>Gateway Endpoint Active</b><span>Ready to process updates</span></div>
                    <time>Just now</time>
                  </div>
                ) : (
                  logs.slice(0, 6).map((log) => (
                    <div className="activity-item" key={log.id}>
                      <span className={`activity-icon ${log.type === 'command' ? 'green' : 'blue'}`}><Radio size={16} /></span>
                      <div>
                        <b>@{log.username} ({log.chatType})</b>
                        <span className="truncate">{log.text || '[Non-text message]'}</span>
                      </div>
                      <time>{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
                    </div>
                  ))
                )}
              </section>

              <section className="panel quick-panel">
                <div className="section-kicker"><span className="mini-icon yellow"><Zap size={15} /></span> QUICK ACTIONS</div>
                <h2>Move faster</h2>
                <p>Everything you need is one click away.</p>
                <button onClick={() => setModal(true)} className="quick-action">
                  <Plus size={17} />Connect a new bot <span>→</span>
                </button>
                <Link href="/docs" className="quick-action">
                  <TerminalSquare size={17} />API Docs & Tester <span>→</span>
                </Link>
              </section>
            </div>
          </div>
        </section>
      </div>

      {/* Bot Connection Modal */}
      {modal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-top">
              <div>
                <span className="eyebrow">NEW CONNECTION</span>
                <h2>Connect a Telegram bot</h2>
              </div>
              <button className="icon-button" onClick={() => setModal(false)}><X size={18} /></button>
            </div>
            <p className="modal-copy">Paste your BotFather token. Dann-Tele validates it with Telegram API and sets up the webhook automatically.</p>
            <form onSubmit={addBot} className="bot-form">
              <label>
                Bot name
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Customer Support Bot" required />
              </label>
              <label>
                BotFather token
                <input value={token} onChange={(e) => setToken(e.target.value)} placeholder="123456789:ABCdefGHIjklMNOpqr..." required />
              </label>
              {error && <p className="form-error">{error}</p>}
              <button className="primary-button full" type="submit" disabled={adding}>
                {adding ? <PuzzleSpinner size="sm" /> : 'Connect and validate →'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Command Editor Modal */}
      {cmdModal && (
        <div className="modal-backdrop">
          <div className="modal-card max-w-lg">
            <div className="modal-top">
              <div>
                <span className="eyebrow">COMMAND CREATOR / EDITOR</span>
                <h2>{cmdId ? 'Edit Command' : 'Create Custom Command'}</h2>
              </div>
              <button className="icon-button" onClick={() => setCmdModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveCommand} className="space-y-4 mt-4">
              <label className="block text-xs font-semibold">
                Trigger Command
                <input value={cmdString} onChange={(e) => setCmdString(e.target.value)} placeholder="/menu atau /start" required className="w-full mt-1 p-2 rounded border border-input bg-background" />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs font-semibold">
                  Mode Scope
                  <select value={cmdMode} onChange={(e) => setCmdMode(e.target.value as any)} className="w-full mt-1 p-2 rounded border border-input bg-background">
                    <option value="all">Grup & Private (All)</option>
                    <option value="group">Hanya Mode Grup</option>
                    <option value="private">Hanya Mode Private (DM)</option>
                  </select>
                </label>
                <label className="block text-xs font-semibold">
                  Limit Penggunaan (-1 = unlimited)
                  <input type="number" value={cmdLimit} onChange={(e) => setCmdLimit(Number(e.target.value))} className="w-full mt-1 p-2 rounded border border-input bg-background" />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs font-semibold">
                  Tipe Respon Bot
                  <select value={cmdResponseType} onChange={(e) => setCmdResponseType(e.target.value as any)} className="w-full mt-1 p-2 rounded border border-input bg-background">
                    <option value="text">Pesan Teks Standard</option>
                    <option value="image">Gambar / Photo + Caption</option>
                    <option value="hydrated_button">Hydrated URL / Callback Button</option>
                    <option value="callback_button">Inline Callback Button</option>
                  </select>
                </label>
                <label className="block text-xs font-semibold">
                  Akses Role Pengguna Bot
                  <select value={cmdRole} onChange={(e) => setCmdRole(e.target.value as any)} className="w-full mt-1 p-2 rounded border border-input bg-background">
                    <option value="user">User (Semua Orang)</option>
                    <option value="admin">Admin Bot</option>
                    <option value="superadmin">Superadmin Bot</option>
                    <option value="owner">Owner Bot Sahaja</option>
                  </select>
                </label>
              </div>

              {cmdResponseType === 'image' && (
                <label className="block text-xs font-semibold">
                  Direct Image URL (.jpg / .png)
                  <input value={cmdImageUrl} onChange={(e) => setCmdImageUrl(e.target.value)} placeholder="https://example.com/image.jpg" className="w-full mt-1 p-2 rounded border border-input bg-background" />
                </label>
              )}

              <label className="block text-xs font-semibold">
                Teks Balasan (HTML Supported)
                <textarea value={cmdResponse} onChange={(e) => setCmdResponse(e.target.value)} rows={3} placeholder="Format <b>HTML</b> didukung..." className="w-full mt-1 p-2 rounded border border-input bg-background" />
              </label>

              {(cmdResponseType === 'hydrated_button' || cmdResponseType === 'callback_button') && (
                <div className="p-3 border border-border rounded bg-muted/20 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
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
                    <div key={idx} className="flex gap-2 items-center text-xs">
                      <input value={btn.label} onChange={(e) => { const copy = [...cmdButtons]; copy[idx].label = e.target.value; setCmdButtons(copy) }} placeholder="Label" className="p-1 rounded border bg-background flex-1" />
                      <select value={btn.type} onChange={(e) => { const copy = [...cmdButtons]; copy[idx].type = e.target.value as any; setCmdButtons(copy) }} className="p-1 rounded border bg-background">
                        <option value="url">URL Link</option>
                        <option value="callback">Callback</option>
                      </select>
                      <input value={btn.value} onChange={(e) => { const copy = [...cmdButtons]; copy[idx].value = e.target.value; setCmdButtons(copy) }} placeholder="URL / Data" className="p-1 rounded border bg-background flex-1" />
                      <button type="button" onClick={() => setCmdButtons(cmdButtons.filter((_, i) => i !== idx))} className="text-destructive font-bold">×</button>
                    </div>
                  ))}
                </div>
              )}

              <button className="primary-button full" type="submit" disabled={savingCmd}>
                {savingCmd ? <PuzzleSpinner size="sm" /> : 'Simpan Command →'}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}

function Metric({ icon: Icon, label, value, trend }: { icon: typeof Bot; label: string; value: string | number; trend: string }) {
  return (
    <div className="metric-card">
      <div className="metric-icon"><Icon size={18} /></div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{trend}</small>
    </div>
  )
}
