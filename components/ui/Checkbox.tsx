'use client'

import React from 'react'
import { Check } from 'lucide-react'

export interface CheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  description?: string
  disabled?: boolean
  className?: string
}

export function Checkbox({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  className = '',
}: CheckboxProps) {
  return (
    <label
      className={`flex items-start gap-3 cursor-pointer select-none ${
        disabled ? 'cursor-not-allowed opacity-50' : ''
      } ${className}`}
    >
      <div
        onClick={() => !disabled && onChange(!checked)}
        className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition ${
          checked
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border bg-background hover:border-primary/60'
        }`}
      >
        {checked && <Check size={12} strokeWidth={3} />}
      </div>
      {(label || description) && (
        <div className="space-y-0.5 text-xs">
          {label && <span className="font-semibold text-foreground block">{label}</span>}
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>
      )}
    </label>
  )
}
