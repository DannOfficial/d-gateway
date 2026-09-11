'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGoogle, faGithub } from '@fortawesome/free-brands-svg-icons'
import { authClient } from '@/lib/auth-client'
import { PuzzleSpinner } from '@/components/ui/puzzle-spinner'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [providerLoading, setProviderLoading] = useState<'google' | 'github' | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Unable to create account.')
        setLoading(false)
        return
      }
      setSuccess('Account created! A verification link has been sent to your Gmail inbox. Please verify your email before logging in.')
      setName('')
      setEmail('')
      setPassword('')
    } catch {
      setError('An error occurred during registration.')
    } finally {
      setLoading(false)
    }
  }

  function signUpSocial(provider: 'google' | 'github') {
    setProviderLoading(provider)
    window.location.assign(`/api/auth/${provider}`)
  }

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 py-8 text-foreground">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl sm:p-8">
        <Link href="/" className="text-sm text-primary transition-colors hover:text-primary/80">← back to dann-tele</Link>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">Build a calmer workspace.</h1>
        <p className="mt-2 text-sm text-muted-foreground">Create your dann-tele account.</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => signUpSocial('google')}
            disabled={Boolean(providerLoading) || loading}
            className="inline-flex items-center justify-center gap-2.5 rounded-lg border border-border bg-muted/30 px-3 py-3 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            {providerLoading === 'google' ? <PuzzleSpinner size="sm" /> : <FontAwesomeIcon icon={faGoogle} className="size-4 text-red-500" />} Google
          </button>
          <button
            type="button"
            onClick={() => signUpSocial('github')}
            disabled={Boolean(providerLoading) || loading}
            className="inline-flex items-center justify-center gap-2.5 rounded-lg border border-border bg-muted/30 px-3 py-3 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            {providerLoading === 'github' ? <PuzzleSpinner size="sm" /> : <FontAwesomeIcon icon={faGithub} className="size-4 text-foreground" />} GitHub
          </button>
        </div>

        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or sign up with email<span className="h-px flex-1 bg-border" /></div>

        {success ? (
          <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 text-center text-sm text-primary">
            <p className="font-semibold">{success}</p>
            <Link href="/login" className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground hover:bg-primary/90">
              Go to Login
            </Link>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block text-sm">Full Name
              <input required value={name} onChange={(event) => setName(event.target.value)} className="mt-1.5 w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-ring" placeholder="Dann Dev" />
            </label>
            <label className="block text-sm">Email Address
              <input required value={email} onChange={(event) => setEmail(event.target.value)} type="email" className="mt-1.5 w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-ring" placeholder="user@gmail.com" />
            </label>
            <label className="block text-sm">Password
              <input required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} type="password" className="mt-1.5 w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-ring" placeholder="At least 8 characters" />
            </label>
            {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
            <button disabled={loading || Boolean(providerLoading)} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? <PuzzleSpinner size="sm" /> : 'Create workspace'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">Already have an account? <Link href="/login" className="text-primary hover:underline">Log in</Link></p>
      </div>
    </main>
  )
}
