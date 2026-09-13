'use client'

import React from 'react'
import Link from 'next/link'
import { Menu, Search, Sun, Moon, Bell, ChevronDown, User as UserIcon, Settings, LogOut } from 'lucide-react'

interface NavbarProps {
  activeTab: string
  user: { name?: string; email?: string; role?: string } | null
  query: string
  setQuery: (query: string) => void
  dark: boolean
  toggleTheme: () => void
  notificationsOpen: boolean
  setNotificationsOpen: (open: boolean) => void
  profileDropdownOpen: boolean
  setProfileDropdownOpen: (open: boolean) => void
  setMobileOpen: (open: boolean) => void
  logsCount: number
  logout: () => void
}

export function Navbar({
  activeTab,
  user,
  query,
  setQuery,
  dark,
  toggleTheme,
  notificationsOpen,
  setNotificationsOpen,
  profileDropdownOpen,
  setProfileDropdownOpen,
  setMobileOpen,
  logsCount,
  logout,
}: NavbarProps) {
  return (
    <header className="topbar">
      <button className="menu-button" onClick={() => setMobileOpen(true)} aria-label="Open menu">
        <Menu size={20} />
      </button>
      <div className="crumb">
        <span>Workspace</span><b>/</b><strong className="capitalize">{activeTab}</strong>
      </div>
      <div className="top-actions">
        <div className="search-box">
          <Search size={16} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search bots..." />
        </div>
        <button className="icon-button" aria-label="Toggle theme" aria-pressed={!dark} onClick={toggleTheme}>
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <div className="dropdown-anchor relative">
          <button
            className="icon-button"
            aria-label="Notifications"
            aria-expanded={notificationsOpen}
            onClick={() => {
              setNotificationsOpen(!notificationsOpen)
              setProfileDropdownOpen(false)
            }}
          >
            <Bell size={18} />
            {logsCount > 0 && <i />}
          </button>
          {notificationsOpen && (
            <div className="dropdown-card notification-card">
              <b className="text-sm">Notifications</b>
              <p className="mt-2 text-xs text-muted-foreground">
                {logsCount ? `${logsCount} recent webhook events` : 'No new notifications.'}
              </p>
            </div>
          )}
        </div>

        <div className="dropdown-anchor relative">
          <button
            className="profile-chip"
            aria-expanded={profileDropdownOpen}
            onClick={() => {
              setProfileDropdownOpen(!profileDropdownOpen)
              setNotificationsOpen(false)
            }}
          >
            <span className="avatar small">{(user?.name || 'D').slice(0, 1).toUpperCase()}</span>
            <span className="profile-name">{user?.name || 'User'}</span>
            <ChevronDown size={15} />
          </button>

          {profileDropdownOpen && (
            <div className="dropdown-card profile-dropdown">
              <div className="border-b border-border pb-3">
                <p className="font-bold text-sm truncate">{user?.name || 'Developer'}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email || 'email@example.com'}</p>
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-primary/20 font-bold uppercase text-primary border border-primary/20">
                    {user?.role || 'free'}
                  </span>
                  <span className="text-emerald-500 font-medium">Workspace Active</span>
                </div>
              </div>
              <div className="space-y-1 text-xs pt-1">
                <Link
                  href="/profile"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted font-medium transition"
                >
                  <UserIcon size={14} /> Profile & Security Settings
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted font-medium transition"
                >
                  <Settings size={14} /> Bot Settings
                </Link>
                <button
                  onClick={logout}
                  className="w-full text-left flex items-center gap-2 p-2 rounded-lg hover:bg-destructive/10 text-destructive font-medium transition"
                >
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
