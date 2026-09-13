'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Bot, Check, ChevronRight, Command, Menu, MessageCircle, ShieldCheck, Sparkles, Terminal, X } from 'lucide-react'

const features = [
  { icon: Bot, title: 'Multi-bot control', text: 'Connect every Telegram bot from one calm, focused workspace.' },
  { icon: Command, title: 'Smart commands', text: 'Create, test, and ship commands without touching a webhook.' },
  { icon: ShieldCheck, title: 'Private by default', text: 'Tokens are validated server-side and never shown in full.' },
]

const plans = [
  { name: 'Free Tier', role: 'free', price: 'Free', copy: 'Sempurna untuk mencoba platform gateway & testing bot sederhana.', features: ['Batas Maksimal 3 Bot', 'Command Custom Table', '7-Day Webhook Event Logs', 'Gemini AI Integration'] },
  { name: 'VIP Account', role: 'vip', price: '$9', copy: 'Ideal untuk pengembang yang mengelola beberapa bot aktif.', features: ['Batas Maksimal 10 Bot', 'RPG Game Engine Active', 'Gemini AI Session Context', 'Priority Execution Speed'], featured: true },
  { name: 'Premium Account', role: 'premium', price: '$29', copy: 'Untuk skala produksi bisnis & produk Telegram menengah.', features: ['Batas Maksimal 25 Bot', 'Unlimited Custom Commands', 'Database Export & Live Socket.io', 'Role Access Management'] },
  { name: 'Admin / Owner', role: 'admin', price: 'Custom', copy: 'Akses penuh tanpa batas untuk owner & administrator sistem.', features: ['Unlimited Bots Creation', 'Full Admin & Owner Permissions', 'Global Broadcast Messaging', 'Custom Domain & API Key Support'] },
]

