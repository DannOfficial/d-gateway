'use client'

import React, { useState } from 'react'
import { LogFilters } from './LogFilters'
import { LogDetails } from './LogDetails'
import { Badge } from '@/components/ui/badge'
import { Activity } from 'lucide-react'

export interface LogItem {
  id: string
  username: string
  chatType: string
  type: string
  text: string
  createdAt: string
}

export interface LogTableProps {
  logs: LogItem[]
}

export function LogTable({ logs }: LogTableProps) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [selectedLog, setSelectedLog] = useState<LogItem | undefined>()

  const filteredLogs = logs.filter((log) => {
    const matchSearch =
      `${log.username} ${log.text}`.toLowerCase().includes(search.toLowerCase())
    const matchType = typeFilter === 'all' || log.type === typeFilter
    return matchSearch && matchType
  })

  return (
    <div className="space-y-4">
      <LogFilters
        search={search}
        onSearchChange={setSearch}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
      />

      {filteredLogs.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground border border-border rounded-xl">
          No logs match your filter criteria.
        </div>
      ) : (
        <div className="space-y-2">
          {filteredLogs.slice(0, 15).map((log) => (
            <div
              key={log.id}
              onClick={() => setSelectedLog(log)}
              className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-card hover:border-primary/50 cursor-pointer transition text-xs"
            >
              <div className="flex items-center gap-3">
                <span className={`p-2 rounded-lg ${log.type === 'command' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  <Activity size={15} />
                </span>
                <div>
                  <b className="font-bold">@{log.username} <span className="text-muted-foreground font-normal">({log.chatType})</span></b>
                  <p className="text-muted-foreground font-mono truncate max-w-xs sm:max-w-md">{log.text || '[Non-text update]'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge variant={log.type === 'command' ? 'success' : 'default'}>
                  {log.type}
                </Badge>
                <time className="text-[11px] text-muted-foreground font-mono">
                  {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </time>
              </div>
            </div>
          ))}
        </div>
      )}

      <LogDetails
        open={Boolean(selectedLog)}
        onClose={() => setSelectedLog(undefined)}
        log={selectedLog}
      />
    </div>
  )
}
