import type {
  AccuracyResult,
  AccuracyRow,
  CatalogRun,
  DraftFilter,
  FilterVocabulary,
  FrameScope,
  MfContext,
  MissFalseKind,
  MissFalseResult,
  MissFalseRow,
  Population,
  PopulationCount,
  Source,
} from './types'

// ----- deterministic RNG so the same request always yields the same response -----

function hashStr(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function rng(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v))
}

// ----- catalog fixtures -----

const NETS = ['dp-fusenet', 'dp-visionnet', 'dp-fusenet-xl']
const DATASETS = ['nuscenes-v1.2', 'internal-hw-24q3', 'urban-mix-24q4']
const USE_CASES = ['highway-pilot', 'urban-nav', 'full-stack']
const USERS = ['a.okoro', 'm.tanaka', 'l.novak', 'system']

function hexHash(seed: number): string {
  return seed.toString(16).padStart(8, '0').slice(0, 7)
}

export const CATALOG: CatalogRun[] = Array.from({ length: 8 }).map((_, i) => {
  const seed = hashStr(`run-${i}`)
  const r = rng(seed)
  const net = NETS[Math.floor(r() * NETS.length)]
  const step = 40000 + Math.floor(r() * 220000)
  return {
    run_id: `run_${(seed % 90000) + 10000}`,
    display_label: `${net} · step ${step.toLocaleString()}`,
    net,
    checkpoint: `${hexHash(seed)}${hexHash(seed >> 3)}`.slice(0, 12),
    dataset: DATASETS[Math.floor(r() * DATASETS.length)],
    use_case: USE_CASES[Math.floor(r() * USE_CASES.length)],
    user: USERS[Math.floor(r() * USERS.length)],
    total_frames: 8000 + Math.floor(r() * 120000),
    last_change: new Date(Date.UTC(2025, 8, 1 + Math.floor(r() * 8), Math.floor(r() * 23))).toISOString(),
    // Every run has vision; most also have fusion.
    sources: r() > 0.2 ? (['vision', 'fusion'] as Source[]) : (['vision'] as Source[]),
  }
})

export const FILTER_VOCABULARY: FilterVocabulary = {
  fields: [
    { name: 'weather', dtype: 'enum', options: ['clear', 'rain', 'fog', 'snow'] },
    { name: 'time_of_day', dtype: 'enum', options: ['day', 'dusk', 'night'] },
    { name: 'road_type', dtype: 'enum', options: ['highway', 'country', 'urban'] },
    { name: 'ego_speed_mps', dtype: 'number' },
    { name: 'lane_count', dtype: 'number' },
    { name: 'occlusion', dtype: 'enum', options: ['none', 'partial', 'heavy'] },
    { name: 'city', dtype: 'string' },
  ],
  scenes: [
    { name: 'cut_in', description: 'Adjacent vehicle merges into ego lane' },
    { name: 'sharp_curve', description: 'Curvature above 0.02 1/m' },
    { name: 'merge_ramp', description: 'On/off-ramp merge geometry' },
    { name: 'construction', description: 'Cones, barriers, shifted lanes' },
    { name: 'tunnel', description: 'Reduced GNSS / lighting transitions' },
    { name: 'roundabout', description: 'Circular intersection navigation' },
    { name: 'toll_plaza', description: 'Multi-lane divergence and stops' },
    { name: 'stop_and_go', description: 'Dense low-speed traffic' },
    { name: 'night_unlit', description: 'No ambient road lighting' },
    { name: 'heavy_rain', description: 'Precipitation degrading vision' },
  ],
}

// ----- request signature helpers -----

function populationSignature(population: Population): string {
  return population.group === 'base'
    ? `base:${population.low}:${population.high}`
    : `nonbase:${population.anchor_radius}`
}

function populationWidth(population: Population): number {
  return population.group === 'base'
    ? Math.max(0.25, population.high - population.low)
    : population.anchor_radius / 4
}

function filterSignature(filter: DraftFilter): number {
  const predicates = filter.groups.reduce((n, g) => n + g.predicates.length, 0)
  return predicates + filter.scenes.include.length + filter.scenes.exclude.length
}

// A run's intrinsic quality: candidates (lower index) trend slightly stronger.
function runQuality(run: CatalogRun, runIndex: number): number {
  const r = rng(hashStr(run.run_id))
  return 0.9 - runIndex * 0.045 + (r() - 0.5) * 0.05
}

// ----- accuracy over sample horizon -----