export default function Page() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) setUser(data.user)
      })
      .catch(() => {})
  }, [])

  return (
    <main className="min-h-screen overflow-hidden bg-[#07131b] text-[#eef7f4]">
      <div className="pointer-events-none fixed inset-0 opacity-70 [background-image:linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] [background-size:64px_64px]" />
      <div className="pointer-events-none absolute left-1/2 top-[-18rem] h-[36rem] w-[58rem] -translate-x-1/2 rounded-full bg-[#12b981]/10 blur-[120px]" />
      <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
        <Link href="/" className="flex items-center gap-3 font-semibold tracking-tight"><span className="grid size-9 place-items-center rounded-xl bg-[#b7f36b] text-[#07131b]"><Terminal size={18} strokeWidth={2.5} /></span><span className="text-lg">dann<span className="text-[#b7f36b]">-</span>tele</span></Link>
        <nav className="hidden items-center gap-8 text-sm text-[#a9bbb9] md:flex"><Link href="#features" className="transition hover:text-white">Features</Link><Link href="#pricing" className="transition hover:text-white">Pricing</Link><Link href="/docs" className="transition hover:text-white">Docs</Link></nav>
        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-[#b7f36b]">Selamat datang, {user.name || user.email?.split('@')[0]} 👋🏻</span>
              <Link href="/dashboard" className="rounded-lg bg-[#b7f36b] px-4 py-2.5 text-sm font-semibold text-[#07131b] transition hover:bg-[#d2ff99]">Dashboard <ArrowRight className="ml-1 inline size-4" /></Link>
            </div>
          ) : (
            <>
              <Link href="/login" className="px-3 py-2 text-sm text-[#c9d8d5] hover:text-white">Log in</Link>
              <Link href="/register" className="rounded-lg bg-[#b7f36b] px-4 py-2.5 text-sm font-semibold text-[#07131b] transition hover:bg-[#d2ff99]">Start building <ArrowRight className="ml-1 inline size-4" /></Link>
            </>
          )}
        </div>
        <button aria-label="Open menu" className="rounded-lg border border-white/10 p-2 md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>{mobileOpen ? <X size={20} /> : <Menu size={20} />}</button>
      </header>
      {mobileOpen && (
        <div className="relative z-20 mx-6 flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#0d2029] p-5 md:hidden">
          <Link href="#features">Features</Link>
          <Link href="#pricing">Pricing</Link>
          <Link href="/docs">Docs</Link>
          {user ? (
            <>
              <span className="text-xs text-[#b7f36b]">Selamat datang, {user.name || user.email?.split('@')[0]} 👋🏻</span>
              <Link href="/dashboard" className="rounded-lg bg-[#b7f36b] px-4 py-2 text-center font-semibold text-[#07131b]">Dashboard</Link>
            </>
          ) : (
            <>
              <Link href="/login">Log in</Link>
              <Link href="/register" className="rounded-lg bg-[#b7f36b] px-4 py-2 text-center font-semibold text-[#07131b]">Start building</Link>
            </>
          )}
        </div>
      )}

      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-24 pt-20 lg:px-10 lg:pb-32 lg:pt-28">
        <div className="max-w-4xl"><div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#b7f36b]/25 bg-[#b7f36b]/8 px-3 py-1.5 text-xs font-medium text-[#c9f79a]"><Sparkles size={14} /> Telegram operations, simplified</div><h1 className="max-w-4xl text-balance text-5xl font-semibold leading-[1.02] tracking-[-.06em] sm:text-7xl lg:text-[6.9rem]">Your bots.<br /><span className="text-[#b7f36b]">Less busywork.</span></h1><p className="mt-8 max-w-xl text-pretty text-lg leading-8 text-[#a9bbb9]">dann-tele is the calm command center for Telegram builders. Connect bots, manage commands, and understand every message in one place.</p><div className="mt-10 flex flex-wrap gap-3"><Link href="/register" className="rounded-lg bg-[#b7f36b] px-5 py-3.5 font-semibold text-[#07131b] hover:bg-[#d2ff99]">Create your workspace <ArrowRight className="ml-2 inline size-4" /></Link><Link href="/docs" className="rounded-lg border border-white/15 px-5 py-3.5 font-medium text-[#d9e4e1] hover:bg-white/5">Read the docs</Link></div></div>
        <div className="mt-20 grid gap-4 sm:grid-cols-3"><div className="border-l border-[#b7f36b] pl-4"><p className="text-3xl font-semibold tracking-tight">2 min</p><p className="mt-1 text-sm text-[#819694]">to connect a bot</p></div><div className="border-l border-white/15 pl-4"><p className="text-3xl font-semibold tracking-tight">99.9%</p><p className="mt-1 text-sm text-[#819694]">webhook reliability</p></div><div className="border-l border-white/15 pl-4"><p className="text-3xl font-semibold tracking-tight">0 tokens</p><p className="mt-1 text-sm text-[#819694]">exposed in your UI</p></div></div>
      </section>

      <section id="features" className="relative z-10 border-y border-white/8 bg-[#0a1b23]/70"><div className="mx-auto max-w-7xl px-6 py-20 lg:px-10"><div className="mb-12 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="mb-3 text-xs font-semibold uppercase tracking-[.25em] text-[#b7f36b]">Everything in reach</p><h2 className="text-3xl font-semibold tracking-[-.03em] sm:text-5xl">A better home for your bots.</h2></div><p className="max-w-sm text-sm leading-6 text-[#819694]">From first connection to production monitoring, stay close to the work that matters.</p></div><div className="grid gap-4 md:grid-cols-3">{features.map(({ icon: Icon, title, text }) => <div key={title} className="rounded-2xl border border-white/10 bg-white/[.035] p-6 transition hover:-translate-y-1 hover:border-[#b7f36b]/40"><div className="mb-12 grid size-10 place-items-center rounded-xl bg-[#b7f36b]/10 text-[#b7f36b]"><Icon size={20} /></div><h3 className="text-xl font-semibold">{title}</h3><p className="mt-3 text-sm leading-6 text-[#91a6a2]">{text}</p><ChevronRight className="mt-8 size-5 text-[#b7f36b]" /></div>)}</div></div></section>

      <section id="pricing" className="relative z-10 mx-auto max-w-7xl px-6 py-24 lg:px-10"><div className="mb-12 text-center"><p className="mb-3 text-xs font-semibold uppercase tracking-[.25em] text-[#b7f36b]">Web Account Roles & Pricing</p><h2 className="text-3xl font-semibold tracking-[-.03em] sm:text-5xl">Disesuaikan dengan Hak Akses Web.</h2></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{plans.map(plan => <div key={plan.name} className={`rounded-2xl border p-6 flex flex-col justify-between ${plan.featured ? 'border-[#b7f36b]/60 bg-[#b7f36b]/[.08]' : 'border-white/10 bg-white/[.035]'}`}><div className="space-y-4"><div className="flex items-center justify-between"><h3 className="text-lg font-semibold">{plan.name}</h3>{plan.featured && <span className="rounded-full bg-[#b7f36b] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#07131b]">Best Value</span>}</div><p className="text-3xl font-semibold tracking-tight">{plan.price}</p><p className="text-xs leading-5 text-[#91a6a2]">{plan.copy}</p><ul className="space-y-2.5 border-t border-white/10 pt-4 text-xs text-[#c9d8d5]">{plan.features.map(feature => <li key={feature} className="flex items-center"><Check className="mr-2 inline size-3.5 text-[#b7f36b]" />{feature}</li>)}</ul></div><Link href="/register" className="mt-6 block rounded-lg border border-white/15 px-4 py-2.5 text-center text-xs font-semibold hover:bg-white/5">Pilih Role {plan.name}</Link></div>)}</div></section>
      <footer className="relative z-10 border-t border-white/8 px-6 py-8 lg:px-10"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 text-sm text-[#819694] sm:flex-row"><span>© 2026 dann-tele</span><div className="flex gap-5"><Link href="/about" className="hover:text-white">About</Link><Link href="/docs" className="hover:text-white">API docs</Link><a href="https://github.com" className="hover:text-white" aria-label="GitHub">GH</a><a href="https://t.me" className="hover:text-white"><MessageCircle size={16} /></a></div></div></footer>
    </main>
  )
}
