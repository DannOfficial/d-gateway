'use client'

import React from 'react'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-border/80 rounded-2xl bg-card/40 my-4">
      {icon && <div className="p-3.5 rounded-full bg-primary/10 text-primary mb-3">{icon}</div>}
      <h3 className="text-base font-bold text-foreground">{title}</h3>
      {description && <p className="text-xs text-muted-foreground max-w-md mt-1 mb-4">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  )
}
