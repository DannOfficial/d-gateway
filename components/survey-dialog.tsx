'use client'

import { useState } from 'react'
import { Sparkles, Check, Bot, Building2, HelpCircle } from 'lucide-react'
import { PuzzleSpinner } from '@/components/ui/puzzle-spinner'

const SOURCE_OPTIONS = [
  'Google Search',
  'YouTube',
  'GitHub',
  'Teman / Rekomendasi',
  'Media Sosial (Instagram / Twitter / TikTok / LinkedIn)',
  'Lainnya',
]

const PURPOSE_OPTIONS = [
  'Bot Komunitas / Grup Telegram',
  'Customer Support & FAQ Automated',
  'Integrasi API / Webhook Custom',
  'Bot Notifikasi & Broadcast',
  'E-Commerce & Pembayaran Bot',
]

const SCALE_OPTIONS = [
  '1 - 3 Bot (Pemula / Hobby)',
  '4 - 10 Bot (Menengah / Komunitas)',
  '10+ Bot (Enterprise / Skala Besar)',
]

interface SurveyDialogProps {
  onComplete: () => void
}

export function SurveyDialog({ onComplete }: SurveyDialogProps) {
  const [source, setSource] = useState('')
  const [purpose, setPurpose] = useState('')
  const [scale, setScale] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!source || !purpose || !scale) {
      setError('Harap isi semua pertanyaan survey sebelum melanjutkan.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const surveyResult = `Sumber: ${source} | Tujuan: ${purpose} | Skala: ${scale}`
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ surveySource: surveyResult }),
      })

      if (res.ok) {
        onComplete()
      } else {
        setError('Gagal menyimpan jawaban. Coba lagi.')
        setSubmitting(false)
      }
    } catch {
      setError('Terjadi kesalahan koneksi.')
      setSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-2xl sm:p-8">
      <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
        <Sparkles size={14} /> Selamat Datang di Dann-Tele Gateway!
      </div>

      <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">Survey Pengguna Baru</h1>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
        Bantu kami menyesuaikan workspace dan performa gateway bot sesuai dengan kebutuhan Anda.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {/* Question 1 */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <HelpCircle size={16} className="text-primary" />
            1. Dari mana Anda mengetahui Dann-Tele?
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            {SOURCE_OPTIONS.map((item) => {
              const active = source === item
              return (
                <button
                  type="button"
                  key={item}
                  onClick={() => { setSource(item); setError('') }}
                  className={`flex items-center justify-between rounded-xl border p-3 text-left text-xs font-medium transition ${
                    active ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary' : 'border-border bg-background/50 hover:bg-muted text-muted-foreground'
                  }`}
                >
                  <span className="truncate">{item}</span>
                  {active && <Check size={14} className="text-primary shrink-0 ml-1" />}
                </button>
              )
            })}
          </div>
        </div>

        {/* Question 2 */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Bot size={16} className="text-primary" />
            2. Apa tujuan utama penggunaan bot Telegram Anda?
          </label>
          <div className="grid gap-2">
            {PURPOSE_OPTIONS.map((item) => {
              const active = purpose === item
              return (
                <button
                  type="button"
                  key={item}
                  onClick={() => { setPurpose(item); setError('') }}
                  className={`flex items-center justify-between rounded-xl border p-3 text-left text-xs font-medium transition ${
                    active ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary' : 'border-border bg-background/50 hover:bg-muted text-muted-foreground'
                  }`}
                >
                  <span>{item}</span>
                  {active && <Check size={14} className="text-primary shrink-0" />}
                </button>
              )
            })}
          </div>
        </div>

        {/* Question 3 */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Building2 size={16} className="text-primary" />
            3. Berapa perkiraan skala penggunaan bot Anda?
          </label>
          <div className="grid gap-2 sm:grid-cols-3">
            {SCALE_OPTIONS.map((item) => {
              const active = scale === item
              return (
                <button
                  type="button"
                  key={item}
                  onClick={() => { setScale(item); setError('') }}
                  className={`flex flex-col items-start rounded-xl border p-3 text-left text-xs font-medium transition ${
                    active ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary' : 'border-border bg-background/50 hover:bg-muted text-muted-foreground'
                  }`}
                >
                  <span className="font-semibold">{item.split(' (')[0]}</span>
                  <span className="text-[10px] opacity-75">{item.split(' (')[1]?.replace(')', '')}</span>
                </button>
              )
            })}
          </div>
        </div>

        {error && <p className="text-xs text-destructive mt-1" role="alert">{error}</p>}

        <button
          type="submit"
          disabled={submitting || !source || !purpose || !scale}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? <PuzzleSpinner size="sm" /> : 'Simpan Survey & Lanjutkan ke Dashboard →'}
        </button>
      </form>
    </div>
  )
}
