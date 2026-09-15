'use client'

import React from 'react'

export interface BotStatusProps {
  status: string
  className?: string
}

export function BotStatus({ status, className = '' }: BotStatusProps) {
  const normalized = (status || 'stopped').toLowerCase()

  let variant = 'pending'
  let label = 'STOPPED'

  if (['running', 'connected', 'active'].includes(normalized)) {
    variant = 'healthy'
    label = 'RUNNING'
  } else if (['starting'].includes(normalized)) {
    variant = 'pending'
    label = 'STARTING'
  } else if (['stopping'].includes(normalized)) {
    variant = 'pending'
    label = 'STOPPING'
  } else if (['error', 'disconnected'].includes(normalized)) {
    variant = 'error'
    label = 'ERROR'
  }

  return (
    <span className={`health-pill ${variant} ${className}`}>
      <i />
      {label}
    </span>
  )
}
