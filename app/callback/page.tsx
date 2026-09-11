'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LoaderCircle } from 'lucide-react'

export default function CallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const timer = window.setTimeout(() => router.replace('/dashboard'), 350)
    return () => window.clearTimeout(timer)
  }, [router])

  return (
    <main className="grid min-h-screen place-items-center bg-background text-foreground">
      <div className="flex items-center gap-3 text-sm text-muted-foreground" role="status" aria-live="polite">
        <LoaderCircle size={18} className="animate-spin text-primary" /> Completing sign in…
      </div>
    </main>
  )
}
