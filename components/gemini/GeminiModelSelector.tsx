'use client'

import React from 'react'
import { Select, SelectOption } from '@/components/ui/Select'

export interface GeminiModelSelectorProps {
  value: string
  onChange: (model: string) => void
  userRole?: string
}

export function GeminiModelSelector({ value, onChange, userRole = 'free' }: GeminiModelSelectorProps) {
  const role = userRole.toLowerCase()

  const options: SelectOption[] = [
    { value: 'gemini-2.5-flash', label: 'gemini-2.5-flash (Fast & Efficient)', badge: 'ALL ROLES' },
    { value: 'gemini-2.0-flash', label: 'gemini-2.0-flash (Balanced)', badge: 'PRO / VIP', disabled: role === 'free' },
    { value: 'gemini-2.5-pro', label: 'gemini-2.5-pro (Advanced Reasoning)', badge: 'PREMIUM', disabled: role === 'free' || role === 'vip' },
    { value: 'gemini-1.5-pro', label: 'gemini-1.5-pro (Legacy Pro)', badge: 'ADMIN ONLY', disabled: role !== 'admin' },
  ]

  return (
    <Select
      label="Gemini AI Model Selection"
      value={value}
      onChange={onChange}
      options={options}
    />
  )
}
