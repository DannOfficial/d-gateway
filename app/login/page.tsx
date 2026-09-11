'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { GitBranch, Globe, LoaderCircle, LockKeyhole } from 'lucide-react'
import { authClient } from '@/lib/auth-client'

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
    const result = await authClient.signIn.email({ email: email.trim(), password, callbackURL: '/callback' })
    if (result.error) {
      setError('Unable to sign in. Check your details or verify your email.')
      setLoading(false)
      return
    }
    window.location.assign('/callback')
  }

  async function signIn(provider: 'google' | 'github') {
    setError('')
    setProviderLoading(provider)
    const result = await authClient.signIn.social({ provider, callbackURL: '/callback' })
    if (result.error) {
      setError('This provider is unavailable. Check the OAuth configuration and try again.')
      setProviderLoading(null)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 py-8 text-foreground">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl sm:p-8">
        <Link href="/" className="text-sm text-primary transition-colors hover:text-primary/80">← back to dann-tele</Link>
        <div className="mt-10 flex size-11 items-center justify-center rounded-xl bg-primary/15 text-primary"><LockKeyhole size={20} /></div>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight">Welcome back.</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Log in to your bot workspace and keep your automations moving.</p>
        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={() => signIn('google')} disabled={Boolean(providerLoading) || loading} className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-3 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60">
            {providerLoading === 'google' ? <LoaderCircle size={17} className="animate-spin" /> : <Globe size={17} />} Google
          </button>
          <button type="button" onClick={() => signIn('github')} disabled={Boolean(providerLoading) || loading} className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-3 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60">
            {providerLoading === 'github' ? <LoaderCircle size={17} className="animate-spin" /> : <GitBranch size={17} />} GitHub
          </button>
        </div>
        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or email<span className="h-px flex-1 bg-border" /></div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm">Email<input required value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" className="mt-2 w-full rounded-lg border border-input bg-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-ring" /></label>
          <label className="block text-sm">Password<input required value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" className="mt-2 w-full rounded-lg border border-input bg-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-ring" /></label>
          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
          <button disabled={loading || Boolean(providerLoading)} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60">{loading && <LoaderCircle size={17} className="animate-spin" />}{loading ? 'Logging in…' : 'Log in'}</button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">New here? <Link href="/register" className="text-primary hover:underline">Create an account</Link></p>
      </div>
    </main>
  )
}
