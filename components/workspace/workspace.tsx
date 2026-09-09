'use client'

import { useMemo, useState } from 'react'
import { Activity, BarChart3, LineChart as LineChartIcon } from 'lucide-react'

import type {
  AnalysisTab,
  DpGroup,
  DraftFilter,
  Population,
  Source,
} from '@/lib/types'
import {
  DEFAULT_THRESHOLDS,
  FILTER_VOCABULARY,
  computeAccuracy,
  computeCounts,
  computeFrameScope,
  computeMissFalse,
} from '@/lib/mock-data'
import { buildSeries } from '@/lib/run-colors'
import { useRunSelection } from '@/lib/run-selection'
import { ANALYSIS_TABS, AnalysisTabs } from './analysis-tabs'
import { AccuracyPanel } from './accuracy-panel'
import { FilterWorkspace } from './filter-workspace'
import { FrameScopeSummary } from './frame-scope-summary'
import { MissFalsePanel } from './miss-false-panel'
import { PopulationControls } from './population-controls'
import { RunContextHeader } from './run-context-header'
import { SeriesChips } from './series-chips'
import { SourceSelector } from './source-selector'
import { ThresholdSettings } from './threshold-settings'

const EMPTY_FILTER: DraftFilter = {
  groups: [{ id: 'g1', combinator: 'and', predicates: [] }],
  scenes: { include: [], exclude: [] },
}

function countActive(filter: DraftFilter): number {
  return (
    filter.groups.reduce((n, g) => n + g.predicates.length, 0) +
    filter.scenes.include.length +
    filter.scenes.exclude.length
  )
}

function filterKey(filter: DraftFilter): string {
  return JSON.stringify(filter)
}

