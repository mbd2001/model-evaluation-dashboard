'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  Activity,
  ChevronRight,
  LayoutGrid,
  Pin,
  PinOff,
  Route,
  Signpost,
  Waypoints,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  section?: string
}

const NAV: NavItem[] = [
  { href: '/', label: 'Run Catalog', icon: LayoutGrid },
  { href: '/drivable-path', label: 'Drivable Path', icon: Waypoints, section: 'Signals' },
  { href: '/road-marks', label: 'Road Marks', icon: Signpost, section: 'Signals' },
]

function NavRail() {
  const pathname = usePathname()
  const [pinned, setPinned] = useState(false)
  const [hovered, setHovered] = useState(false)
  const expanded = pinned || hovered

  let lastSection: string | undefined

  return (
    <aside
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex flex-col border-r border-border bg-card/60 backdrop-blur-xl transition-[width] duration-200 ease-out',
        expanded ? 'w-60' : 'w-[4.25rem]',
      )}
    >
      <div className="flex h-16 items-center gap-2.5 px-4">
        <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/25">
          <Route className="size-5" />
        </div>
        <div
          className={cn(
            'min-w-0 overflow-hidden transition-opacity duration-150',
            expanded ? 'opacity-100' : 'opacity-0',
          )}
        >
          <div className="font-mono text-sm font-semibold tracking-tight text-foreground">
            ROADSCOPE
          </div>
          <div className="truncate text-[11px] text-muted-foreground">Eval Platform</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {NAV.map((item) => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
          const showSection = item.section && item.section !== lastSection && expanded
          lastSection = item.section
          const Icon = item.icon
          const link = (
            <Link
              href={item.href}
              className={cn(
                'group flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary/12 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              <Icon className="size-[1.15rem] shrink-0" />
              <span
                className={cn(
                  'truncate transition-opacity duration-150',
                  expanded ? 'opacity-100' : 'opacity-0',
                )}
              >
                {item.label}
              </span>
            </Link>
          )
          return (
            <div key={item.href}>
              {showSection && (
                <div className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                  {item.section}
                </div>
              )}
              {expanded ? (
                link
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              )}
            </div>
          )
        })}
      </nav>

      <div className="border-t border-border p-3">
        <button
          type="button"
          onClick={() => setPinned((v) => !v)}
          className={cn(
            'flex h-9 w-full items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
          )}
        >
          {pinned ? <PinOff className="size-4 shrink-0" /> : <Pin className="size-4 shrink-0" />}
          <span className={cn('transition-opacity', expanded ? 'opacity-100' : 'opacity-0')}>
            {pinned ? 'Unpin rail' : 'Pin rail'}
          </span>
        </button>
      </div>
    </aside>
  )
}

interface AppShellProps {
  title: string
  breadcrumb?: string
  headerRight?: React.ReactNode
  children: React.ReactNode
}

export function AppShell({ title, breadcrumb, headerRight, children }: AppShellProps) {
  return (
    <div className="min-h-screen">
      <NavRail />
      <div className="pl-[4.25rem]">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-background/80 px-6 backdrop-blur-xl">
          <div className="flex min-w-0 items-center gap-2 text-sm">
            {breadcrumb && (
              <>
                <span className="text-muted-foreground">{breadcrumb}</span>
                <ChevronRight className="size-3.5 text-muted-foreground/50" />
              </>
            )}
            <span className="truncate font-semibold text-foreground">{title}</span>
          </div>
          <div className="flex items-center gap-3">
            {headerRight}
            <div className="hidden items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground sm:flex">
              <Activity className="size-3 text-success" />
              <span className="tnum">live</span>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1560px] px-6 py-7">{children}</main>
      </div>
    </div>
  )
}
