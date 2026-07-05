import { useState } from 'react'
import { ChevronIcon } from '../icons'

interface Props {
  title: string
  badge?: string
  error?: boolean
  defaultExpanded?: boolean
  children: React.ReactNode
}

export function ParamGroup({
  title,
  badge,
  error,
  defaultExpanded = true,
  children
}: Props): React.JSX.Element {
  const [expanded, setExpanded] = useState(defaultExpanded)

  return (
    <div
      className={`border-b border-border-subtle ${
        error ? 'bg-[linear-gradient(var(--color-error-soft),transparent_70%)]' : ''
      }`}
    >
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center gap-2 px-3.5 pb-[9px] pt-[11px] text-left"
      >
        <span
          className={`inline-flex transition-transform duration-200 ease-[var(--ease-standard)] ${
            expanded ? 'rotate-90' : ''
          } ${error ? 'text-error' : 'text-text-secondary'}`}
        >
          <ChevronIcon />
        </span>
        <span
          className={`flex-1 text-section-header font-semibold uppercase tracking-[0.11em] ${
            error ? 'text-error' : 'text-text-secondary'
          }`}
        >
          {title}
        </span>
        {error ? (
          <span className="h-1.5 w-1.5 rounded-full bg-error" />
        ) : (
          badge && <span className="font-mono text-[10px] text-text-tertiary">{badge}</span>
        )}
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-[var(--ease-standard)] ${
          expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div
          className={`overflow-hidden transition-opacity duration-200 ${expanded ? 'opacity-100' : 'opacity-0'}`}
        >
          <div className="px-3.5 pb-3.5 pt-0.5">{children}</div>
        </div>
      </div>
    </div>
  )
}
