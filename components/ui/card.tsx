'use client'

import React from 'react'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  glow?: boolean
}

export function Card({ children, className = '', glow = false, ...props }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-border bg-card/80 p-6 text-card-foreground shadow-xl backdrop-blur-md transition-all ${
        glow ? 'border-primary/40 shadow-primary/5 hover:border-primary/60' : 'hover:border-border/80'
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
