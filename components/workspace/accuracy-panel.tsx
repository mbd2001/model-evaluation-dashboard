'use client'

import { useMemo } from 'react'
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from 'recharts'

import { cn } from '@/lib/utils'
import type { AccuracyRow } from '@/lib/types'
import type { SeriesDescriptor } from '@/lib/run-colors'
import { sourceLabel } from '@/lib/run-colors'
import { ChartContainer, type ChartConfig } from '@/components/ui/chart'

interface AccuracyPanelProps {
  title: string
  subtitle: string
  series: SeriesDescriptor[]
  rows: AccuracyRow[]
  hiddenKeys: Set<string>
  xLabel: string
  missing: { run_id: string; source: string }[]
}

export function AccuracyPanel({
  title,
  subtitle,
  series,
  rows,
  hiddenKeys,
  xLabel,
  missing,
}: AccuracyPanelProps) {
  const visible = series.filter((s) => !hiddenKeys.has(s.key))

  const { data, config } = useMemo(() => {
    const byX = new Map<number, Record<string, number | null>>()
    for (const row of rows) {
      const key = `${row.run_id}__${row.source}`
      if (!byX.has(row.sample_x)) byX.set(row.sample_x, { x: row.sample_x })
      byX.get(row.sample_x)![key] = row.accuracy
    }
    const data = Array.from(byX.values()).sort((a, b) => (a.x as number) - (b.x as number))
    const config: ChartConfig = {}
    for (const s of series) {
      config[s.key] = { label: `R${s.runIndex + 1} ${sourceLabel(s.source)}`, color: s.color }
    }
    return { data, config }
  }, [rows, series])

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card">
      <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <h4 className="text-sm font-semibold text-foreground">{title}</h4>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        {missing.length > 0 && (
          <span className="rounded-md bg-warning/10 px-2 py-1 text-[10px] font-medium text-warning">
            {missing.length} series n/p
          </span>
        )}
      </div>

      <div className="p-3">
        {visible.length === 0 ? (
          <EmptyChart label="All series hidden — reset from the legend above." />
        ) : (
          <ChartContainer config={config} className="aspect-auto h-[260px] w-full">
            <LineChart data={data} margin={{ top: 8, right: 12, bottom: 18, left: 4 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis
                dataKey="x"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                stroke="var(--muted-foreground)"
                fontSize={11}
                label={{
                  value: xLabel,
                  position: 'insideBottom',
                  offset: -10,
                  fill: 'var(--muted-foreground)',
                  fontSize: 11,
                }}
              />
              <YAxis
                domain={[0, 1]}
                tickFormatter={(v) => `${Math.round(v * 100)}%`}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={40}
                stroke="var(--muted-foreground)"
                fontSize={11}
              />
              <ReferenceLine y={0.9} stroke="var(--success)" strokeDasharray="4 4" strokeOpacity={0.4} />
              <ChartTooltip series={series} hiddenKeys={hiddenKeys} xLabel={xLabel} />
              {visible.map((s) => (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  stroke={s.color}
                  strokeWidth={2}
                  strokeDasharray={s.source === 'fusion' ? '5 4' : undefined}
                  dot={false}
                  activeDot={{ r: 3.5, strokeWidth: 0 }}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ChartContainer>
        )}
      </div>
    </div>
  )
}

/**
 * Custom tooltip that ranks every visible series at the hovered x, so baseline-vs-candidate
 * deltas are readable at a glance. Recharts injects `active`/`payload`/`label` at render time.
 */
function ChartTooltip(props: {
  series: SeriesDescriptor[]
  hiddenKeys: Set<string>
  xLabel: string
  active?: boolean
  payload?: { dataKey: string; value: number | null }[]
  label?: number
}) {
  const { active, payload, label, series, xLabel } = props
  if (!active || !payload?.length) return null

  const rows = payload
    .filter((p) => p.value != null)
    .map((p) => ({ descriptor: series.find((s) => s.key === p.dataKey), value: p.value as number }))
    .filter((r) => r.descriptor)
    .sort((a, b) => b.value - a.value)

  return (
    <div className="min-w-[13rem] rounded-lg border border-border bg-popover/95 p-2.5 shadow-xl backdrop-blur">
      <div className="mb-1.5 flex items-center justify-between border-b border-border/60 pb-1.5 text-[11px]">
        <span className="text-muted-foreground">{xLabel}</span>
        <span className="tnum font-mono font-semibold text-foreground">{label}</span>
      </div>
      <div className="space-y-1">
        {rows.map(({ descriptor, value }) => (
          <div key={descriptor!.key} className="flex items-center justify-between gap-3 text-xs">
            <span className="flex items-center gap-1.5">
              <span
                className="size-2.5 rounded-[2px]"
                style={{
                  background:
                    descriptor!.source === 'vision'
                      ? descriptor!.color
                      : `repeating-linear-gradient(135deg, ${descriptor!.color}, ${descriptor!.color} 2px, transparent 2px, transparent 4px)`,
                  border: descriptor!.source === 'fusion' ? `1px solid ${descriptor!.color}` : undefined,
                }}
              />
              <span className="text-muted-foreground">
                R{descriptor!.runIndex + 1} {sourceLabel(descriptor!.source)}
              </span>
            </span>
            <span className="tnum font-mono font-semibold text-foreground">
              {(value * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className={cn('flex h-[260px] items-center justify-center px-6 text-center')}>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}
