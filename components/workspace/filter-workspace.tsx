'use client'

import { Check, Filter, Plus, RotateCcw, Trash2, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { DraftFilter, FilterVocabulary, Predicate, PredicateOp } from '@/lib/types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

const OPS: { value: PredicateOp; label: string }[] = [
  { value: 'eq', label: '=' },
  { value: 'neq', label: '≠' },
  { value: 'gt', label: '>' },
  { value: 'lt', label: '<' },
  { value: 'contains', label: 'contains' },
]

function uid() {
  return Math.random().toString(36).slice(2, 9)
}

interface FilterWorkspaceProps {
  vocabulary: FilterVocabulary
  draft: DraftFilter
  onDraftChange: (next: DraftFilter) => void
  onApply: () => void
  onReset: () => void
  dirty: boolean
  activeCount: number
}

export function FilterWorkspace({
  vocabulary,
  draft,
  onDraftChange,
  onApply,
  onReset,
  dirty,
  activeCount,
}: FilterWorkspaceProps) {
  const group = draft.groups[0]

  function updatePredicate(id: string, patch: Partial<Predicate>) {
    onDraftChange({
      ...draft,
      groups: draft.groups.map((g) =>
        g.id === group.id
          ? { ...g, predicates: g.predicates.map((p) => (p.id === id ? { ...p, ...patch } : p)) }
          : g,
      ),
    })
  }

  function addPredicate() {
    const field = vocabulary.fields[0]
    const predicate: Predicate = {
      id: uid(),
      field: field.name,
      op: field.dtype === 'number' ? 'gt' : 'eq',
      value: field.options?.[0] ?? '',
    }
    onDraftChange({
      ...draft,
      groups: draft.groups.map((g) =>
        g.id === group.id ? { ...g, predicates: [...g.predicates, predicate] } : g,
      ),
    })
  }

  function removePredicate(id: string) {
    onDraftChange({
      ...draft,
      groups: draft.groups.map((g) =>
        g.id === group.id ? { ...g, predicates: g.predicates.filter((p) => p.id !== id) } : g,
      ),
    })
  }

  function setCombinator(combinator: 'and' | 'or') {
    onDraftChange({
      ...draft,
      groups: draft.groups.map((g) => (g.id === group.id ? { ...g, combinator } : g)),
    })
  }

  function toggleScene(name: string, bucket: 'include' | 'exclude') {
    const other = bucket === 'include' ? 'exclude' : 'include'
    const inBucket = draft.scenes[bucket].includes(name)
    onDraftChange({
      ...draft,
      scenes: {
        [bucket]: inBucket
          ? draft.scenes[bucket].filter((s) => s !== name)
          : [...draft.scenes[bucket], name],
        [other]: draft.scenes[other].filter((s) => s !== name),
      } as DraftFilter['scenes'],
    })
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Filters</h3>
          {activeCount > 0 && (
            <span className="tnum rounded-full bg-primary/15 px-2 py-0.5 font-mono text-xs font-medium text-primary">
              {activeCount} applied
            </span>
          )}
          {dirty && (
            <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning">
              <span className="size-1.5 rounded-full bg-warning" />
              unapplied
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <RotateCcw className="size-3.5" />
            Reset
          </button>
          <button
            type="button"
            onClick={onApply}
            disabled={!dirty}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
              dirty
                ? 'bg-primary text-primary-foreground hover:opacity-90'
                : 'cursor-not-allowed bg-accent text-muted-foreground',
            )}
          >
            <Check className="size-3.5" />
            Apply
          </button>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div className="space-y-2">
          {group.predicates.length > 1 && (
            <div className="inline-flex overflow-hidden rounded-md border border-border text-xs">
              {(['and', 'or'] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCombinator(c)}
                  className={cn(
                    'px-2.5 py-1 font-medium uppercase transition-colors',
                    group.combinator === c
                      ? 'bg-accent text-foreground'
                      : 'bg-transparent text-muted-foreground hover:text-foreground',
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          )}

          {group.predicates.length === 0 && (
            <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
              No predicates. All frames pass.
            </p>
          )}

          {group.predicates.map((p) => {
            const field = vocabulary.fields.find((f) => f.name === p.field)
            return (
              <div key={p.id} className="flex flex-wrap items-center gap-2">
                <Select
                  value={p.field}
                  onValueChange={(field) => {
                    const f = vocabulary.fields.find((x) => x.name === field)
                    updatePredicate(p.id, {
                      field,
                      op: f?.dtype === 'number' ? 'gt' : 'eq',
                      value: f?.options?.[0] ?? '',
                    })
                  }}
                >
                  <SelectTrigger className="h-9 w-[9.5rem] bg-background font-mono text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {vocabulary.fields.map((f) => (
                      <SelectItem key={f.name} value={f.name} className="font-mono text-xs">
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={p.op} onValueChange={(op) => updatePredicate(p.id, { op: op as PredicateOp })}>
                  <SelectTrigger className="h-9 w-[5.5rem] bg-background text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OPS.filter((o) =>
                      field?.dtype === 'number'
                        ? ['gt', 'lt', 'eq', 'neq'].includes(o.value)
                        : ['eq', 'neq', 'contains'].includes(o.value),
                    ).map((o) => (
                      <SelectItem key={o.value} value={o.value} className="text-xs">
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {field?.options ? (
                  <Select value={p.value} onValueChange={(value) => updatePredicate(p.id, { value })}>
                    <SelectTrigger className="h-9 min-w-[7rem] flex-1 bg-background font-mono text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options.map((opt) => (
                        <SelectItem key={opt} value={opt} className="font-mono text-xs">
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <input
                    value={p.value}
                    onChange={(e) => updatePredicate(p.id, { value: e.target.value })}
                    placeholder={field?.dtype === 'number' ? '0' : 'value'}
                    inputMode={field?.dtype === 'number' ? 'decimal' : 'text'}
                    className="tnum h-9 min-w-[7rem] flex-1 rounded-md border border-input bg-background px-2.5 font-mono text-xs text-foreground outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/25"
                  />
                )}

                <button
                  type="button"
                  onClick={() => removePredicate(p.id)}
                  className="grid size-9 shrink-0 place-items-center rounded-md border border-border text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive"
                  aria-label="Remove predicate"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            )
          })}

          <button
            type="button"
            onClick={addPredicate}
            className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
          >
            <Plus className="size-3.5" />
            Add predicate
          </button>
        </div>

        <div className="border-t border-border pt-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">Scenes</span>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:border-foreground/20"
                >
                  <Plus className="size-3.5" />
                  Add scene
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72 p-0">
                <div className="max-h-72 overflow-auto p-1">
                  {vocabulary.scenes.map((scene) => {
                    const included = draft.scenes.include.includes(scene.name)
                    const excluded = draft.scenes.exclude.includes(scene.name)
                    return (
                      <div
                        key={scene.name}
                        className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-accent"
                      >
                        <div className="min-w-0">
                          <div className="truncate font-mono text-xs text-foreground">{scene.name}</div>
                          <div className="truncate text-[10px] text-muted-foreground">
                            {scene.description}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            onClick={() => toggleScene(scene.name, 'include')}
                            className={cn(
                              'rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase transition-colors',
                              included
                                ? 'bg-success/20 text-success'
                                : 'text-muted-foreground hover:bg-accent',
                            )}
                          >
                            in
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleScene(scene.name, 'exclude')}
                            className={cn(
                              'rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase transition-colors',
                              excluded
                                ? 'bg-destructive/20 text-destructive'
                                : 'text-muted-foreground hover:bg-accent',
                            )}
                          >
                            ex
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {draft.scenes.include.length === 0 && draft.scenes.exclude.length === 0 && (
              <span className="text-xs text-muted-foreground">No scene constraints.</span>
            )}
            {draft.scenes.include.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-2 py-0.5 font-mono text-xs text-success"
              >
                +{s}
                <button type="button" onClick={() => toggleScene(s, 'include')} aria-label={`Remove ${s}`}>
                  <X className="size-3" />
                </button>
              </span>
            ))}
            {draft.scenes.exclude.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1 rounded-full border border-destructive/30 bg-destructive/10 px-2 py-0.5 font-mono text-xs text-destructive"
              >
                −{s}
                <button type="button" onClick={() => toggleScene(s, 'exclude')} aria-label={`Remove ${s}`}>
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
