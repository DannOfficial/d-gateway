'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PuzzleSpinner } from '@/components/ui/puzzle-spinner'
import { Check, Sparkles } from 'lucide-react'

const SURVEY_OPTIONS = [
  'Google Search',
  'YouTube',
  'GitHub',
  'Teman / Rekomendasi',
  'Media Sosial (Instagram / Twitter / TikTok / LinkedIn)',
  'Lainnya',
]

export default function CallbackPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [showSurvey, setShowSurvey] = useState(false)
  const [selectedSource, setSelectedSource] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function checkAuthAndSurvey() {
      try {
        const response = await fetch('/api/auth/me')
        if (!response.ok) {
          router.replace('/login')
          return
        }
        const data = await response.json()
        if (!data.user) {
          router.replace('/login')
          return
        }

        // Check if surveySource is missing
        if (!data.user.surveySource) {
          if (isMounted) {
            setShowSurvey(true)
            setLoading(false)
          }
        } else {
          // Survey already answered, navigate to dashboard
          router.replace('/dashboard')
        }
      } catch {
        router.replace('/login')
      }
    }

    checkAuthAndSurvey()

    return () => {
      isMounted = false
    }
  }, [router])

  async function handleSurveySubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedSource) {
      setError('Silakan pilih salah satu jawaban.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ surveySource: selectedSource }),
      })

      if (res.ok) {
        router.replace('/dashboard')
      } else {
        setError('Gagal menyimpan jawaban. Coba lagi.')
        setSubmitting(false)
      }
    } catch {
      setError('Terjadi kesalahan koneksi.')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-background text-foreground px-4">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <PuzzleSpinner size="lg" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Authenticating workspace session…</p>
        </div>
      </main>
    )
  }

  if (showSurvey) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-4 py-8 text-foreground">
        <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl sm:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles size={14} /> Selamat Datang!
          </div>

          <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">Kamu tahu Dann-Tele darimana?</h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Bantu kami memahami dari mana Anda menemukan Dann-Tele agar kami dapat memberikan pengalaman terbaik.
          </p>

          <form onSubmit={handleSurveySubmit} className="mt-6 space-y-3">
            {SURVEY_OPTIONS.map((option) => {
              const isSelected = selectedSource === option
              return (
                <button
                  type="button"
                  key={option}
                  onClick={() => {
                    setSelectedSource(option)
                    setError('')
                  }}
                  className={`w-full flex items-center justify-between rounded-xl border p-3.5 text-left text-sm font-medium transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary'
                      : 'border-border bg-background/50 hover:bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span>{option}</span>
                  {isSelected && (
                    <div className="grid size-5 place-items-center rounded-full bg-primary text-primary-foreground">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  )}
                </button>
              )
            })}

            {error && <p className="text-xs text-destructive mt-2" role="alert">{error}</p>}

            <button
              type="submit"
              disabled={submitting || !selectedSource}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? <PuzzleSpinner size="sm" /> : 'Simpan & Lanjutkan →'}
            </button>
          </form>
        </div>
      </main>
    )
  }

  return null
}
