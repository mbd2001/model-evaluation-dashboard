'use client'

import { cn } from '@/lib/utils'
import type { AnalysisTab } from '@/lib/types'

export const ANALYSIS_TABS: { value: AnalysisTab; label: string; aggregates: boolean }[] = [
  { value: 'positional', label: 'Positional', aggregates: false },
  { value: 'roles', label: 'Roles', aggregates: true },
  { value: 'boundaries', label: 'Boundaries', aggregates: false },
  { value: 'dp_attributes', label: 'DP Attributes', aggregates: false },
  { value: 'dp_direction', label: 'DP Direction', aggregates: false },
]

interface AnalysisTabsProps {
  value: AnalysisTab
  onChange: (tab: AnalysisTab) => void
}

export function AnalysisTabs({ value, onChange }: AnalysisTabsProps) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto border-b border-border">
      {ANALYSIS_TABS.map((tab) => {
        const active = tab.value === value
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            className={cn(
              'relative whitespace-nowrap px-3.5 py-2.5 text-sm font-medium transition-colors',
              active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
            {tab.aggregates && (
              <span className="ml-1.5 rounded bg-accent px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                agg
              </span>
            )}
            {active && (
              <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />
            )}
          </button>
        )
      })}
    </div>
  )
}
