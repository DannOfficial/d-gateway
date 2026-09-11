'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { authClient } from '@/lib/auth-client'

export default function RegisterPage() {
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [loading, setLoading] = useState(false)
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError('')
    const result = await authClient.signUp.email({ name, email, password, callbackURL: '/dashboard' })
    if (result.error) setError('Unable to create account. Check your details and try again.')
    else window.location.href = '/login?registered=1'
    setLoading(false)
  }
  return <main className="grid min-h-screen place-items-center bg-background px-6 text-foreground"><div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-2xl"><Link href="/" className="text-sm text-primary">← back to dann-tele</Link><h1 className="mt-10 text-3xl font-semibold">Build a calmer workspace.</h1><p className="mt-2 text-sm text-muted-foreground">Create your dann-tele account.</p><form className="mt-8 space-y-4" onSubmit={handleSubmit}><label className="block text-sm">Name<input required value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full rounded-lg border border-input bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-ring" /></label><label className="block text-sm">Email<input required value={email} onChange={(event) => setEmail(event.target.value)} type="email" className="mt-2 w-full rounded-lg border border-input bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-ring" /></label><label className="block text-sm">Password<input required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} type="password" className="mt-2 w-full rounded-lg border border-input bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-ring" /></label>{error && <p className="text-sm text-red-300" role="alert">{error}</p>}<button disabled={loading} className="w-full rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground disabled:opacity-60">{loading ? 'Creating workspace…' : 'Create workspace'}</button></form><p className="mt-6 text-center text-sm text-muted-foreground">Already have an account? <Link href="/login" className="text-primary">Log in</Link></p></div></main>
}
