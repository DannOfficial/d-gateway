'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PuzzleSpinner } from '@/components/ui/puzzle-spinner'
import { SurveyDialog } from '@/components/survey-dialog'

export default function CallbackPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [showSurvey, setShowSurvey] = useState(false)

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

        if (!data.user.surveySource) {
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

    checkAuthAndSurvey()

    return () => {
      isMounted = false
    }
  }, [router])

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
