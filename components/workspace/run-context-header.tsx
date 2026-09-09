'use client'

import Link from 'next/link'
import { ArrowLeftRight, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { CatalogRun } from '@/lib/types'
import { runColorVar } from '@/lib/run-colors'

interface RunContextHeaderProps {
  runs: CatalogRun[]
  onRemove: (runId: string) => void
  onMove: (runId: string, direction: -1 | 1) => void
}

/** The comparison bar: each selected checkpoint as an identity card with its stable run color. */
export function RunContextHeader({ runs, onRemove, onMove }: RunContextHeaderProps) {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ArrowLeftRight className="size-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Comparing checkpoints</h2>
          <span className="tnum rounded-full bg-accent px-2 py-0.5 font-mono text-xs text-muted-foreground">
            {runs.length}
          </span>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-foreground/20"
        >
          <Plus className="size-3.5" />
          Manage runs
        </Link>
      </div>

      {runs.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-10 text-center">
          <p className="text-sm text-muted-foreground">No runs selected.</p>
          <Link href="/" className="text-sm font-medium text-primary hover:underline">
            Pick checkpoints from the catalog →
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {runs.map((run, i) => (
            <article
              key={run.run_id}
              className="group relative overflow-hidden rounded-lg border border-border bg-elevated/50 p-3"
            >
              <span
                className="absolute inset-y-0 left-0 w-1"
                style={{ background: runColorVar(i) }}
                aria-hidden
              />
              <div className="flex items-start justify-between gap-2 pl-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="tnum rounded px-1.5 py-0.5 font-mono text-[10px] font-bold"
                      style={{ background: `color-mix(in oklab, ${runColorVar(i)} 22%, transparent)`, color: runColorVar(i) }}
                    >
                      R{i + 1}
                    </span>
                    <span className="truncate text-sm font-semibold text-foreground">{run.net}</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                    <span className="text-muted-foreground/60">ckpt</span>
                    <span className="truncate text-foreground/90">{run.checkpoint}</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => onMove(run.run_id, -1)}
                    disabled={i === 0}
                    className="grid size-6 place-items-center rounded text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
                    aria-label="Move left"
                  >
                    <ChevronLeft className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onMove(run.run_id, 1)}
                    disabled={i === runs.length - 1}
                    className="grid size-6 place-items-center rounded text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
                    aria-label="Move right"
                  >
                    <ChevronRight className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemove(run.run_id)}
                    className="grid size-6 place-items-center rounded text-muted-foreground transition-colors hover:text-destructive"
                    aria-label="Remove run"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              </div>
              <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-border/60 pl-2 pt-2.5 text-xs">
                <div>
                  <dt className="text-[10px] uppercase tracking-wider text-muted-foreground/60">Frames</dt>
                  <dd className="tnum font-mono font-medium text-foreground">
                    {(run.total_frames / 1000).toFixed(1)}k
                  </dd>
                </div>
                <div className="col-span-2 min-w-0">
                  <dt className="text-[10px] uppercase tracking-wider text-muted-foreground/60">Dataset</dt>
                  <dd className="truncate font-medium text-foreground">{run.dataset}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
