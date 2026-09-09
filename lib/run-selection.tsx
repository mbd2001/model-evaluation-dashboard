'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'

import { CATALOG } from './mock-data'
import type { CatalogRun } from './types'

interface RunSelectionValue {
  selectedIds: string[]
  selectedRuns: CatalogRun[]
  toggle: (runId: string) => void
  isSelected: (runId: string) => boolean
  clear: () => void
  move: (runId: string, direction: -1 | 1) => void
}

const RunSelectionContext = createContext<RunSelectionValue | null>(null)

const MAX_RUNS = 5

export function RunSelectionProvider({ children }: { children: React.ReactNode }) {
  // Seed with a baseline + candidate so the comparison view is populated on first load.
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    CATALOG.slice(0, 2).map((r) => r.run_id),
  )

  const toggle = useCallback((runId: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(runId)) return prev.filter((id) => id !== runId)
      if (prev.length >= MAX_RUNS) return prev
      return [...prev, runId]
    })
  }, [])

  const move = useCallback((runId: string, direction: -1 | 1) => {
    setSelectedIds((prev) => {
      const idx = prev.indexOf(runId)
      const next = idx + direction
      if (idx === -1 || next < 0 || next >= prev.length) return prev
      const copy = [...prev]
      ;[copy[idx], copy[next]] = [copy[next], copy[idx]]
      return copy
    })
  }, [])

  const clear = useCallback(() => setSelectedIds([]), [])

  const value = useMemo<RunSelectionValue>(() => {
    const selectedRuns = selectedIds
      .map((id) => CATALOG.find((r) => r.run_id === id))
      .filter((r): r is CatalogRun => Boolean(r))
    return {
      selectedIds,
      selectedRuns,
      toggle,
      isSelected: (runId: string) => selectedIds.includes(runId),
      clear,
      move,
    }
  }, [selectedIds, toggle, clear, move])

  return <RunSelectionContext.Provider value={value}>{children}</RunSelectionContext.Provider>
}

export function useRunSelection() {
  const ctx = useContext(RunSelectionContext)
  if (!ctx) throw new Error('useRunSelection must be used within RunSelectionProvider')
  return ctx
}

export { MAX_RUNS }
