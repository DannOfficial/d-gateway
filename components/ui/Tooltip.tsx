'use client'

import React, { useState } from 'react'

export interface TooltipProps {
  content: string
  children: React.ReactNode
}

export function Tooltip({ content, children }: TooltipProps) {
  const [show, setShow] = useState(false)

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-foreground shadow-xl z-50 pointer-events-none animate-in fade-in duration-100">
          {content}
        </div>
      )}
    </div>
  )
}
