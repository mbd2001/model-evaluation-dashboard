'use client'

import type { FrameScope } from '@/lib/types'

interface FrameScopeSummaryProps {
  data: FrameScope
}

/** Compact readout of the frame population the current filter resolves to. */
export function FrameScopeSummary({ data }: FrameScopeSummaryProps) {
  const pct = data.total_frames > 0 ? data.matched_frames / data.total_frames : 0
  const stats = [
    { label: 'Runs', value: data.runs.toLocaleString() },
    { label: 'Matched frames', value: data.matched_frames.toLocaleString() },
    { label: 'Total frames', value: data.total_frames.toLocaleString() },
  ]
  return (
    <div className="flex items-stretch divide-x divide-border overflow-hidden rounded-lg border border-border bg-card">
      {stats.map((s) => (
        <div key={s.label} className="flex flex-col justify-center px-3.5 py-2">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
            {s.label}
          </span>
          <span className="tnum font-mono text-sm font-semibold text-foreground">{s.value}</span>
        </div>
      ))}
      <div className="flex min-w-[7rem] flex-col justify-center px-3.5 py-2">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
          Frame retention
        </span>
        <div className="mt-1 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-accent">
            <div className="h-full rounded-full bg-primary" style={{ width: `${pct * 100}%` }} />
          </div>
          <span className="tnum font-mono text-xs font-semibold text-foreground">
            {(pct * 100).toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  )
}
