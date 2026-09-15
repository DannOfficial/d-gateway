'use client'

import React from 'react'
import { PuzzleSpinner } from './puzzle-spinner'

export interface LoadingStateProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
}

export function LoadingState({
  message = 'Loading data...',
  size = 'md',
}: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-3 text-muted-foreground text-xs">
      <PuzzleSpinner size={size} />
      <span>{message}</span>
    </div>
  )
}