export function computeAccuracy(
  runs: CatalogRun[],
  sources: Source[],
  population: Population,
  thresholds: number[],
): AccuracyResult {
  const rows: AccuracyRow[] = []
  const missing: AccuracyResult['missing'] = []
  const isBase = population.group === 'base'
  const filterShift = 0
  const popSig = populationSignature(population)
  const width = populationWidth(population)

  runs.forEach((run, runIndex) => {
    const quality = runQuality(run, runIndex)
    sources.forEach((source) => {
      if (!run.sources.includes(source)) {
        missing.push({ run_id: run.run_id, source })
        return
      }
      const seed = hashStr(`${run.run_id}:${source}:${popSig}:acc`)
      const r = rng(seed)
      // Fusion is a touch stronger and steadier than vision alone.
      const srcBoost = source === 'fusion' ? 0.035 : 0
      const decay = 0.16 + r() * 0.05
      const nValidBase = Math.round(width * (2400 + r() * 3200))

      thresholds.forEach((threshold, i) => {
        const x = isBase ? i * 0.5 : i * (population.anchor_radius / (thresholds.length - 1))
        const horizon = i / (thresholds.length - 1)
        // Smooth, monotonically-softening accuracy curve.
        let acc = quality + srcBoost - decay * horizon * horizon + (r() - 0.5) * 0.02 - filterShift
        acc = clamp01(acc)
        // Introduce one realistic gap for a fusion series at the far horizon.
        const isGap = source === 'fusion' && runIndex === 1 && i === thresholds.length - 2
        const nValid = Math.max(1, Math.round(nValidBase * (1 - horizon * 0.4)))
        const nAccurate = Math.round(nValid * acc)
        rows.push({
          run_id: run.run_id,
          source,
          sample_x: Number(x.toFixed(2)),
          accuracy: isGap ? null : acc,
          label: run.display_label,
          threshold_m: threshold,
          n_accurate: nAccurate,
          n_valid: nValid,
          n_total: Math.round(nValid * 1.08),
        })
      })
    })
  })

  return { rows, missing, xLabel } as AccuracyResult & { xLabel: string }
}

// ----- miss / false rates by environment context -----

export const MF_CONTEXTS: { value: MfContext; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'highway', label: 'Highway' },
  { value: 'country', label: 'Country' },
  { value: 'urban', label: 'Urban' },
  { value: 'other', label: 'Other' },
]

const CONTEXT_DIFFICULTY: Record<MfContext, number> = {
  all: 1,
  highway: 0.7,
  country: 1.05,
  urban: 1.5,
  other: 1.2,
}

export function computeMissFalse(
  runs: CatalogRun[],
  sources: Source[],
  population: Population,
): MissFalseResult {
  const rows: MissFalseRow[] = []
  const missing: MissFalseResult['missing'] = []
  const popSig = populationSignature(population)
  const kinds: MissFalseKind[] = ['miss', 'false']

  runs.forEach((run, runIndex) => {
    const quality = runQuality(run, runIndex)
    sources.forEach((source) => {
      if (!run.sources.includes(source)) {
        kinds.forEach((kind) => missing.push({ run_id: run.run_id, source, kind }))
        return
      }
      const srcBoost = source === 'fusion' ? 0.7 : 1 // fusion misses/false less
      kinds.forEach((kind) => {
        const seed = hashStr(`${run.run_id}:${source}:${popSig}:${kind}`)
        const r = rng(seed)
        const kindBase = kind === 'miss' ? 0.07 : 0.045
        MF_CONTEXTS.forEach(({ value }) => {
          const difficulty = CONTEXT_DIFFICULTY[value]
          const total = Math.round(600 + r() * 5200)
          let rate = kindBase * difficulty * srcBoost * (2 - quality) + (r() - 0.5) * 0.008
          rate = clamp01(Math.max(0, rate))
          const n = Math.round(total * rate)
          rows.push({
            run_id: run.run_id,
            source,
            kind,
            context: value,
            rate,
            n,
            total,
            label: run.display_label,
          })
        })
      })
    })
  })

  return { rows, missing }
}

// ----- population counts (per-run, per-source PRED / GT) -----

export function computeCounts(
  runs: CatalogRun[],
  sources: Source[],
  population: Population,
): PopulationCount[] {
  const width = populationWidth(population)
  const popSig = populationSignature(population)
  const out: PopulationCount[] = []
  runs.forEach((run) => {
    sources.forEach((source) => {
      if (!run.sources.includes(source)) {
        out.push({ run_id: run.run_id, source, pred: null, gt: null })
        return
      }
      const r = rng(hashStr(`${run.run_id}:${source}:${popSig}:count`))
      const gt = Math.round(width * (1800 + r() * 2600))
      const pred = Math.round(gt * (0.9 + r() * 0.18))
      out.push({ run_id: run.run_id, source, pred, gt })
    })
  })
  return out
}

export function computeFrameScope(runs: CatalogRun[], filter: DraftFilter): FrameScope {
  const total = runs.reduce((sum, run) => sum + run.total_frames, 0)
  const sig = filterSignature(filter)
  // Active filters narrow the matched frame count deterministically.
  const retention = sig === 0 ? 1 : Math.max(0.28, 1 - sig * 0.13)
  return {
    total_frames: total,
    matched_frames: Math.round(total * retention),
    runs: runs.length,
  }
}

// Default 11-element threshold ladders per DP group (metres).
export const DEFAULT_THRESHOLDS: Record<'base' | 'non_base', number[]> = {
  base: [0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.6, 0.75, 1.0],
  non_base: [0.25, 0.3, 0.4, 0.5, 0.6, 0.75, 0.9, 1.1, 1.35, 1.6, 2.0],
}
