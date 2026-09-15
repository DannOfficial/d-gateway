'use client'

import React from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-1.5 text-xs text-muted-foreground" aria-label="Breadcrumb">
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1
        return (
          <React.Fragment key={idx}>
            {idx > 0 && <ChevronRight size={12} className="text-muted-foreground/60" />}
            {item.href && !isLast ? (
              <Link href={item.href} className="hover:text-foreground transition font-medium">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? 'font-bold text-foreground' : ''}>{item.label}</span>
            )}
          </React.Fragment>
        )
      })}
    </nav>
  )
}
