'use client'

import React from 'react'
import { CustomSelect } from '@/components/ui/custom-select'
import { Search } from 'lucide-react'

export interface LogFiltersProps {
  search: string
  onSearchChange: (q: string) => void
  typeFilter: string
  onTypeFilterChange: (type: string) => void
}

export function LogFilters({
  search,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
}: LogFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs">
      <div className="relative flex-1 max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search username or text log..."
          className="w-full pl-9 pr-3 py-2 rounded-xl border border-input bg-background"
        />
      </div>

      <div className="w-44">
        <CustomSelect
          value={typeFilter}
          onChange={onTypeFilterChange}
          options={[
            { value: 'all', label: 'All Log Types' },
            { value: 'command', label: 'Commands' },
            { value: 'message', label: 'Messages' },
          ]}
        />
      </div>
    </div>
  )
}
