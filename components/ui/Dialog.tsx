'use client'

import React from 'react'
import { Modal } from './Modal'
import { AlertTriangle, Info, CheckCircle2 } from 'lucide-react'

export interface DialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  variant?: 'danger' | 'warning' | 'info'
  confirmText?: string
  cancelText?: string
  loading?: boolean
}

export function Dialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  variant = 'warning',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  loading = false,
}: DialogProps) {
  const Icon = variant === 'danger' ? AlertTriangle : variant === 'warning' ? AlertTriangle : Info
  const iconColor = variant === 'danger' ? 'text-destructive bg-destructive/10' : variant === 'warning' ? 'text-amber-500 bg-amber-500/10' : 'text-primary bg-primary/10'

  return (
    <Modal open={open} onClose={onClose} maxWidth="sm">
      <div className="text-center space-y-4">
        <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${iconColor}`}>
          <Icon size={24} />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-xl border border-border px-4 py-2.5 text-xs font-semibold hover:bg-muted transition"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 rounded-xl px-4 py-2.5 text-xs font-bold text-white transition ${
              variant === 'danger' ? 'bg-destructive hover:bg-destructive/90' : 'bg-primary hover:bg-primary/90 text-primary-foreground'
            }`}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  )
}
