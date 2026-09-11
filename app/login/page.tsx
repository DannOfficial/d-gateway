'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { LockKeyhole } from 'lucide-react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGoogle, faGithub } from '@fortawesome/free-brands-svg-icons'
import { authClient } from '@/lib/auth-client'
import { PuzzleSpinner } from '@/components/ui/puzzle-spinner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [providerLoading, setProviderLoading] = useState<'google' | 'github' | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Unable to sign in. Check your email/password.')
        setLoading(false)
        return
      }
      window.location.assign('/callback')
    } catch {
      setError('An error occurred during login.')
      setLoading(false)
    }
  }

  async function signIn(provider: 'google' | 'github') {
    setError('')
    setProviderLoading(provider)
    try {
      const result = await authClient.signIn.social({ provider, callbackURL: '/callback' })
      if (result.error) {
        setError('This provider is unavailable. Check your OAuth setup or configuration.')
        setProviderLoading(null)
      }
    } catch {
      setError('Failed to initiate social login.')
      setProviderLoading(null)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 py-8 text-foreground">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl sm:p-8">
        <Link href="/" className="text-sm text-primary transition-colors hover:text-primary/80">← back to dann-tele</Link>
        <div className="mt-8 flex size-11 items-center justify-center rounded-xl bg-primary/15 text-primary"><LockKeyhole size={20} /></div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">Welcome back.</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Log in to your bot workspace and keep your automations moving.</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => signIn('google')}
            disabled={Boolean(providerLoading) || loading}
            className="inline-flex items-center justify-center gap-2.5 rounded-lg border border-border bg-muted/30 px-3 py-3 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            {providerLoading === 'google' ? <PuzzleSpinner size="sm" /> : <FontAwesomeIcon icon={faGoogle} className="size-4 text-red-500" />} Google
          </button>
          <button
            type="button"
            onClick={() => signIn('github')}
            disabled={Boolean(providerLoading) || loading}
            className="inline-flex items-center justify-center gap-2.5 rounded-lg border border-border bg-muted/30 px-3 py-3 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            {providerLoading === 'github' ? <PuzzleSpinner size="sm" /> : <FontAwesomeIcon icon={faGithub} className="size-4 text-foreground" />} GitHub
          </button>
        </div>

        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or continue with email<span className="h-px flex-1 bg-border" /></div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm">Email
            <input required value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" className="mt-1.5 w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-ring" />
          </label>
          <label className="block text-sm">Password
            <input required value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" className="mt-1.5 w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-ring" />
          </label>
          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
          <button disabled={loading || Boolean(providerLoading)} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? <PuzzleSpinner size="sm" /> : 'Log in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">New here? <Link href="/register" className="text-primary hover:underline">Create an account</Link></p>
      </div>
    </main>
  )
}
