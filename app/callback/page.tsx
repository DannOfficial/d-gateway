'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PuzzleSpinner } from '@/components/ui/puzzle-spinner'
import { SurveyDialog } from '@/components/survey-dialog'

export const dynamic = 'force-dynamic'

function CallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [showSurvey, setShowSurvey] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let isMounted = true

    async function processAuthFlow() {
      const provider = searchParams.get('provider')
      const code = searchParams.get('code')
      const state = searchParams.get('state')
      const oauthError = searchParams.get('error')

      if (oauthError) {
        if (isMounted) {
          setErrorMessage(`OAuth Authorization Error: ${oauthError}`)
          setLoading(false)
        }
        setTimeout(() => router.replace('/login?error=' + oauthError), 2000)
        return
      }

      if (provider && code) {
        try {
          const res = await fetch('/api/auth/callback', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ provider, code, state }),
          })
          const data = await res.json()
          if (!res.ok || !data.success) {
            const errText = data?.error?.message || 'OAuth authentication failed.'
            if (isMounted) {
              setErrorMessage(errText)
              setLoading(false)
            }
            setTimeout(() => router.replace('/login?error=oauth_failed'), 2000)
            return
          }
        } catch {
          if (isMounted) {
            setErrorMessage('Network error during OAuth callback.')
            setLoading(false)
          }
          setTimeout(() => router.replace('/login?error=network_error'), 2000)
          return
        }
      }

      try {
        const meRes = await fetch('/api/auth/me')
        if (!meRes.ok) {
          router.replace('/login')
          return
        }
        const meData = await meRes.json()
        if (!meData.user) {
          router.replace('/login')
          return
        }

        if (!meData.user.surveySource) {
          if (isMounted) {
            setShowSurvey(true)
            setLoading(false)
          }
        } else {
          router.replace('/dashboard')
        }
      } catch {
        router.replace('/login')
      }
    }

    processAuthFlow()

    return () => {
      isMounted = false
    }
  }, [router, searchParams])

  if (errorMessage) {
    return (
      <main className="grid min-h-screen place-items-center bg-background text-foreground px-4">
        <div className="flex flex-col items-center justify-center gap-3 text-center max-w-sm rounded-2xl border border-destructive/30 bg-destructive/10 p-6">
          <p className="text-sm font-semibold text-destructive">{errorMessage}</p>
          <p className="text-xs text-muted-foreground">Redirecting to login…</p>
        </div>
      </main>
    )
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
        <SurveyDialog onComplete={() => router.replace('/dashboard')} />
      </main>
    )
  }

  return null
}

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center bg-background text-foreground px-4">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <PuzzleSpinner size="lg" />
            <p className="text-sm font-medium text-muted-foreground">Loading workspace callback…</p>
          </div>
        </main>
      }
    >
      <CallbackContent />
    </Suspense>
  )
}
