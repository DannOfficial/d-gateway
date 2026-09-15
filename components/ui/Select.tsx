'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

export interface SelectOption {
  value: string
  label: string
  badge?: string
  disabled?: boolean
}

export interface SelectProps {
  label?: string
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function Select({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select option...',
  disabled = false,
  className = '',
}: SelectProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((opt) => opt.value === value)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={`relative w-full space-y-1.5 ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {label}
        </label>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-xl border border-border bg-background/80 px-3.5 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50 transition"
      >
        <span className={selectedOption ? 'font-medium' : 'text-muted-foreground'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={14} className={`text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-border bg-card p-1 shadow-2xl backdrop-blur-md animate-in fade-in duration-100">
          {options.map((option) => {
            const isSelected = option.value === value
            return (
              <button
                key={option.value}
                type="button"
                disabled={option.disabled}
                onClick={() => {
                  onChange(option.value)
                  setOpen(false)
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition ${
                  isSelected
                    ? 'bg-primary/20 text-primary font-bold'
                    : 'text-foreground hover:bg-muted'
                } ${option.disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <span className="flex items-center gap-2">
                  {option.label}
                  {option.badge && (
                    <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[9px] font-bold text-primary border border-primary/30">
                      {option.badge}
                    </span>
                  )}
                </span>
                {isSelected && <Check size={14} className="text-primary" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
