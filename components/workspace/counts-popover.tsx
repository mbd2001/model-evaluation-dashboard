'use client'

import { Sigma } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { CatalogRun, PopulationCount } from '@/lib/types'
import { sourceLabel } from '@/lib/run-colors'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface CountsPopoverProps {
  label: string
  runs: CatalogRun[]
  counts: PopulationCount[]
}

/** Per-run, per-source PRED / GT counts for one exact population. "Not produced" ≠ empty. */
export function CountsPopover({ label, runs, counts }: CountsPopoverProps) {
  const total = counts.reduce((sum, c) => sum + (c.gt ?? 0), 0)
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <Sigma className="size-3" />
          <span className="tnum font-mono">{total.toLocaleString()}</span>
          <span className="text-muted-foreground/60">GT</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-0">
        <div className="border-b border-border px-3 py-2 text-xs font-semibold text-foreground">
          {label} · sample counts
        </div>
        <div className="max-h-72 overflow-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
                <th className="px-3 py-1.5 text-left font-medium">Run</th>
                <th className="px-3 py-1.5 text-left font-medium">Source</th>
                <th className="px-3 py-1.5 text-right font-medium">PRED</th>
                <th className="px-3 py-1.5 text-right font-medium">GT</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {counts.map((c, i) => {
                const runIndex = runs.findIndex((r) => r.run_id === c.run_id)
                const produced = c.pred !== null
                return (
                  <tr key={`${c.run_id}-${c.source}-${i}`} className="border-t border-border/60">
                    <td className="px-3 py-1.5 text-muted-foreground">R{runIndex + 1}</td>
                    <td className="px-3 py-1.5 text-muted-foreground">{sourceLabel(c.source)}</td>
                    <td
                      className={cn(
                        'tnum px-3 py-1.5 text-right',
                        produced ? 'text-foreground' : 'text-muted-foreground/40',
                      )}
                    >
                      {produced ? c.pred!.toLocaleString() : 'n/p'}
                    </td>
                    <td
                      className={cn(
                        'tnum px-3 py-1.5 text-right',
                        produced ? 'text-foreground' : 'text-muted-foreground/40',
                      )}
                    >
                      {produced ? c.gt!.toLocaleString() : 'n/p'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="border-t border-border px-3 py-1.5 text-[10px] text-muted-foreground/70">
          n/p = source not produced for this run
        </div>
      </PopoverContent>
    </Popover>
  )
}
