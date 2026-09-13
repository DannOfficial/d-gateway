'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

export interface SelectOption {
  value: string
  label: string
  icon?: React.ReactNode
  badge?: string
  disabled?: boolean
}

interface CustomSelectProps {
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  id?: string
}

export function CustomSelect({
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  disabled = false,
  className = '',
  id,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((opt) => opt.value === value)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className={`relative w-full ${className}`} id={id}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-card/80 px-3.5 py-2.5 text-xs text-foreground backdrop-blur-md transition-all hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/40 ${
          disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
        } ${isOpen ? 'border-primary ring-2 ring-primary/30' : ''}`}
      >
        <div className="flex items-center gap-2 truncate">
          {selectedOption?.icon && <span className="text-primary">{selectedOption.icon}</span>}
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        </div>
        <ChevronDown size={14} className={`text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : ''}`} />
      </button>

      {isOpen && !disabled && (
        <div className="absolute left-0 top-full z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-border bg-card/95 p-1.5 shadow-2xl backdrop-blur-xl animate-in fade-in-80 zoom-in-95">
          {options.map((opt) => {
            const isSelected = opt.value === value
            return (
              <button
                key={opt.value}
                type="button"
                disabled={opt.disabled}
                onClick={() => {
                  onChange(opt.value)
                  setIsOpen(false)
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs transition-colors ${
                  isSelected ? 'bg-primary/20 font-semibold text-primary' : 'hover:bg-muted/60 text-foreground'
                } ${opt.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  {opt.icon && <span className={isSelected ? 'text-primary' : 'text-muted-foreground'}>{opt.icon}</span>}
                  <span className="truncate">{opt.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {opt.badge && (
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary border border-primary/20">
                      {opt.badge}
                    </span>
                  )}
                  {isSelected && <Check size={14} className="text-primary" />}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
