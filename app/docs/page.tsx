'use client'

import Link from 'next/link'
import { useState } from 'react'
import { PuzzleSpinner } from '@/components/ui/puzzle-spinner'
import { Terminal, Play, CheckCircle, Code, Shield, Send, Copy, Sparkles } from 'lucide-react'

const ENDPOINTS = [
  {
    id: 'get-me',
    name: 'Get Current User Profile',
    method: 'GET',
    path: '/api/auth/me',
    desc: 'Retrieves the authenticated user details and active session status.',
    defaultBody: '',
  },
  {
    id: 'get-bots',
    name: 'List Workspace Bots',
    method: 'GET',
    path: '/api/bots',
    desc: 'Returns a list of all Telegram bots connected to the active user workspace.',
    defaultBody: '',
  },
  {
    id: 'add-bot',
    name: 'Connect Telegram Bot',
    method: 'POST',
    path: '/api/bots',
    desc: 'Validates BotFather token with Telegram API and sets up the webhook automatically.',
    defaultBody: JSON.stringify({ name: 'Support Bot', token: '123456789:ABCdefGHIjklMNOpqrSTUvwxyz' }, null, 2),
  },
  {
    id: 'validate-bot',
    name: 'Re-validate Bot & Sync Webhook',
    method: 'POST',
    path: '/api/bots/validate',
    desc: 'Re-checks Telegram Bot token validity and re-registers the webhook endpoint.',
    defaultBody: JSON.stringify({ botId: '65f1234567890abcdef12345' }, null, 2),
  },
  {
    id: 'profile-survey',
    name: 'Update User Profile / Survey',
    method: 'POST',
    path: '/api/profile',
    desc: 'Saves user profile preferences and "Kamu tahu Dann-Tele darimana?" survey source.',
    defaultBody: JSON.stringify({ surveySource: 'GitHub' }, null, 2),
  },
]

