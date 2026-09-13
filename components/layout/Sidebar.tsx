'use client'

import React from 'react'
import Link from 'next/link'
import {
  LayoutDashboard, Bot, Command, Database, Activity, Sparkles, Settings, CircleHelp, LogOut, X, User
} from 'lucide-react'

interface SidebarProps {
  activeTab: string
  setActiveTab: (tab: any) => void
  mobileOpen: boolean
  setMobileOpen: (open: boolean) => void
  user: { name?: string; email?: string; role?: string } | null
  botsCount: number
  live: boolean
  logout: () => void
}

export function Sidebar({
  activeTab,
  setActiveTab,
  mobileOpen,
  setMobileOpen,
  user,
  botsCount,
  live,
  logout,
}: SidebarProps) {
  return (
    <>
      {mobileOpen && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

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
          <span className="rounded bg-primary/20 px-2 py-0.5 text-[10px] font-bold uppercase text-primary border border-primary/30">
            {user?.role || 'free'}
          </span>
        </div>

        <p className="nav-label">Navigation & Categories</p>
        <nav className="side-nav" aria-label="Dashboard sections">
          <button onClick={() => { setActiveTab('overview'); setMobileOpen(false) }} className={activeTab === 'overview' ? 'active' : ''}>
            <LayoutDashboard size={17} /> Overview
          </button>
          <button onClick={() => { setActiveTab('bots'); setMobileOpen(false) }} className={activeTab === 'bots' ? 'active' : ''}>
            <Bot size={17} /> Bots {botsCount > 0 && <span className="nav-badge">{botsCount}</span>}
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
        <nav className="side-nav" aria-label="Workspace configuration">
          <Link href="/settings"><Settings size={17} />Settings</Link>
          <Link href="/profile"><User size={17} />Profile</Link>
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
    </>
  )
}
