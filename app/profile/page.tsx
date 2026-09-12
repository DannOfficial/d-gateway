'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, User, Shield, Key, Download } from 'lucide-react'
import { PuzzleSpinner } from '@/components/ui/puzzle-spinner'

export default function ProfilePage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [twoFactor, setTwoFactor] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setName(data.user.name || '')
          setEmail(data.user.email || '')
          setTwoFactor(Boolean(data.user.twoFactorEnabled))
        }
      })
      .finally(() => setLoading(false))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, email, password: password || undefined, twoFactorEnabled: twoFactor }),
      })
      const data = await res.json()
      setMessage(data.message || data.error || 'Profile updated.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-background text-foreground">
        <PuzzleSpinner size="lg" />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background p-6 text-foreground md:p-12">
      <div className="mx-auto max-w-2xl">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <h1 className="mt-4 text-3xl font-bold">User Profile</h1>
        <p className="text-sm text-muted-foreground">Manage your account credentials, security preferences, and data exports.</p>

        <form onSubmit={handleSave} className="mt-8 space-y-6 rounded-2xl border border-border bg-card p-6 shadow-xl">
          <div className="space-y-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold"><User size={18} /> General Account Info</h2>
            <label className="block text-sm">Full Name
              <input value={name} onChange={(e) => setName(e.target.value)} required className="mt-1.5 w-full rounded-lg border border-input bg-background p-2.5 text-sm" />
            </label>
            <label className="block text-sm">Email Address
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="mt-1.5 w-full rounded-lg border border-input bg-background p-2.5 text-sm" />
            </label>
          </div>

          <div className="space-y-4 border-t border-border pt-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold"><Key size={18} /> Security & Authentication</h2>
            <label className="block text-sm">New Password (leave blank to keep current)
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" minLength={8} className="mt-1.5 w-full rounded-lg border border-input bg-background p-2.5 text-sm" placeholder="••••••••" />
            </label>
            <label className="flex items-center gap-3 rounded-lg border border-border p-3 text-sm">
              <input type="checkbox" checked={twoFactor} onChange={(e) => setTwoFactor(e.target.checked)} />
              <span>Enable Two-Factor Authentication (2FA)</span>
            </label>
          </div>

          <div className="border-t border-border pt-6 flex items-center justify-between">
            <a href="/api/db/export" download className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted">
              <Download size={16} /> Export Workspace JSON
            </a>
            <button type="submit" disabled={saving} className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
              {saving ? <PuzzleSpinner size="sm" /> : 'Save Profile'}
            </button>
          </div>
          {message && <p className="text-center text-sm text-primary font-medium">{message}</p>}
        </form>
      </div>
    </main>
  )
}