export default function DocsPage() {
  const [activeEndpoint, setActiveEndpoint] = useState(ENDPOINTS[0])
  const [requestBody, setRequestBody] = useState(ENDPOINTS[0].defaultBody)
  const [responseStatus, setResponseStatus] = useState<number | null>(null)
  const [responseData, setResponseData] = useState<string | null>(null)
  const [testing, setTesting] = useState(false)
  const [copied, setCopied] = useState(false)

  function selectEndpoint(ep: typeof ENDPOINTS[0]) {
    setActiveEndpoint(ep)
    setRequestBody(ep.defaultBody)
    setResponseStatus(null)
    setResponseData(null)
  }

  async function handleTestApi() {
    setTesting(true)
    setResponseStatus(null)
    setResponseData(null)

    const startTime = performance.now()

    try {
      const options: RequestInit = {
        method: activeEndpoint.method,
        headers: { 'content-type': 'application/json' },
      }

      if (['POST', 'PATCH', 'PUT'].includes(activeEndpoint.method) && requestBody.trim()) {
        options.body = requestBody
      }

      const res = await fetch(activeEndpoint.path, options)
      const endTime = performance.now()
      const duration = Math.round(endTime - startTime)

      setResponseStatus(res.status)
      let dataText = ''
      try {
        const json = await res.json()
        dataText = JSON.stringify(json, null, 2)
      } catch {
        dataText = await res.text()
      }

      setResponseData(`// Response time: ${duration}ms\n// Status: ${res.status} ${res.statusText}\n\n${dataText}`)
    } catch (err: any) {
      setResponseStatus(500)
      setResponseData(`// Request error:\n${err?.message || 'Network error'}`)
    } finally {
      setTesting(false)
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <main className="min-h-screen bg-[#07131b] text-[#eef7f4] px-4 py-8 md:px-12 lg:px-20">
      <div className="mx-auto max-w-6xl">
        {/* Header Nav */}
        <div className="flex items-center justify-between border-b border-white/10 pb-6">
          <Link href="/" className="flex items-center gap-2 font-bold tracking-tight text-lg hover:opacity-90">
            <span className="grid size-8 place-items-center rounded-lg bg-[#b7f36b] text-[#07131b]">
              <Terminal size={16} strokeWidth={2.5} />
            </span>
            dann<span className="text-[#b7f36b]">-</span>tele API Docs
          </Link>

          <Link href="/dashboard" className="rounded-lg bg-[#b7f36b] px-4 py-2 text-xs font-semibold text-[#07131b] hover:bg-[#d2ff99] transition">
            Go to Dashboard →
          </Link>
        </div>

        {/* Hero Section */}
        <div className="py-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#b7f36b]/30 bg-[#b7f36b]/10 px-3 py-1 text-xs font-semibold text-[#b7f36b]">
            <Sparkles size={14} /> Interactive API Reference & Playground
          </div>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
            Gateway API Documentation
          </h1>
          <p className="mt-3 max-w-2xl text-base text-[#91a6a2] leading-relaxed">
            Connect, validate, and query your Telegram bot fleet via high-performance REST endpoints. Test live API requests directly in your browser.
          </p>
        </div>

        {/* Documentation Sections Grid */}
        <div className="grid gap-6 md:grid-cols-3 mb-12">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="mb-4 grid size-9 place-items-center rounded-xl bg-[#b7f36b]/15 text-[#b7f36b]">
              <Shield size={18} />
            </div>
            <h3 className="text-lg font-semibold">1. Authentication</h3>
            <p className="mt-2 text-xs text-[#91a6a2] leading-relaxed">
              Requests require active cookie sessions or Authorization tokens. Sessions are created automatically via form or Google & GitHub OAuth.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="mb-4 grid size-9 place-items-center rounded-xl bg-[#63d6c5]/15 text-[#63d6c5]">
              <Send size={18} />
            </div>
            <h3 className="text-lg font-semibold">2. Webhook Integration</h3>
            <p className="mt-2 text-xs text-[#91a6a2] leading-relaxed">
              When a bot token is added, Dann-Tele automatically registers the Webhook URL with Telegram API (`/api/telegram/webhook/[botId]`).
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="mb-4 grid size-9 place-items-center rounded-xl bg-[#f4c95d]/15 text-[#f4c95d]">
              <Code size={18} />
            </div>
            <h3 className="text-lg font-semibold">3. Standard Response</h3>
            <p className="mt-2 text-xs text-[#91a6a2] leading-relaxed">
              All responses are returned as structured JSON payload with HTTP status codes 200 (Success), 400 (Bad Request), 401 (Unauthorized), or 422 (Unprocessable).
            </p>
          </div>
        </div>

        {/* Interactive API Tester Playground */}
        <div className="rounded-2xl border border-[#b7f36b]/30 bg-[#0d2029] p-6 sm:p-8 shadow-2xl">
          <div className="flex flex-col gap-2 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-[#b7f36b]">
                <Play size={14} /> LIVE API TESTER PLAYGROUND
              </div>
              <h2 className="mt-1 text-2xl font-bold tracking-tight">Test Gateway Endpoints</h2>
            </div>
            <p className="text-xs text-[#91a6a2]">Select an endpoint below to test live API calls.</p>
          </div>

          {/* Endpoint Selector Tabs */}
          <div className="mt-6 flex flex-wrap gap-2 border-b border-white/10 pb-4">
            {ENDPOINTS.map((ep) => {
              const isActive = activeEndpoint.id === ep.id
              return (
                <button
                  key={ep.id}
                  onClick={() => selectEndpoint(ep)}
                  className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-mono transition-all ${
                    isActive
                      ? 'bg-[#b7f36b] font-bold text-[#07131b]'
                      : 'border border-white/10 bg-white/5 text-[#91a6a2] hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                    ep.method === 'GET' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {ep.method}
                  </span>
                  {ep.name}
                </button>
              )
            })}
          </div>

          {/* Active Endpoint Info */}
          <div className="mt-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className={`rounded-md px-2.5 py-1 text-xs font-mono font-bold ${
                activeEndpoint.method === 'GET' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
              }`}>
                {activeEndpoint.method}
              </span>
              <code className="rounded-md border border-white/10 bg-black/40 px-3 py-1 font-mono text-xs text-[#b7f36b]">
                {activeEndpoint.path}
              </code>
            </div>
            <p className="mt-3 text-sm text-[#91a6a2]">{activeEndpoint.desc}</p>
          </div>

          {/* Playground Inputs & Output Grid */}
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {/* Request Column */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs font-mono text-[#91a6a2]">
                <span>REQUEST BODY (JSON)</span>
                {['POST', 'PATCH', 'PUT'].includes(activeEndpoint.method) ? (
                  <span className="text-[#b7f36b]">Editable</span>
                ) : (
                  <span className="opacity-50">Not required for GET</span>
                )}
              </div>

              <textarea
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
                disabled={!['POST', 'PATCH', 'PUT'].includes(activeEndpoint.method)}
                rows={8}
                className="w-full rounded-xl border border-white/10 bg-black/50 p-4 font-mono text-xs text-white outline-none focus:border-[#b7f36b] focus:ring-1 focus:ring-[#b7f36b] disabled:opacity-40 disabled:cursor-not-allowed"
                placeholder="{}"
              />

              <button
                onClick={handleTestApi}
                disabled={testing}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#b7f36b] px-4 py-3 text-sm font-bold text-[#07131b] hover:bg-[#d2ff99] transition disabled:opacity-50"
              >
                {testing ? <PuzzleSpinner size="sm" /> : <><Play size={16} fill="currentColor" /> Send Request</>}
              </button>
            </div>

            {/* Response Column */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs font-mono text-[#91a6a2]">
                <span>RESPONSE OUTPUT</span>
                {responseStatus && (
                  <span className={`font-bold ${responseStatus >= 200 && responseStatus < 300 ? 'text-emerald-400' : 'text-red-400'}`}>
                    HTTP {responseStatus}
                  </span>
                )}
              </div>

              <div className="relative min-h-[220px] rounded-xl border border-white/10 bg-black/60 p-4 font-mono text-xs text-[#b7f36b] overflow-x-auto">
                {responseData ? (
                  <>
                    <button
                      onClick={() => copyToClipboard(responseData)}
                      className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-muted-foreground hover:bg-white/10 hover:text-white transition"
                    >
                      {copied ? <CheckCircle size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                    <pre className="whitespace-pre-wrap word-break">{responseData}</pre>
                  </>
                ) : (
                  <div className="flex h-full min-h-[200px] flex-col items-center justify-center text-center text-[#91a6a2]/60">
                    <Terminal size={28} className="mb-2" />
                    <p className="text-xs">Click "Send Request" to view live API response output.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
