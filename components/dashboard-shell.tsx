'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { io } from 'socket.io-client'
import {
  Activity, Bell, Bot, ChevronDown, CircleHelp, Command, Edit, LayoutDashboard, List, LogOut, Menu, Moon, Plus, Radio, Search, Settings, ShieldCheck, Sun, TerminalSquare, Trash2, X, Zap, BarChart2, Shield, Cpu, HardDrive, Server, Sparkles, Database, User as UserIcon, Lock
} from 'lucide-react'
import { PuzzleSpinner } from '@/components/ui/puzzle-spinner'

type BotItem = { id: string; name: string; username: string | null; status: string; commands: number; messages?: number; createdAt?: string }
type User = { id?: string; name: string; email: string; role?: string; plan?: string; twoFactorEnabled?: boolean; surveySource?: string | null }
type LogItem = { id: string; username: string; text: string; type: string; chatType: string; createdAt: string }
type CommandItem = {
  id: string
  command: string
  response: string
  decorations?: string[]
  mode: 'all' | 'group' | 'private'
  limit: number
  usageCount: number
  responseType: 'text' | 'image' | 'hydrated_button' | 'callback_button'
  imageUrl?: string
  buttons?: Array<{ label: string; type: 'url' | 'callback'; value: string }>
  allowedRole?: 'user' | 'admin' | 'superadmin' | 'owner'
  aiSessionMode?: boolean
}
type ChartPoint = { date: string; label: string; count: number }
type SystemMetrics = {
  memory: { total: string; used: string; free: string; percentage: number }
  cpu: { model: string; cores: number; usagePercentage: number; loadAvg: string[] }
  nodeVersion: string
  os: string
  ipAddress: string
}

