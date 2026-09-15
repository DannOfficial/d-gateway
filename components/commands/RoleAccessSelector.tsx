'use client'

import React from 'react'
import { CustomSelect } from '@/components/ui/custom-select'

export interface RoleAccessSelectorProps {
  value: 'user' | 'admin' | 'superadmin' | 'owner'
  onChange: (val: 'user' | 'admin' | 'superadmin' | 'owner') => void
}

export function RoleAccessSelector({ value, onChange }: RoleAccessSelectorProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Akses Role Pengguna
      </label>
      <CustomSelect
        value={value}
        onChange={(val) => onChange(val as any)}
        options={[
          { value: 'user', label: 'User (Semua Orang)', badge: 'Default' },
          { value: 'admin', label: 'Admin Bot', badge: 'Elevated' },
          { value: 'superadmin', label: 'Superadmin Bot', badge: 'High' },
          { value: 'owner', label: 'Owner Bot Sahaja', badge: 'Highest' },
        ]}
      />
    </div>
  )
}
