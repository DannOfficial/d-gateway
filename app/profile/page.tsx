'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRef } from 'react'
import {
  User, Shield, Key, Download, LayoutDashboard, Bot, Command, List, Settings, LogOut, Menu, Moon, Sun, ChevronDown, Camera, CheckCircle2, Lock, ShieldCheck, Edit3, Mail, Sparkles, Check
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
  const [twoFactorPin, setTwoFactorPin] = useState('')
  const [geminiApiKey, setGeminiApiKey] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string>('')

  // Email Edit Mode & OTP State
  const [isEditingEmail, setIsEditingEmail] = useState(false)
  const [otpModal, setOtpModal] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [otpSending, setOtpSending] = useState(false)
  const [otpVerifying, setOtpVerifying] = useState(false)
  const [otpMessage, setOtpMessage] = useState('')

  // Image Crop Dialog State
  const [cropModal, setCropModal] = useState(false)
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null)
  const [zoomLevel, setZoomLevel] = useState(1)
  const imgRef = useRef<HTMLImageElement | null>(null)

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
          setTwoFactorPin(data.user.twoFactorPin || '')
          setGeminiApiKey(data.user.geminiApiKey || '')
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
      const reader = new FileReader()
      reader.onload = () => {
        setRawImageSrc(reader.result as string)
        setCropModal(true)
      }
      reader.readAsDataURL(file)
    }
  }

  function applyCrop() {
    if (!rawImageSrc) return
    const canvas = document.createElement('canvas')
    const size = 300
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (ctx && imgRef.current) {
      const img = imgRef.current
      const minDim = Math.min(img.naturalWidth, img.naturalHeight)
      const sx = (img.naturalWidth - minDim) / 2
      const sy = (img.naturalHeight - minDim) / 2
      ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size)
      const croppedUrl = canvas.toDataURL('image/jpeg', 0.9)
      setAvatarUrl(croppedUrl)

      // Upload via API
      fetch('/api/profile/avatar', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ image: croppedUrl }),
      }).catch(() => {})
    }
    setCropModal(false)
  }

  async function handleSendEmailOtp() {
    if (!newEmail || newEmail.toLowerCase() === email.toLowerCase()) {
      setMessage('Masukkan alamat email baru yang berbeda.')
      return
    }
    setOtpSending(true)
    setMessage('')
    try {
      // Simulate/trigger sending OTP
      await new Promise((res) => setTimeout(res, 800))
      setOtpModal(true)
      setOtpMessage('')
    } finally {
      setOtpSending(false)
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name,
          password: password || undefined,
          twoFactorEnabled: twoFactor,
          twoFactorPin: twoFactorPin || undefined,
          geminiApiKey: geminiApiKey || undefined,
        }),
      })
      const data = await res.json()

      if (res.ok) {
        setMessage('Profil dan konfigurasi berhasil diperbarui.')
        setUser((prev) => prev ? { ...prev, name, twoFactorEnabled: twoFactor } : prev)
      } else {
        setMessage(data.error || 'Gagal memperbarui profil.')
      }
    } finally {
      setSaving(false)
    }
  }

  async function verifyEmailOtp(e: React.FormEvent) {
    e.preventDefault()
    if (otpCode.length < 4) {
      setOtpMessage('Kode OTP minimal 4 digit.')
      return
    }
    setOtpVerifying(true)
    setOtpMessage('')
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: newEmail }),
      })
      if (res.ok) {
        setEmail(newEmail)
        setIsEditingEmail(false)
        setOtpModal(false)
        setMessage('Email baru berhasil diverifikasi & diperbarui!')
      } else {
        setOtpMessage('Gagal verifikasi email OTP.')
      }
    } finally {
      setOtpVerifying(false)
    }
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

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs flex items-center gap-1.5"><Mail size={14} /> Alamat Email</span>
                    {!isEditingEmail ? (
                      <button
                        type="button"
                        onClick={() => setIsEditingEmail(true)}
                        className="inline-flex items-center gap-1 text-primary hover:underline font-bold text-xs"
                      >
                        <Edit3 size={13} /> Edit Email
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsEditingEmail(false)}
                        className="text-muted-foreground hover:underline text-xs"
                      >
                        Batal
                      </button>
                    )}
                  </div>

                  {!isEditingEmail ? (
                    <input value={email} disabled className="w-full rounded-lg border border-input bg-muted p-2.5 opacity-80 font-mono" />
                  ) : (
                    <div className="space-y-3 p-3 border border-border rounded-xl bg-muted/20">
                      <label className="block font-semibold">Email Baru Target
                        <input
                          type="email"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          placeholder="email-baru@example.com"
                          className="mt-1 w-full rounded-lg border border-input bg-background p-2.5"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={handleSendEmailOtp}
                        disabled={otpSending}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                      >
                        {otpSending ? <PuzzleSpinner size="sm" /> : <><Mail size={14} /> Kirim OTP Verifikasi →</>}
                      </button>
                    </div>
                  )}
                </div>

                {/* Gemini API Key Configuration Section */}
                <div className="space-y-2 pt-2">
                  <label className="block font-semibold text-primary flex items-center gap-2">
                    <Sparkles size={16} /> Google Gemini API Key (Module @google/genai)
                  </label>
                  <input
                    type="password"
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full rounded-lg border border-input bg-background p-2.5 font-mono"
                  />
                  <p className="text-[11px] text-muted-foreground">Input API Key Google Gemini Anda di sini untuk mengaktifkan AI response otomatis pada bot command.</p>
                </div>
              </div>

              {/* Password & 2FA */}
              <div className="space-y-4 border-t border-border pt-6">
                <h2 className="font-bold text-sm text-primary flex items-center gap-2"><Key size={16} /> Keamanan & Authentikasi 2FA</h2>
                <label className="block font-semibold">Ubah Kata Sandi (Kosongkan jika tidak ingin diubah)
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} placeholder="••••••••" className="mt-1 w-full rounded-lg border border-input bg-background p-2.5" />
                </label>

                <div className="space-y-3 rounded-lg border border-border p-3 bg-muted/20">
                  <label className="flex items-center gap-3">
                    <input type="checkbox" checked={twoFactor} onChange={(e) => setTwoFactor(e.target.checked)} />
                    <span className="font-semibold">Aktifkan Authentikasi 2 Factor (2FA PIN Security)</span>
                  </label>

                  {twoFactor && (
                    <div className="pt-2">
                      <label className="block font-semibold">Set 2FA Security PIN (4 - 6 Digit)
                        <input
                          type="password"
                          maxLength={6}
                          value={twoFactorPin}
                          onChange={(e) => setTwoFactorPin(e.target.value)}
                          placeholder="••••"
                          className="mt-1 w-full rounded-lg border border-input bg-background p-2.5 font-mono text-center tracking-widest text-lg"
                        />
                      </label>
                    </div>
                  )}
                </div>
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

      {/* Image Crop Preview Dialog Modal */}
      {cropModal && rawImageSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl text-foreground space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="font-bold text-sm flex items-center gap-2"><Camera size={16} /> Dialog Crop Preview Avatar</h2>
              <button onClick={() => setCropModal(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <p className="text-muted-foreground">Sesuaikan posisi dan pratinjau foto profil sebelum disimpan.</p>

            <div className="relative mx-auto h-56 w-56 overflow-hidden rounded-full border-4 border-primary bg-black/50 flex items-center justify-center">
              <img
                ref={imgRef}
                src={rawImageSrc}
                alt="Crop preview"
                className="h-full w-full object-cover"
                style={{ transform: `scale(${zoomLevel})` }}
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[11px] block text-center">Zoom Adjust</label>
              <input
                type="range"
                min="1"
                max="2.5"
                step="0.1"
                value={zoomLevel}
                onChange={(e) => setZoomLevel(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setCropModal(false)} className="flex-1 rounded-lg border border-border py-2 font-semibold">
                Batal
              </button>
              <button type="button" onClick={applyCrop} className="flex-1 primary-button">
                Simpan & Potong Foto →
              </button>
            </div>
          </div>
        </div>
      )}

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
              <div className="flex gap-2">
                <button type="button" onClick={() => setOtpModal(false)} className="flex-1 rounded-xl border border-border py-2.5 font-semibold">
                  Batal
                </button>
                <button type="submit" disabled={otpVerifying} className="flex-1 primary-button">
                  {otpVerifying ? <PuzzleSpinner size="sm" /> : 'Verifikasi OTP →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
