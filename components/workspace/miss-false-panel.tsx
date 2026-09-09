'use client'

import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts'

import type { MfContext, MissFalseKind, MissFalseRow } from '@/lib/types'
import type { SeriesDescriptor } from '@/lib/run-colors'
import { sourceLabel } from '@/lib/run-colors'
import { MF_CONTEXTS } from '@/lib/mock-data'
import { ChartContainer, type ChartConfig } from '@/components/ui/chart'

interface MissFalsePanelProps {
  kind: MissFalseKind
  series: SeriesDescriptor[]
  rows: MissFalseRow[]
  hiddenKeys: Set<string>
}

export function MissFalsePanel({ kind, series, rows, hiddenKeys }: MissFalsePanelProps) {
  const visible = series.filter((s) => !hiddenKeys.has(s.key))
  const accent = kind === 'miss' ? 'var(--destructive)' : 'var(--warning)'

  const { data, config, maxRate } = useMemo(() => {
    const byContext = new Map<MfContext, Record<string, number | null | string>>()
    for (const ctx of MF_CONTEXTS) byContext.set(ctx.value, { context: ctx.label })
    let maxRate = 0
    for (const row of rows) {
      if (row.kind !== kind) continue
      const key = `${row.run_id}__${row.source}`
      const bucket = byContext.get(row.context)
      if (bucket) {
        bucket[key] = row.rate
        if (row.rate != null) maxRate = Math.max(maxRate, row.rate)
      }
    }
    const config: ChartConfig = {}
    for (const s of series) {
      config[s.key] = { label: `R${s.runIndex + 1} ${sourceLabel(s.source)}`, color: s.color }
    }
    return { data: Array.from(byContext.values()), config, maxRate }
  }, [rows, series, kind])

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-[3px]" style={{ background: accent }} />
          <h4 className="text-sm font-semibold text-foreground">
            {kind === 'miss' ? 'Miss rate' : 'False rate'}
          </h4>
          <span className="text-xs text-muted-foreground">by environment</span>
        </div>
        <span className="tnum font-mono text-xs text-muted-foreground">
          peak {(maxRate * 100).toFixed(1)}%
        </span>
      </div>

      <div className="p-3">
        {visible.length === 0 ? (
          <div className="flex h-[240px] items-center justify-center px-6 text-center">
            <p className="text-sm text-muted-foreground">All series hidden.</p>
          </div>
        ) : (
          <ChartContainer config={config} className="aspect-auto h-[240px] w-full">
            <BarChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: 4 }} barCategoryGap="22%">
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis
                dataKey="context"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                stroke="var(--muted-foreground)"
                fontSize={11}
              />
              <YAxis
                tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={40}
                stroke="var(--muted-foreground)"
                fontSize={11}
              />
              <MfTooltip series={series} kind={kind} />
              {visible.map((s) => (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  radius={[3, 3, 0, 0]}
                  fill={s.color}
                  fillOpacity={s.source === 'fusion' ? 0.4 : 1}
                  stroke={s.color}
                  strokeWidth={s.source === 'fusion' ? 1.5 : 0}
                  isAnimationActive={false}
                >
                  {data.map((_, i) => (
                    <Cell key={i} />
                  ))}
                </Bar>
              ))}
            </BarChart>
          </ChartContainer>
        )}
      </div>
    </div>
  )
}

function MfTooltip(props: {
  series: SeriesDescriptor[]
  kind: MissFalseKind
  active?: boolean
  payload?: { dataKey: string; value: number | null }[]
  label?: string
}) {
  const { active, payload, label, series, kind } = props
  if (!active || !payload?.length) return null

  const rows = payload
    .filter((p) => p.value != null)
    .map((p) => ({ descriptor: series.find((s) => s.key === p.dataKey), value: p.value as number }))
    .filter((r) => r.descriptor)
    .sort((a, b) => a.value - b.value)

  return (
    <div className="min-w-[13rem] rounded-lg border border-border bg-popover/95 p-2.5 shadow-xl backdrop-blur">
      <div className="mb-1.5 flex items-center justify-between border-b border-border/60 pb-1.5 text-[11px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium uppercase text-muted-foreground">{kind} rate</span>
      </div>
      <div className="space-y-1">
        {rows.map(({ descriptor, value }) => (
          <div key={descriptor!.key} className="flex items-center justify-between gap-3 text-xs">
            <span className="flex items-center gap-1.5">
              <span
                className="size-2.5 rounded-[2px]"
                style={{
                  background: descriptor!.color,
                  opacity: descriptor!.source === 'fusion' ? 0.5 : 1,
                }}
              />
              <span className="text-muted-foreground">
                R{descriptor!.runIndex + 1} {sourceLabel(descriptor!.source)}
              </span>
            </span>
            <span className="tnum font-mono font-semibold text-foreground">
              {(value * 100).toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
