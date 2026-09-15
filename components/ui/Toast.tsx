'use client'

import React, { useEffect } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

export interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info'
  open: boolean
  onClose: () => void
  duration?: number
}

export function Toast({
  message,
  type = 'info',
  open,
  onClose,
  duration = 4000,
}: ToastProps) {
  useEffect(() => {
    if (open && duration > 0) {
      const timer = setTimeout(onClose, duration)
      return () => clearTimeout(timer)
    }
  }, [open, duration, onClose])

  if (!open) return null

  const Icon = type === 'success' ? CheckCircle2 : type === 'error' ? AlertCircle : Info
  const colors =
    type === 'success'
      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
      : type === 'error'
      ? 'border-destructive/30 bg-destructive/10 text-destructive'
      : 'border-primary/30 bg-primary/10 text-primary'

  return (
    <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-xl border p-3.5 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5 duration-200 ${colors}`}>
      <Icon size={18} />
      <span className="text-xs font-semibold">{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-80">
        <X size={14} />
      </button>
    </div>
  )
}
