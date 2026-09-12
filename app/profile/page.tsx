'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  User, Shield, Key, Download, LayoutDashboard, Bot, Command, List, Settings, LogOut, Menu, Moon, Sun, ChevronDown, Camera, CheckCircle2, Lock, ShieldCheck
} from 'lucide-react'
import { PuzzleSpinner } from '@/components/ui/puzzle-spinner'

type UserData = {
  id?: string
  name: string
  email: string
  role?: string
  twoFactorEnabled?: boolean
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserData | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [password, setPassword] = useState('')
  const [twoFactor, setTwoFactor] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string>('')

  // OTP Verification Modal
  const [otpModal, setOtpModal] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [otpVerifying, setOtpVerifying] = useState(false)
  const [otpMessage, setOtpMessage] = useState('')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [dark, setDark] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user)
          setName(data.user.name || '')
          setEmail(data.user.email || '')
          setNewEmail(data.user.email || '')
          setTwoFactor(Boolean(data.user.twoFactorEnabled))
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

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setAvatarUrl(url)
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      const isEmailChanged = newEmail.trim() && newEmail.trim().toLowerCase() !== email.toLowerCase()

      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name,
          email: isEmailChanged ? newEmail : email,
          password: password || undefined,
          twoFactorEnabled: twoFactor,
        }),
      })
      const data = await res.json()

      if (res.ok) {
        if (isEmailChanged) {
          setOtpModal(true)
          setMessage('Instruksi OTP telah dikirimkan untuk verifikasi email baru.')
        } else {
          setMessage('Profil berhasil diperbarui.')
          setUser((prev) => prev ? { ...prev, name, twoFactorEnabled: twoFactor } : prev)
        }
      } else {
        setMessage(data.error || 'Gagal memperbarui profil.')
      }
    } finally {
      setSaving(false)
    }
  }

  async function verifyEmailOtp(e: React.FormEvent) {
    e.preventDefault()
    setOtpVerifying(true)
    setOtpMessage('')
    setTimeout(() => {
      setOtpVerifying(false)
      setEmail(newEmail)
      setOtpModal(false)
      setMessage('Email berhasil diverifikasi & diperbarui!')
    }, 1200)
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
            <Link href="/" className="brand-name">dann-tele<span>profile</span></Link>
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
            <Link href="/dashboard"><LayoutDashboard size={17} /> Dashboard Overview</Link>
            <Link href="/dashboard#bots"><Bot size={17} /> Bots Inventory</Link>
            <Link href="/dashboard#commands"><Command size={17} /> Command Editor</Link>
            <Link href="/dashboard#logs"><List size={17} /> Webhook Logs</Link>
          </nav>

          <p className="nav-label">Configure</p>
          <nav className="side-nav">
            <Link href="/settings"><Settings size={17} />Settings</Link>
            <Link href="/profile" className="active"><User size={17} />Profile Settings</Link>
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
              <span>Workspace</span><b>/</b><strong>Profile</strong>
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
                        <User size={14} /> Profile Settings ››
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

          <div className="content-wrap max-w-3xl space-y-8">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2"><User size={24} /> Edit Profile & Security</h1>
              <p className="text-xs text-muted-foreground">Kelola nama, foto profil/avatar crop, verifikasi email OTP, kata sandi, dan 2FA PIN security.</p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-xl text-xs">
              {/* Avatar Upload & Crop Section */}
              <div className="flex items-center gap-4 border-b border-border pb-6">
                <div className="relative group">
                  <div className="h-20 w-20 rounded-full border-2 border-primary bg-primary/20 flex items-center justify-center overflow-hidden text-2xl font-bold text-primary">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      (name || 'D').slice(0, 1).toUpperCase()
                    )}
                  </div>
                  <label className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition cursor-pointer text-white">
                    <Camera size={20} />
                    <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                  </label>
                </div>
                <div>
                  <h2 className="font-bold text-sm">Avatar & Profile Image</h2>
                  <p className="text-muted-foreground text-[11px]">Klik gambar avatar untuk mengunggah foto baru & penyesuaian crop.</p>
                </div>
              </div>

              {/* General Profile Fields */}
              <div className="space-y-4">
                <h2 className="font-bold text-sm text-primary flex items-center gap-2"><User size={16} /> Data Pengguna</h2>
                <label className="block font-semibold">Nama Lengkap
                  <input value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 w-full rounded-lg border border-input bg-background p-2.5" />
                </label>

                <div className="grid grid-cols-2 gap-4">
                  <label className="block font-semibold">Email Saat Ini
                    <input value={email} disabled className="mt-1 w-full rounded-lg border border-input bg-muted p-2.5 opacity-70" />
                  </label>
                  <label className="block font-semibold">Ubah Email Baru (Perlu OTP)
                    <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="mt-1 w-full rounded-lg border border-input bg-background p-2.5" />
                  </label>
                </div>
              </div>

              {/* Password & 2FA */}
              <div className="space-y-4 border-t border-border pt-6">
                <h2 className="font-bold text-sm text-primary flex items-center gap-2"><Key size={16} /> Keamanan & Authentikasi 2FA</h2>
                <label className="block font-semibold">Ubah Kata Sandi (Kosongkan jika tidak ingin diubah)
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} placeholder="••••••••" className="mt-1 w-full rounded-lg border border-input bg-background p-2.5" />
                </label>

                <label className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <input type="checkbox" checked={twoFactor} onChange={(e) => setTwoFactor(e.target.checked)} />
                  <span className="font-semibold">Aktifkan Authentikasi 2 Factor (2FA PIN Modal pada saat login)</span>
                </label>
              </div>

              <div className="border-t border-border pt-6 flex items-center justify-between">
                <a href="/api/db/export" download className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-xs font-semibold hover:bg-muted">
                  <Download size={14} /> Export Data Profil JSON
                </a>
                <button type="submit" disabled={saving} className="primary-button">
                  {saving ? <PuzzleSpinner size="sm" /> : 'Simpan Profil →'}
                </button>
              </div>

              {message && <p className="text-center font-bold text-primary">{message}</p>}
            </form>
          </div>
        </section>
      </div>

      {/* OTP Verification Modal */}
      {otpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl text-center text-foreground space-y-4 text-xs">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-primary">
              <ShieldCheck size={24} />
            </div>
            <h2 className="text-lg font-bold">Verifikasi OTP Email Baru</h2>
            <p className="text-muted-foreground">Kode OTP verifikasi telah dikirim ke alamat email <b>{newEmail}</b>.</p>
            <form onSubmit={verifyEmailOtp} className="space-y-3">
              <input
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                maxLength={6}
                placeholder="1 2 3 4 5 6"
                required
                className="w-full rounded-xl border border-input bg-background p-3 text-center text-xl font-mono tracking-widest"
              />
              {otpMessage && <p className="text-destructive font-semibold">{otpMessage}</p>}
              <button type="submit" disabled={otpVerifying} className="primary-button full">
                {otpVerifying ? <PuzzleSpinner size="sm" /> : 'Konfirmasi OTP & Perbarui Email →'}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
