'use client'

import { Info } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { CatalogRun, Source } from '@/lib/types'
import { sourceLabel } from '@/lib/run-colors'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

const SOURCES: Source[] = ['vision', 'fusion']

interface SourceSelectorProps {
  runs: CatalogRun[]
  sources: Source[]
  onToggleSource: (source: Source) => void
}

/** Global source toggle. Vision = solid, Fusion = patterned — a style axis, not a second color. */
export function SourceSelector({ runs, sources, onToggleSource }: SourceSelectorProps) {
  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-card p-1">
      {SOURCES.map((source) => {
        const active = sources.includes(source)
        const availableIn = runs.filter((r) => r.sources.includes(source))
        return (
          <div key={source} className="flex items-center">
            <button
              type="button"
              onClick={() => onToggleSource(source)}
              aria-pressed={active}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-accent text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <span
                className="size-2.5 rounded-[3px]"
                style={{
                  background: active
                    ? source === 'vision'
                      ? 'var(--muted-foreground)'
                      : 'repeating-linear-gradient(135deg, var(--muted-foreground), var(--muted-foreground) 2px, transparent 2px, transparent 4px)'
                    : 'transparent',
                  border: '1px solid var(--muted-foreground)',
                }}
              />
              {sourceLabel(source)}
            </button>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="grid size-7 place-items-center rounded-md text-muted-foreground/70 transition-colors hover:text-foreground"
                  aria-label={`${sourceLabel(source)} availability`}
                >
                  <Info className="size-3.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72">
                <div className="mb-2 text-xs font-semibold text-foreground">
                  {sourceLabel(source)} availability
                </div>
                <ul className="space-y-1.5">
                  {runs.map((run, i) => {
                    const has = run.sources.includes(source)
                    return (
                      <li key={run.run_id} className="flex items-center justify-between gap-2 text-xs">
                        <span className="truncate text-muted-foreground">
                          R{i + 1} · <span className="font-mono">{run.checkpoint.slice(0, 7)}</span>
                        </span>
                        <span
                          className={cn(
                            'shrink-0 font-medium',
                            has ? 'text-success' : 'text-muted-foreground/50',
                          )}
                        >
                          {has ? 'produced' : 'not produced'}
                        </span>
                      </li>
                    )
                  })}
                </ul>
                <p className="mt-2 text-[11px] text-muted-foreground/70">
                  {availableIn.length} of {runs.length} selected runs produce this source.
                </p>
              </PopoverContent>
            </Popover>
          </div>
        )
      })}
    </div>
  )
}
