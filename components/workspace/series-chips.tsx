'use client'

import { useRef } from 'react'
import { RotateCcw } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { SeriesDescriptor } from '@/lib/run-colors'
import { sourceLabel } from '@/lib/run-colors'

interface SeriesChipsProps {
  series: SeriesDescriptor[]
  hiddenKeys: Set<string>
  onHiddenKeysChange: (next: Set<string>) => void
  /** Noun used in helper + reset copy, e.g. "lines" or "bars". */
  noun: string
}

/**
 * Shared visibility control for every panel in a section. Single click toggles one series;
 * double click isolates it (or restores all when it is already the only one shown). This is the
 * only legend — chart-native legends stay hidden so colors/patterns never reshuffle.
 */
export function SeriesChips({ series, hiddenKeys, onHiddenKeysChange, noun }: SeriesChipsProps) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const allKeys = series.map((s) => s.key)

  function toggle(key: string) {
    const next = new Set(hiddenKeys)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    onHiddenKeysChange(next)
  }

  function isolate(key: string) {
    const onlyThisVisible = allKeys.every((k) => (k === key ? !hiddenKeys.has(k) : hiddenKeys.has(k)))
    if (onlyThisVisible) {
      onHiddenKeysChange(new Set())
    } else {
      onHiddenKeysChange(new Set(allKeys.filter((k) => k !== key)))
    }
  }

  function handleClick(key: string, detail: number) {
    if (detail > 1) {
      if (timer.current) clearTimeout(timer.current)
      isolate(key)
      return
    }
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => toggle(key), 180)
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {series.map((s) => {
        const hidden = hiddenKeys.has(s.key)
        return (
          <button
            key={s.key}
            type="button"
            onClick={(e) => handleClick(s.key, e.detail)}
            title={`${s.run.display_label} · ${sourceLabel(s.source)}\nClick to toggle · double-click to isolate`}
            className={cn(
              'group inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium transition-all',
              hidden
                ? 'border-border bg-transparent text-muted-foreground/60'
                : 'border-border bg-card text-foreground hover:border-foreground/20',
            )}
          >
            <span
              className={cn('size-2.5 shrink-0 rounded-[3px] transition-opacity', hidden && 'opacity-40')}
              style={{
                background:
                  s.source === 'vision' ? s.color : `repeating-linear-gradient(135deg, ${s.color}, ${s.color} 2px, transparent 2px, transparent 4px)`,
                border: s.source === 'fusion' ? `1px solid ${s.color}` : undefined,
              }}
            />
            <span className={cn('max-w-[13rem] truncate', hidden && 'line-through decoration-1')}>
              R{s.runIndex + 1}
              <span className="mx-1 text-muted-foreground/50">·</span>
              <span className="font-mono">{s.run.checkpoint.slice(0, 7)}</span>
            </span>
            <span
              className={cn(
                'rounded px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wider',
                s.source === 'vision' ? 'bg-accent text-muted-foreground' : 'bg-transparent text-muted-foreground/70 ring-1 ring-inset ring-border',
              )}
            >
              {s.source === 'vision' ? 'V' : 'F'}
            </span>
          </button>
        )
      })}
      {hiddenKeys.size > 0 && (
        <button
          type="button"
          onClick={() => onHiddenKeysChange(new Set())}
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <RotateCcw className="size-3" />
          Reset {noun}
        </button>
      )}
    </div>
  )
}
