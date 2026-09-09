'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { CatalogRun, DpGroup, PopulationCount } from '@/lib/types'
import { Slider } from '@/components/ui/slider'
import { CountsPopover } from './counts-popover'

interface RangeFieldProps {
  label: string
  hint: string
  value: [number, number]
  onCommit: (next: [number, number]) => void
  runs: CatalogRun[]
  counts: PopulationCount[]
  fetching?: boolean
  disabled?: boolean
}

/** min/max metre inputs committed on blur/Enter, with a per-population counts popover. */
function RangeField({ label, hint, value, onCommit, runs, counts, fetching, disabled }: RangeFieldProps) {
  const [low, setLow] = useState(String(value[0]))
  const [high, setHigh] = useState(String(value[1]))

  useEffect(() => {
    setLow(String(value[0]))
    setHigh(String(value[1]))
  }, [value])

  function commit() {
    const l = Number(low)
    const h = Number(high)
    if (!Number.isFinite(l) || !Number.isFinite(h) || h <= l) {
      setLow(String(value[0]))
      setHigh(String(value[1]))
      return
    }
    onCommit([l, h])
  }

  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-elevated/40 p-3.5 transition-opacity',
        disabled && 'pointer-events-none opacity-50',
      )}
    >
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            {label}
            {fetching && <Loader2 className="size-3 animate-spin text-primary" />}
          </div>
          <div className="text-[11px] text-muted-foreground">{hint}</div>
        </div>
        <CountsPopover label={label} runs={runs} counts={counts} />
      </div>
      <div className="flex items-center gap-2">
        <label className="flex-1">
          <span className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
            Min (m)
          </span>
          <input
            value={low}
            onChange={(e) => setLow(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => e.key === 'Enter' && commit()}
            inputMode="decimal"
            className="tnum h-9 w-full rounded-md border border-input bg-background px-2.5 font-mono text-sm text-foreground outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/25"
          />
        </label>
        <div className="mt-4 h-px w-2.5 shrink-0 bg-border" />
        <label className="flex-1">
          <span className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
            Max (m)
          </span>
          <input
            value={high}
            onChange={(e) => setHigh(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => e.key === 'Enter' && commit()}
            inputMode="decimal"
            className="tnum h-9 w-full rounded-md border border-input bg-background px-2.5 font-mono text-sm text-foreground outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/25"
          />
        </label>
      </div>
    </div>
  )
}

interface PopulationControlsProps {
  runs: CatalogRun[]
  group: DpGroup
  onGroupChange: (group: DpGroup) => void
  egoRange: [number, number]
  onEgoRangeChange: (next: [number, number]) => void
  egoCounts: PopulationCount[]
  nonEgoRange: [number, number]
  onNonEgoRangeChange: (next: [number, number]) => void
  nonEgoCounts: PopulationCount[]
  anchorRadius: number
  onAnchorRadiusChange: (next: number) => void
  anchorCounts: PopulationCount[]
  fetching?: boolean
  disabled?: boolean
}

export function PopulationControls(props: PopulationControlsProps) {
  const { group, onGroupChange, disabled } = props
  const groups: { value: DpGroup; label: string; hint: string }[] = [
    { value: 'base', label: 'Base', hint: 'Time-anchored Ego / Non-ego ranges' },
    { value: 'non_base', label: 'Non-base', hint: 'Distance-anchored radius' },
  ]

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="inline-flex rounded-lg border border-border bg-background p-1">
          {groups.map((g) => (
            <button
              key={g.value}
              type="button"
              onClick={() => onGroupChange(g.value)}
              className={cn(
                'rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors',
                group === g.value
                  ? 'bg-accent text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {g.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {groups.find((g) => g.value === group)?.hint}
        </p>
      </div>

      <div className="p-4">
        {disabled && (
          <div className="mb-3 rounded-lg border border-border bg-elevated/40 px-3 py-2 text-xs text-muted-foreground">
            Population controls are disabled while this tab aggregates every row in the DP group.
          </div>
        )}
        {group === 'base' ? (
          <div className="grid gap-3 md:grid-cols-2">
            <RangeField
              label="Ego range"
              hint="Points near the ego vehicle"
              value={props.egoRange}
              onCommit={props.onEgoRangeChange}
              runs={props.runs}
              counts={props.egoCounts}
              fetching={props.fetching}
              disabled={disabled}
            />
            <RangeField
              label="Non-ego range"
              hint="Points beyond the ego band"
              value={props.nonEgoRange}
              onCommit={props.onNonEgoRangeChange}
              runs={props.runs}
              counts={props.nonEgoCounts}
              fetching={props.fetching}
              disabled={disabled}
            />
          </div>
        ) : (
          <div className={cn('rounded-lg border border-border bg-elevated/40 p-4', disabled && 'pointer-events-none opacity-50')}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <div className="text-sm font-semibold text-foreground">Anchor radius</div>
                <div className="text-[11px] text-muted-foreground">Distance from anchor point</div>
              </div>
              <CountsPopover label="Anchor radius" runs={props.runs} counts={props.anchorCounts} />
            </div>
            <div className="flex items-center gap-4">
              <Slider
                min={5}
                max={120}
                step={5}
                value={[props.anchorRadius]}
                onValueChange={(v) => props.onAnchorRadiusChange(v[0])}
                className="flex-1"
              />
              <div className="tnum flex w-20 shrink-0 items-baseline justify-end gap-1 font-mono">
                <span className="text-lg font-semibold text-foreground">{props.anchorRadius}</span>
                <span className="text-xs text-muted-foreground">m</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
