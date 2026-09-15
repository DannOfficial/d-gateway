'use client'

import React, { useEffect } from 'react'
import { X } from 'lucide-react'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  children: React.ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'md',
}: ModalProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && open) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  const widthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  }[maxWidth]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className={`w-full ${widthClasses} rounded-2xl border border-border bg-card p-6 shadow-2xl text-foreground max-h-[90vh] overflow-y-auto space-y-4`}>
        {(title || subtitle) && (
          <div className="flex items-start justify-between border-b border-border pb-3">
            <div>
              {title && <h2 className="text-lg font-bold">{title}</h2>}
              {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        )}
        <div>{children}</div>
      </div>
    </div>
  )
}
