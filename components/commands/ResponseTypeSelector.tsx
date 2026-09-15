'use client'

import React from 'react'
import { CustomSelect } from '@/components/ui/custom-select'

export interface ResponseTypeSelectorProps {
  value: 'text' | 'image' | 'hydrated_button' | 'callback_button'
  onChange: (val: 'text' | 'image' | 'hydrated_button' | 'callback_button') => void
}

export function ResponseTypeSelector({ value, onChange }: ResponseTypeSelectorProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Tipe Respon Bot
      </label>
      <CustomSelect
        value={value}
        onChange={(val) => onChange(val as any)}
        options={[
          { value: 'text', label: 'Pesan Teks Standard' },
          { value: 'image', label: 'Gambar / Photo + Caption' },
          { value: 'hydrated_button', label: 'Hydrated URL / Callback Button' },
          { value: 'callback_button', label: 'Inline Callback Button' },
        ]}
      />
    </div>
  )
}
