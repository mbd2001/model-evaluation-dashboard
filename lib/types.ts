// Data model mirrored from the original Drivable Path workspace API contract.
// Kept intentionally close to the source so the redesign can be ported back.

export type Source = 'vision' | 'fusion'
export type DpGroup = 'base' | 'non_base'
export type AnalysisTab =
  | 'positional'
  | 'roles'
  | 'boundaries'
  | 'dp_attributes'
  | 'dp_direction'
export type MissFalseKind = 'miss' | 'false'
export type MfContext = 'all' | 'highway' | 'country' | 'urban' | 'other'

export interface CatalogRun {
  run_id: string
  display_label: string
  net: string
  checkpoint: string
  dataset: string
  use_case: string
  user: string
  total_frames: number
  last_change: string
  sources: Source[]
}

/** One point on an accuracy curve for a given (run, source, population). */
export interface AccuracyRow {
  run_id: string
  source: Source
  sample_x: number
  accuracy: number | null
  label: string
  threshold_m: number
  n_accurate: number
  n_valid: number
  n_total: number
}

export interface MissingSeries {
  run_id: string
  source: Source
}

export interface AccuracyResult {
  rows: AccuracyRow[]
  missing: MissingSeries[]
}

/** One grouped-bar datum for miss/false rates by environment context. */
export interface MissFalseRow {
  run_id: string
  source: Source
  kind: MissFalseKind
  context: MfContext
  rate: number | null
  n: number
  total: number
  label: string
}

export interface MissFalseResult {
  rows: MissFalseRow[]
  missing: (MissingSeries & { kind: MissFalseKind })[]
}

export interface PopulationCount {
  run_id: string
  source: Source
  /** `null` means the signal was not produced (vs. a genuine zero). */
  pred: number | null
  gt: number | null
}

export interface FrameScope {
  total_frames: number
  matched_frames: number
  runs: number
}

// ----- Filter state (draft vs. applied) -----

export type PredicateOp = 'eq' | 'neq' | 'gt' | 'lt' | 'contains'

export interface Predicate {
  id: string
  field: string
  op: PredicateOp
  value: string
}

export interface FilterGroup {
  id: string
  combinator: 'and' | 'or'
  predicates: Predicate[]
}

export interface SceneSelection {
  include: string[]
  exclude: string[]
}

export interface DraftFilter {
  groups: FilterGroup[]
  scenes: SceneSelection
}

export interface FilterVocabulary {
  fields: { name: string; dtype: 'string' | 'number' | 'enum'; options?: string[] }[]
  scenes: { name: string; description: string }[]
}

// ----- Population request shapes -----

export type Population =
  | { group: 'base'; low: number; high: number }
  | { group: 'non_base'; anchor_radius: number }
