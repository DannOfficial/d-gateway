'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { io } from 'socket.io-client'
import {
  Activity, BarChart2, Bot, Command, Database, HardDrive, Cpu, Server, Radio, Plus, TerminalSquare, Sparkles, Lock, Play, Square, RefreshCw, Trash2, X
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { PuzzleSpinner } from '@/components/ui/puzzle-spinner'
import { BotStats } from '@/components/bots/BotStats'
import { BotCard } from '@/components/bots/BotCard'
import { CommandEditor } from '@/components/commands/CommandEditor'
import { GeminiSession } from '@/components/gemini/GeminiSession'
import { LogTable } from '@/components/logs/LogTable'
import { RPGDashboard } from '@/components/rpg/RPGDashboard'

type BotItem = { id: string; name: string; username: string | null; status: string; commands: number; createdAt?: string }
type User = { id?: string; name: string; email: string; role?: string; geminiApiKey?: string; twoFactorEnabled?: boolean }
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
  apiEndpoint?: string
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
  const [geminiLogs, setGeminiLogs] = useState<any[]>([])
  const [rpgPlayers, setRpgPlayers] = useState<any[]>([])
  const [commandsList, setCommandsList] = useState<CommandItem[]>([])
  const [chartData, setChartData] = useState<ChartPoint[]>([])
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null)
  const [totalRpgPlayers, setTotalRpgPlayers] = useState<number>(0)

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [activeTab, setActiveTab] = useState<'overview' | 'bots' | 'commands' | 'database' | 'connection' | 'session' | 'rpg'>('overview')

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
  const [editingCmd, setEditingCmd] = useState<any>(null)
  const [savingCmd, setSavingCmd] = useState(false)

  // Top Navbar & Search
  const [query, setQuery] = useState('')
  const [live, setLive] = useState(true)

  async function load(silent = false) {
    if (!silent) setLoading(true); else setRefreshing(true)
    try {
      const [meRes, botsRes, logsRes, cmdsRes, statsRes, rpgRes, geminiLogsRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/bots'),
        fetch('/api/logs'),
        fetch('/api/commands'),
        fetch('/api/stats'),
        fetch('/api/rpg/profile'),
        fetch('/api/gemini/logs'),
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
      if (rpgRes.ok) {
        const rpgData = await rpgRes.json()
        setRpgPlayers(rpgData.players || [])
      }
      if (geminiLogsRes.ok) {
        const gLogsData = await geminiLogsRes.json()
        setGeminiLogs(gLogsData.logs || [])
      }
      setLoadError('')
    } catch {
      setLoadError('Dashboard data could not be refreshed.')
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
    const socketUrl = 'https://dannteam.biz.id'
    const socket = io(socketUrl, { transports: ['websocket', 'polling'] })
    socket.on('connect', () => setLive(true))
    socket.on('disconnect', () => setLive(false))
    socket.on('bots:updated', () => load(true))
    socket.on('logs:new', () => load(true))
    socket.on('commands:updated', () => load(true))
    return () => socket.close()
  }, [])

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

  async function botAction(id: string, action: 'start' | 'stop' | 'restart') {
    const endpoint = action === 'start' ? `/api/bots/${id}/start` : action === 'stop' ? `/api/bots/${id}/stop` : `/api/bots/${id}`
    const method = action === 'start' || action === 'stop' ? 'POST' : 'PATCH'
    const response = await fetch(endpoint, {
      method,
      headers: { 'content-type': 'application/json' },
      body: action === 'restart' ? JSON.stringify({ action: 'restart' }) : undefined,
    })
    if (response.ok) {
      const data = await response.json()
      if (data.bot) {
        setBots((current) => current.map((item) => (item.id === id ? data.bot : item)))
      }
    }
  }

  async function handleSaveCommand(data: CommandItem) {
    setSavingCmd(true)
    try {
      const res = await fetch('/api/commands', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        setCmdModal(false)
        setEditingCmd(null)
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

  const filteredBots = useMemo(
    () => bots.filter((bot) => `${bot.name} ${bot.username || ''}`.toLowerCase().includes(query.toLowerCase())),
    [bots, query]
  )
  const runningCount = bots.filter((b) => ['running', 'connected', 'active'].includes((b.status || '').toLowerCase())).length
  const stoppedCount = bots.length - runningCount
  const maxChartVal = Math.max(...chartData.map((d) => d.count), 5)

  if (!pinVerified && pinDialog) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl text-center text-foreground">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-primary border border-primary/30">
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
            <button type="submit" className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition">
              Verifikasi PIN →
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout
      activeTab={activeTab}
      setActiveTab={(t) => setActiveTab(t)}
      user={user}
      botsCount={bots.length}
      logsCount={logs.length}
      live={live}
      query={query}
      setQuery={setQuery}
    >
      {loading && !user && (
        <div className="loading-card" role="status">
          <PuzzleSpinner size="sm" />
          <span>Loading your workspace...</span>
        </div>
      )}
      {loadError && (
        <div className="load-error" role="status">
          <span>{loadError}</span>
          <button type="button" onClick={() => load()} className="load-error-action">Retry</button>
        </div>
      )}

      {/* System Metrics */}
      {systemMetrics && (
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs">
          <Card className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary"><HardDrive size={18} /></div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-bold">RAM Memory</span>
              <p className="font-bold">{systemMetrics.memory.used} / {systemMetrics.memory.total} ({systemMetrics.memory.percentage}%)</p>
            </div>
          </Card>
          <Card className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500"><Cpu size={18} /></div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-bold">CPU Load ({systemMetrics.cpu.cores} Cores)</span>
              <p className="font-bold truncate max-w-[150px]">{systemMetrics.cpu.model}</p>
            </div>
          </Card>
          <Card className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500"><Server size={18} /></div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-bold">Node.js & OS Specs</span>
              <p className="font-bold">{systemMetrics.nodeVersion} · {systemMetrics.os.split(' ')[0]}</p>
            </div>
          </Card>
          <Card className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-500"><Radio size={18} /></div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-bold">Server IP Address</span>
              <p className="font-bold font-mono">{systemMetrics.ipAddress}</p>
            </div>
          </Card>
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

          <BotStats
            totalBots={bots.length}
            runningBots={runningCount}
            stoppedBots={stoppedCount}
            totalCommands={bots.reduce((sum, b) => sum + (b.commands || 0), 0)}
            userRole={user?.role}
          />

          <Card className="panel chart-panel my-6 p-6">
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
                      className="w-full bg-primary/20 group-hover:bg-primary/50 transition-all rounded-t-lg"
                      style={{ height: `${heightPercent}%` }}
                    />
                    <span className="text-xs font-medium text-muted-foreground">{pt.label}</span>
                  </div>
                )
              })}
            </div>
          </Card>
        </>
      )}

      {/* BOTS TAB */}
      {(activeTab === 'overview' || activeTab === 'bots') && (
        <section className="panel bots-panel my-6" id="bots">
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
            <EmptyState
              icon={<TerminalSquare size={24} />}
              title={query ? 'No bots found' : 'Your workspace is ready'}
              description={query ? 'Try another search term.' : 'Connect your first Telegram bot to start receiving live webhook messages here.'}
              action={!query ? <button className="primary-button" onClick={() => setModal(true)}>Connect your first bot</button> : null}
            />
          ) : (
            <div className="bot-list">
              {filteredBots.map((bot) => (
                <BotCard
                  key={bot.id}
                  bot={bot}
                  onStart={(id) => botAction(id, 'start')}
                  onStop={(id) => botAction(id, 'stop')}
                  onRestart={(id) => botAction(id, 'restart')}
                  onDelete={(id) => removeBot(id)}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* COMMANDS TAB */}
      {(activeTab === 'overview' || activeTab === 'commands') && (
        <Card className="panel commands-panel my-6 p-6" id="commands">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="section-kicker flex items-center gap-1.5 text-xs text-primary font-semibold"><Command size={15} /> COMMAND EDITOR</div>
              <h2 className="text-xl font-bold">Custom Bot Commands Table</h2>
            </div>
            <button
              className="primary-button compact"
              onClick={() => { setEditingCmd(null); setCmdModal(true) }}
            >
              <Plus size={15} /> Create Command
            </button>
          </div>

          {commandsList.length === 0 ? (
            <EmptyState
              icon={<Command size={24} />}
              title="No Commands Yet"
              description="Belum ada command custom. Klik 'Create Command' untuk menambahkan menu atau tombol baru."
              action={<button className="primary-button compact" onClick={() => { setEditingCmd(null); setCmdModal(true) }}>+ Create Command</button>}
            />
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
                      <td className="p-3"><Badge variant="primary">{cmd.mode}</Badge></td>
                      <td className="p-3">{cmd.limit === -1 ? 'Unlimited' : `${cmd.usageCount}/${cmd.limit}`}</td>
                      <td className="p-3 font-semibold">{cmd.responseType}</td>
                      <td className="p-3 uppercase font-bold">{cmd.allowedRole || 'user'}</td>
                      <td className="p-3">{cmd.aiSessionMode ? <Badge variant="success">Enabled</Badge> : <Badge variant="default">Disabled</Badge>}</td>
                      <td className="p-3 text-right space-x-2">
                        <button onClick={() => { setEditingCmd(cmd); setCmdModal(true) }} className="text-primary hover:underline font-semibold">Edit</button>
                        <button onClick={() => handleDeleteCommand(cmd.id)} className="text-destructive hover:underline font-semibold">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* DATABASE INFO TAB */}
      {activeTab === 'database' && (
        <Card className="panel my-6 p-6 space-y-4">
          <div className="flex items-center gap-2 text-primary font-bold"><Database size={20} /> MongoDB Collection Stats</div>
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
        </Card>
      )}

      {/* CONNECTION & LOGS TAB */}
      {(activeTab === 'overview' || activeTab === 'connection') && (
        <div className="my-6">
          <LogTable logs={logs} />
        </div>
      )}

      {/* AI SESSION TAB */}
      {activeTab === 'session' && (
        <GeminiSession
          apiKey={user?.geminiApiKey || ''}
          userRole={user?.role}
          logs={geminiLogs}
          onSaveKey={async (key) => {
            await fetch('/api/profile', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ geminiApiKey: key }),
            })
          }}
          onValidateKey={async (key) => {
            const res = await fetch('/api/gemini/validate-key', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ apiKey: key }),
            })
            return await res.json()
          }}
        />
      )}

      {/* RPG TAB */}
      {activeTab === 'rpg' && (
        <RPGDashboard players={rpgPlayers} />
      )}

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
            <p className="modal-copy">Paste your BotFather token. Gateway registers webhooks in stopped state by default.</p>
            <form onSubmit={addBot} className="bot-form">
              <label>
                Bot name
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Support Bot" required />
              </label>
              <label>
                BotFather token
                <input value={token} onChange={(e) => setToken(e.target.value)} placeholder="123456789:ABCdef..." required />
              </label>
              {error && <p className="form-error">{error}</p>}
              <button className="primary-button full" type="submit" disabled={adding}>
                {adding ? <PuzzleSpinner size="sm" /> : 'Connect Bot →'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Command Editor Modal */}
      <CommandEditor
        open={cmdModal}
        onClose={() => setCmdModal(false)}
        initialData={editingCmd}
        onSave={handleSaveCommand}
        saving={savingCmd}
      />
    </DashboardLayout>
  )
}