export function Workspace() {
  const { selectedRuns, toggle, move } = useRunSelection()

  // ----- global controls -----
  const [sources, setSources] = useState<Source[]>(['vision', 'fusion'])
  const [group, setGroup] = useState<DpGroup>('base')
  const [tab, setTab] = useState<AnalysisTab>('positional')

  // ----- spatial thresholds (committed values drive derived data) -----
  const [egoRange, setEgoRange] = useState<[number, number]>([0, 15])
  const [nonEgoRange, setNonEgoRange] = useState<[number, number]>([15, 40])
  const [anchorRadius, setAnchorRadius] = useState(30)

  // ----- accuracy threshold ladders, per group -----
  const [thresholds, setThresholds] = useState<Record<DpGroup, number[]>>({
    base: [...DEFAULT_THRESHOLDS.base],
    non_base: [...DEFAULT_THRESHOLDS.non_base],
  })

  // ----- filter draft vs. applied -----
  const [draftFilter, setDraftFilter] = useState<DraftFilter>(EMPTY_FILTER)
  const [appliedFilter, setAppliedFilter] = useState<DraftFilter>(EMPTY_FILTER)
  const dirty = filterKey(draftFilter) !== filterKey(appliedFilter)

  // ----- per-section series visibility -----
  const [hiddenAccuracy, setHiddenAccuracy] = useState<Set<string>>(new Set())
  const [hiddenMissFalse, setHiddenMissFalse] = useState<Set<string>>(new Set())

  const aggregates = ANALYSIS_TABS.find((t) => t.value === tab)?.aggregates ?? false

  const series = useMemo(() => buildSeries(selectedRuns, sources), [selectedRuns, sources])

  // Population definitions for the Ego / Non-ego / Anchor bands.
  const egoPopulation: Population = { group: 'base', low: egoRange[0], high: egoRange[1] }
  const nonEgoPopulation: Population = { group: 'base', low: nonEgoRange[0], high: nonEgoRange[1] }
  const anchorPopulation: Population = { group: 'non_base', anchor_radius: anchorRadius }

  // Active population used for the metric panels depends on the group.
  const activePopulation: Population =
    group === 'base' ? egoPopulation : anchorPopulation

  const activeThresholds = thresholds[group]

  // ----- derived data (simulated query layer over applied state) -----
  const egoCounts = useMemo(
    () => computeCounts(selectedRuns, sources, egoPopulation),
    [selectedRuns, sources, egoRange],
  )
  const nonEgoCounts = useMemo(
    () => computeCounts(selectedRuns, sources, nonEgoPopulation),
    [selectedRuns, sources, nonEgoRange],
  )
  const anchorCounts = useMemo(
    () => computeCounts(selectedRuns, sources, anchorPopulation),
    [selectedRuns, sources, anchorRadius],
  )

  const frameScope = useMemo(
    () => computeFrameScope(selectedRuns, appliedFilter),
    [selectedRuns, appliedFilter],
  )

  const egoAccuracy = useMemo(
    () => computeAccuracy(selectedRuns, sources, egoPopulation, activeThresholds),
    [selectedRuns, sources, egoRange, activeThresholds, appliedFilter],
  )
  const nonEgoAccuracy = useMemo(
    () => computeAccuracy(selectedRuns, sources, group === 'base' ? nonEgoPopulation : anchorPopulation, activeThresholds),
    [selectedRuns, sources, nonEgoRange, anchorRadius, group, activeThresholds, appliedFilter],
  )

  const missFalse = useMemo(
    () => computeMissFalse(selectedRuns, sources, activePopulation),
    [selectedRuns, sources, group, egoRange, anchorRadius, appliedFilter],
  )

  const xLabel = group === 'base' ? 'Time from frame (s)' : 'Distance from anchor (m)'
  const secondPanelTitle = group === 'base' ? 'Non-ego range' : 'Anchor radius'
  const secondPanelSubtitle =
    group === 'base' ? `${nonEgoRange[0]}–${nonEgoRange[1]} m band` : `0–${anchorRadius} m radius`

  return (
    <div className="space-y-5">
      <RunContextHeader runs={selectedRuns} onRemove={toggle} onMove={move} />

      {/* Global control bar */}
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <SourceSelector runs={selectedRuns} sources={sources} onToggleSource={toggleSource} />
          <div className="hidden h-6 w-px bg-border sm:block" />
          <FrameScopeSummary data={frameScope} />
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Activity className="size-3.5 text-success" />
            <span className="tnum font-mono">{series.length}</span> series live
          </span>
        </div>
      </section>

      <div className="grid gap-5">
        <PopulationControls
          runs={selectedRuns}
          group={group}
          onGroupChange={setGroup}
          egoRange={egoRange}
          onEgoRangeChange={setEgoRange}
          egoCounts={egoCounts}
          nonEgoRange={nonEgoRange}
          onNonEgoRangeChange={setNonEgoRange}
          nonEgoCounts={nonEgoCounts}
          anchorRadius={anchorRadius}
          onAnchorRadiusChange={setAnchorRadius}
          anchorCounts={anchorCounts}
          disabled={aggregates}
        />

        <FilterWorkspace
          vocabulary={FILTER_VOCABULARY}
          draft={draftFilter}
          onDraftChange={setDraftFilter}
          onApply={() => setAppliedFilter(draftFilter)}
          onReset={() => {
            setDraftFilter(EMPTY_FILTER)
            setAppliedFilter(EMPTY_FILTER)
          }}
          dirty={dirty}
          activeCount={countActive(appliedFilter)}
        />
      </div>

      {/* Metric surface */}
      <section className="rounded-xl border border-border bg-card">
        <div className="px-4 pt-1">
          <AnalysisTabs value={tab} onChange={setTab} />
        </div>

        <div className="space-y-6 p-4">
          {/* Accuracy */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <LineChartIcon className="size-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Threshold accuracy</h3>
                <span className="text-xs text-muted-foreground">accuracy vs. {xLabel.toLowerCase()}</span>
              </div>
              <ThresholdSettings
                group={group}
                thresholds={activeThresholds}
                onChange={(next) => setThresholds((prev) => ({ ...prev, [group]: next }))}
              />
            </div>
            <SeriesChips
              series={series}
              hiddenKeys={hiddenAccuracy}
              onHiddenKeysChange={setHiddenAccuracy}
              noun="lines"
            />
            <div className="grid gap-4 xl:grid-cols-2">
              <AccuracyPanel
                title={group === 'base' ? 'Ego range' : 'Anchor population'}
                subtitle={group === 'base' ? `${egoRange[0]}–${egoRange[1]} m band` : `0–${anchorRadius} m radius`}
                series={series}
                rows={egoAccuracy.rows}
                hiddenKeys={hiddenAccuracy}
                xLabel={xLabel}
                missing={egoAccuracy.missing}
              />
              <AccuracyPanel
                title={secondPanelTitle}
                subtitle={secondPanelSubtitle}
                series={series}
                rows={nonEgoAccuracy.rows}
                hiddenKeys={hiddenAccuracy}
                xLabel={xLabel}
                missing={nonEgoAccuracy.missing}
              />
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* Error distributions */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="size-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Error distributions</h3>
              <span className="text-xs text-muted-foreground">miss &amp; false rates by environment</span>
            </div>
            <SeriesChips
              series={series}
              hiddenKeys={hiddenMissFalse}
              onHiddenKeysChange={setHiddenMissFalse}
              noun="bars"
            />
            <div className="grid gap-4 xl:grid-cols-2">
              <MissFalsePanel kind="miss" series={series} rows={missFalse.rows} hiddenKeys={hiddenMissFalse} />
              <MissFalsePanel kind="false" series={series} rows={missFalse.rows} hiddenKeys={hiddenMissFalse} />
            </div>
          </div>
        </div>
      </section>
    </div>
  )

  function toggleSource(source: Source) {
    setSources((prev) =>
      prev.includes(source)
        ? prev.length > 1
          ? prev.filter((s) => s !== source)
          : prev
        : [...prev, source],
    )
  }
}
