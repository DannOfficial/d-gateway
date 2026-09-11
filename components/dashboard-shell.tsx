'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { io } from 'socket.io-client'
import {
  Activity, Bell, Bot, ChevronDown, CircleHelp, Command, LayoutDashboard, List, LogOut, Menu, Moon, Plus, Radio, Search, Settings, ShieldCheck, Sun, TerminalSquare, Trash2, X, Zap
} from 'lucide-react'
import { PuzzleSpinner } from '@/components/ui/puzzle-spinner'

type BotItem = { id: string; name: string; username: string | null; status: string; commands: number; messages?: number; createdAt?: string }
type User = { name: string; email: string; surveySource?: string | null }

const nav = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Bots', icon: Bot },
  { label: 'Commands', icon: Command },
  { label: 'Logs', icon: List },
]

export default function DashboardShell() {
  const [user, setUser] = useState<User | null>(null)
  const [bots, setBots] = useState<BotItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [modal, setModal] = useState(false)
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [dark, setDark] = useState(true)
  const [live, setLive] = useState(false)

  async function load(silent = false) {
    if (!silent) setLoading(true); else setRefreshing(true)
    try {
      const [meResponse, botsResponse] = await Promise.all([fetch('/api/auth/me'), fetch('/api/bots')])
      if (meResponse.ok) {
        const userData = await meResponse.json()
        setUser(userData.user)
      }
      if (botsResponse.ok) {
        const botsData = await botsResponse.json()
        setBots(botsData.bots || [])
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    load()
    const timer = window.setInterval(() => load(true), 20000)
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

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL
    if (!socketUrl) return
    const socket = io(socketUrl, { transports: ['websocket', 'polling'] })
    socket.on('connect', () => setLive(true))
    socket.on('disconnect', () => setLive(false))
    socket.on('bots:updated', () => load(true))
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

      // Validate webhook & getMe in background
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

  async function logout() {
    await fetch('/api/auth/me', { method: 'DELETE' })
    window.location.href = '/login'
  }

  const filteredBots = useMemo(
    () => bots.filter((bot) => `${bot.name} ${bot.username || ''}`.toLowerCase().includes(query.toLowerCase())),
    [bots, query]
  )
  const commands = bots.reduce((sum, bot) => sum + (bot.commands || 0), 0)

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center app-bg">
        <div className="flex flex-col items-center justify-center gap-4">
          <PuzzleSpinner size="lg" />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen app-bg">
      <div className="dashboard-grid">
        {mobileOpen && <button aria-label="Close navigation" className="mobile-scrim" onClick={() => setMobileOpen(false)} />}
        <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
          <div className="sidebar-brand">
            <Link href="/" className="brand-mark">›_</Link>
            <Link href="/" className="brand-name">dann-tele<span>control room</span></Link>
            <button className="mobile-close" onClick={() => setMobileOpen(false)}><X size={18} /></button>
          </div>
          <div className="workspace-switch">
            <span className="avatar">{(user?.name || 'D').slice(0, 1).toUpperCase()}</span>
            <span>
              <b>{user?.name || 'Workspace'}</b>
              <small>{user?.email || 'Personal workspace'}</small>
            </span>
            <ChevronDown size={15} />
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
              {live ? 'Realtime ready' : 'Polling fallback'}
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
                <p className="eyebrow"><span className="live-dot" /> SYSTEMS OPERATIONAL</p>
                <h1>Your command center.</h1>
                <p className="subtitle">Monitor every Telegram bot, command, and webhook event from one workspace.</p>
              </div>
              <button className="primary-button" onClick={() => setModal(true)}>
                <Plus size={17} /> Connect bot
              </button>
            </div>

            <div className="metric-grid">
              <Metric icon={Bot} label="Connected bots" value={bots.length} trend="Total bots" />
              <Metric icon={Command} label="Commands processed" value={commands} trend="All time" />
              <Metric icon={Activity} label="Webhook status" value="99.9%" trend="Last 30 days" />
              <Metric icon={Radio} label="Gateway channel" value={live ? 'Socket' : 'HTTP'} trend={refreshing ? 'Updating...' : 'Auto-sync 20s'} />
            </div>

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

            <div className="bottom-grid">
              <section className="panel activity-panel" id="logs">
                <div className="panel-heading compact-heading">
                  <div>
                    <div className="section-kicker"><span className="mini-icon pink"><Activity size={15} /></span> LIVE FEED</div>
                    <h2>Recent activity</h2>
                  </div>
                  <a href="#logs" className="view-link">View logs <span>→</span></a>
                </div>
                <div className="activity-item">
                  <span className="activity-icon green"><ShieldCheck size={16} /></span>
                  <div><b>Telegram Webhook Endpoint Active</b><span>Ready to process updates</span></div>
                  <time>Just now</time>
                </div>
                <div className="activity-item">
                  <span className="activity-icon blue"><Radio size={16} /></span>
                  <div><b>Gateway API Sync Complete</b><span>Metrics & logs up to date</span></div>
                  <time>1m ago</time>
                </div>
              </section>

              <section className="panel quick-panel" id="commands">
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
