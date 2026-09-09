import type { CatalogRun, Source } from './types'

/** Stable run color slots — assigned by selection order and reused across every panel. */
export const RUN_COLOR_VARS = [
  'var(--run-1)',
  'var(--run-2)',
  'var(--run-3)',
  'var(--run-4)',
  'var(--run-5)',
] as const

export function runColorVar(index: number): string {
  return RUN_COLOR_VARS[index % RUN_COLOR_VARS.length]
}

/** Series identity used everywhere: `${run_id}__${source}`. */
export function seriesKey(runId: string, source: Source): string {
  return `${runId}__${source}`
}

export function parseSeriesKey(key: string): { runId: string; source: Source } {
  const [runId, source] = key.split('__')
  return { runId, source: source as Source }
}

export function sourceLabel(source: Source): string {
  return source === 'vision' ? 'Vision' : 'Fusion'
}

export interface SeriesDescriptor {
  key: string
  run: CatalogRun
  runIndex: number
  source: Source
  color: string
}

/** Every enabled (run, source) combination, in stable order. */
export function buildSeries(runs: CatalogRun[], sources: Source[]): SeriesDescriptor[] {
  const series: SeriesDescriptor[] = []
  runs.forEach((run, runIndex) => {
    sources.forEach((source) => {
      if (!run.sources.includes(source)) return
      series.push({
        key: seriesKey(run.run_id, source),
        run,
        runIndex,
        source,
        color: runColorVar(runIndex),
      })
    })
  })
  return series
}
