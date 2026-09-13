'use client'

import React from 'react'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'outline'
  className?: string
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const variantStyles = {
    default: 'bg-muted text-muted-foreground border-border',
    primary: 'bg-primary/20 text-primary border-primary/30',
    success: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    warning: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    danger: 'bg-destructive/20 text-destructive border-destructive/30',
    outline: 'bg-transparent text-foreground border-border',
  }

  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  )
}
