'use client'

import { useEffect, useState } from 'react'
import { RotateCcw, SlidersHorizontal } from 'lucide-react'

import type { DpGroup } from '@/lib/types'
import { DEFAULT_THRESHOLDS } from '@/lib/mock-data'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface ThresholdSettingsProps {
  group: DpGroup
  thresholds: number[]
  onChange: (next: number[]) => void
}

/** Editable accuracy-threshold ladder (metres). Comma / space separated, committed on blur. */
export function ThresholdSettings({ group, thresholds, onChange }: ThresholdSettingsProps) {
  const [text, setText] = useState(thresholds.join(', '))

  useEffect(() => {
    setText(thresholds.join(', '))
  }, [thresholds])

  function commit() {
    const parsed = text
      .split(/[\s,]+/)
      .map((t) => Number(t))
      .filter((n) => Number.isFinite(n) && n > 0)
      .sort((a, b) => a - b)
    if (parsed.length >= 2) onChange(parsed)
    else setText(thresholds.join(', '))
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <SlidersHorizontal className="size-3.5" />
          {thresholds.length} thresholds
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground">Accuracy thresholds (m)</span>
          <button
            type="button"
            onClick={() => onChange([...DEFAULT_THRESHOLDS[group]])}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <RotateCcw className="size-3" />
            Default
          </button>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={commit}
          rows={3}
          className="tnum w-full resize-none rounded-md border border-input bg-background p-2.5 font-mono text-xs text-foreground outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/25"
        />
        <div className="mt-2 flex flex-wrap gap-1">
          {thresholds.map((t) => (
            <span
              key={t}
              className="tnum rounded bg-accent px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
            >
              {t}
            </span>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground/70">
          Each threshold becomes one point on the accuracy curve.
        </p>
      </PopoverContent>
    </Popover>
  )
}
