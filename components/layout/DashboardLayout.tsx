'use client'

import React, { useState } from 'react'
import { Sidebar } from './Sidebar'
import { Navbar } from './Navbar'

export interface DashboardLayoutProps {
  children: React.ReactNode
  activeTab?: string
  setActiveTab?: (tab: any) => void
  user?: any
  botsCount?: number
  logsCount?: number
  live?: boolean
  query?: string
  setQuery?: (q: string) => void
  logout?: () => void
}

export function DashboardLayout({
  children,
  activeTab = 'overview',
  setActiveTab = () => {},
  user,
  botsCount = 0,
  logsCount = 0,
  live = true,
  query = '',
  setQuery = () => {},
  logout = async () => {
    await fetch('/api/auth/me', { method: 'DELETE' })
    window.location.href = '/login'
  },
}: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dark, setDark] = useState(true)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)

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

  return (
    <main className="min-h-screen app-bg text-foreground">
      <div className="dashboard-grid">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
          user={user}
          botsCount={botsCount}
          live={live}
          logout={logout}
        />

        <section className="main-column">
          <Navbar
            activeTab={activeTab}
            user={user}
            query={query}
            setQuery={setQuery}
            dark={dark}
            toggleTheme={toggleTheme}
            notificationsOpen={notificationsOpen}
            setNotificationsOpen={setNotificationsOpen}
            profileDropdownOpen={profileDropdownOpen}
            setProfileDropdownOpen={setProfileDropdownOpen}
            setMobileOpen={setMobileOpen}
            logsCount={logsCount}
            logout={logout}
          />

          <div className="content-wrap space-y-6">
            {children}
          </div>
        </section>
      </div>
    </main>
  )
}