export default function DashboardShell() {
  const [user, setUser] = useState<User | null>(null)
  const [bots, setBots] = useState<BotItem[]>([])
  const [logs, setLogs] = useState<LogItem[]>([])
  const [commandsList, setCommandsList] = useState<CommandItem[]>([])
  const [chartData, setChartData] = useState<ChartPoint[]>([])
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null)
  const [totalRpgPlayers, setTotalRpgPlayers] = useState<number>(0)

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'bots' | 'commands' | 'database' | 'connection' | 'session'>('overview')

  // 2FA Dialog state
  const [pinDialog, setPinDialog] = useState(false)
  const [enteredPin, setEnteredPin] = useState('')
  const [pinVerified, setPinVerified] = useState(true)
  const [pinError, setPinError] = useState('')

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
  const [cmdDecorations, setCmdDecorations] = useState<string[]>(['✨', '🔥'])
  const [newDecorInput, setNewDecorInput] = useState('')
  const [cmdMode, setCmdMode] = useState<'all' | 'group' | 'private'>('all')
  const [cmdLimit, setCmdLimit] = useState(-1)
  const [cmdResponseType, setCmdResponseType] = useState<'text' | 'image' | 'hydrated_button' | 'callback_button'>('text')
  const [cmdImageUrl, setCmdImageUrl] = useState('')
  const [cmdButtons, setCmdButtons] = useState<Array<{ label: string; type: 'url' | 'callback'; value: string }>>([])
  const [cmdRole, setCmdRole] = useState<'user' | 'admin' | 'superadmin' | 'owner'>('user')
  const [cmdAiMode, setCmdAiMode] = useState(false)

  // API Scrape Tester in Command Editor
  const [scrapeQuery, setScrapeQuery] = useState('')
  const [scrapeResult, setScrapeResult] = useState<any>(null)
  const [scraping, setScraping] = useState(false)

  // Top Navbar Dropdown & UI states
  const [query, setQuery] = useState('')
  const [dark, setDark] = useState(true)
  const [live, setLive] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)

  // AI Sessions State
  const [aiSessions, setAiSessions] = useState<Array<{ id: string; name: string; context: string; model: string }>>([
    { id: '1', name: 'Gemini Assistant General', context: 'Kamu adalah asisten pintar buatan Dann-Tele.', model: 'gemini-1.5-flash' },
    { id: '2', name: 'RPG Companion AI', context: 'Kamu adalah NPC pemandu petualangan RPG yang ramah dan membantu player.', model: 'gemini-1.5-pro' },
  ])
  const [newAiSessionName, setNewAiSessionName] = useState('')
  const [newAiSessionContext, setNewAiSessionContext] = useState('')

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
        if (userData.user?.twoFactorEnabled && !sessionStorage.getItem('dann_2fa_ok')) {
          setPinVerified(false)
          setPinDialog(true)
        }
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
        if (statsData.stats) {
          if (statsData.stats.chartData) setChartData(statsData.stats.chartData)
          if (statsData.stats.system) setSystemMetrics(statsData.stats.system)
          if (typeof statsData.stats.totalRpgPlayers === 'number') setTotalRpgPlayers(statsData.stats.totalRpgPlayers)
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
    socket.on('commands:updated', () => load(true))
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
    if (!window.confirm('Delete this bot and all of its logs? This cannot be undone.')) return
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
          decorations: cmdDecorations,
          mode: cmdMode,
          limit: Number(cmdLimit),
          responseType: cmdResponseType,
          imageUrl: cmdImageUrl,
          buttons: cmdButtons,
          allowedRole: cmdRole,
          aiSessionMode: cmdAiMode,
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
    if (!window.confirm('Delete this command? This cannot be undone.')) return
    setCommandsList((cur) => cur.filter((c) => c.id !== id))
    await fetch(`/api/commands/${id}`, { method: 'DELETE' })
  }

  async function botAction(bot: BotItem, action: 'start' | 'stop' | 'restart') {
    const response = await fetch(`/api/bots/${bot.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action }) })
    if (response.ok) {
      const data = await response.json()
      setBots((current) => current.map((item) => item.id === bot.id ? data.bot : item))
    }
  }

  async function testScrapeApi() {
    if (!scrapeQuery.trim()) return
    setScraping(true)
    setScrapeResult(null)
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ command: cmdString || '/pinterest', query: scrapeQuery }),
      })
      const data = await res.json()
      setScrapeResult(data)
    } catch (err: any) {
      setScrapeResult({ error: err.message })
    } finally {
      setScraping(false)
    }
  }

  function handlePinSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (enteredPin.length >= 4) {
      sessionStorage.setItem('dann_2fa_ok', 'true')
      setPinVerified(true)
      setPinDialog(false)
      setPinError('')
    } else {
      setPinError('PIN 2FA minimal 4 digit.')
    }
  }

  function resetCmdForm() {
    setCmdId('')
    setCmdString('')
    setCmdResponse('')
    setCmdDecorations(['✨', '🔥'])
    setNewDecorInput('')
    setCmdMode('all')
    setCmdLimit(-1)
    setCmdResponseType('text')
    setCmdImageUrl('')
    setCmdButtons([])
    setCmdRole('user')
    setCmdAiMode(false)
    setScrapeQuery('')
    setScrapeResult(null)
  }

  function editCommand(cmd: CommandItem) {
    setCmdId(cmd.id)
    setCmdString(cmd.command)
    setCmdResponse(cmd.response)
    setCmdDecorations(cmd.decorations || ['✨', '🔥'])
    setCmdMode(cmd.mode)
    setCmdLimit(cmd.limit)
    setCmdResponseType(cmd.responseType)
    setCmdImageUrl(cmd.imageUrl || '')
    setCmdButtons(cmd.buttons || [])
    setCmdRole(cmd.allowedRole || 'user')
    setCmdAiMode(Boolean(cmd.aiSessionMode))
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
  const maxChartVal = Math.max(...chartData.map((d) => d.count), 5)

  if (!pinVerified && pinDialog) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl text-center text-foreground">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-primary">
            <Lock size={24} />
          </div>
          <h2 className="text-xl font-bold">2-Factor Authentication</h2>
          <p className="mt-1 text-xs text-muted-foreground">Masukkan PIN Keamanan 2FA Anda untuk membuka Dashboard.</p>
          <form onSubmit={handlePinSubmit} className="mt-5 space-y-4">
            <input
              type="password"
              maxLength={6}
              value={enteredPin}
              onChange={(e) => setEnteredPin(e.target.value)}
              placeholder="• • • •"
              className="w-full rounded-xl border border-input bg-background p-3 text-center text-2xl font-mono tracking-widest focus:ring-2 focus:ring-primary"
              autoFocus
            />
            {pinError && <p className="text-xs text-destructive">{pinError}</p>}
            <button type="submit" className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
              Verifikasi PIN →
            </button>
          </form>
        </div>
      </div>
    )
  }

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

          <p className="nav-label">Navigation & Categories</p>
          <nav className="side-nav">
            <button onClick={() => { setActiveTab('overview'); setMobileOpen(false) }} className={activeTab === 'overview' ? 'active' : ''}>
              <LayoutDashboard size={17} /> Overview
            </button>
            <button onClick={() => { setActiveTab('bots'); setMobileOpen(false) }} className={activeTab === 'bots' ? 'active' : ''}>
              <Bot size={17} /> Bots {bots.length > 0 && <span className="nav-badge">{bots.length}</span>}
            </button>
            <button onClick={() => { setActiveTab('commands'); setMobileOpen(false) }} className={activeTab === 'commands' ? 'active' : ''}>
              <Command size={17} /> Commands Table
            </button>
            <button onClick={() => { setActiveTab('database'); setMobileOpen(false) }} className={activeTab === 'database' ? 'active' : ''}>
              <Database size={17} /> Database Info
            </button>
            <button onClick={() => { setActiveTab('connection'); setMobileOpen(false) }} className={activeTab === 'connection' ? 'active' : ''}>
              <Activity size={17} /> Connection & Logs
            </button>
            <button onClick={() => { setActiveTab('session'); setMobileOpen(false) }} className={activeTab === 'session' ? 'active' : ''}>
              <Sparkles size={17} /> Gemini AI Session
            </button>
          </nav>

          <p className="nav-label">Configure</p>
          <nav className="side-nav">
            <Link href="/settings"><Settings size={17} />Settings</Link>
            <Link href="/docs"><CircleHelp size={17} />Documentation & API</Link>
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
              <span>Workspace</span><b>/</b><strong className="capitalize">{activeTab}</strong>
            </div>
            <div className="top-actions">
              <div className="search-box">
                <Search size={16} />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search bots..." />
              </div>
              <button className="icon-button" aria-label="Toggle theme" onClick={toggleTheme}>
                {dark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button className="icon-button relative" aria-label="Notifications" onClick={() => setNotificationsOpen(!notificationsOpen)}>
                <Bell size={18} /><i />
              </button>
              {notificationsOpen && (
                <div className="absolute right-20 top-16 z-30 w-72 rounded-xl border border-border bg-card p-4 shadow-xl text-foreground">
                  <b className="text-sm">Notifications</b>
                  <p className="mt-2 text-xs text-muted-foreground">{logs.length ? `${logs.length} recent webhook events` : 'No new notifications.'}</p>
                </div>
              )}

              {/* Enhanced Navbar Profile Dropdown */}
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
                      <div className="mt-2 flex items-center justify-between text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-primary/20 font-bold uppercase text-primary">{user?.role || 'free'}</span>
                        <span className="text-emerald-500 font-medium">Workspace Active</span>
                      </div>
                    </div>
                    <div className="space-y-1 text-xs">
                      <Link href="/profile" onClick={() => setProfileDropdownOpen(false)} className="flex items-center gap-2 p-2 rounded hover:bg-muted font-medium">
                        <UserIcon size={14} /> View & Edit Profile ››
                      </Link>
                      <Link href="/settings" onClick={() => setProfileDropdownOpen(false)} className="flex items-center gap-2 p-2 rounded hover:bg-muted font-medium">
                        <Settings size={14} /> Bot Settings
                      </Link>
                      <button onClick={logout} className="w-full text-left flex items-center gap-2 p-2 rounded hover:bg-destructive/10 text-destructive font-medium">
                        <LogOut size={14} /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          <div className="content-wrap">
            {/* System Hardware Specifications Display */}
            {systemMetrics && (
              <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs">
                <div className="p-3 rounded-xl border border-border bg-card/60 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary"><HardDrive size={18} /></div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold">RAM Memory</span>
                    <p className="font-bold">{systemMetrics.memory.used} / {systemMetrics.memory.total} ({systemMetrics.memory.percentage}%)</p>
                  </div>
                </div>
                <div className="p-3 rounded-xl border border-border bg-card/60 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500"><Cpu size={18} /></div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold">CPU Load ({systemMetrics.cpu.cores} Cores)</span>
                    <p className="font-bold truncate max-w-[150px]">{systemMetrics.cpu.model}</p>
                  </div>
                </div>
                <div className="p-3 rounded-xl border border-border bg-card/60 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500"><Server size={18} /></div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold">Node.js & OS Specs</span>
                    <p className="font-bold">{systemMetrics.nodeVersion} · {systemMetrics.os.split(' ')[0]}</p>
                  </div>
                </div>
                <div className="p-3 rounded-xl border border-border bg-card/60 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-sky-500/10 text-sky-500"><Radio size={18} /></div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold">Server IP Address</span>
                    <p className="font-bold font-mono">{systemMetrics.ipAddress}</p>
                  </div>
                </div>
              </div>
            )}

            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <>
                <div className="hero-row">
                  <div>
                    <p className="eyebrow"><span className="live-dot" /> REALTIME TELEGRAM GATEWAY</p>
                    <h1>Welcome back, {user?.name?.split(' ')[0] || 'builder'}.</h1>
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
              </>
            )}

            {/* BOTS TAB */}
            {(activeTab === 'overview' || activeTab === 'bots') && (
              <section className="panel bots-panel mb-6" id="bots">
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
                            <button className="ghost-button compact" onClick={() => botAction(bot, isConnected ? 'stop' : 'start')}>{isConnected ? 'Stop' : 'Start'}</button>
                            <button className="ghost-button compact" onClick={() => botAction(bot, 'restart')}>Restart</button>
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
            )}

            {/* COMMANDS TAB */}
            {(activeTab === 'overview' || activeTab === 'commands') && (
              <section className="panel commands-panel my-6 p-6 rounded-2xl border border-border bg-card" id="commands">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="section-kicker flex items-center gap-1.5 text-xs text-primary font-semibold"><Command size={15} /> COMMAND EDITOR</div>
                    <h2 className="text-xl font-bold">Custom Bot Commands Table</h2>
                    <p className="text-xs text-muted-foreground">Configure triggers, decorations, mode scopes, limits, roles, and Gemini AI context toggles.</p>
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
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-border bg-muted/40 font-bold uppercase text-[10px]">
                        <tr>
                          <th className="p-3">Trigger</th>
                          <th className="p-3">Decorations</th>
                          <th className="p-3">Scope Mode</th>
                          <th className="p-3">Limit</th>
                          <th className="p-3">Response Type</th>
                          <th className="p-3">Role</th>
                          <th className="p-3">AI Mode</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {commandsList.map((cmd) => (
                          <tr key={cmd.id} className="hover:bg-muted/20">
                            <td className="p-3 font-mono font-bold text-primary">{cmd.command}</td>
                            <td className="p-3 font-mono text-xs">{cmd.decorations?.join(' ') || '—'}</td>
                            <td className="p-3"><span className="px-2 py-0.5 rounded border border-primary/30 uppercase text-[10px] text-primary">{cmd.mode}</span></td>
                            <td className="p-3">{cmd.limit === -1 ? 'Unlimited' : `${cmd.usageCount}/${cmd.limit}`}</td>
                            <td className="p-3 font-semibold">{cmd.responseType}</td>
                            <td className="p-3 uppercase font-bold">{cmd.allowedRole || 'user'}</td>
                            <td className="p-3">{cmd.aiSessionMode ? <span className="text-emerald-500 font-bold">Enabled</span> : <span className="text-muted-foreground">Disabled</span>}</td>
                            <td className="p-3 text-right space-x-2">
                              <button onClick={() => editCommand(cmd)} className="text-primary hover:underline font-semibold">Edit</button>
                              <button onClick={() => handleDeleteCommand(cmd.id)} className="text-destructive hover:underline font-semibold">Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}

            {/* DATABASE INFO TAB */}
            {activeTab === 'database' && (
              <section className="panel my-6 p-6 rounded-2xl border border-border bg-card space-y-4">
                <div className="flex items-center gap-2 text-primary font-bold"><Database size={20} /> MongoDB Collection Stats</div>
                <p className="text-xs text-muted-foreground">Informasi statistik data tersimpan di database MongoDB gateway Anda.</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl border border-border bg-background">
                    <span className="text-xs text-muted-foreground">Total Bot</span>
                    <p className="text-2xl font-bold text-primary">{bots.length}</p>
                  </div>
                  <div className="p-4 rounded-xl border border-border bg-background">
                    <span className="text-xs text-muted-foreground">Total Commands</span>
                    <p className="text-2xl font-bold text-primary">{commandsList.length}</p>
                  </div>
                  <div className="p-4 rounded-xl border border-border bg-background">
                    <span className="text-xs text-muted-foreground">Logs Activity</span>
                    <p className="text-2xl font-bold text-primary">{logs.length}</p>
                  </div>
                  <div className="p-4 rounded-xl border border-border bg-background">
                    <span className="text-xs text-muted-foreground">RPG Players Data</span>
                    <p className="text-2xl font-bold text-primary">{totalRpgPlayers}</p>
                  </div>
                </div>
              </section>
            )}

            {/* CONNECTION & LOGS TAB */}
            {(activeTab === 'overview' || activeTab === 'connection') && (
              <div className="bottom-grid my-6">
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
                    logs.slice(0, 8).map((log) => (
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
            )}

            {/* AI SESSIONS TAB */}
            {activeTab === 'session' && (
              <section className="panel my-6 p-6 rounded-2xl border border-border bg-card space-y-4">
                <div className="flex items-center gap-2 text-primary font-bold"><Sparkles size={20} /> Gemini AI Session Context Manager</div>
                <p className="text-xs text-muted-foreground">Buat dan atur konteks instruksi AI Gemini agar bot Telegram merespon secara otomatis sesuai dengan kepribadian/fitur yang diinginkan.</p>

                <div className="grid gap-4 md:grid-cols-2">
                  {aiSessions.map((sess) => (
                    <div key={sess.id} className="p-4 rounded-xl border border-border bg-background space-y-2">
                      <div className="flex items-center justify-between">
                        <b className="text-sm font-bold">{sess.name}</b>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/20 text-primary">{sess.model}</span>
                      </div>
                      <p className="text-xs text-muted-foreground bg-muted/40 p-2 rounded border border-border/50">{sess.context}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 border-t border-border pt-4">
                  <h3 className="text-sm font-bold mb-2">+ Tambah Session Context Baru</h3>
                  <div className="space-y-3">
                    <input
                      value={newAiSessionName}
                      onChange={(e) => setNewAiSessionName(e.target.value)}
                      placeholder="Nama Session Context (e.g. Asisten Toko Online)"
                      className="w-full p-2.5 text-xs rounded-lg border border-input bg-background"
                    />
                    <textarea
                      value={newAiSessionContext}
                      onChange={(e) => setNewAiSessionContext(e.target.value)}
                      rows={3}
                      placeholder="Instruksi / Prompt Konteks (e.g. Kamu adalah asisten ramah penanggung jawab customer care...)"
                      className="w-full p-2.5 text-xs rounded-lg border border-input bg-background"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newAiSessionName.trim()) {
                          setAiSessions([...aiSessions, { id: String(Date.now()), name: newAiSessionName, context: newAiSessionContext, model: 'gemini-1.5-flash' }])
                          setNewAiSessionName('')
                          setNewAiSessionContext('')
                        }
                      }}
                      className="primary-button compact"
                    >
                      Simpan AI Session Context
                    </button>
                  </div>
                </div>
              </section>
            )}
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
          <div className="modal-card max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="modal-top">
              <div>
                <span className="eyebrow">COMMAND CREATOR / EDITOR</span>
                <h2>{cmdId ? 'Edit Command' : 'Create Custom Command'}</h2>
              </div>
              <button className="icon-button" onClick={() => setCmdModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveCommand} className="space-y-4 mt-4 text-xs">
              {/* Awalan Dekorasi */}
              <div>
                <label className="block font-semibold mb-1">Awalan Dekorasi Respon Bot</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {cmdDecorations.map((dec, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-muted border border-border">
                      {dec}
                      <button type="button" onClick={() => setCmdDecorations(cmdDecorations.filter((_, i) => i !== idx))} className="text-destructive font-bold">×</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={newDecorInput}
                    onChange={(e) => setNewDecorInput(e.target.value)}
                    placeholder="Tambah emoji/dekorasi (contoh: 🌟, 🤖)"
                    className="flex-1 p-2 rounded border border-input bg-background"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newDecorInput.trim()) {
                        setCmdDecorations([...cmdDecorations, newDecorInput.trim()])
                        setNewDecorInput('')
                      }
                    }}
                    className="px-3 py-2 rounded bg-secondary text-secondary-foreground font-semibold"
                  >
                    + Dekor
                  </button>
                </div>
              </div>

              <label className="block font-semibold">
                Trigger Command
                <input value={cmdString} onChange={(e) => setCmdString(e.target.value)} placeholder="/pinterest atau /start" required className="w-full mt-1 p-2 rounded border border-input bg-background" />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block font-semibold">
                  Mode Scope
                  <select value={cmdMode} onChange={(e) => setCmdMode(e.target.value as any)} className="w-full mt-1 p-2 rounded border border-input bg-background">
                    <option value="all">Grup & Private (All)</option>
                    <option value="group">Hanya Mode Grup</option>
                    <option value="private">Hanya Mode Private (DM)</option>
                  </select>
                </label>
                <label className="block font-semibold">
                  Limit Penggunaan (-1 = unlimited)
                  <input type="number" value={cmdLimit} onChange={(e) => setCmdLimit(Number(e.target.value))} className="w-full mt-1 p-2 rounded border border-input bg-background" />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block font-semibold">
                  Tipe Respon Bot
                  <select value={cmdResponseType} onChange={(e) => setCmdResponseType(e.target.value as any)} className="w-full mt-1 p-2 rounded border border-input bg-background">
                    <option value="text">Pesan Teks Standard</option>
                    <option value="image">Gambar / Photo + Caption</option>
                    <option value="hydrated_button">Hydrated URL / Callback Button</option>
                    <option value="callback_button">Inline Callback Button</option>
                  </select>
                </label>
                <label className="block font-semibold">
                  Akses Role Pengguna
                  <select value={cmdRole} onChange={(e) => setCmdRole(e.target.value as any)} className="w-full mt-1 p-2 rounded border border-input bg-background">
                    <option value="user">User (Semua Orang)</option>
                    <option value="admin">Admin Bot</option>
                    <option value="superadmin">Superadmin Bot</option>
                    <option value="owner">Owner Bot Sahaja</option>
                  </select>
                </label>
              </div>

              <label className="flex items-center gap-2 font-semibold p-2.5 rounded border border-border bg-muted/20">
                <input type="checkbox" checked={cmdAiMode} onChange={(e) => setCmdAiMode(e.target.checked)} />
                <span>Gunakan Mode Gemini AI Response (Sesuai Session Context)</span>
              </label>

              {cmdResponseType === 'image' && (
                <label className="block font-semibold">
                  Media URL (image, MP4, GIF, WebM)
                  <input value={cmdImageUrl} onChange={(e) => setCmdImageUrl(e.target.value)} placeholder="https://cdn.example.com/media.gif" className="w-full mt-1 p-2 rounded border border-input bg-background" />
                </label>
              )}

              <label className="block font-semibold">
                Teks Balasan / Response Format (HTML Supported)
                <textarea value={cmdResponse} onChange={(e) => setCmdResponse(e.target.value)} rows={3} placeholder="Gunakan @username @fullname @id @time @date @timezone @botname..." className="w-full mt-1 p-2 rounded border border-input bg-background" />
              </label>

              {/* Scrape / API Testing Section */}
              <div className="p-3 border border-border rounded-xl bg-muted/30 space-y-2">
                <div className="flex items-center justify-between font-bold">
                  <span>Testing Scrape / API Endpoint</span>
                  <span className="text-[10px] text-muted-foreground">e.g. /pinterest kucing</span>
                </div>
                <div className="flex gap-2">
                  <input
                    value={scrapeQuery}
                    onChange={(e) => setScrapeQuery(e.target.value)}
                    placeholder="Masukkan query (contoh: kucing)"
                    className="flex-1 p-2 rounded border border-input bg-background"
                  />
                  <button type="button" onClick={testScrapeApi} disabled={scraping} className="px-3 py-2 rounded bg-primary text-primary-foreground font-semibold">
                    {scraping ? 'Testing...' : 'Test Scrape'}
                  </button>
                </div>
                {scrapeResult && (
                  <pre className="p-2 rounded bg-black/80 text-emerald-400 font-mono text-[10px] max-h-32 overflow-auto">
                    {JSON.stringify(scrapeResult, null, 2)}
                  </pre>
                )}
              </div>

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
                      <input value={btn.label} onChange={(e) => { const copy = [...cmdButtons]; copy[idx].label = e.target.value; setCmdButtons(copy) }} placeholder="Label" className="p-1.5 rounded border bg-background flex-1" />
                      <select value={btn.type} onChange={(e) => { const copy = [...cmdButtons]; copy[idx].type = e.target.value as any; setCmdButtons(copy) }} className="p-1.5 rounded border bg-background">
                        <option value="url">URL Link</option>
                        <option value="callback">Callback</option>
                      </select>
                      <input value={btn.value} onChange={(e) => { const copy = [...cmdButtons]; copy[idx].value = e.target.value; setCmdButtons(copy) }} placeholder="URL / Data" className="p-1.5 rounded border bg-background flex-1" />
                      <button type="button" onClick={() => setCmdButtons(cmdButtons.filter((_, i) => i !== idx))} className="text-destructive font-bold text-sm">×</button>
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
